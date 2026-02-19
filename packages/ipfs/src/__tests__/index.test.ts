import { describe, it, test, expect, vi, beforeEach } from "vitest";

import { createIpfsClient } from "../index.js";
import { defaultIPFSConfig } from "../defaults/index.js";
import { createIPFSFetchClient } from "../utils/createIPFSFetchClient.js";
import { pin } from "../actions/pin.js";
import { pinFile } from "../actions/pinFile.js";
import { retrieve } from "../actions/retrieve.js";

vi.mock("../utils/createIPFSFetchClient.js");
vi.mock("../actions/pin.js");
vi.mock("../actions/pinFile.js");
vi.mock("../actions/retrieve.js");

describe("createIpfsClient", () => {
  beforeEach(() => {
    vi.mocked(createIPFSFetchClient).mockReturnValue(global.TEST_FETCH_CLIENT);
  });

  it("should create an IPFS client with default config", async () => {
    const ipfs = createIpfsClient();

    await ipfs.pin(global.TEST_PIN_DATA);
    await ipfs.pinFile("path/to/file.txt");
    await ipfs.retrieve(global.TEST_HASH);

    expect(pin).toHaveBeenCalledWith(global.TEST_PIN_DATA, expect.anything());
    expect(pinFile).toHaveBeenCalledWith("path/to/file.txt", expect.anything());
    expect(retrieve).toHaveBeenCalledWith(global.TEST_HASH, expect.anything());

    expect(createIPFSFetchClient).toHaveBeenCalledWith(expect.objectContaining(defaultIPFSConfig));
  });


  test("when created with custom config, it should create an IPFS client with the provided config", async () => {
    createIpfsClient(global.TEST_IPFS_CONFIG);
    expect(createIPFSFetchClient).toHaveBeenCalledWith(expect.objectContaining(global.TEST_IPFS_CONFIG));
  });
});