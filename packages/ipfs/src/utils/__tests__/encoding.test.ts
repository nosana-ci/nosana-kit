import { ERRORS } from "../../defaults/index.js";
import { ipfsHashToSolBytesArray, solBytesArrayToIpfsHash } from "../encoding.js";

describe("encoding utilities", () => {
  describe("ipfsHashToSolBytesArray", () => {
    it("should convert an IPFS hash to a byte array", () => {
      const ipfsHash = ipfsHashToSolBytesArray(global.TEST_HASH);
      expect(ipfsHash).toEqual(global.TEST_SOLANA_ARRAY);
    });

    test("should throw an error for invalid IPFS hash", () => {
      expect(() => ipfsHashToSolBytesArray(global.TEST_INVALID_HASH)).toThrow(ERRORS.INVALID_IPFS_HASH);
    });
  });

  describe("solBytesArrayToIpfsHash", () => {
    it("should convert a Solana hash byte array to an IPFS hash", () => {
      const ipfsHash = solBytesArrayToIpfsHash(global.TEST_SOLANA_ARRAY);
      expect(ipfsHash).toEqual(global.TEST_HASH);
    });

    test("should throw an error for invalid Solana hash length", () => {
      expect(() => solBytesArrayToIpfsHash(global.TEST_INVALID_SOLANA_ARRAY)).toThrow(ERRORS.INVALID_SOLANA_BYTES_ARRAY);
    });
  });
});