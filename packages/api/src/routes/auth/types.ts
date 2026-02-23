
export type NosanaAuthApi = {
  signMessage: (message: string, options?: { includeTime?: boolean }) => Promise<string>;
}