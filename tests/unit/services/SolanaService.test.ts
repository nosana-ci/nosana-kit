import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSolanaService } from '../../../src/services/SolanaService.js';
import type { IInstruction } from '@solana/kit';
import { Logger } from '../../../src/logger/Logger.js';
import { AddressFactory } from '../helpers/index.js';
import { createKeyPairSigner } from '@solana/kit';

// Mock @solana/kit module used by SolanaService
vi.mock('@solana/kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solana/kit')>();
  const latestBlockhashValue = { blockhash: 'mock-blockhash', lastValidBlockHeight: BigInt(123) };
  const getLatestBlockhash = vi.fn(() => ({
    send: vi.fn().mockResolvedValue({ value: latestBlockhashValue }),
  }));
  const getBalance = vi.fn(() => ({
    send: vi.fn().mockResolvedValue({ value: BigInt(1000) }),
  }));

  const rpc = { getLatestBlockhash, getBalance } as any;
  const rpcSubscriptions = {} as any;
  const sendAndConfirmTransaction = vi.fn().mockResolvedValue(undefined);

  const createSolanaRpc = vi.fn(() => rpc);
  const createSolanaRpcSubscriptions = vi.fn(() => rpcSubscriptions);
  const sendAndConfirmTransactionFactory = vi.fn(() => sendAndConfirmTransaction);

  const createTransactionMessage = vi.fn((args: any) => ({ ...args, version: 0 }));
  const setTransactionMessageFeePayer = vi.fn((feePayer: any, tx: any) => ({ ...tx, feePayer }));
  const setTransactionMessageLifetimeUsingBlockhash = vi.fn((blockhash: any, tx: any) => ({
    ...tx,
    blockhash,
  }));
  const signTransactionMessageWithSigners = vi.fn(async (txOrMsg: any) => ({
    ...txOrMsg,
    signatures: [
      {
        address: txOrMsg?.feePayer?.address ?? actual.address('11111111111111111111111111111111'),
        signature: new Uint8Array([1]),
      },
    ],
  }));
  const getSignatureFromTransaction = vi.fn(() => 'mock-signature' as any);
  const getProgramDerivedAddress = vi.fn(async () => [
    actual.address('11111111111111111111111111111111'),
  ]);
  const createKeyPairSigner = vi.fn(async () => ({
    address: actual.address('11111111111111111111111111111112'),
    signMessages: async () => [],
    signTransactions: async () => [],
  }));

  // re-export with actual implementations for functions we don't mock
  return {
    ...actual,
    createSolanaRpc,
    createSolanaRpcSubscriptions,
    sendAndConfirmTransactionFactory,
    createTransactionMessage,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
    signTransactionMessageWithSigners,
    getSignatureFromTransaction,
    getProgramDerivedAddress,
    createKeyPairSigner,
  };
});

// pull mocked functions for assertions
const solanaKit = await import('@solana/kit');
type SolanaKitMock = {
  createTransactionMessage: ReturnType<typeof vi.fn>;
  signTransactionMessageWithSigners: ReturnType<typeof vi.fn>;
  getSignatureFromTransaction: ReturnType<typeof vi.fn>;
  createSolanaRpc: ReturnType<typeof vi.fn>;
  sendAndConfirmTransactionFactory: ReturnType<typeof vi.fn>;
};
const solanaKitMock = solanaKit as unknown as SolanaKitMock;

function makeInstruction(): IInstruction {
  return {
    programAddress: AddressFactory.createValid(),
    accounts: [],
    data: new Uint8Array([1, 2, 3]),
  };
}

async function makeWallet() {
  return await createKeyPairSigner();
}

