export type Template = Record<string, unknown>;

export interface NosanaTemplatesApi {
  list: () => Promise<Template[]>;
  getAllGrouped: () => Promise<Record<string, unknown>>;
  get: (id: string) => Promise<Template>;
  getVariant: (id: string, variantId: string) => Promise<Template>;
}
