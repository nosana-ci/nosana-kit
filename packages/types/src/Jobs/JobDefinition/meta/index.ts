
export type Meta = {
  trigger?: string;
  system_resources?: Record<string, string | number>;
  [key: string]: string | number | Record<string, string | number | Array<string | number>> | Array<string | number> | undefined;
}