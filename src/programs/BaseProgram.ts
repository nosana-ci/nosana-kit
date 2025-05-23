import { Address } from 'gill';
import { NosanaClient } from '../index.js';

export abstract class BaseProgram {
  protected readonly sdk: NosanaClient;
  protected readonly accounts: { [key: string]: Address } | undefined

  constructor(sdk: NosanaClient) {
    this.sdk = sdk;
  }

  protected abstract getProgramId(): Address;
} 