export * from "./evm";
export * from "./cosmos";
export * from "./injective";
export * from "./inscriber";

import { CosmosInscriber } from "./cosmos";
import { EvmInscriber } from "./evm";
import { InjectiveInscriber } from "./injective";
import { CosmosConfig, EvmConfig } from "./inscriber";
import { match } from 'ts-pattern';

export namespace Inscriber {
  export function from(config: EvmConfig | CosmosConfig) {
    return match(config)
      .with({ os: "cosmos", prefix: "inj" }, () => new InjectiveInscriber(config as CosmosConfig))
      .with({ os: "cosmos" }, () => new CosmosInscriber(config as CosmosConfig))
      .with({ os: "evm" }, () => new EvmInscriber(config as EvmConfig))
      .run();
  }
}