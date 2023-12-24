export * from './evm';
export * from '@scriptione/one';

import { ChainId, Config } from '@scriptione/one';
import { match } from 'ts-pattern';
import { EvmInscriber } from './evm';
import * as JSON_OBJECT from './chains.json';

export type EvmConfig = Config & { chainId: ChainId };
export const CHAINS: Record<string, { name: string; rpcs: string[] }> = JSON_OBJECT;
export namespace Inscriber {
  export function from(config: EvmConfig) {
    return match(config)
      .with({ os: "evm" }, () => new EvmInscriber(config as EvmConfig))
      .run();
  }
}