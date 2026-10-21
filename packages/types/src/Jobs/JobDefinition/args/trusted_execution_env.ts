export const TrustedExecutionEnv = {
  "SEV-SNP": "SEV-SNP",
  "SEV-GUEST": "SEV-GUEST",
} as const;

export type TrustedExecutionEnv = keyof typeof TrustedExecutionEnv;
