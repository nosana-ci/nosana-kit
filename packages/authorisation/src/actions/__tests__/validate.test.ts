import { vi } from 'vitest';

import { validate } from "../validate.js";

describe('validate', () => {
  it('should validate authentication', () => {
    expect(
      validate(
        'validationString:4hEXBxCVbFm6uPYScs5k24UcqpqHpTh4XrxrArg7uW57LW3i5e7WPJdZyYgL5nzacxYEHjywpbrL4Dq1ryHaC2ot',
        global.TEST_WALLET_PUBLIC_KEY,
      ),
    ).toBeTruthy();
  });

  it('should validate with expiry', () => {
    expect(
      validate(
        'validationStringWithOpts+4EsfLjmGevLsN2VRHFMdW5u7xRBGca4Pwe9fwNz6pQf5LDF5AZ8jNeArz46euTEydUyYdcS4FRH6HdwEFzgHxMz+1734307200000',
        global.TEST_WALLET_PUBLIC_KEY,
        {
          separator: '+',
        },
      ),
    ).toBeTruthy();
  });

  it('should validate with expiry', () => {
    vi.setSystemTime(new Date('2024-12-16:00:05:00'));

    let msg: string = '';

    try {
      validate(
        'validationStringWithOpts+4EsfLjmGevLsN2VRHFMdW5u7xRBGca4Pwe9fwNz6pQf5LDF5AZ8jNeArz46euTEydUyYdcS4FRH6HdwEFzgHxMz+1734307200000',
        global.TEST_WALLET_PUBLIC_KEY,
        {
          separator: '+',
        },
      );
    } catch (e) {
      msg = (e as Error).message;
    }

    expect(msg).toBe('Authorization has expired.');
  });

  describe('when using a different wallet', () => {
    it('should not validate', () => {
      expect(
        validate(
          'validationString:4hEXBxCVbFm6uPYScs5k24UcqpqHpTh4XrxrArg7uW57LW3i5e7WPJdZyYgL5nzacxYEHjywpbrL4Dq1ryHaC2ot',
          global.TEST_WRONG_WALLET_PUBLIC_KEY
        ),
      ).toBeFalsy();
    });
  });
});