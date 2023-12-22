import { Defferable, EvmConfig, Inscriber, Inscription, Provider, Signer, Tx } from ".";
export default class EvmInscriber extends Inscriber {
    constructor(config: EvmConfig);
    inscribe(inp: Inscription): Promise<Tx>;
    randomProvider(): Provider;
    stringify(inp: Inscription): string;
    buildCallData(inp: Inscription): string;
    createSigner(): Defferable<Signer>;
    loadSigner(address?: string): Defferable<Signer>;
}
