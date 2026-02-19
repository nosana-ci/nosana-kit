/**
 * api        - we receive and send via an endpoint endpoint
 * api-listen - we create an endpoint to listen for incoming requests
 */
export const LogisticType = {
  API: 'api',
  API_LISTEN: 'api-listen',
} as const;
export type LogisticType = typeof LogisticType[keyof typeof LogisticType];
type LogisticArgs = Partial<{
  endpoint: string;
}>;

export type Logistic = {
  type: LogisticType;
  args: LogisticArgs;
}

export interface Logistics {
  send: Logistic;
  receive: Logistic;
}
