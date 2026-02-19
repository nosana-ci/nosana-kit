import { operations } from "../../client/schema.js";

export type Balance = operations['getApiCreditsBalance']['responses'][200]['content']['application/json']

export interface NosanaCreditsApi {
  balance: () => Promise<Balance>;
}