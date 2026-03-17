
export type EnumValues<T> = T[keyof T];

type HasType<T> = '_type' extends keyof T ? true : false;
type ExtractType<T> = T extends { _type: infer U } ? U : never;

export type GetPublicKeyOrAddress<P, A> =
  HasType<P> extends true
  ? HasType<A> extends true
  ? never  // Both augmented - error
  : ExtractType<P>  // Only P augmented
  : HasType<A> extends true
  ? ExtractType<A>  // Only A augmented
  : never;  // Neither augmented - error

