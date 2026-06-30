import type { operations } from '../../client/client-manager/schema.js';

// A template as returned by `GET /templates/{id}` and as each element of the
// list endpoint. The variant endpoint (`GET /templates/{id}/{variantId}`) has no
// response schema in the CM OpenAPI spec yet, so it is asserted to this same
// shape in index.ts — see the note there.
export type Template =
  operations['getTemplatesById']['responses'][200]['content']['application/json'];

export interface NosanaTemplatesApi {
  list: () => Promise<Template[]>;
  getAllGrouped: () => Promise<Record<string, unknown>>;
  get: (id: string) => Promise<Template>;
  getVariant: (id: string, variantId: string) => Promise<Template>;
}
