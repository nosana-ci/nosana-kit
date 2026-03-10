import { operations } from "../../client/blockchain-indexer/schema.js";

export type Balance = operations['getApiCreditsBalance']['responses'][200]['content']['application/json']

export interface NosanaCreditsApi {
  balance: () => Promise<Balance>;
}