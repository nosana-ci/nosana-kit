import { describe, it, expect, vi } from 'vitest';
import { createSolanaService } from '../../../src/services/SolanaService.js';
import type { Instruction } from '@solana/kit';
import { Logger } from '../../../src/logger/Logger.js';
import { AddressFactory, SignerFactory } from '../helpers/index.js';
import type { Signer } from '../../../src/types.js';

// Mock @solana/kit module
// We mock:
// 1. Network-calling functions (createSolanaRpc, createSolanaRpcSubscriptions, sendAndConfirmTransactionFactory)
//    - These make actual HTTP/WebSocket calls to RPC endpoints - MUST be mocked
// 2. Transaction building/signing functions (wrapped in vi.fn for error testing)
//    - These don't make network calls but we mock them for:
//      a) Error testing (need to inject errors)
//      b) Test simplicity (real implementations require complex transaction structure validation)
//    - We use real implementations by default but wrap in vi.fn to allow overrides
// 3. We use real implementations for: getProgramDerivedAddress (deterministic PDA derivation, no network calls, simple to use)
vi.mock('@solana/kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solana/kit')>();
  const mockBlockhash = '11111111111111111111111111111111'; // Valid base58 format
  const mockLastValidBlockHeight = BigInt(123);
  const mockBalance = BigInt(1000);
  const mockSignature = 'mock-signature';

  const latestBlockhashValue = {
    blockhash: mockBlockhash,
    lastValidBlockHeight: mockLastValidBlockHeight,
  };
  const getLatestBlockhash = vi.fn(() => ({
    send: vi.fn().mockResolvedValue({ value: latestBlockhashValue }),
  }));
  const getBalance = vi.fn(() => ({
    send: vi.fn().mockResolvedValue({ value: mockBalance }),
  }));

  const rpc = { getLatestBlockhash, getBalance } as any;
  const rpcSubscriptions = {} as any;
  const sendAndConfirmTransaction = vi.fn().mockResolvedValue(undefined);

  // Mock network-calling functions (these make actual network calls)
  const createSolanaRpc = vi.fn(() => rpc);
  const createSolanaRpcSubscriptions = vi.fn(() => rpcSubscriptions);
  const sendAndConfirmTransactionFactory = vi.fn(() => sendAndConfirmTransaction);

  // Wrap transaction building and signing functions in vi.fn for error testing
  // These don't make network calls but we wrap them to allow error injection
  const createTransactionMessage = vi.fn(actual.createTransactionMessage);
  const setTransactionMessageFeePayer = vi.fn(actual.setTransactionMessageFeePayer);
  const setTransactionMessageLifetimeUsingBlockhash = vi.fn(
    actual.setTransactionMessageLifetimeUsingBlockhash
  );
  // Mock signing function - doesn't make network calls but has complex validation
  // We mock it to avoid complex transaction structure requirements in tests
  const signTransactionMessageWithSigners = vi.fn(async (txOrMsg: any) => ({
    ...txOrMsg,
    signatures: [
      {
        address: txOrMsg?.feePayer?.address ?? actual.address('11111111111111111111111111111111'),
        signature: new Uint8Array(64).fill(1),
      },
    ],
  }));
  const getSignatureFromTransaction = vi.fn(() => mockSignature as any);

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
    // getProgramDerivedAddress uses real implementation (deterministic, no network calls)
  };
});

// pull mocked functions for assertions (wrapped in vi.fn for error testing)
const solanaKit = await import('@solana/kit');
type SolanaKitMock = {
  createTransactionMessage: ReturnType<typeof vi.fn>;
  signTransactionMessageWithSigners: ReturnType<typeof vi.fn>;
  createSolanaRpc: ReturnType<typeof vi.fn>;
  sendAndConfirmTransactionFactory: ReturnType<typeof vi.fn>;
};
const solanaKitMock = solanaKit as unknown as SolanaKitMock;

function makeInstruction(): Instruction {
  return {
    programAddress: AddressFactory.createValid(),
    accounts: [],
    data: new Uint8Array([1, 2, 3]),
  };
}

