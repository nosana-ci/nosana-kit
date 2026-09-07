import { describe, expect, it } from 'vitest';
import type { JobDefinition } from '@nosana/types';

import { getSshPublicKeys, withSshPublicKeys } from '../jobDefinition.js';

const definition = { version: '0.1', type: 'container', ops: [] } as unknown as JobDefinition;
const key =
  'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIB0XqCL4vLIsYRvd5VmtbOJ8IEKDJpjaVWQ5lmxWVTq5 user-a';

describe('job definition SSH keys', () => {
  it('reads keys, ignoring blanks and a missing block', () => {
    expect(getSshPublicKeys(definition)).toEqual([]);
    expect(getSshPublicKeys({ ...definition, ssh: { public_keys: [key, ' ', ''] } })).toEqual([
      key,
    ]);
  });

  it('adds keys without mutating the original', () => {
    const updated = withSshPublicKeys(definition, [key]);
    expect(definition.ssh).toBeUndefined();
    expect(updated.ssh?.public_keys).toEqual([key]);
    expect(updated.ssh?.public_keys).not.toBe(updated.ssh?.public_keys?.slice());
  });

  it('drops the ssh block when given no keys', () => {
    const updated = withSshPublicKeys(withSshPublicKeys(definition, [key]), []);
    expect(updated).not.toHaveProperty('ssh');
    expect(updated).toEqual(definition);
  });
});
