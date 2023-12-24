export * from './cosmos';
export * from './injective';
export * from '@scriptione/one';

import { match } from 'ts-pattern';
import { Config } from '@scriptione/one';
import { CosmosInscriber } from './cosmos';
import { InjectiveInscriber } from './injective';
import * as JSON_OBJECT from './chains.json';

export type CosmosConfig = Config & { prefix: string };
export const CHAINS: Record<string, { name: string; rpcs: string[] }> = JSON_OBJECT;
export namespace Inscriber {
  export function from(config: CosmosConfig) {
    return match(config)
      .with({ os: "cosmos", prefix: "inj" }, () => new InjectiveInscriber(config as CosmosConfig))
      .with({ os: "cosmos" }, () => new CosmosInscriber(config as CosmosConfig))
      .run();
  }
}