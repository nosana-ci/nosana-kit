import { vi } from "vitest";
import { pin } from "../pin.js";
import { endpoints } from "../../defaults/index.js";

describe("pin", () => {
  it("should pin data and return the IPFS hash", async () => {
    global.TEST_FETCH_CLIENT.POST = vi.fn().mockResolvedValue([global.TEST_IPFS_RESPONSE, undefined]);

    const ipfsHash = await pin(global.TEST_PIN_DATA, global.TEST_FETCH_CLIENT);

    expect(ipfsHash).toBe(global.TEST_HASH);
    expect(global.TEST_FETCH_CLIENT.POST).toHaveBeenCalledWith(
      endpoints.pinJSONToIPFS,
      expect.objectContaining({
        body: JSON.stringify(global.TEST_PIN_DATA)
      })
    );
  });

  it("should throw an error if pinning fails", async () => {
    global.TEST_FETCH_CLIENT.POST = vi.fn().mockResolvedValue([undefined, global.TEST_PIN_ERROR]);

    await expect(pin(global.TEST_PIN_DATA, global.TEST_FETCH_CLIENT)).rejects.toThrow(global.TEST_PIN_ERROR);
  });
})