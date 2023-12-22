import { CosmosConfig, Signer } from ".";
import { CosmosInscriber } from "./cosmos";
export declare class InjectiveInscriber extends CosmosInscriber {
    constructor(config: CosmosConfig);
    loadSigner(address?: string): Promise<Signer>;
}
