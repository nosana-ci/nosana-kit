import type { JobDefinition } from '@nosana/types';

/** The SSH public keys a job definition grants access to, ignoring blank entries. */
export function getSshPublicKeys(definition: JobDefinition): string[] {
  const keys = definition.ssh?.public_keys;
  if (!Array.isArray(keys)) return [];
  return keys.filter((key) => typeof key === 'string' && key.trim().length > 0);
}

/** A copy of `definition` granting exactly `publicKeys`; an empty list drops the `ssh` block. */
export function withSshPublicKeys(definition: JobDefinition, publicKeys: string[]): JobDefinition {
  const { ssh, ...rest } = definition;
  if (publicKeys.length === 0) return rest;
  return { ...rest, ssh: { ...ssh, public_keys: [...publicKeys] } };
}
