import { BigNumber, ethers } from "ethers";
import { CHAINS_COSMOS } from "../config";
import { CosmosConfig, Defferable, Inscriber, Inscription, Signer, Tx, TxRequest } from ".";
import { appendFileSync } from "fs";
import { Secp256k1HdWallet } from "@cosmjs/launchpad";
import { assert } from "console";
import { SigningStargateClient } from "@cosmjs/stargate";
import { base64 } from "ethers/lib/utils";

export class CosmosInscriber extends Inscriber {
    constructor(config: CosmosConfig) {
        super(config);
        this.rpcs = CHAINS_COSMOS[config.prefix]?.rpcs ?? [];
    }

    async inscribe(inp: Inscription): Promise<Tx> {
        const from = await this.signer?.getAddress()!;
        const to = this.config.isSelfTransaction ? from : this.config.contract!;
        const data = this.buildCallData(inp);
        const value = this.config.value || BigNumber.from(0);
        assert(this.signer);
        return this.signer?.sendTransaction({ from, to, data, value })
    }

    stringify(inp: Inscription): string {
        return `data:,${JSON.stringify(inp)}`
    }

    buildCallData(inp: Inscription): string {
        return base64.encode(this.stringify(inp));
    }

    createSigner(): Defferable<Signer> {
        const signer = ethers.Wallet.createRandom();
        const { address, privateKey } = signer;
        const record = `${address}${this.csvDelimiter}${privateKey}\r\n`;
        appendFileSync(this.secretPath, record);
        return signer;
    }

    nativeDenomOf(prefix: string) {
        switch (prefix) {
            case "celestia": return 'utia';
            case "cosmos": return 'uatom';
            case "osmo": return 'uosmo';
            case "inj": return 'inj';
        }
        // TODO
        throw Error("Unknown prefix");
    }

    async loadSigner(address?: string): Promise<Signer> {
        const mnemonic = this.loadMnemonic(address);
        const prefix = (this.config as CosmosConfig).prefix;
        const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic.trim(), { prefix });
        const client = await SigningStargateClient.connectWithSigner(this.randomRpc(), wallet);
        const account = (await wallet.getAccounts())[0].address;
        const getAddress = async () => account;
        const sendTransaction =
            async ({ from: sender, to: recipient, value: amount, data: memo }: TxRequest) => {
                const { transactionHash } = await client.sendTokens(
                    sender,
                    recipient,
                    [{ amount: amount.toString(), denom: this.nativeDenomOf(prefix) }],
                    "auto",
                    memo.toString()
                );
                return { hash: transactionHash }
            };
        return { sendTransaction, getAddress };
    }
}