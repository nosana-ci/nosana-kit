import { describe, it, expect, vi } from 'vitest';
import { createSolanaService } from '../../../src/services/SolanaService.js';
import type { Instruction } from '@solana/kit';
import { Logger } from '../../../src/logger/Logger.js';
import { AddressFactory, SignerFactory } from '../helpers/index.js';
import type { Wallet } from '../../../src/types.js';

// Mock @solana/kit module
// We mock:
// 1. Network-calling functions (createSolanaRpc, createSolanaRpcSubscriptions, sendAndConfirmTransactionFactory)
//    - These make actual HTTP/WebSocket calls to RPC endpoints - MUST be mocked
// 2. Transaction building/signing functions (wrapped in vi.fn for error testing)
//    - These don't make network calls but we mock them for:
//      a) Error testing (need to inject errors)
//      b) Test simplicity (real implementations require complex transaction structure validation)
//    - We use real implementations by default but wrap in vi.fn to allow overrides
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

  // Create a factory function that returns a new RPC mock instance each time
  // This prevents test isolation issues when tests modify the RPC mock
  function createMockRpc() {
    const getLatestBlockhash = vi.fn(() => ({
      send: vi.fn().mockResolvedValue({ value: latestBlockhashValue }),
    }));
    const getBalance = vi.fn(() => ({
      send: vi.fn().mockResolvedValue({ value: mockBalance }),
    }));
    const simulateTransaction = vi.fn(() => ({
      send: vi.fn().mockResolvedValue({
        value: {
          err: null,
          unitsConsumed: BigInt(200000),
          logs: [],
        },
      }),
    }));
    return { getLatestBlockhash, getBalance, simulateTransaction } as any;
  }

  const rpcSubscriptions = {} as any;
  const sendAndConfirmTransaction = vi.fn().mockResolvedValue(undefined);

  // Mock network-calling functions (these make actual network calls)
  // Return a new RPC instance each time to prevent test isolation issues
  const createSolanaRpc = vi.fn(() => createMockRpc());
  const createSolanaRpcSubscriptions = vi.fn(() => rpcSubscriptions);
  const sendAndConfirmTransactionFactory = vi.fn(() => sendAndConfirmTransaction);

  // Store the mock so we can access it in tests
  (sendAndConfirmTransactionFactory as any).mockSendAndConfirm = sendAndConfirmTransaction;

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
  // Mock to return predictable signature for tests
  const getSignatureFromTransaction = vi.fn(() => mockSignature as any);
  // Mock assertIsSendableTransaction - real implementation has strict validation
  // that requires complete transaction structure which our mocks don't provide
  const assertIsSendableTransaction = vi.fn((_tx: any) => {
    // No-op validation for tests
  });

  return {
    ...actual, // Includes all real implementations (pipe, createTransactionMessage, etc.)
    createSolanaRpc,
    createSolanaRpcSubscriptions,
    sendAndConfirmTransactionFactory,
    signTransactionMessageWithSigners, // Mocked to avoid complex validation
    getSignatureFromTransaction, // Mocked for predictable test signatures
    assertIsSendableTransaction, // Mocked to avoid strict transaction structure validation
  };
});

