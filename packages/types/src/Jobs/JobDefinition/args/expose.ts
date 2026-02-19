import type { tags } from "typia";
import type { LiteralString, SpreadMarker } from "./literals.js";

export type UniqueExposedPorts = Array<ExposeBase> &
  tags.TagBase<{
    kind: 'uniqueExposedPorts';
    target: 'array';
    value: 'uniqueExposedPorts';
    validate: `
      (() => {
       if (!Array.isArray($input)) return true;
        const numbers = new Set();
        const ranges = [];
        for (const el of $input) {
          // Skip dynamic placeholders and spread markers for uniqueness check
          if (typeof el === "string" && /^%%(ops|global).[^%]+%%$/.test(el)) continue;
          if (el && typeof el === "object" && !Array.isArray(el) && el.__spread__) continue;

          const port = typeof el === "object" ? el.port : el;
          if (typeof port === "number") {
            if (numbers.has(port)) return false;
            numbers.add(port);
          } else if (typeof port === "string") {
            // Enforce range format for concrete range strings
            const match = /^([0-9]+)-([0-9]+)$/.exec(port);
            if (!match) return false;
            const start = Number(match[1]), end = Number(match[2]);
            for (const [rStart, rEnd] of ranges) {
              if (start <= rEnd && end >= rStart) return false;
            }
            ranges.push([start, end]);
          }
        }
        for (const port of numbers) {
          for (const [start, end] of ranges) {
            if (port >= start && port <= end) return false;
          }
        }
        return true;
      })()
    `;
    message: 'Exposed ports must be unique, number ports must not fall within any defined port range, and port ranges must not overlap or be adjacent.';
  }>;

export const ServiceType = {
  WEB: 'web',
  API: 'api',
  WEBAPI: 'webapi',
  WEBSOCKET: 'websocket',
  NONE: 'none',
} as const;

// Union type for all service types
export type ServiceType = typeof ServiceType[keyof typeof ServiceType];

export const HealthCheckType = {
  HTTP: 'http',
  WEBSOCKET: 'websocket',
} as const;

// Union type for all health check types
export type HealthCheckType = typeof HealthCheckType[keyof typeof HealthCheckType];
// Define HealthCheck structure based on HealthCheckType
export type HttpHealthCheck = {
  type: typeof HealthCheckType.HTTP;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  expected_status: number;
  headers?: Record<string, string>;
  body?: unknown;
  continuous: boolean;
};

export type WebSocketHealthCheck = {
  type: typeof HealthCheckType.WEBSOCKET;
  expected_response: string;
  continuous: boolean;
};

// Union type for health checks
export type HealthCheck = HttpHealthCheck | WebSocketHealthCheck;

export type Port = number;
export type ExposedPort = {
  port: number;
  type?: ServiceType;
  health_checks?: HealthCheck[];
};
export type ExposeBase = Port | ExposedPort | LiteralString | SpreadMarker;
export type Expose = ExposeBase | UniqueExposedPorts;