import { address } from '@solana/kit';
import { NosanaNetwork } from '@nosana/types';
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

import { createNosanaClient, type NosanaClient, TokenService } from '../../../../src/index.js';

vi.mock('../../../../src/logger/Logger.js', () => {
  return {
    Logger: {
      getInstance: vi.fn().mockReturnValue({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      }),
    },
  };
});
// Mock @solana/kit module
vi.mock('@solana/kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solana/kit')>();

  const mockGetProgramAccounts = vi.fn();
  const mockGetTokenAccountsByOwner = vi.fn();
  const mockGetBalance = vi.fn();
  const mockGetLatestBlockhash = vi.fn();

  const rpc = {
    getProgramAccounts: mockGetProgramAccounts,
    getTokenAccountsByOwner: mockGetTokenAccountsByOwner,
    getBalance: mockGetBalance,
    getLatestBlockhash: mockGetLatestBlockhash,
  } as any;

  const rpcSubscriptions = {} as any;
  const sendAndConfirmTransaction = vi.fn();

  const createSolanaRpc = vi.fn(() => rpc);
  const createSolanaRpcSubscriptions = vi.fn(() => rpcSubscriptions);
  const sendAndConfirmTransactionFactory = vi.fn(() => sendAndConfirmTransaction);

  return {
    ...actual,
    createSolanaRpc,
    createSolanaRpcSubscriptions,
    sendAndConfirmTransactionFactory,
  };
});

