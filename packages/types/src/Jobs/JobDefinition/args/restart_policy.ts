export const RestartPolicy = {
  No: "no",
  Always: "always",
  UnlessStopped: 'unless-stopped',
  OnFailure: 'on-failure',
} as const

export type RestartPolicy = typeof RestartPolicy[keyof typeof RestartPolicy]
  | {
    policy: typeof RestartPolicy.OnFailure;
    restart_tries?: number;
  };