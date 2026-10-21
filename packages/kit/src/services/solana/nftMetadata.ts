import {
  type Address,
  type Codec,
  type Option,
  addCodecSizePrefix,
  getAddressCodec,
  getAddressEncoder,
  getArrayCodec,
  getBooleanCodec,
  getOptionCodec,
  getProgramDerivedAddress,
  getStructCodec,
  getU16Codec,
  getU32Codec,
  getU8Codec,
  getUtf8Codec,
} from '@solana/kit';

/** Metaplex Token Metadata program. */
export const TOKEN_METADATA_PROGRAM_ADDRESS =
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s' as Address<'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'>;

/** `Key::MetadataV1`, the first byte of every Metaplex metadata account. */
export const METADATA_V1_KEY = 4;

/**
 * The leading fields of a Metaplex `Metadata` account, up to and including
 * `collection`. Fields after it (uses, collection details, programmable config)
 * are not read.
 */
export interface NftMetadataPrefix {
  key: number;
  updateAuthority: Address;
  mint: Address;
  data: {
    name: string;
    symbol: string;
    uri: string;
    sellerFeeBasisPoints: number;
    creators: Option<Array<{ address: Address; verified: boolean; share: number }>>;
  };
  primarySaleHappened: boolean;
  isMutable: boolean;
  editionNonce: Option<number>;
  tokenStandard: Option<number>;
  collection: Option<{ verified: boolean; key: Address }>;
}

const borshString = () => addCodecSizePrefix(getUtf8Codec(), getU32Codec());

/**
 * Borsh codec for the leading fields of a Metaplex `Metadata` account. Decoding
 * stops after `collection`, so the account's trailing fields and padding (which
 * differ between full-size and resized accounts) never matter.
 */
export function getNftMetadataPrefixCodec(): Codec<NftMetadataPrefix> {
  return getStructCodec([
    ['key', getU8Codec()],
    ['updateAuthority', getAddressCodec()],
    ['mint', getAddressCodec()],
    [
      'data',
      getStructCodec([
        ['name', borshString()],
        ['symbol', borshString()],
        ['uri', borshString()],
        ['sellerFeeBasisPoints', getU16Codec()],
        [
          'creators',
          getOptionCodec(
            getArrayCodec(
              getStructCodec([
                ['address', getAddressCodec()],
                ['verified', getBooleanCodec()],
                ['share', getU8Codec()],
              ])
            )
          ),
        ],
      ]),
    ],
    ['primarySaleHappened', getBooleanCodec()],
    ['isMutable', getBooleanCodec()],
    ['editionNonce', getOptionCodec(getU8Codec())],
    ['tokenStandard', getOptionCodec(getU8Codec())],
    [
      'collection',
      getOptionCodec(
        getStructCodec([
          ['verified', getBooleanCodec()],
          ['key', getAddressCodec()],
        ])
      ),
    ],
  ]) as Codec<NftMetadataPrefix>;
}

/** Derive the Metaplex metadata account of a mint: `['metadata', program, mint]`. */
export async function findNftMetadataPda(mint: Address): Promise<Address> {
  const addressEncoder = getAddressEncoder();
  const [pda] = await getProgramDerivedAddress({
    programAddress: TOKEN_METADATA_PROGRAM_ADDRESS,
    seeds: [
      'metadata',
      addressEncoder.encode(TOKEN_METADATA_PROGRAM_ADDRESS),
      addressEncoder.encode(mint),
    ],
  });
  return pda;
}
