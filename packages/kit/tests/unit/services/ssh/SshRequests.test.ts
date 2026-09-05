import { describe, expect, it, vi } from 'vitest';
import nacl from 'tweetnacl';
import { createNosanaAuthorization, validateHeaders } from '@nosana/authorization';
import { createSshService } from '../../../../src/services/ssh/index.js';

const key =
  'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIB0XqCL4vLIsYRvd5VmtbOJ8IEKDJpjaVWQ5lmxWVTq5 user-a';
const now = new Date('2026-08-30T12:00:00Z');
const owner = nacl.sign.keyPair();
const opts = {
  job: 'job-address',
  node: 'node-address',
  nodeDomain: 'node.example.com',
  authorizationProvider: async (message: string) =>
    nacl.sign.detached(new TextEncoder().encode(message), owner.secretKey),
};
function fixture() {
  const fetchMock = vi.fn(async (_url: string, req: RequestInit) => {
    const body = req.body === undefined ? undefined : JSON.parse(String(req.body));
    const base = { job: opts.job, sshUser: `nosana-${opts.job}` };
    const payload =
      req.method === 'POST'
        ? { ...base, authorized: true, ...(body?.expiresAt ? { expiresAt: body.expiresAt } : {}) }
        : req.method === 'DELETE'
          ? { ...base, revoked: true }
          : { ...base, keys: [] };
    return new Response(JSON.stringify(payload), { status: 200 });
  });
  const service = createSshService({
    getWallet: () => undefined,
    fetch: fetchMock as typeof fetch,
    now: () => now,
  });
  return { service, fetchMock };
}

describe('SSH node requests', () => {
  it('generates a real standard header and only sends the permanent key in the body', async () => {
    const { service, fetchMock } = fixture();
    const response = await service.authorizeKey({ ...opts, sshPublicKey: key });
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('https://node-address.node.example.com/job/job-address/ssh/authorize');
    expect(JSON.parse(String(request.body))).toEqual({ sshPublicKey: key });
    const authorization = new Headers(request.headers).get('authorization')!;
    expect(
      validateHeaders({ authorization }, owner.publicKey, { expected_message: opts.job })
    ).toBe(true);
    expect(response).not.toHaveProperty('expiresAt');
    expect(request.redirect).toBe('error');
  });
  it('accepts a DM authorization provider returning message:signature', async () => {
    const { service, fetchMock } = fixture();
    const auth = createNosanaAuthorization(owner.secretKey);
    await service.authorizeKey({
      ...opts,
      sshPublicKey: key,
      authorizationProvider: (message) => auth.generate(message),
    });
    expect(
      validateHeaders(
        { authorization: new Headers(fetchMock.mock.calls[0][1].headers).get('authorization')! },
        owner.publicKey
      )
    ).toBe(true);
  });
  it('serializes an explicit Date and permits expiry beyond five minutes', async () => {
    const { service, fetchMock } = fixture();
    const expiresAt = new Date(now.getTime() + 3600000);
    expect(await service.authorizeKey({ ...opts, sshPublicKey: key, expiresAt })).toHaveProperty(
      'expiresAt',
      expiresAt.toISOString()
    );
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body))).toEqual({
      sshPublicKey: key,
      expiresAt: expiresAt.toISOString(),
    });
  });
  it('keeps the ephemeral convenience method temporary with a four-minute default', async () => {
    const { service } = fixture();
    expect(
      await service.authorizeEphemeralKey({ ...opts, publicKey: key, network: 'devnet' })
    ).toHaveProperty('expiresAt', '2026-08-30T12:04:00.000Z');
  });
  it.each([0, -1, NaN, Infinity, 0.1])(
    'rejects invalid TTL %s before requesting auth',
    async (ttlMs) => {
      const { service, fetchMock } = fixture();
      await expect(
        service.authorizeEphemeralKey({ ...opts, publicKey: key, ttlMs })
      ).rejects.toThrow('TTL');
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );
  it.each([new Date(NaN), new Date(0), null])(
    'rejects malformed or expired dates',
    async (expiresAt) => {
      const { service, fetchMock } = fixture();
      await expect(
        service.authorizeKey({ ...opts, sshPublicKey: key, expiresAt: expiresAt as Date })
      ).rejects.toThrow('future Date');
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );
  it('lists, replaces, and revokes using the corresponding node endpoints', async () => {
    const { service, fetchMock } = fixture();
    await service.listKeys(opts);
    await service.replaceKeys({ ...opts, publicKeys: [key] });
    await service.replaceKeys({ ...opts, publicKeys: [] });
    await service.revokeKey({ ...opts, sshPublicKey: key });
    expect(
      fetchMock.mock.calls.map(([url, request]) => [
        url.endsWith('/ssh/keys'),
        request.method,
        request.body && JSON.parse(String(request.body)),
      ])
    ).toEqual([
      [true, 'GET', undefined],
      [true, 'PUT', { publicKeys: [key] }],
      [true, 'PUT', { publicKeys: [] }],
      [true, 'DELETE', { sshPublicKey: key }],
    ]);
  });
  it('rejects malformed and injected keys before contacting the node', async () => {
    const { service, fetchMock } = fixture();
    await expect(service.authorizeKey({ ...opts, sshPublicKey: `${key}\n${key}` })).rejects.toThrow(
      'public key'
    );
    await expect(service.replaceKeys({ ...opts, publicKeys: ['invalid'] })).rejects.toThrow(
      'public key'
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('propagates cancellation', async () => {
    const { service, fetchMock } = fixture();
    const signal = new AbortController().signal;
    await service.listKeys({ ...opts, signal });
    expect(fetchMock.mock.calls[0][1].signal).toBe(signal);
  });
  it('preserves HTTP failures as typed errors', async () => {
    const { service, fetchMock } = fixture();
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    );
    await expect(service.listKeys(opts)).rejects.toMatchObject({
      name: 'SshRequestError',
      status: 401,
      message: 'Unauthorized',
    });
  });
  it('rejects malformed success responses and accidental permanent ephemeral grants', async () => {
    const { service, fetchMock } = fixture();
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ job: opts.job, sshUser: `nosana-${opts.job}`, authorized: true })
      )
    );
    await expect(service.authorizeEphemeralKey({ ...opts, publicKey: key })).rejects.toThrow(
      'invalid SSH authorization response'
    );
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ job: 'other-job', sshUser: 'nosana-other-job', keys: [] }))
    );
    await expect(service.listKeys(opts)).rejects.toThrow('invalid SSH response');
  });
  it('rejects unsafe destinations before sending signatures', async () => {
    const { service, fetchMock } = fixture();
    await expect(
      service.listKeys({ ...opts, nodeDomain: 'node.example.com@evil.test' })
    ).rejects.toThrow('Invalid SSH');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
