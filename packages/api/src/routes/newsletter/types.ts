import type { operations } from '../../client/client-manager/schema.js';

export type NewsletterSubscribeRequest = NonNullable<
  operations['postNewsletterSubscribe']['requestBody']
>['content']['application/json'];

export interface NosanaNewsletterApi {
  subscribe: (
    request: NewsletterSubscribeRequest,
  ) => Promise<Record<string, unknown>>;
}
