import { vi } from "vitest";

import { retrieve } from "../retrieve.js";

vi.mock("../../utils/encoding.js", () => {
  return {
    ...vi.importActual<any>("../../utils/encoding.js"),
    solBytesArrayToIpfsHash: (_: number[]) => global.TEST_HASH
  }
})

describe("retrieve", () => {
  test("when hash is a string, it should retrieve data from IPFS using the given hash", async () => {
    global.TEST_FETCH_CLIENT.GET = vi.fn().mockResolvedValue([global.TEST_PIN_DATA, undefined]);

    const data = await retrieve(global.TEST_HASH, global.TEST_FETCH_CLIENT);

    expect(data).toEqual(global.TEST_PIN_DATA);
    expect(global.TEST_FETCH_CLIENT.GET).toHaveBeenCalledWith(global.TEST_HASH);
  });

  test("when hash is an array, it should retrieve data from IPFS using the given hash array", async () => {
    global.TEST_FETCH_CLIENT.GET = vi.fn().mockResolvedValue([global.TEST_PIN_DATA, undefined]);

    const data = await retrieve(global.TEST_SOLANA_ARRAY, global.TEST_FETCH_CLIENT);

    expect(data).toEqual(global.TEST_PIN_DATA);
    expect(global.TEST_FETCH_CLIENT.GET).toHaveBeenCalledWith(global.TEST_HASH);
  });

  it("should throw an error if retrieval fails", async () => {
    global.TEST_FETCH_CLIENT.GET = vi.fn().mockResolvedValue([undefined, global.TEST_RETRIEVE_ERROR]);

    await expect(retrieve(global.TEST_HASH, global.TEST_FETCH_CLIENT)).rejects.toThrow(global.TEST_RETRIEVE_ERROR);
  });
});