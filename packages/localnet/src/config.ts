import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const LOCALNET_RPC_ENDPOINT = 'http://127.0.0.1:8899';
export const LOCALNET_WS_ENDPOINT = 'ws://127.0.0.1:8900';

/**
 * Absolute path to the bundled keypair files directory.
 */
export const KEYS_DIR = path.resolve(__dirname, '..', 'keys');

/**
 * Absolute path to the bundled fixture files directory.
 */
export const FIXTURES_DIR = path.resolve(__dirname, '..', 'fixtures');