describe('SolanaService', () => {
  const logger = Logger.getInstance();
  let wallet: Awaited<ReturnType<typeof createKeyPairSigner>> | undefined;

  beforeEach(() => {
    wallet = undefined;
  });

  function createService() {
    return createSolanaService({
      rpcEndpoint: 'https://rpc.example',
      cluster: 'devnet',
      logger,
      getSigner: () => wallet,
    });
  }

  describe('send', () => {
    it('throws when no wallet is set', async () => {
      const service = createService();
      await expect(service.send(makeInstruction())).rejects.toMatchObject({ code: 'NO_WALLET' });
    });

    it('sends a single instruction', async () => {
      wallet = await makeWallet();
      const service = createService();

      const sig = await service.send(makeInstruction());

      expect(sig).toBe('mock-signature');
      expect(solanaKitMock.createTransactionMessage).toHaveBeenCalled();
      expect(solanaKitMock.signTransactionMessageWithSigners).toHaveBeenCalled();
      expect(solanaKitMock.getSignatureFromTransaction).toHaveBeenCalled();
      expect(service.sendAndConfirmTransaction).toHaveBeenCalled();

      // signer/feePayer checks
      const calledTx = solanaKitMock.signTransactionMessageWithSigners.mock.calls.at(-1)![0];
      expect(calledTx.feePayer).toBe(wallet.address);
      const signedTx =
        await solanaKitMock.signTransactionMessageWithSigners.mock.results.at(-1)!.value;
      // The mock returns the address from the transaction or a default, so check it's defined
      expect(signedTx.signatures?.[0]?.address).toBeDefined();
    });

    it('sends an array of instructions', async () => {
      wallet = await makeWallet();
      const service = createService();

      const sig = await service.send([makeInstruction(), makeInstruction()]);

      expect(sig).toBe('mock-signature');
      expect(solanaKitMock.createTransactionMessage).toHaveBeenCalled();
      expect(service.sendAndConfirmTransaction).toHaveBeenCalled();
    });

    it('uses a pre-signed transaction without re-signing', async () => {
      wallet = await makeWallet();
      const service = createService();

      const preSignedTx = {
        instructions: [makeInstruction()],
        version: 0,
        signatures: [{ address: AddressFactory.createValid(), signature: new Uint8Array([1]) }],
      } as any;

      const sig = await service.send(preSignedTx);

      expect(sig).toBe('mock-signature');
      expect(solanaKitMock.signTransactionMessageWithSigners).not.toHaveBeenCalled();
    });

    it('signs an unsigned transaction object', async () => {
      wallet = await makeWallet();
      const service = createService();

      const unsignedTx = {
        instructions: [makeInstruction()],
        version: 0,
      } as any;

      const sig = await service.send(unsignedTx);
      expect(sig).toBe('mock-signature');
      expect(solanaKitMock.signTransactionMessageWithSigners).toHaveBeenCalledWith(unsignedTx);
    });

    it('propagates transaction creation errors', async () => {
      wallet = await makeWallet();
      const service = createService();

      solanaKitMock.createTransactionMessage.mockImplementationOnce(() => {
        throw new Error('create failed');
      });

      await expect(service.send(makeInstruction())).rejects.toThrow(
        'Failed to send transaction: create failed'
      );
    });

    it('propagates signing errors', async () => {
      wallet = await makeWallet();
      const service = createService();

      solanaKitMock.signTransactionMessageWithSigners.mockRejectedValueOnce(
        new Error('sign failed')
      );

      await expect(service.send(makeInstruction())).rejects.toThrow(
        'Failed to send transaction: sign failed'
      );
    });
  });

  describe('getBalance', () => {
    it('returns balance for valid address', async () => {
      const service = createService();
      const balance = await service.getBalance('11111111111111111111111111111111');
      expect(balance).toBe(BigInt(1000));
    });

    it('throws NosanaError on RPC failure', async () => {
      const service = createService();
      const mockGetBalance = vi.fn(() => ({
        send: vi.fn().mockRejectedValue(new Error('rpc error')),
      }));
      service.rpc.getBalance = mockGetBalance as any;
      await expect(service.getBalance('invalid')).rejects.toMatchObject({ code: 'RPC_ERROR' });
    });
  });

  describe('getLatestBlockhash', () => {
    it('returns blockhash and last valid block height', async () => {
      const service = createService();
      const blockhash = await service.getLatestBlockhash();
      expect(blockhash).toEqual({ blockhash: 'mock-blockhash', lastValidBlockHeight: BigInt(123) });
    });

    it('throws NosanaError on RPC failure', async () => {
      const service = createService();
      const mockGetLatestBlockhash = vi.fn(() => ({
        send: vi.fn().mockRejectedValue(new Error('rpc error')),
      }));
      service.rpc.getLatestBlockhash = mockGetLatestBlockhash as any;
      await expect(service.getLatestBlockhash()).rejects.toMatchObject({ code: 'RPC_ERROR' });
    });
  });

  describe('pda', () => {
    it('derives PDA from seeds and program ID', async () => {
      const service = createService();
      // Call pda and verify it returns an address
      const programId = AddressFactory.createValid();
      const pda = await service.pda(['seed1', 'seed2'], programId);
      expect(pda).toBeTypeOf('string');
      expect(pda.length).toBeGreaterThan(0);
    });
  });
});
