import { EvmInscriber } from ".";
import { Onescription, Strategy } from ".";

async function example() {
  const configuration = {
    chainId: 56,
    isSelfTransaction: true
  };
  const inscriber = await new EvmInscriber(configuration).connectSignerFromSecretCsv();
  const strategy: Strategy = { maxConcurrentRequests: 5, statusToWait: "submitted" };
  const onescription = new Onescription(inscriber, strategy);
  for (; ;) {
    const inscription = { 'p': 'brc20', 'op': 'mint', 'tick': 'wakaka', 'amt': '1000' };
    await onescription.inscribe(inscription);
  }
}
example()