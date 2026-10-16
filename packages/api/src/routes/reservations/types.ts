import type { operations } from '../../client/host-manager/schema.js';

type Json<T> = T extends { content: { 'application/json': infer Body } }
  ? Body
  : never;

/**
 * Metric key → required value. A number is a minimum (`ram_gb: 64` means at
 * least 64 GB); a string or boolean must match exactly (`country: "NL"`); a
 * list is any of its values. The GPU model is the `name` key, e.g.
 * `{ name: ["NVIDIA GeForce RTX 4090", "NVIDIA GeForce RTX 5090"] }`.
 */
export type NosanaRequirements = NonNullable<
  NosanaAvailableNodesRequest['requirements']
>;
/** One requirement's value: a scalar, or a list of them meaning any of. */
export type NosanaRequirementValue = NosanaRequirements[string];

/** GPU models on the network: VRAM, host counts and the markets they serve. */
export type NosanaGpuModels = Json<
  operations['getReservationsGpus']['responses']['200']
>;
export type NosanaGpuModel = NosanaGpuModels['gpus'][number];

/** Which requirement metrics to describe, scoped to hosts meeting `requirements`. */
export type NosanaRequirementOptionsRequest = Json<
  operations['postReservationsRequirements']['requestBody']
>;
/** Each metric's type, match rule and the values hosts report, with counts. */
export type NosanaRequirementOptions = Json<
  operations['postReservationsRequirements']['responses']['200']
>;
export type NosanaRequirementOption = NosanaRequirementOptions['metrics'][number];

/** The requirements to check queued hosts against; none means every host. */
export type NosanaAvailableNodesRequest = Json<
  operations['postReservationsAvailable']['requestBody']
>;
/** Queued hosts meeting the requirements right now, and their price range. */
export type NosanaAvailableNodes = Json<
  operations['postReservationsAvailable']['responses']['200']
>;

export interface NosanaReservationsApi {
  /** Every GPU model on the network, with available and working host counts. */
  listGpus: () => Promise<NosanaGpuModels>;
  /**
   * The options for each requirement metric (values and host counts), over
   * the hosts that meet `requirements`. Omit `metrics` for all of them.
   */
  getRequirementOptions: (
    request?: NosanaRequirementOptionsRequest,
  ) => Promise<NosanaRequirementOptions>;
  /** The queued hosts that meet `requirements` right now, across every market. */
  findAvailable: (
    request?: NosanaAvailableNodesRequest,
  ) => Promise<NosanaAvailableNodes>;
}
