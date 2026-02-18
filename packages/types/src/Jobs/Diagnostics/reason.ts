export type DiagnosticsReason = {
  hostShutDown: boolean;
  jobStopped: boolean;
  jobExpired: boolean;
  reason?: string;
}