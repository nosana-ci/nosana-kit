import { jest } from '@jest/globals';
import { SolanaUtils } from '../SolanaUtils';
import { NosanaClient, NosanaNetwork } from '../../index';
import {
  IInstruction,
  Address
} from 'gill';
import { NosanaError, ErrorCodes } from '../../errors/NosanaError';

// Mock the gill library
jest.mock('gill', () => ({
  createSolanaClient: jest.fn(() => ({
    rpc: {
      getLatestBlockhash: jest.fn(() => ({
        send: jest.fn(() => Promise.resolve({
          value: { blockhash: 'mock-blockhash', lastValidBlockHeight: 100 }
        }))
      })),
      getBalance: jest.fn(() => ({
        send: jest.fn(() => Promise.resolve({ value: BigInt(1000000) }))
      }))
    },
    rpcSubscriptions: {},
    sendAndConfirmTransaction: jest.fn(() => Promise.resolve('mock-signature'))
  })),
  address: jest.fn((addr: string) => addr as Address),
  createTransaction: jest.fn(),
  signTransactionMessageWithSigners: jest.fn(),
  getSignatureFromTransaction: jest.fn(),
  getExplorerLink: jest.fn(),
  getProgramDerivedAddress: jest.fn(),
  getAddressEncoder: jest.fn(),
  generateKeyPairSigner: jest.fn()
}));

