import { describe, it, expect, vi } from 'vitest';
import type { Instruction } from '@solana/kit';
import { getTransferSolInstructionDataDecoder } from '@solana-program/system';

import { createSolanaService } from '../../../../src/services/solana/index.js';
import { PROTOCOL } from '../../../../src/utils/convertHttpToWebSocketUrl.js';
import { AddressFactory, MockClientFactory, SignerFactory } from '../../../setup/index.js';
import type { Wallet } from '../../../../src/types.js';

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
  const mockSignature = 'mock-signature';
  const mockLastValidBlockHeight = BigInt(123);
  const mockBalance = BigInt(1000);

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
  createSolanaRpcSubscriptions: ReturnType<typeof vi.fn>;
  sendAndConfirmTransactionFactory: ReturnType<typeof vi.fn>;
};
const solanaKitMock = solanaKit as unknown as SolanaKitMock;

// Test constants (defined at module level for use in tests)
// Note: These must match the values defined inside the vi.mock factory
const mockLastValidBlockHeight = BigInt(123);
const mockBalance = BigInt(1000);

function makeInstruction(): Instruction {
  return {
    programAddress: AddressFactory.createValid(),
    accounts: [],
    data: new Uint8Array([1, 2, 3]),
  };
}

describe('SolanaService', () => {
  const logger = MockClientFactory.createBasic().logger;
  const baseHost = 'rpc.example';
  const rpcEndpoint = `${PROTOCOL.HTTPS}://${baseHost}`;
  const wsEndpoint = `${PROTOCOL.WSS}://${baseHost}/`;
  const cluster = 'devnet';
  const mockSignature = 'mock-signature';
  const testAddress = '11111111111111111111111111111111';

  function createService(getWallet: () => Wallet | undefined) {
    return createSolanaService(
      {
        logger,
        getWallet,
      },
      {
        rpcEndpoint,
        cluster,
      }
    );
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

  describe('config', () => {
    it('exposes config property', () => {
      const service = createService(() => undefined);
      expect(service.config).toBeDefined();
      expect(service.config.rpcEndpoint).toBe(rpcEndpoint);
      expect(service.config.cluster).toBe(cluster);
    });

    it('uses wsEndpoint when provided', () => {
      const service = createSolanaService(
        { logger, getWallet: () => undefined },
        { rpcEndpoint, cluster, wsEndpoint }
      );
      expect(service.config.wsEndpoint).toBe(wsEndpoint);
      expect(solanaKitMock.createSolanaRpcSubscriptions).toHaveBeenCalledWith(wsEndpoint);
    });

    it('falls back to rpcEndpoint when wsEndpoint not provided', () => {
      createSolanaService({ logger, getWallet: () => undefined }, { rpcEndpoint, cluster });
      // When wsEndpoint is not provided, rpcEndpoint is converted from http(s) to ws(s)
      expect(solanaKitMock.createSolanaRpcSubscriptions).toHaveBeenCalledWith(wsEndpoint);
    });
  });

  describe('feePayer', () => {
    it('can be set on service', async () => {
      const { service } = await createWalletAndService();
      const customFeePayer = await SignerFactory.createRandomSigner();
      service.feePayer = customFeePayer;

      expect(service.feePayer).toBe(customFeePayer);
    });

    it('uses service feePayer as fallback when no options.feePayer provided', async () => {
      const { service } = await createWalletAndService();
      const serviceFeePayer = await SignerFactory.createRandomSigner();
      service.feePayer = serviceFeePayer;
      const instruction = makeInstruction();

      const transactionMessage = await service.buildTransaction(instruction);

      expect(transactionMessage).toBeDefined();
      expect(String(transactionMessage.feePayer.address)).toBe(String(serviceFeePayer.address));
    });

    it('uses options.feePayer over service feePayer', async () => {
      const { service } = await createWalletAndService();
      const serviceFeePayer = await SignerFactory.createRandomSigner();
      const optionsFeePayer = await SignerFactory.createRandomSigner();
      service.feePayer = serviceFeePayer;
      const instruction = makeInstruction();

      const transactionMessage = await service.buildTransaction(instruction, {
        feePayer: optionsFeePayer,
      });

      expect(transactionMessage).toBeDefined();
      expect(String(transactionMessage.feePayer.address)).toBe(String(optionsFeePayer.address));
    });

    it('uses feePayer from config when creating service', async () => {
      const configFeePayer = await SignerFactory.createRandomSigner();
      const service = createSolanaService(
        { logger, getWallet: () => undefined },
        { rpcEndpoint, cluster, feePayer: configFeePayer }
      );
      const instruction = makeInstruction();

      expect(service.feePayer).toBe(configFeePayer);

      const transactionMessage = await service.buildTransaction(instruction);
      expect(String(transactionMessage.feePayer.address)).toBe(String(configFeePayer.address));
    });
  });

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
      expect(transactionMessage.instructions).toHaveLength(1);
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

    it('uses commitment from config as fallback', async () => {
      const configCommitment = 'finalized' as const;
      const service = createSolanaService(
        { logger, getWallet: () => undefined },
        { rpcEndpoint, cluster, commitment: configCommitment }
      );
      const { wallet } = await createWalletAndService();
      service.feePayer = wallet;
      const instruction = makeInstruction();
      const signedTransaction = await createSignedTransaction(service, instruction);

      const signature = await service.sendTransaction(signedTransaction);

      expect(signature).toBe(mockSignature);
      expect(service.sendAndConfirmTransaction).toHaveBeenCalledWith(expect.any(Object), {
        commitment: configCommitment,
      });
    });

    it('uses options.commitment over config.commitment', async () => {
      const configCommitment = 'finalized' as const;
      const optionsCommitment = 'processed' as const;
      const service = createSolanaService(
        { logger, getWallet: () => undefined },
        { rpcEndpoint, cluster, commitment: configCommitment }
      );
      const { wallet } = await createWalletAndService();
      service.feePayer = wallet;
      const instruction = makeInstruction();
      const signedTransaction = await createSignedTransaction(service, instruction);

      const signature = await service.sendTransaction(signedTransaction, {
        commitment: optionsCommitment,
      });

      expect(signature).toBe(mockSignature);
      expect(service.sendAndConfirmTransaction).toHaveBeenCalledWith(expect.any(Object), {
        commitment: optionsCommitment,
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

      const balance = await service.getBalance(testAddress);

      expect(balance).toBe(Number(mockBalance));
    });

    it('returns balance for wallet when no address provided', async () => {
      const { wallet, service } = await createWalletAndService();

      const balance = await service.getBalance();

      expect(balance).toBe(Number(mockBalance));
      expect(service.rpc.getBalance).toHaveBeenCalledWith(wallet.address);
    });

    it('throws when no wallet and no address provided', async () => {
      const service = createService(() => undefined);

      await expect(service.getBalance()).rejects.toMatchObject({ code: 'NO_WALLET' });
    });

    it('throws NosanaError on RPC failure', async () => {
      const service = createService(() => undefined);
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

  describe('buildTransaction with address as feePayer', () => {
    it('accepts a string address as fee payer for partial signing flow', async () => {
      const { service } = await createWalletAndService();
      const feePayerAddress = AddressFactory.createValid();
      const instruction = makeInstruction();

      const transactionMessage = await service.buildTransaction(instruction, {
        feePayer: feePayerAddress,
      });

      expect(transactionMessage).toBeDefined();
      expect(transactionMessage.feePayer.address).toBe(feePayerAddress);
    });
  });

  describe('buildTransaction with estimateComputeUnits', () => {
    it('does not add compute unit instruction by default', async () => {
      const { service } = await createWalletAndService();
      const instruction = makeInstruction();

      const transactionMessage = await service.buildTransaction(instruction);

      // Only the provided instruction should be present
      expect(transactionMessage.instructions).toHaveLength(1);
    });

    it('adds compute unit instruction when estimateComputeUnits is true', async () => {
      const { service } = await createWalletAndService();
      const instruction = makeInstruction();

      const transactionMessage = await service.buildTransaction(instruction, {
        estimateComputeUnits: true,
      });

      // Should have original instruction + compute budget instruction
      expect(transactionMessage.instructions).toHaveLength(2);
    });
  });

  describe('partiallySignTransaction', () => {
    it('partially signs a transaction message', async () => {
      const { service } = await createWalletAndService();
      const instruction = makeInstruction();

      const transactionMessage = await service.buildTransaction(instruction);

      const partiallySignedTx = await service.partiallySignTransaction(transactionMessage);

      expect(partiallySignedTx).toBeDefined();
      expect(partiallySignedTx.signatures).toBeDefined();
      expect(partiallySignedTx.messageBytes).toBeDefined();
    });
  });

  describe('serializeTransaction and deserializeTransaction', () => {
    it('round-trips a transaction through serialize/deserialize', async () => {
      const { service } = await createWalletAndService();
      const instruction = makeInstruction();
      const transactionMessage = await createTransactionMessage(service, instruction);
      const partiallySignedTx = await service.partiallySignTransaction(transactionMessage);

      const serialized = service.serializeTransaction(partiallySignedTx);
      const deserialized = await service.deserializeTransaction(serialized);

      expect(deserialized).toBeDefined();
      expect(deserialized.messageBytes).toStrictEqual(partiallySignedTx.messageBytes);
    });

    it('restores lastValidBlockHeight after deserialization', async () => {
      const { service } = await createWalletAndService();
      const instruction = makeInstruction();
      const transactionMessage = await createTransactionMessage(service, instruction);
      const partiallySignedTx = await service.partiallySignTransaction(transactionMessage);

      const serialized = service.serializeTransaction(partiallySignedTx);
      const deserialized = await service.deserializeTransaction(serialized);

      expect(deserialized.lifetimeConstraint).toBeDefined();
      expect(deserialized.lifetimeConstraint.lastValidBlockHeight).toBeDefined();
      expect(deserialized.lifetimeConstraint.lastValidBlockHeight).toBe(mockLastValidBlockHeight);
    });
  });

  describe('signTransactionWithSigners', () => {
    it('signs a transaction with provided signers', async () => {
      const { service } = await createWalletAndService();
      const instruction = makeInstruction();
      const transactionMessage = await createTransactionMessage(service, instruction);
      // Use partiallySignTransaction to get a real transaction structure
      const partiallySignedTx = await service.partiallySignTransaction(transactionMessage);

      // Create a mock signer that returns a signature dictionary
      const signerAddress = AddressFactory.createValid();
      const mockSigner = {
        address: signerAddress,
        signTransactions: vi
          .fn()
          .mockResolvedValue([{ [signerAddress]: new Uint8Array(64).fill(1) }]),
      };

      // Serialize and deserialize to simulate receiving a transaction
      const serialized = service.serializeTransaction(partiallySignedTx);
      const receivedTx = await service.deserializeTransaction(serialized);

      const reSigned = await service.signTransactionWithSigners(receivedTx, [mockSigner as any]);

      expect(reSigned).toBeDefined();
      expect(reSigned.signatures).toBeDefined();
      expect(mockSigner.signTransactions).toHaveBeenCalledWith([receivedTx]);
    });
  });

  describe('decompileTransaction', () => {
    it('decompiles a transaction to inspect its contents', async () => {
      const { service } = await createWalletAndService();
      const instruction = makeInstruction();
      const transactionMessage = await createTransactionMessage(service, instruction);
      // Use partiallySignTransaction to get a real transaction structure
      const partiallySignedTx = await service.partiallySignTransaction(transactionMessage);

      // Serialize and deserialize to simulate receiving a transaction
      const serialized = service.serializeTransaction(partiallySignedTx);
      const receivedTx = await service.deserializeTransaction(serialized);

      const decompiled = service.decompileTransaction(receivedTx);

      expect(decompiled).toBeDefined();
      expect(decompiled.feePayer.address).toBe(transactionMessage.feePayer.address);
      expect(decompiled.instructions.length).toBe(transactionMessage.instructions.length);
      expect(decompiled.instructions[0].programAddress).toBe(
        transactionMessage.instructions[0].programAddress
      );
      expect(decompiled.instructions[0].data).toStrictEqual(
        transactionMessage.instructions[0].data
      );
    });
  });

  describe('transfer', () => {
    const amount = BigInt(1000000);

    it('should use wallet address as source when from is not provided', async () => {
      const wallet = await SignerFactory.createTestSigner();
      const service = createService(() => wallet);
      const recipient = AddressFactory.createValid();

      const instruction = await service.transfer({
        to: recipient,
        amount,
      });

      expect(instruction).toBeDefined();
      expect(instruction.accounts).toBeDefined();
      expect(instruction.accounts[0].address).toBe(wallet.address); // source
    });

    it('should use explicit from address as source when provided', async () => {
      const wallet = await SignerFactory.createTestSigner();
      const explicitSender = await SignerFactory.createRandomSigner();
      const service = createService(() => wallet);
      const recipient = AddressFactory.createValid();

      const instruction = await service.transfer({
        to: recipient,
        amount,
        from: explicitSender,
      });

      expect(instruction).toBeDefined();
      expect(instruction.accounts).toBeDefined();
      expect(instruction.accounts[0].address).toBe(explicitSender.address); // source
    });

    it('should include amount in instruction data', async () => {
      const wallet = await SignerFactory.createTestSigner();
      const service = createService(() => wallet);
      const recipient = AddressFactory.createValid();

      const instruction = await service.transfer({
        to: recipient,
        amount,
      });

      expect(instruction).toBeDefined();
      expect(instruction.data).toBeDefined();

      const decoder = getTransferSolInstructionDataDecoder();
      const decodedData = decoder.decode(instruction.data!);

      expect(decodedData.amount).toBe(amount);
    });

    it('should use recipient address as destination', async () => {
      const wallet = await SignerFactory.createTestSigner();
      const service = createService(() => wallet);
      const recipient = AddressFactory.createValid();

      const instruction = await service.transfer({
        to: recipient,
        amount,
      });

      expect(instruction).toBeDefined();
      expect(instruction.accounts).toBeDefined();
      expect(instruction.accounts[1].address).toBe(recipient); // destination
    });

    it('should throw error when no wallet and no from parameter provided', async () => {
      const service = createService(() => undefined);
      const recipient = AddressFactory.createValid();

      await expect(
        service.transfer({
          to: recipient,
          amount,
        })
      ).rejects.toMatchObject({ code: 'NO_WALLET' });
    });

    it('should accept string address for recipient', async () => {
      const wallet = await SignerFactory.createTestSigner();
      const service = createService(() => wallet);
      const recipient = AddressFactory.createValid().toString();

      const instruction = await service.transfer({
        to: recipient,
        amount,
      });

      expect(instruction).toBeDefined();
      expect(instruction.programAddress).toBeDefined();
    });
  });
});
