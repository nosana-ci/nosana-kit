import { vi } from "vitest";
import { generate } from "../generate.js"
import { AuthorizationStore } from "../../types.js";

describe("generate", () => {
  it("should generate a signed message authorization string", async () => {
    expect(await generate('validationString', undefined, global.TEST_WALLET)).toBe(
      'validationString:4hEXBxCVbFm6uPYScs5k24UcqpqHpTh4XrxrArg7uW57LW3i5e7WPJdZyYgL5nzacxYEHjywpbrL4Dq1ryHaC2ot',
    );
  })

  test('when includeTime is true and separator is +, should return validation string with time and + separator', async () => {
    expect(
      await generate('validationStringWithOpts', {
        includeTime: true,
        separator: '+',
      }, global.TEST_WALLET),
    ).toBe(
      'validationStringWithOpts+4EsfLjmGevLsN2VRHFMdW5u7xRBGca4Pwe9fwNz6pQf5LDF5AZ8jNeArz46euTEydUyYdcS4FRH6HdwEFzgHxMz+1734307200000',
    );
  });

  describe('when a store is provided', () => {
    test('and does not contain a stored signature, should store and return a new signature', async () => {
      const mockStore: AuthorizationStore = {
        identifier: 'test-identifier',
        actions: {
          get: vi.fn().mockResolvedValue(undefined),
          set: vi.fn().mockResolvedValue(undefined),
        },
      };

      const signature = await generate(
        'messageToStore',
        undefined,
        global.TEST_WALLET,
        mockStore,
      );

      expect(mockStore.actions.get).toHaveBeenCalledWith(mockStore.identifier, {
        includeTime: false,
        separator: ':',
      });

      expect(mockStore.actions.set).toHaveBeenCalledWith(
        mockStore.identifier,
        {
          includeTime: false,
          separator: ':',
        },
        signature,
      );
    });

    test('and contains a stored signature, should return the stored signature', async () => {
      const mockStore: AuthorizationStore = {
        identifier: 'test-identifier',
        actions: {
          get: vi.fn().mockResolvedValue('storedSignature'),
          set: vi.fn().mockResolvedValue(undefined),
        },
      };

      const signature = await generate(
        'messageToStore',
        undefined,
        global.TEST_WALLET,
        mockStore,
      );

      expect(mockStore.actions.get).toHaveBeenCalledWith(mockStore.identifier, {
        includeTime: false,
        separator: ':',
      });
      expect(signature).toBe('storedSignature');
      expect(mockStore.actions.set).not.toHaveBeenCalled();
    });
  });
});