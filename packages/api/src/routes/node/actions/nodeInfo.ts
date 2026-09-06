import { errorFormatter } from '../../../utils/errorFormatter.js';

import type { NodeClient } from '../../../client/node/index.js';
import type { NodeInfo } from '../types.js';

export async function nodeInfo(client: NodeClient): Promise<NodeInfo> {
  const { data, error, response } = await client.GET('/node/info');
  if ((error !== undefined && error !== null) || data === undefined) {
    throw errorFormatter('Failed to get node info', error, response);
  }
  return data;
}