describe('SolanaService', () => {
  const logger = Logger.getInstance();
  const rpcEndpoint = 'https://rpc.example';
  const cluster = 'devnet';
  const mockBalance = BigInt(1000);
  const mockBlockhash = '11111111111111111111111111111111'; // Valid base58 format
  const mockLastValidBlockHeight = BigInt(123);
  const mockSignature = 'mock-signature';

  function createService(getSigner: () => Signer | undefined) {
    return createSolanaService({
      rpcEndpoint,
      cluster,
      logger,
      getSigner,
    });
  }

  describe('send', () => {
    it('throws when no signer is set', async () => {
      const service = createService(() => undefined);
      const instruction = makeInstruction();

      await expect(service.send(instruction)).rejects.toMatchObject({ code: 'NO_WALLET' });
    });

    it('sends a single instruction and returns signature', async () => {
      const signer = await SignerFactory.createTestSigner();
      const service = createService(() => signer);
      const instruction = makeInstruction();

      const signature = await service.send(instruction);

      // observable behavior: signature is returned and transaction is confirmed
      expect(signature).toBe(mockSignature);
      expect(service.sendAndConfirmTransaction).toHaveBeenCalled();
    });

    it('sends multiple instructions and returns signature', async () => {
      const signer = await SignerFactory.createTestSigner();
      const service = createService(() => signer);
      const instructions = [makeInstruction(), makeInstruction()];

      const signature = await service.send(instructions);

      // observable behavior: signature is returned and transaction is confirmed
      expect(signature).toBe(mockSignature);
      expect(service.sendAndConfirmTransaction).toHaveBeenCalled();
    });

    it('uses pre-signed transaction without re-signing', async () => {
      const signer = await SignerFactory.createTestSigner();
      const service = createService(() => signer);
      const preSignedTx = {
        instructions: [makeInstruction()],
        version: 0,
        signatures: [{ address: signer.address, signature: new Uint8Array(64).fill(1) }],
      } as any;

      vi.clearAllMocks();
      const signature = await service.send(preSignedTx);

      // observable behavior: signature is returned without re-signing
      expect(signature).toBe(mockSignature);
      expect(solanaKitMock.signTransactionMessageWithSigners).not.toHaveBeenCalled();
    });

    it('signs an unsigned transaction object', async () => {
      const signer = await SignerFactory.createTestSigner();
      const service = createService(() => signer);
      const unsignedTx = {
        instructions: [makeInstruction()],
        version: 0,
      } as any;

      const signature = await service.send(unsignedTx);

      // observable behavior: signature is returned for unsigned transaction
      expect(signature).toBe(mockSignature);
    });

    it('throws NosanaError when transaction creation fails', async () => {
      const signer = await SignerFactory.createTestSigner();
      const service = createService(() => signer);
      const errorMessage = 'create failed';

      solanaKitMock.createTransactionMessage.mockImplementationOnce(() => {
        throw new Error(errorMessage);
      });

      await expect(service.send(makeInstruction())).rejects.toThrow(
        `Failed to send transaction: ${errorMessage}`
      );
    });

    it('throws NosanaError when signing fails', async () => {
      const signer = await SignerFactory.createTestSigner();
      const service = createService(() => signer);
      const errorMessage = 'sign failed';

      solanaKitMock.signTransactionMessageWithSigners.mockRejectedValueOnce(
        new Error(errorMessage)
      );

      await expect(service.send(makeInstruction())).rejects.toThrow(
        `Failed to send transaction: ${errorMessage}`
      );
    });
  });

  describe('getBalance', () => {
    it('returns balance for valid address', async () => {
      const service = createService(() => undefined);
      const testAddress = '11111111111111111111111111111111';

      const balance = await service.getBalance(testAddress);

      expect(balance).toBe(mockBalance);
    });

    it('throws NosanaError on RPC failure', async () => {
      const service = createService(() => undefined);
      const testAddress = '11111111111111111111111111111111';
      const rpcError = new Error('rpc error');
      const mockGetBalance = vi.fn(() => ({
        send: vi.fn().mockRejectedValue(rpcError),
      }));
      service.rpc.getBalance = mockGetBalance as any;

      await expect(service.getBalance(testAddress)).rejects.toMatchObject({ code: 'RPC_ERROR' });
    });
  });

  describe('getLatestBlockhash', () => {
    it('returns blockhash and last valid block height', async () => {
      const service = createService(() => undefined);

      const result = await service.getLatestBlockhash();

      expect(result.blockhash).toBe(mockBlockhash);
      expect(result.lastValidBlockHeight).toBe(mockLastValidBlockHeight);
    });

    it('throws NosanaError on RPC failure', async () => {
      const service = createService(() => undefined);
      const rpcError = new Error('rpc error');
      const mockGetLatestBlockhash = vi.fn(() => ({
        send: vi.fn().mockRejectedValue(rpcError),
      }));
      service.rpc.getLatestBlockhash = mockGetLatestBlockhash as any;

      await expect(service.getLatestBlockhash()).rejects.toMatchObject({ code: 'RPC_ERROR' });
    });
  });

  describe('pda', () => {
    it('derives PDA from seeds and program ID', async () => {
      const service = createService(() => undefined);
      const programId = AddressFactory.createValid();
      const seed1 = 'seed1';
      const seed2 = 'seed2';

      const pda = await service.pda([seed1, seed2], programId);

      expect(pda).toBeTypeOf('string');
      expect(pda.length).toBeGreaterThan(0);
    });
  });
});
