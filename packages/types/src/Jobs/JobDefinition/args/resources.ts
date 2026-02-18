import type { RemoveIfEmptyMarker, SpreadMarker } from "./literals.js";

type Target = string;
type URL = string;
type AllowWrite = boolean;
type File = string;
type Model = string
type Bucket = string
type Revision = string
type Repo = string

export const ResourceTypeEnum = {
  S3: 'S3',
  HF: 'HF',
  Ollama: 'Ollama',
} as const
export type ResourceType = typeof ResourceTypeEnum[keyof typeof ResourceTypeEnum];

export type S3Base = {
  type: typeof ResourceTypeEnum.S3;
  target: Target;
  url?: URL;
  allowWrite?: AllowWrite;
  files?: File[]; // allow files in base
  IAM?: S3Auth;
  // No bucket, no buckets
};

export type S3WithBucket = {
  type: typeof ResourceTypeEnum.S3;
  target: Target;
  bucket: Bucket;
  url?: URL;
  allowWrite?: AllowWrite;
  IAM?: S3Auth;
  // No buckets, no files
};

export type S3WithBuckets = {
  type: typeof ResourceTypeEnum.S3;
  target: Target;
  buckets: { url: URL; files?: File[] }[];
  url?: URL;
  allowWrite?: AllowWrite;
  IAM?: S3Auth;
  // No bucket, no files
};

export type S3Unsecure =
  | S3Base
  | S3WithBucket
  | S3WithBuckets;

export type S3Auth = {
  REGION: string;
  ACCESS_KEY_ID: string;
  SECRET_ACCESS_KEY: string;
};

export type ResourceBase = {
  type: typeof ResourceTypeEnum[keyof typeof ResourceTypeEnum];
  target: Target;
};

export type HFResource = {
  type: typeof ResourceTypeEnum.HF;
  target: Target;
  repo: Repo;
  revision?: Revision;
  files?: File[];
  accessToken?: string;
};

export type OllamaResource = {
  type: typeof ResourceTypeEnum.Ollama;
  model: Model;
  target?: Target;
};

export type S3Resource = S3Unsecure;
export type Resource = S3Resource | HFResource | OllamaResource;

export type RequiredResource = Omit<Resource, 'target'>;

export type Resources = Array<Resource | SpreadMarker | RemoveIfEmptyMarker>