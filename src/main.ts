import { EvmInscriber } from "./inscriber/evm";

async function main() {
    let inscriber = new EvmInscriber({
        chainId: 56,
        isSelfTransaction: true,
    });
    await inscriber.loadSigner();
    let tx = await inscriber.inscribe({ p: "injrc-20", op: "mint", tick: "INJS", amt: "1000" })
    console.log(tx)
}
main()