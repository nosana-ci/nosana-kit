import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type MessageSigner } from '@solana/kit';

import { SignerFactory } from '../../setup/index.js';

import { NosanaError } from '../../../src/errors/NosanaError.js';
import { walletToAuthorizationSigner } from '../../../src/utils/walletToAuthorizationSigner.js';

describe('walletToAuthorizationSigner', () => {
  let walletAddress: ReturnType<typeof SignerFactory.getExpectedAddress>;
  const testMessage = new Uint8Array([1, 2, 3]);
  const signatureLength = 64;
  const signatureValue1 = 42;
  const signatureValue2 = 100;
  const signatureValue3 = 200;

  beforeEach(() => {
    walletAddress = SignerFactory.getExpectedAddress();
  });

  it('converts a signer with modifyAndSignMessages to a SignMessageFn', async () => {
    const signer = await SignerFactory.createTestSigner();
    const authorizationSigner = walletToAuthorizationSigner(signer);

    const message = new Uint8Array([1, 2, 3, 4, 5]);
    const signature = await authorizationSigner(message);

    // Should return a valid signature (Uint8Array)
    expect(signature).toBeInstanceOf(Uint8Array);
    expect(signature.length).toBeGreaterThan(0);
  });

  it('converts a signer with signMessages to a SignMessageFn', async () => {
    // Create a mock signer that only has signMessages (MessagePartialSigner)
    const expectedSignature = new Uint8Array(signatureLength).fill(signatureValue1);
    const signMessagesMock = vi.fn(async (_messages) => {
      // Return signature dictionary for the signer address
      return [{ [walletAddress]: expectedSignature }] as any;
    });
    const signer = {
      address: walletAddress,
      signMessages: signMessagesMock,
    } as any as MessageSigner;

    const authorizationSigner = walletToAuthorizationSigner(signer);
    const signature = await authorizationSigner(testMessage);

    // Should return the signature from signMessages
    expect(signature).toBeInstanceOf(Uint8Array);
    expect(signature.length).toBe(signatureLength);
    expect(signature[0]).toBe(signatureValue1);
    expect(signMessagesMock).toHaveBeenCalledTimes(1);
  });

  it('prefers modifyAndSignMessages over signMessages when both are available', async () => {
    const modifyAndSignSignature = new Uint8Array(signatureLength).fill(signatureValue2);
    const signMessagesSignature = new Uint8Array(signatureLength).fill(signatureValue3);
    const modifyAndSignMessages = vi.fn(async (messages) => {
      return [
        {
          content: messages[0].content,
          signatures: {
            [walletAddress]: modifyAndSignSignature,
          },
        },
      ] as any;
    });
    const signMessages = vi.fn(async () => {
      return [{ [walletAddress]: signMessagesSignature }] as any;
    });

    const signer = {
      address: walletAddress,
      modifyAndSignMessages,
      signMessages,
    } as unknown as MessageSigner;

    const authorizationSigner = walletToAuthorizationSigner(signer);
    const signature = await authorizationSigner(testMessage);

    // Should use modifyAndSignMessages (returns signature with value 100)
    expect(signature[0]).toBe(signatureValue2);
    expect(modifyAndSignMessages).toHaveBeenCalledTimes(1);
    expect(signMessages).not.toHaveBeenCalled();
  });

  it('throws error when modifyAndSignMessages returns empty array', async () => {
    const signer = {
      address: walletAddress,
      modifyAndSignMessages: vi.fn(async () => [] as any),
    } as unknown as MessageSigner;

    const authorizationSigner = walletToAuthorizationSigner(signer);

    await expect(authorizationSigner(testMessage)).rejects.toThrow(NosanaError);
  });

  it('throws error when modifyAndSignMessages returns message without signature', async () => {
    const signer = {
      address: walletAddress,
      modifyAndSignMessages: vi.fn(async (messages) => {
        return [
          {
            content: messages[0].content,
            signatures: {}, // Empty signatures
          },
        ] as any;
      }),
    } as unknown as MessageSigner;

    const authorizationSigner = walletToAuthorizationSigner(signer);

    await expect(authorizationSigner(testMessage)).rejects.toThrow(NosanaError);
  });

  it('throws error when signMessages returns empty array', async () => {
    const signer = {
      address: walletAddress,
      signMessages: vi.fn(async () => [] as any),
    } as unknown as MessageSigner;

    const authorizationSigner = walletToAuthorizationSigner(signer);

    await expect(authorizationSigner(testMessage)).rejects.toThrow(NosanaError);
  });

  it('throws error when signMessages returns dictionary without signature', async () => {
    const signer = {
      address: walletAddress,
      signMessages: vi.fn(async () => {
        return [{}] as any; // Empty dictionary
      }),
    } as unknown as MessageSigner;

    const authorizationSigner = walletToAuthorizationSigner(signer);

    await expect(authorizationSigner(testMessage)).rejects.toThrow(NosanaError);
  });

  it('throws error when signer has neither modifyAndSignMessages nor signMessages', async () => {
    const signer = {
      address: walletAddress,
      // No signMessages or modifyAndSignMessages
    } as unknown as MessageSigner;

    const authorizationSigner = walletToAuthorizationSigner(signer);

    await expect(authorizationSigner(testMessage)).rejects.toThrow(NosanaError);
  });

  it('correctly extracts signature from modifyAndSignMessages result', async () => {
    const signer = await SignerFactory.createTestSigner();
    const authorizationSigner = walletToAuthorizationSigner(signer);

    const message1 = testMessage;
    const message2 = new Uint8Array([4, 5, 6]);

    const signature1 = await authorizationSigner(message1);
    const signature2 = await authorizationSigner(message2);

    // Different messages should produce different signatures
    expect(signature1).toBeInstanceOf(Uint8Array);
    expect(signature2).toBeInstanceOf(Uint8Array);
    // Signatures should be different for different messages
    expect(signature1).not.toEqual(signature2);
  });

  it('handles different message sizes correctly', async () => {
    const signer = await SignerFactory.createTestSigner();
    const authorizationSigner = walletToAuthorizationSigner(signer);

    const emptyMessage = new Uint8Array([]);
    const smallMessage = new Uint8Array([1]);
    const largeMessage = new Uint8Array(new Array(1000).fill(0).map((_, i) => i % 256));

    const emptySig = await authorizationSigner(emptyMessage);
    const smallSig = await authorizationSigner(smallMessage);
    const largeSig = await authorizationSigner(largeMessage);

    expect(emptySig).toBeInstanceOf(Uint8Array);
    expect(smallSig).toBeInstanceOf(Uint8Array);
    expect(largeSig).toBeInstanceOf(Uint8Array);
    // All should be valid signatures
    expect(emptySig.length).toBeGreaterThan(0);
    expect(smallSig.length).toBeGreaterThan(0);
    expect(largeSig.length).toBeGreaterThan(0);
  });
});
