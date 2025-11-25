import { type MessageSigner } from '@solana/kit';
import { NosanaError, ErrorCodes } from '../errors/NosanaError.js';

/**
 * Type for a function that signs a message and returns the signature.
 * Matches the SignMessageFn type from @nosana/authorization.
 */
type SignMessageFn = (message: Uint8Array) => Promise<Uint8Array>;

/**
 * Extract signature from a signatures dictionary.
 */
function extractSignature(
  signatures: Record<string, Uint8Array> | undefined,
  signerAddress: string,
  errorContext: string
): Uint8Array {
  if (!signatures) {
    throw new NosanaError(errorContext, ErrorCodes.AUTH_ERROR);
  }

  const signature = signatures[signerAddress];
  if (!signature) {
    throw new NosanaError('Failed to get signature from signer', ErrorCodes.AUTH_ERROR);
  }

  return signature instanceof Uint8Array ? signature : new Uint8Array(signature);
}

/**
 * Convert a MessageSigner to a SignMessageFn for use with createNosanaAuthorization.
 * MessageSigner always supports message signing (either via modifyAndSignMessages or signMessages).
 *
 * @param signer - The message signer to convert
 * @returns A SignMessageFn that can be used with createNosanaAuthorization
 */
export function walletToAuthorizationSigner(signer: MessageSigner): SignMessageFn {
  const signerAddress = signer.address;

  return async (message: Uint8Array): Promise<Uint8Array> => {
    const messageToSign = { content: message, signatures: {} };

    // Try modifyAndSignMessages first (MessageModifyingSigner)
    if ('modifyAndSignMessages' in signer && typeof signer.modifyAndSignMessages === 'function') {
      const signedMessages = await signer.modifyAndSignMessages([messageToSign]);
      const signedMessage = signedMessages[0] as
        | {
            content: Uint8Array;
            signatures: Record<typeof signerAddress, Uint8Array>;
          }
        | undefined;
      return extractSignature(
        signedMessage?.signatures,
        signerAddress,
        'Failed to get signed message from signer'
      );
    }

    // Fallback to signMessages (MessagePartialSigner)
    if ('signMessages' in signer && typeof signer.signMessages === 'function') {
      const signatures = await signer.signMessages([messageToSign]);
      const signatureDict = signatures[0] as Record<typeof signerAddress, Uint8Array> | undefined;
      return extractSignature(signatureDict, signerAddress, 'Failed to get signatures from signer');
    }

    // This should never happen since MessageSigner always has one of these methods
    throw new NosanaError('MessageSigner does not support message signing', ErrorCodes.AUTH_ERROR);
  };
}
