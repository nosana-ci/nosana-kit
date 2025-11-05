import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SolanaService } from '../src/solana/SolanaService.js';
import { address } from 'gill';
import type { SolanaClient, IInstruction, CompilableTransactionMessage, TransactionMessageWithBlockhashLifetime, FullySignedTransaction, TransactionWithBlockhashLifetime, Address, KeyPairSigner } from 'gill';
type CryptoKeyPair = { publicKey?: unknown; privateKey?: unknown };
import type { NosanaClient } from '../src/index.js';

// Mock gill module used by SolanaService
vi.mock('gill', () => {
  const latestBlockhashValue = { blockhash: 'mock-blockhash', lastValidBlockHeight: 123 };
  const getLatestBlockhash = vi.fn(() => ({
    send: vi.fn().mockResolvedValue({ value: latestBlockhashValue })
  }));
  const getBalance = vi.fn(() => ({
    send: vi.fn().mockResolvedValue({ value: BigInt(1000) })
  }));

  const rpc = { getLatestBlockhash, getBalance } as unknown as SolanaClient['rpc'];
  const rpcSubscriptions = {} as unknown as SolanaClient['rpcSubscriptions'];
  const sendAndConfirmTransaction = vi.fn().mockResolvedValue(undefined);

  const createSolanaClient = vi.fn(() => ({ rpc, rpcSubscriptions, sendAndConfirmTransaction }));

  const createTransaction = vi.fn((args: any) => ({ ...args, created: true }));
  const signTransactionMessageWithSigners = vi.fn(async (txOrMsg: any) => ({
    ...txOrMsg,
    signatures: [{ address: txOrMsg?.feePayer?.address ?? addressFn('unknown'), signature: new Uint8Array([1]) }]
  }));
  const getSignatureFromTransaction = vi.fn(() => 'mock-signature');
  const getExplorerLink = vi.fn(() => 'https://explorer/tx/mock-signature');
  const addressFn = vi.fn((s: string) => s as unknown as Address);
  const generateKeyPairSigner = vi.fn(async () => ({
    address: addressFn('feePayer'),
    signMessages: async () => [],
    signTransactions: async () => [],
    keyPair: {} as any,
  }));

  // re-export minimal surface used by SolanaService
  return {
    createSolanaClient,
    createTransaction,
    signTransactionMessageWithSigners,
    getSignatureFromTransaction,
    getExplorerLink,
    address: addressFn,
    generateKeyPairSigner,
  };
});

// pull mocked functions for assertions
const gill = await import('gill');
type GillMock = {
  createTransaction: ReturnType<typeof vi.fn>;
  signTransactionMessageWithSigners: ReturnType<typeof vi.fn>;
  getSignatureFromTransaction: ReturnType<typeof vi.fn>;
  getExplorerLink: ReturnType<typeof vi.fn>;
  generateKeyPairSigner: ReturnType<typeof vi.fn>;
};
const gillMock = gill as unknown as GillMock;

function makeSdk(overrides: Partial<NosanaClient> = {}) {
  return {
    config: {
      solana: { rpcEndpoint: 'https://rpc.example', cluster: 'devnet' },
    },
    logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
    wallet: overrides.wallet,
    ...overrides,
  } as unknown as NosanaClient;
}

function makeInstruction(): IInstruction {
  return { programAddress: address('prog'), accounts: [], data: new Uint8Array([1, 2, 3]) };
}

async function makeWallet(): Promise<KeyPairSigner> {
  return (await import('gill')).generateKeyPairSigner();
}

describe('SolanaService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('throws when no wallet is set', async () => {
    const sdk = makeSdk({ wallet: undefined });
    const service = new SolanaService(sdk);
    await expect(service.send(makeInstruction())).rejects.toMatchObject({ code: 'NO_WALLET' });
  });

  it('sends a single instruction', async () => {
    const sdk = makeSdk({ wallet: await makeWallet() });
    const service = new SolanaService(sdk);

    const sig = await service.send(makeInstruction());

    expect(sig).toBe('mock-signature');
    expect(gillMock.createTransaction).toHaveBeenCalled();
    expect(gillMock.signTransactionMessageWithSigners).toHaveBeenCalled();
    expect(gillMock.getSignatureFromTransaction).toHaveBeenCalled();
    expect(gillMock.getExplorerLink).toHaveBeenCalled();
    expect(service.sendAndConfirmTransaction).toHaveBeenCalled();
    expect((await import('gill'))).toBeTruthy();

    // signer/feePayer checks
    const calledTx = gillMock.signTransactionMessageWithSigners.mock.calls.at(-1)![0];
    expect(calledTx.feePayer).toBe(sdk.wallet);
    const signedTx = await gillMock.signTransactionMessageWithSigners.mock.results.at(-1)!.value;
    expect(signedTx.signatures?.[0]?.address).toBe(sdk.wallet!.address);
  });

  it('sends an array of instructions', async () => {
    const sdk = makeSdk({ wallet: await makeWallet() });
    const service = new SolanaService(sdk);

    const sig = await service.send([makeInstruction(), makeInstruction()]);

    expect(sig).toBe('mock-signature');
    expect(gillMock.createTransaction).toHaveBeenCalled();
    expect(service.sendAndConfirmTransaction).toHaveBeenCalled();
  });

  it('uses a pre-signed transaction without re-signing', async () => {
    const sdk = makeSdk({ wallet: await makeWallet() });
    const service = new SolanaService(sdk);

    const preSignedTx = {
      instructions: [makeInstruction()],
      version: 0,
      signatures: [{ address: address('feePayer'), signature: new Uint8Array([1]) }],
    } as unknown as FullySignedTransaction & TransactionWithBlockhashLifetime;

    const sig = await service.send(preSignedTx);

    expect(sig).toBe('mock-signature');
    expect(gillMock.signTransactionMessageWithSigners).not.toHaveBeenCalled();
  });

  it('signs an unsigned transaction object', async () => {
    const sdk = makeSdk({ wallet: await makeWallet() });
    const service = new SolanaService(sdk);

    const unsignedTx = {
      instructions: [makeInstruction()],
      version: 0,
    } as unknown as CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime;

    const sig = await service.send(unsignedTx);
    expect(sig).toBe('mock-signature');
    expect(gillMock.signTransactionMessageWithSigners).toHaveBeenCalledWith(unsignedTx);
  });

  it('propagates transaction creation errors', async () => {
    const sdk = makeSdk({ wallet: await makeWallet() });
    const service = new SolanaService(sdk);

    gillMock.createTransaction.mockImplementationOnce(() => { throw new Error('create failed'); });

    await expect(service.send(makeInstruction())).rejects.toThrow('Failed to send transaction: create failed');
  });

  it('propagates signing errors', async () => {
    const sdk = makeSdk({ wallet: await makeWallet() });
    const service = new SolanaService(sdk);

    gillMock.signTransactionMessageWithSigners.mockRejectedValueOnce(new Error('sign failed'));

    await expect(service.send(makeInstruction())).rejects.toThrow('Failed to send transaction: sign failed');
  });
});


