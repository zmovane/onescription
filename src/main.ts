import EvmInscriber from "./inscriber/evm";
import { Onescription, Strategy } from "./onescription";

async function main() {
  const inscriber = new EvmInscriber({
    chainId: 56,
    isSelfTransaction: true,
  });
  await inscriber.loadSigner();
  const strategy: Strategy = { maxConcurrentRequests: 5, statusToWait: "submitted" };
  const onescription = new Onescription(inscriber, strategy);
  for (; ;) {
    const inscription = { 'p': 'brc20', 'op': 'mint', 'tick': 'wakaka', 'amt': '1000' };
    await onescription.inscribe(inscription);
  }
}
main()