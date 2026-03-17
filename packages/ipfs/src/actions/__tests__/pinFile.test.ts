import fs from "fs";
import { vi } from "vitest";

import { pinFile } from "../pinFile.js";
import { endpoints } from "../../defaults/index.js";

vi.mock("fs");

const MOCK_FILE_PATH = "tests/TEXT_FILE.txt";
const MOCK_FILE_BUFFER = Buffer.from("test file content");

describe("pinFile", () => {
  it("should pin data and return the IPFS hash", async () => {
    vi.mocked(fs.readFileSync).mockReturnValue(MOCK_FILE_BUFFER);

    global.TEST_FETCH_CLIENT.POST = vi.fn().mockResolvedValue([global.TEST_IPFS_RESPONSE, undefined]);

    const ipfsHash = await pinFile(MOCK_FILE_PATH, global.TEST_FETCH_CLIENT);

    expect(ipfsHash).toBe(global.TEST_HASH);
    expect(fs.readFileSync).toHaveBeenCalledWith(MOCK_FILE_PATH);
    expect(global.TEST_FETCH_CLIENT.POST).toHaveBeenCalledWith(
      endpoints.pinFileToIPFS,
      expect.objectContaining({
        body: expect.any(FormData)
      })
    );
  });

  it("should throw an error if pinning fails", async () => {
    vi.mocked(fs.readFileSync).mockReturnValue(MOCK_FILE_BUFFER);

    global.TEST_FETCH_CLIENT.POST = vi.fn().mockResolvedValue([undefined, global.TEST_PIN_ERROR]);

    await expect(pinFile(MOCK_FILE_PATH, global.TEST_FETCH_CLIENT)).rejects.toThrow(global.TEST_PIN_ERROR);
  });
})