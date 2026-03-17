type GroupDependencies = {
  depends_on?: never
  stop_if_dependent_stops?: never;
}
  | {
    depends_on: string[];
    stop_if_dependent_stops?: boolean;
  };


export type Execution = {
  group?: string;
} & GroupDependencies