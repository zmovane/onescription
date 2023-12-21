import { BigNumber, ethers } from "ethers";
import { EVM_CHAINS } from "../config";
import { Defferable, EvmConfig, Inscriber, Inscription, Provider, Signer, Tx } from ".";
import { appendFileSync } from "fs";
import assert from "assert";

export class EvmInscriber extends Inscriber {
    constructor(config: EvmConfig) {
        super(config);
        this.rpcs = EVM_CHAINS[config.chainId]?.rpcs ?? [];
    }

    async inscribe(inp: Inscription): Promise<Tx> {
        const from = await this.signer?.getAddress()!;
        const to = this.config.isSelfTransaction ? from : this.config.contract!;
        const data = this.buildCallData(inp);
        const value = this.config.value || BigNumber.from(0);
        assert(this.signer);
        return await this.signer.sendTransaction({ from, to, data, value });
    }

    randomProvider(): Provider {
        return new ethers.providers.JsonRpcProvider(this.randomRpc())
    }

    stringify(inp: Inscription): string {
        return `data:,${JSON.stringify(inp)}`
    }

    buildCallData(inp: Inscription): string {
        return ethers.utils.hexlify(this.stringify(inp))
    }

    createSigner(): Defferable<Signer> {
        const signer = ethers.Wallet.createRandom();
        const { address, privateKey } = signer;
        const record = `${address}${this.csvDelimiter}${privateKey}\r\n`;
        appendFileSync(this.secretPath, record);
        return signer;
    }

    loadSigner(address?: string): Defferable<Signer> {
        const mnemonic = this.loadMnemonic(address);
        return ethers.Wallet.fromMnemonic(mnemonic);
    }
}