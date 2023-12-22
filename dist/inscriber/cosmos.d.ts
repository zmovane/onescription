import { CosmosConfig, Defferable, Inscriber, Inscription, Signer, Tx } from ".";
export default class CosmosInscriber extends Inscriber {
    constructor(config: CosmosConfig);
    inscribe(inp: Inscription): Promise<Tx>;
    stringify(inp: Inscription): string;
    buildCallData(inp: Inscription): string;
    createSigner(): Defferable<Signer>;
    nativeDenomOf(prefix: string): "utia" | "uatom" | "uosmo" | "inj";
    loadSigner(address?: string): Promise<Signer>;
}
