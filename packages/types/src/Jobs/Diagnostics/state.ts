export type DiagnosticsState = {
  Status: string;
  Running: boolean;
  Paused: boolean;
  Restarting: boolean;
  OOMKilled: boolean;
  Dead: boolean;
  Pid: number;
  ExitCode: number;
  Error: string;
  StartedAt: string;
  FinishedAt: string;
  Health?: {
    Status: string;
    FailingStreak: number;
    Log: {
      Start: string;
      End: string;
      ExitCode: number;
      Output: string;
    }[] | null;
  } | undefined;
  RestartCount: number
}