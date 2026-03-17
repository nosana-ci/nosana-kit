import { defineScenarioVitestConfig } from '@nosana/scenario';

export default defineScenarioVitestConfig({
  test: {
    include: ['tests/scenarios/specs/**/*.test.ts'],
  },
});
