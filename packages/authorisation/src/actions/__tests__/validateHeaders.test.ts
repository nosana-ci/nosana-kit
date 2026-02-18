import { validateHeaders } from "../validateHeaders.js"

describe('validateHeaders', () => {
  it('should validate header', () => {
    expect(
      validateHeaders({
        'authorization': 'validationString:4hEXBxCVbFm6uPYScs5k24UcqpqHpTh4XrxrArg7uW57LW3i5e7WPJdZyYgL5nzacxYEHjywpbrL4Dq1ryHaC2ot'
      }, global.TEST_WALLET_PUBLIC_KEY),
    ).toBeTruthy();
  });
});