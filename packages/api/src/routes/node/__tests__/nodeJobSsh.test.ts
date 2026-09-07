import { Mock } from 'vitest';
import { JOB, KEY, NODE, nodeApi, ok } from './fixtures.js';

const ssh = () => nodeApi().job(JOB).ssh;

describe('node job ssh', () => {
  it('lists the keys the node holds', async () => {
    const keys = [{ sshPublicKey: KEY }];
    (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue(ok({ job: JOB, sshUser: 'nosana', keys }));

    await expect(ssh().keys()).resolves.toEqual(keys);
    expect(global.TEST_MOCK_CLIENT.GET).toHaveBeenCalledWith('/job/{job}/ssh/keys', {
      params: { path: { job: JOB } },
      signal: undefined,
    });
  });

  it('adds a key permanently or until an expiry', async () => {
    (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue(ok({ job: JOB, sshUser: 'u', authorized: true }));
    const expiresAt = new Date(Date.now() + 60_000);

    await ssh().add(` ${KEY} `);
    await ssh().add(KEY, { expiresAt });

    expect((global.TEST_MOCK_CLIENT.POST as Mock).mock.calls.map(([, init]) => init.body)).toEqual([
      { sshPublicKey: KEY },
      { sshPublicKey: KEY, expiresAt: expiresAt.toISOString() },
    ]);
  });

  it('rejects an invalid key or a past expiry before contacting the node', async () => {
    await expect(ssh().add('nope')).rejects.toThrow('public key');
    await expect(ssh().add(KEY, { expiresAt: new Date(0) })).rejects.toThrow('future Date');
    expect(global.TEST_MOCK_CLIENT.POST).not.toHaveBeenCalled();
  });

  it('removes a key', async () => {
    (global.TEST_MOCK_CLIENT.DELETE as Mock).mockResolvedValue(ok({ job: JOB, sshUser: 'u', revoked: true }));

    await expect(ssh().remove(KEY)).resolves.toMatchObject({ revoked: true });
    expect(global.TEST_MOCK_CLIENT.DELETE).toHaveBeenCalledWith('/job/{job}/ssh/keys', {
      params: { path: { job: JOB } },
      signal: undefined,
      body: { sshPublicKey: KEY },
    });
  });

  it('describes the ssh command to the job on its node, with the chosen identity', () => {
    const command = ssh().command({ identityFile: '~/.ssh/id_ed25519' });

    expect(command.hostname).toBe(`${JOB}-0-ssh.node.k8s.dev.nos.ci`);
    expect(command.username).toBe('nosana');
    expect(command.args).toContain('~/.ssh/id_ed25519');
    expect(ssh().command({ opIndex: 1 }).hostname).toBe(`${JOB}-1-ssh.node.k8s.dev.nos.ci`);
  });
});