describe('SolanaUtils', () => {
  let solanaUtils: SolanaUtils;
  let mockClient: NosanaClient;
  let mockWallet: any;

  beforeEach(() => {
    mockClient = new NosanaClient(NosanaNetwork.DEVNET);
    mockWallet = {
      address: 'mock-address',
      signTransaction: jest.fn()
    };
    mockClient.wallet = mockWallet;
    solanaUtils = new SolanaUtils(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with client', () => {
    expect(solanaUtils).toBeDefined();
    expect(solanaUtils.rpc).toBeDefined();
    expect(solanaUtils.rpcSubscriptions).toBeDefined();
    expect(solanaUtils.sendAndConfirmTransaction).toBeDefined();
  });

  describe('Client properties', () => {
    it('should expose rpc client', () => {
      expect(solanaUtils.rpc).toBeDefined();
      expect(typeof solanaUtils.rpc.getLatestBlockhash).toBe('function');
    });

    it('should expose rpcSubscriptions client', () => {
      expect(solanaUtils.rpcSubscriptions).toBeDefined();
    });

    it('should expose sendAndConfirmTransaction method', () => {
      expect(typeof solanaUtils.sendAndConfirmTransaction).toBe('function');
    });
  });

  describe('send', () => {
    const mockInstruction = {
      programAddress: 'mock-program' as Address,
      accounts: [] as const,
      data: new Uint8Array([1, 2, 3])
    } as IInstruction;

    const mockTransaction = {
      instructions: [mockInstruction],
      version: 0,
      feePayer: mockWallet,
      lifetimeConstraint: { blockhash: 'mock-blockhash', lastValidBlockHeight: 100 }
    };

    const mockSignedTransaction = {
      signatures: new Map([['mock-address', new Uint8Array([1, 2, 3])]]),
      messageBytes: new Uint8Array([4, 5, 6])
    };

    const mockSignature = 'mock-signature';

    beforeEach(() => {
      const { createTransaction, signTransactionMessageWithSigners, getSignatureFromTransaction } = require('gill');
      createTransaction.mockReturnValue(mockTransaction);
      signTransactionMessageWithSigners.mockResolvedValue(mockSignedTransaction);
      getSignatureFromTransaction.mockReturnValue(mockSignature);
    });

    it('should throw error when no wallet is set', async () => {
      mockClient.wallet = undefined;

      await expect(solanaUtils.send(mockInstruction)).rejects.toThrow(
        new NosanaError('No wallet found', ErrorCodes.NO_WALLET)
      );
    });

    it('should handle single instruction', async () => {
      const { createTransaction, signTransactionMessageWithSigners } = require('gill');

      const result = await solanaUtils.send(mockInstruction);

      expect(createTransaction).toHaveBeenCalledWith({
        instructions: [mockInstruction],
        feePayer: mockWallet,
        latestBlockhash: expect.any(Object),
        version: 0
      });
      expect(signTransactionMessageWithSigners).toHaveBeenCalledWith(mockTransaction);
      expect(result).toBe(mockSignature);
    });

    it('should handle array of instructions', async () => {
      const { createTransaction, signTransactionMessageWithSigners } = require('gill');
      const instructions = [mockInstruction, mockInstruction];

      const result = await solanaUtils.send(instructions);

      expect(createTransaction).toHaveBeenCalledWith({
        instructions,
        feePayer: mockWallet,
        latestBlockhash: expect.any(Object),
        version: 0
      });
      expect(signTransactionMessageWithSigners).toHaveBeenCalledWith(mockTransaction);
      expect(result).toBe(mockSignature);
    });

    it('should handle unsigned transaction', async () => {
      const { createTransaction, signTransactionMessageWithSigners } = require('gill');
      const unsignedTransaction = {
        instructions: [mockInstruction],
        version: 0,
        feePayer: mockWallet
      };

      const result = await solanaUtils.send(unsignedTransaction as any);

      expect(createTransaction).not.toHaveBeenCalled();
      expect(signTransactionMessageWithSigners).toHaveBeenCalledWith(unsignedTransaction);
      expect(result).toBe(mockSignature);
    });

    it('should handle signed transaction without re-signing', async () => {
      const { createTransaction, signTransactionMessageWithSigners, getSignatureFromTransaction } = require('gill');
      const signedTransaction = {
        instructions: [mockInstruction],
        version: 0,
        signatures: [{ address: 'mock-address', signature: new Uint8Array([1, 2, 3]) }]
      };

      const result = await solanaUtils.send(signedTransaction as any);

      expect(createTransaction).not.toHaveBeenCalled();
      expect(signTransactionMessageWithSigners).not.toHaveBeenCalled();
      expect(getSignatureFromTransaction).toHaveBeenCalledWith(signedTransaction);
      expect(result).toBe(mockSignature);
    });

    it('should handle transaction creation failure', async () => {
      const { createTransaction } = require('gill');
      const error = new Error('Transaction creation failed');
      createTransaction.mockImplementation(() => {
        throw error;
      });

      await expect(solanaUtils.send(mockInstruction)).rejects.toThrow(
        'Failed to send transaction: Transaction creation failed'
      );
    });

    it('should handle signing failure', async () => {
      const { signTransactionMessageWithSigners } = require('gill');
      const error = new Error('Signing failed');
      signTransactionMessageWithSigners.mockRejectedValue(error);

      await expect(solanaUtils.send(mockInstruction)).rejects.toThrow(
        'Failed to send transaction: Signing failed'
      );
    });
  });

  describe('type guards', () => {
    it('should correctly identify transactions', () => {
      const instruction = { programAddress: 'mock', accounts: [], data: new Uint8Array() };
      const transaction = { instructions: [], version: 0 };
      const signedTransaction = { instructions: [], version: 0, signatures: [] };

      expect((solanaUtils as any).isTransaction(instruction)).toBe(false);
      expect((solanaUtils as any).isTransaction([instruction])).toBe(false);
      expect((solanaUtils as any).isTransaction(transaction)).toBe(true);
      expect((solanaUtils as any).isTransaction(signedTransaction)).toBe(true);
    });

    it('should correctly identify signed transactions', () => {
      const unsignedTransaction = { instructions: [], version: 0 };
      const signedTransaction = {
        instructions: [],
        version: 0,
        signatures: [{ address: 'mock-address', signature: new Uint8Array([1, 2, 3]) }]
      };
      const emptySignedTransaction = {
        instructions: [],
        version: 0,
        signatures: []
      };

      expect((solanaUtils as any).isSignedTransaction(unsignedTransaction)).toBe(false);
      expect((solanaUtils as any).isSignedTransaction(emptySignedTransaction)).toBe(false);
      expect((solanaUtils as any).isSignedTransaction(signedTransaction)).toBe(true);
    });
  });
}); 