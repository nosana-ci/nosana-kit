import type { Job, Market, Run } from '../JobsProgram.js';

/**
 * Monitor event type constants
 * @group @nosana/kit
 */
export const MonitorEventType = {
  JOB: 'job',
  MARKET: 'market',
  RUN: 'run',
} as const;

export type MonitorEventType = (typeof MonitorEventType)[keyof typeof MonitorEventType];

/**
 * Simple monitor event (run accounts are auto-merged into job events)
 * @group @nosana/kit
 */
export type SimpleMonitorEvent =
  | { type: typeof MonitorEventType.JOB; data: Job }
  | { type: typeof MonitorEventType.MARKET; data: Market };

/**
 * Event types for monitoring (extends SimpleMonitorEvent with run events)
 * @group @nosana/kit
 */
export type MonitorEvent = SimpleMonitorEvent | { type: typeof MonitorEventType.RUN; data: Run };
