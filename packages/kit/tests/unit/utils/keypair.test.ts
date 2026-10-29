import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import bs58 from 'bs58';

import * as os from 'os';

import {
  generateWallet,
  generateWalletToFile,
  createWalletFromBytes,
  createWalletFromBase58,
  loadWalletFromFile,
} from '../../../src/utils/keypair.js';

import { SignerFactory } from '../setup/index.js';

// Reuse existing test fixtures
const TEST_KEY_FILE = path.join(__dirname, '..', 'setup', 'example_solana_key.json');
const TEST_KEY_ARRAY: number[] = JSON.parse(fs.readFileSync(TEST_KEY_FILE, 'utf8'));
const TEST_KEY_BASE58 = bs58.encode(new Uint8Array(TEST_KEY_ARRAY));
const EXPECTED_ADDRESS = SignerFactory.getExpectedAddress();

describe('keypair helpers', () => {
  describe('generateWallet', () => {
    it('returns a wallet with an address and signing functions', async () => {
      const wallet = await generateWallet();

      expect(wallet).toBeDefined();
      expect(typeof wallet.address).toBe('string');
      expect(wallet.address.length).toBeGreaterThan(0);
      expect(typeof wallet.signMessages).toBe('function');
      expect(typeof wallet.signTransactions).toBe('function');
    });

    it('generates unique wallets each time', async () => {
      const wallet1 = await generateWallet();
      const wallet2 = await generateWallet();

      expect(wallet1.address).not.toBe(wallet2.address);
    });
  });

  describe('generateWalletToFile', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nosana-kit-keypair-'));
    const file = path.join(dir, 'nested', 'keypair.json');

    it('writes a Solana CLI keypair file the wallet loads back from', async () => {
      const wallet = await generateWalletToFile(file);

      const bytes: number[] = JSON.parse(fs.readFileSync(file, 'utf8'));
      expect(bytes).toHaveLength(64);
      expect((await loadWalletFromFile(file)).address).toBe(wallet.address);
      expect((await createWalletFromBytes(bytes)).address).toBe(wallet.address);
    });

    it('never overwrites an existing file', async () => {
      const before = fs.readFileSync(file, 'utf8');

      await expect(generateWalletToFile(file)).rejects.toThrow();

      expect(fs.readFileSync(file, 'utf8')).toBe(before);
    });
  });

  describe('createWalletFromBytes', () => {
    it('creates a wallet from a Uint8Array', async () => {
      const wallet = await createWalletFromBytes(new Uint8Array(TEST_KEY_ARRAY));

      expect(wallet.address).toBe(EXPECTED_ADDRESS);
      expect(typeof wallet.signMessages).toBe('function');
      expect(typeof wallet.signTransactions).toBe('function');
    });

    it('creates a wallet from a number array', async () => {
      const wallet = await createWalletFromBytes(TEST_KEY_ARRAY);

      expect(wallet.address).toBe(EXPECTED_ADDRESS);
    });

    it('produces the same wallet for the same bytes', async () => {
      const wallet1 = await createWalletFromBytes(new Uint8Array(TEST_KEY_ARRAY));
      const wallet2 = await createWalletFromBytes(TEST_KEY_ARRAY);

      expect(wallet1.address).toBe(wallet2.address);
    });
  });

  describe('createWalletFromBase58', () => {
    it('creates a wallet from a base58-encoded key', async () => {
      const wallet = await createWalletFromBase58(TEST_KEY_BASE58);

      expect(wallet.address).toBe(EXPECTED_ADDRESS);
      expect(typeof wallet.signMessages).toBe('function');
      expect(typeof wallet.signTransactions).toBe('function');
    });
  });

  describe('loadWalletFromFile', () => {
    it('loads a wallet from a keypair JSON file', async () => {
      const wallet = await loadWalletFromFile(TEST_KEY_FILE);

      expect(wallet.address).toBe(EXPECTED_ADDRESS);
      expect(typeof wallet.signMessages).toBe('function');
      expect(typeof wallet.signTransactions).toBe('function');
    });

    it('throws when the file does not exist', async () => {
      await expect(loadWalletFromFile('/nonexistent/path.json')).rejects.toThrow();
    });

    it('uses default path (~/.config/solana/id.json) when no argument is provided', async () => {
      // Temporarily unset HOME so the default path resolves to a nonexistent location
      const originalHome = process.env.HOME;
      const originalUserProfile = process.env.USERPROFILE;
      process.env.HOME = '/nonexistent_home_for_test';
      delete process.env.USERPROFILE;

      try {
        await expect(loadWalletFromFile()).rejects.toThrow();
      } finally {
        process.env.HOME = originalHome;
        if (originalUserProfile !== undefined) {
          process.env.USERPROFILE = originalUserProfile;
        }
      }
    });
  });
});
