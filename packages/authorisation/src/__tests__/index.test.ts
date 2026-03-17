import { createNosanaAuthorization } from "../index.js";

describe("createNosanaAuthorization", () => {
  it("should generate an authorization object with required methods", () => {
    const auth = createNosanaAuthorization();
    expect(auth).toHaveProperty("generate");
    expect(auth).toHaveProperty("generateHeaders");
    expect(auth).toHaveProperty("validate");
    expect(auth).toHaveProperty("validateHeaders");
  });

  test("when calling generate without a signer or key, it should throw an error ", async () => {
    const auth = createNosanaAuthorization();
    await expect(auth.generate("test message")).rejects.toThrow(
      "Signer or key is required for this operation."
    );
  });

  test("when calling generateHeaders without a signer or key, it should throw an error", async () => {
    const auth = createNosanaAuthorization();
    await expect(auth.generateHeaders("test message")).rejects.toThrow(
      "Signer or key is required for this operation."
    );
  });

  test("when calling generate with a signer function, it should not throw an error", async () => {
    const auth = createNosanaAuthorization(global.TEST_WALLET);
    await expect(auth.generate("test message")).resolves.toBe("test message:5sjHKLoqNxGStn6ZGYS9mBABvW74NM6fuJYjdg9ppMMA9v9FKYvfmRcUBHxHzeu1iQ95Sr8519xo7DWK7xX69gGN");
  })
});