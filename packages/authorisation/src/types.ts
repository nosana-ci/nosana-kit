export type SignerOrKey = Uint8Array | SignMessageFn;

export type AuthorizationStore = {
  identifier: string;
  actions: {
    get: (identifier: string, options: Omit<GenerateOptions, "store">) => Promise<string | undefined> | string | undefined;
    set: (identifier: string, options: Omit<GenerateOptions, "store">, value: string | undefined) => void;
  }
}

export type GenerateHeaderOptions = GenerateOptions & {
  expiry: number;
  key: string;
};

export type ValidateOptions = {
  expiry: number;
  separator: string;
  expected_message?: string;
};

export type GenerateOptions = {
  includeTime: boolean;
  separator: string;
};

export type SignMessageFn = (message: Uint8Array) => Promise<Uint8Array>;