describe('TokenService (nos)', () => {
  let client: NosanaClient;
  let nosService: TokenService;

  beforeAll(async () => {
    // Wait for module resolution
    await vi.dynamicImportSettled();
  });

  beforeEach(() => {
    client = createNosanaClient(NosanaNetwork.DEVNET);
    nosService = client.nos;
  });

  describe('initialization', () => {
    it('should initialize TokenService', () => {
      expect(nosService).toBeDefined();
      expect(typeof nosService.getAllTokenHolders).toBe('function');
      expect(typeof nosService.getTokenAccountForAddress).toBe('function');
      expect(typeof nosService.getBalance).toBe('function');
    });

    it('should have access to NosanaClient instance', () => {
      expect(client.nos).toBe(nosService);
    });

    it('should be accessible via client.nos', () => {
      expect(client.nos).toBe(nosService);
    });
  });

  describe('getAllTokenHolders', () => {
    it('should fetch all NOS token holders and exclude zero balances by default', async () => {
      // Mock the RPC response with some zero balance accounts
      const mockAccounts = [
        {
          pubkey: address('7N4HggYEJAtCLJdnHGCtFqfxcB5rhQCsQTze3ftYstVj'),
          account: {
            data: {
              parsed: {
                info: {
                  owner: address('9aKHLbxLbgKGz9vL3kZKz9XwPnxGKLWxjZHWzLHfbT1J'),
                  mint: client.config.programs.nosTokenAddress,
                  tokenAmount: {
                    amount: '1000000000',
                    decimals: 6,
                    uiAmount: 1000,
                  },
                },
              },
            },
          },
        },
        {
          pubkey: address('8N5HggYEJAtCLJdnHGCtFqfxcB5rhQCsQTze3ftYstVk'),
          account: {
            data: {
              parsed: {
                info: {
                  owner: address('8aKHLbxLbgKGz9vL3kZKz9XwPnxGKLWxjZHWzLHfbT1K'),
                  mint: client.config.programs.nosTokenAddress,
                  tokenAmount: {
                    amount: '500000000',
                    decimals: 6,
                    uiAmount: 500,
                  },
                },
              },
            },
          },
        },
        {
          pubkey: address('9M5HggYEJAtCLJdnHGCtFqfxcB5rhQCsQTze3ftYstVm'),
          account: {
            data: {
              parsed: {
                info: {
                  owner: address('9aKHLbxLbgKGz9vL3kZKz9XwPnxGKLWxjZHWzLHfbT1M'),
                  mint: client.config.programs.nosTokenAddress,
                  tokenAmount: {
                    amount: '0',
                    decimals: 6,
                    uiAmount: 0,
                  },
                },
              },
            },
          },
        },
      ];

      // Mock the getProgramAccounts method
      (client.solana.rpc.getProgramAccounts as any).mockReturnValue({
        send: vi.fn().mockResolvedValue(mockAccounts),
      });

      const holders = await nosService.getAllTokenHolders();

      // Should only return non-zero balance accounts
      expect(holders).toHaveLength(2);
      expect(holders[0]).toMatchObject({
        pubkey: mockAccounts[0].pubkey,
        owner: mockAccounts[0].account.data.parsed.info.owner,
        mint: client.config.programs.nosTokenAddress,
        amount: BigInt('1000000000'),
        decimals: 6,
        uiAmount: 1000,
      });
      expect(holders[1]).toMatchObject({
        pubkey: mockAccounts[1].pubkey,
        owner: mockAccounts[1].account.data.parsed.info.owner,
        mint: client.config.programs.nosTokenAddress,
        amount: BigInt('500000000'),
        decimals: 6,
        uiAmount: 500,
      });
    });

    it('should include zero balance accounts when includeZeroBalance is true', async () => {
      const mockAccounts = [
        {
          pubkey: address('7N4HggYEJAtCLJdnHGCtFqfxcB5rhQCsQTze3ftYstVj'),
          account: {
            data: {
              parsed: {
                info: {
                  owner: address('9aKHLbxLbgKGz9vL3kZKz9XwPnxGKLWxjZHWzLHfbT1J'),
                  mint: client.config.programs.nosTokenAddress,
                  tokenAmount: {
                    amount: '1000000000',
                    decimals: 6,
                    uiAmount: 1000,
                  },
                },
              },
            },
          },
        },
        {
          pubkey: address('9M5HggYEJAtCLJdnHGCtFqfxcB5rhQCsQTze3ftYstVm'),
          account: {
            data: {
              parsed: {
                info: {
                  owner: address('9aKHLbxLbgKGz9vL3kZKz9XwPnxGKLWxjZHWzLHfbT1M'),
                  mint: client.config.programs.nosTokenAddress,
                  tokenAmount: {
                    amount: '0',
                    decimals: 6,
                    uiAmount: 0,
                  },
                },
              },
            },
          },
        },
      ];

      (client.solana.rpc.getProgramAccounts as any).mockReturnValue({
        send: vi.fn().mockResolvedValue(mockAccounts),
      });

      const holders = await nosService.getAllTokenHolders({ includeZeroBalance: true });

      // Should return all accounts including zero balance
      expect(holders).toHaveLength(2);
      expect(holders[1].uiAmount).toBe(0);
    });

    it('should exclude PDA accounts when excludePdaAccounts is true', async () => {
      const pdaAddress = address('8N5HggYEJAtCLJdnHGCtFqfxcB5rhQCsQTze3ftYstVk');
      const mockAccounts = [
        {
          pubkey: address('7N4HggYEJAtCLJdnHGCtFqfxcB5rhQCsQTze3ftYstVj'),
          account: {
            data: {
              parsed: {
                info: {
                  owner: address('9aKHLbxLbgKGz9vL3kZKz9XwPnxGKLWxjZHWzLHfbT1J'),
                  mint: client.config.programs.nosTokenAddress,
                  tokenAmount: {
                    amount: '1000000000',
                    decimals: 6,
                    uiAmount: 1000,
                  },
                },
              },
            },
          },
        },
        {
          // PDA account where pubkey equals owner (smart contract ownership)
          pubkey: pdaAddress,
          account: {
            data: {
              parsed: {
                info: {
                  owner: pdaAddress, // Same as pubkey
                  mint: client.config.programs.nosTokenAddress,
                  tokenAmount: {
                    amount: '500000000',
                    decimals: 6,
                    uiAmount: 500,
                  },
                },
              },
            },
          },
        },
        {
          pubkey: address('9M5HggYEJAtCLJdnHGCtFqfxcB5rhQCsQTze3ftYstVm'),
          account: {
            data: {
              parsed: {
                info: {
                  owner: address('9aKHLbxLbgKGz9vL3kZKz9XwPnxGKLWxjZHWzLHfbT1M'),
                  mint: client.config.programs.nosTokenAddress,
                  tokenAmount: {
                    amount: '250000000',
                    decimals: 6,
                    uiAmount: 250,
                  },
                },
              },
            },
          },
        },
      ];

      (client.solana.rpc.getProgramAccounts as any).mockReturnValue({
        send: vi.fn().mockResolvedValue(mockAccounts),
      });

      const holders = await nosService.getAllTokenHolders({ excludePdaAccounts: true });

      // Should return 2 accounts (excluding the PDA where pubkey === owner)
      expect(holders).toHaveLength(2);
      expect(holders[0].pubkey).not.toBe(holders[0].owner);
      expect(holders[1].pubkey).not.toBe(holders[1].owner);
      // PDA account should not be in results
      expect(holders.find((h) => h.pubkey === pdaAddress)).toBeUndefined();
    });

    it('should apply both filters when both options are set', async () => {
      const pdaAddress = address('8N5HggYEJAtCLJdnHGCtFqfxcB5rhQCsQTze3ftYstVk');
      const mockAccounts = [
        {
          pubkey: address('7N4HggYEJAtCLJdnHGCtFqfxcB5rhQCsQTze3ftYstVj'),
          account: {
            data: {
              parsed: {
                info: {
                  owner: address('9aKHLbxLbgKGz9vL3kZKz9XwPnxGKLWxjZHWzLHfbT1J'),
                  mint: client.config.programs.nosTokenAddress,
                  tokenAmount: {
                    amount: '1000000000',
                    decimals: 6,
                    uiAmount: 1000,
                  },
                },
              },
            },
          },
        },
        {
          // PDA account
          pubkey: pdaAddress,
          account: {
            data: {
              parsed: {
                info: {
                  owner: pdaAddress,
                  mint: client.config.programs.nosTokenAddress,
                  tokenAmount: {
                    amount: '500000000',
                    decimals: 6,
                    uiAmount: 500,
                  },
                },
              },
            },
          },
        },
        {
          // Zero balance account
          pubkey: address('9M5HggYEJAtCLJdnHGCtFqfxcB5rhQCsQTze3ftYstVm'),
          account: {
            data: {
              parsed: {
                info: {
                  owner: address('9aKHLbxLbgKGz9vL3kZKz9XwPnxGKLWxjZHWzLHfbT1M'),
                  mint: client.config.programs.nosTokenAddress,
                  tokenAmount: {
                    amount: '0',
                    decimals: 6,
                    uiAmount: 0,
                  },
                },
              },
            },
          },
        },
      ];

      (client.solana.rpc.getProgramAccounts as any).mockReturnValue({
        send: vi.fn().mockResolvedValue(mockAccounts),
      });

      const holders = await nosService.getAllTokenHolders({
        includeZeroBalance: false,
        excludePdaAccounts: true,
      });

      // Should return only 1 account (excluding both zero balance and PDA)
      expect(holders).toHaveLength(1);
      expect(holders[0].uiAmount).toBe(1000);
      expect(holders[0].pubkey).not.toBe(holders[0].owner);
    });

    it('should handle empty response', async () => {
      (client.solana.rpc.getProgramAccounts as any).mockReturnValue({
        send: vi.fn().mockResolvedValue([]),
      });

      const holders = await nosService.getAllTokenHolders();

      expect(holders).toHaveLength(0);
    });

    it('should handle RPC errors', async () => {
      (client.solana.rpc.getProgramAccounts as any).mockReturnValue({
        send: vi.fn().mockRejectedValue(new Error('RPC Error')),
      });

      await expect(nosService.getAllTokenHolders()).rejects.toThrow(
        'Failed to fetch token holders'
      );
    });
  });

  describe('getTokenAccountForAddress', () => {
    const ownerAddress = '9aKHLbxLbgKGz9vL3kZKz9XwPnxGKLWxjZHWzLHfbT1J';
    const tokenAccountAddress = '7N4HggYEJAtCLJdnHGCtFqfxcB5rhQCsQTze3ftYstVj';

    it('should fetch token account for a given address', async () => {
      const mockResponse = {
        value: [
          {
            pubkey: address(tokenAccountAddress),
            account: {
              data: {
                parsed: {
                  info: {
                    owner: address(ownerAddress),
                    mint: client.config.programs.nosTokenAddress,
                    tokenAmount: {
                      amount: '1500000000',
                      decimals: 6,
                      uiAmount: 1500,
                    },
                  },
                },
              },
            },
          },
        ],
      };

      (client.solana.rpc.getTokenAccountsByOwner as any).mockReturnValue({
        send: vi.fn().mockResolvedValue(mockResponse),
      });

      const account = await nosService.getTokenAccountForAddress(ownerAddress);

      expect(account).not.toBeNull();
      expect(account).toMatchObject({
        pubkey: address(tokenAccountAddress),
        owner: address(ownerAddress),
        mint: client.config.programs.nosTokenAddress,
        amount: BigInt('1500000000'),
        decimals: 6,
        uiAmount: 1500,
      });
    });

    it('should accept Address type as parameter', async () => {
      const mockResponse = {
        value: [
          {
            pubkey: address(tokenAccountAddress),
            account: {
              data: {
                parsed: {
                  info: {
                    owner: address(ownerAddress),
                    mint: client.config.programs.nosTokenAddress,
                    tokenAmount: {
                      amount: '1500000000',
                      decimals: 6,
                      uiAmount: 1500,
                    },
                  },
                },
              },
            },
          },
        ],
      };

      (client.solana.rpc.getTokenAccountsByOwner as any).mockReturnValue({
        send: vi.fn().mockResolvedValue(mockResponse),
      });

      const account = await nosService.getTokenAccountForAddress(address(ownerAddress));

      expect(account).not.toBeNull();
      expect(account?.owner).toBe(address(ownerAddress));
    });

    it('should return null when no token account exists', async () => {
      (client.solana.rpc.getTokenAccountsByOwner as any).mockReturnValue({
        send: vi.fn().mockResolvedValue({ value: [] }),
      });

      const account = await nosService.getTokenAccountForAddress(ownerAddress);

      expect(account).toBeNull();
    });

    it('should handle RPC errors', async () => {
      (client.solana.rpc.getTokenAccountsByOwner as any).mockReturnValue({
        send: vi.fn().mockRejectedValue(new Error('RPC Error')),
      });

      await expect(nosService.getTokenAccountForAddress(ownerAddress)).rejects.toThrow(
        'Failed to fetch token account'
      );
    });
  });

  describe('getBalance', () => {
    const ownerAddress = '9aKHLbxLbgKGz9vL3kZKz9XwPnxGKLWxjZHWzLHfbT1J';

    it('should return the token balance', async () => {
      const mockResponse = {
        value: [
          {
            pubkey: address('7N4HggYEJAtCLJdnHGCtFqfxcB5rhQCsQTze3ftYstVj'),
            account: {
              data: {
                parsed: {
                  info: {
                    owner: address(ownerAddress),
                    mint: client.config.programs.nosTokenAddress,
                    tokenAmount: {
                      amount: '2000000000',
                      decimals: 6,
                      uiAmount: 2000,
                    },
                  },
                },
              },
            },
          },
        ],
      };

      (client.solana.rpc.getTokenAccountsByOwner as any).mockReturnValue({
        send: vi.fn().mockResolvedValue(mockResponse),
      });

      const balance = await nosService.getBalance(ownerAddress);

      expect(balance).toBe(2000);
    });

    it('should return 0 when no token account exists', async () => {
      (client.solana.rpc.getTokenAccountsByOwner as any).mockReturnValue({
        send: vi.fn().mockResolvedValue({ value: [] }),
      });

      const balance = await nosService.getBalance(ownerAddress);

      expect(balance).toBe(0);
    });

    it('should handle RPC errors', async () => {
      (client.solana.rpc.getTokenAccountsByOwner as any).mockReturnValue({
        send: vi.fn().mockRejectedValue(new Error('RPC Error')),
      });

      await expect(nosService.getBalance(ownerAddress)).rejects.toThrow(
        'Failed to fetch token account'
      );
    });
  });

  describe('network-specific token mints', () => {
    it('should use mainnet NOS token address on mainnet', () => {
      const mainnetClient = createNosanaClient(NosanaNetwork.MAINNET);

      // TokenService is now functional, so we can't access private methods
      // Instead, verify it uses the correct token address through its behavior
      expect(mainnetClient.config.programs.nosTokenAddress).toBe(
        address('nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7')
      );
    });

    it('should use devnet NOS token address on devnet', () => {
      const devnetClient = createNosanaClient(NosanaNetwork.DEVNET);

      expect(devnetClient.config.programs.nosTokenAddress).toBe(
        address('devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP')
      );
    });
  });
});
