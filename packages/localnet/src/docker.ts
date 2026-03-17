import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCKER_DIR = path.resolve(__dirname, '..', 'docker');

export interface LocalnetOptions {
  /**
   * Path to a custom docker-compose file.
   * Defaults to the one bundled with `@nosana/localnet`.
   */
  composeFile?: string;

  /**
   * Container name. Defaults to `nosana-localnet`.
   */
  containerName?: string;

  /**
   * Whether to print docker-compose output. Defaults to `false`.
   */
  verbose?: boolean;
}

function getComposeFile(options?: LocalnetOptions): string {
  return options?.composeFile ?? path.join(DOCKER_DIR, 'docker-compose.yml');
}

function getExecOptions(options?: LocalnetOptions) {
  return {
    stdio: (options?.verbose ? 'inherit' : 'pipe') as 'inherit' | 'pipe',
    cwd: path.dirname(getComposeFile(options)),
  };
}

/**
 * Start the Nosana localnet validator using Docker Compose.
 * Waits for the healthcheck to pass before returning.
 *
 * @example
 * ```ts
 * import { startLocalnet, stopLocalnet } from '@nosana/localnet';
 *
 * // In your test setup (e.g. globalSetup)
 * await startLocalnet();
 *
 * // In your test teardown
 * await stopLocalnet();
 * ```
 */
export function startLocalnet(options?: LocalnetOptions): void {
  const composeFile = getComposeFile(options);
  const execOptions = getExecOptions(options);

  execSync(`docker compose -f "${composeFile}" up -d --wait --force-recreate`, execOptions);
}

/**
 * Stop the Nosana localnet validator and clean up volumes.
 */
export function stopLocalnet(options?: LocalnetOptions): void {
  const composeFile = getComposeFile(options);
  const execOptions = getExecOptions(options);

  execSync(`docker compose -f "${composeFile}" down -v`, execOptions);
}