// pull mocked functions for assertions
const solanaKit = await import('@solana/kit');
type SolanaKitMock = {
  signTransactionMessageWithSigners: ReturnType<typeof vi.fn>;
  getSignatureFromTransaction: ReturnType<typeof vi.fn>;
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
  const mockSignature = 'mock-signature';

  function createService(getWallet: () => Wallet | undefined) {
    return createSolanaService({
      rpcEndpoint,
      cluster,
      logger,
      getWallet,
    });
  }

  async function createWalletAndService() {
    const wallet = await SignerFactory.createTestSigner();
    const service = createService(() => wallet);
    return { wallet, service };
  }

  async function createTransactionMessage(
    service: ReturnType<typeof createService>,
    instruction: Instruction | Instruction[]
  ) {
    return await service.buildTransaction(instruction);
  }

  async function createSignedTransaction(
    service: ReturnType<typeof createService>,
    instruction: Instruction | Instruction[]
  ) {
    const transactionMessage = await createTransactionMessage(service, instruction);
    return await service.signTransaction(transactionMessage);
  }

  describe('buildTransaction', () => {
    it('throws when no wallet is set and no feePayer provided', async () => {
      const service = createService(() => undefined);
      const instruction = makeInstruction();

      await expect(service.buildTransaction(instruction)).rejects.toMatchObject({
        code: 'NO_WALLET',
      });
    });

    it('builds a transaction message with wallet as fee payer', async () => {
      const { service } = await createWalletAndService();
      const instruction = makeInstruction();

      const transactionMessage = await service.buildTransaction(instruction);

      // observable behavior: transaction message is returned
      expect(transactionMessage).toBeDefined();
      expect(transactionMessage.instructions).toHaveLength(2); // instruction + compute unit limit
    });

    it('builds a transaction message with custom fee payer', async () => {
      const { service } = await createWalletAndService();
      const customFeePayer = await SignerFactory.createRandomSigner();
      const instruction = makeInstruction();

      const transactionMessage = await service.buildTransaction(instruction, {
        feePayer: customFeePayer,
      });

      // observable behavior: transaction message uses custom fee payer
      expect(transactionMessage).toBeDefined();
      expect(transactionMessage.feePayer).toBeDefined();
      // Verify the fee payer address matches the custom fee payer
      expect(String(transactionMessage.feePayer.address)).toBe(String(customFeePayer.address));
    });

    it('builds a transaction message with multiple instructions', async () => {
      const { service } = await createWalletAndService();
      const instructions = [makeInstruction(), makeInstruction()];

      const transactionMessage = await service.buildTransaction(instructions);

      // observable behavior: all instructions are included
      expect(transactionMessage.instructions.length).toBeGreaterThanOrEqual(2);
    });

    it('throws NosanaError on RPC failure', async () => {
      const { service } = await createWalletAndService();
      const rpcError = new Error('rpc error');
      const mockGetLatestBlockhash = vi.fn(() => ({
        send: vi.fn().mockRejectedValue(rpcError),
      }));
      service.rpc.getLatestBlockhash = mockGetLatestBlockhash as any;

      await expect(service.buildTransaction(makeInstruction())).rejects.toMatchObject({
        code: 'RPC_ERROR',
      });
    });
  });

  describe('signTransaction', () => {
    it('signs a transaction message', async () => {
      const { service } = await createWalletAndService();
      const instruction = makeInstruction();
      const transactionMessage = await createTransactionMessage(service, instruction);

      const signedTransaction = await service.signTransaction(transactionMessage);

      // observable behavior: transaction is signed
      expect(signedTransaction).toBeDefined();
      expect(solanaKitMock.signTransactionMessageWithSigners).toHaveBeenCalled();
    });

    it('throws NosanaError when signing fails', async () => {
      const { service } = await createWalletAndService();
      const instruction = makeInstruction();
      const transactionMessage = await createTransactionMessage(service, instruction);
      const errorMessage = 'sign failed';

      solanaKitMock.signTransactionMessageWithSigners.mockRejectedValueOnce(
        new Error(errorMessage)
      );

      await expect(service.signTransaction(transactionMessage)).rejects.toMatchObject({
        code: 'TRANSACTION_ERROR',
      });
    });
  });

  describe('sendTransaction', () => {
    it('sends and confirms a signed transaction', async () => {
      const { service } = await createWalletAndService();
      const instruction = makeInstruction();
      const signedTransaction = await createSignedTransaction(service, instruction);

      const signature = await service.sendTransaction(signedTransaction);

      // observable behavior: signature is returned and transaction is confirmed
      expect(signature).toBe(mockSignature);
      expect(service.sendAndConfirmTransaction).toHaveBeenCalled();
    });

    it('sends transaction with custom commitment', async () => {
      const { service } = await createWalletAndService();
      const instruction = makeInstruction();
      const signedTransaction = await createSignedTransaction(service, instruction);
      const commitment = 'finalized' as const;

      const signature = await service.sendTransaction(signedTransaction, { commitment });

      // observable behavior: transaction is sent with custom commitment
      expect(signature).toBe(mockSignature);
      expect(service.sendAndConfirmTransaction).toHaveBeenCalledWith(expect.any(Object), {
        commitment,
      });
    });

    it('throws NosanaError on RPC failure', async () => {
      const { wallet } = await createWalletAndService();
      const instruction = makeInstruction();

      // Create a service with a mocked sendAndConfirmTransaction that rejects
      const rpcError = new Error('rpc error');
      const mockSendAndConfirm = vi.fn().mockRejectedValue(rpcError);
      solanaKitMock.sendAndConfirmTransactionFactory.mockReturnValueOnce(mockSendAndConfirm as any);

      const service = createService(() => wallet);
      const signedTransaction = await createSignedTransaction(service, instruction);

      await expect(service.sendTransaction(signedTransaction)).rejects.toMatchObject({
        code: 'RPC_ERROR',
      });
    });
  });

  describe('buildSignAndSend', () => {
    it('builds, signs, and sends a transaction in one call', async () => {
      const { service } = await createWalletAndService();
      const instruction = makeInstruction();

      const signature = await service.buildSignAndSend(instruction);

      // observable behavior: signature is returned
      expect(signature).toBe(mockSignature);
      expect(service.sendAndConfirmTransaction).toHaveBeenCalled();
    });

    it('builds, signs, and sends with custom fee payer', async () => {
      const { service } = await createWalletAndService();
      const customFeePayer = await SignerFactory.createRandomSigner();
      const instruction = makeInstruction();

      const signature = await service.buildSignAndSend(instruction, { feePayer: customFeePayer });

      // observable behavior: signature is returned with custom fee payer
      expect(signature).toBe(mockSignature);
      // Verify the transaction was built and sent successfully
      expect(service.sendAndConfirmTransaction).toHaveBeenCalled();
    });

    it('builds, signs, and sends with custom commitment', async () => {
      const { service } = await createWalletAndService();
      const instruction = makeInstruction();
      const commitment = 'processed' as const;

      const signature = await service.buildSignAndSend(instruction, { commitment });

      // observable behavior: signature is returned with custom commitment
      expect(signature).toBe(mockSignature);
      expect(service.sendAndConfirmTransaction).toHaveBeenCalledWith(expect.any(Object), {
        commitment,
      });
    });
  });

  describe('getBalance', () => {
    it('returns balance for valid address', async () => {
      const service = createService(() => undefined);
      const testAddress = '11111111111111111111111111111111';

      const balance = await service.getBalance(testAddress);

      expect(balance).toBe(mockBalance);
    });

    it('returns balance for wallet when no address provided', async () => {
      const { wallet, service } = await createWalletAndService();

      const balance = await service.getBalance();

      expect(balance).toBe(mockBalance);
      expect(service.rpc.getBalance).toHaveBeenCalledWith(wallet.address);
    });

    it('throws when no wallet and no address provided', async () => {
      const service = createService(() => undefined);

      await expect(service.getBalance()).rejects.toMatchObject({ code: 'NO_WALLET' });
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
