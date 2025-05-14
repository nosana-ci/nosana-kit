import { NosanaClient } from '../index.js';

export abstract class BaseProgram {
  protected readonly sdk: NosanaClient;

  constructor(sdk: NosanaClient) {
    this.sdk = sdk;
  }

  protected abstract getProgramId(): string;
} 