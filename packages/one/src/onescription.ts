import { Inscription, InscriptionText, Tx, ChainInfoProvider, Inscriber } from "./inscriber";
import { Semaphore } from 'async-mutex';
import { delay } from "./utils";
import { match } from 'ts-pattern';

export type Strategy = {
  maxConcurrentRequests?: number;
  statusToWait?: "requested" | "submitted" | "confirmed";
  predicate?: (provider: ChainInfoProvider) => Promise<boolean>
  delayIfFailed?: number;
  delayIfUnsatisfied?: number;
};

export const DEFAULT_STRATEGY: Strategy = {
  maxConcurrentRequests: 1,
  statusToWait: "submitted",
  predicate: (_) => Promise.resolve(true),
  delayIfFailed: 1000,
  delayIfUnsatisfied: 5000
};

export class Onescription {
  private readonly semaphore: Semaphore;
  readonly inscriber: Inscriber;
  readonly strategy: Strategy;

  constructor(inscriber: Inscriber, strategy: Strategy) {
    this.inscriber = inscriber
    this.strategy = strategy;
    const concurrentRequests = Math.max(1, strategy.maxConcurrentRequests ?? DEFAULT_STRATEGY.maxConcurrentRequests!);
    this.semaphore = new Semaphore(concurrentRequests + 1);
  }

  async inscribe(inp: Inscription | InscriptionText): Promise<Tx> {
    this.semaphore.acquire();
    return await this.semaphore.runExclusive<Tx>(async () => {
      return this.predicated()
        .then(async (predicated) => {
          if (!predicated) {
            throw new Error("E1001: The conditions for execution are not satisfied")
          }
          return await this.buildInscribeTx(inp)
        })
        .then((tx) => tx)
        .catch((err) => {
          const errMsg = err.toString();
          const errResolved = Promise.resolve({ err });
          let mills = 0;
          if (errMsg.startsWith("E1001")) {
            mills = this.strategy.delayIfUnsatisfied ?? DEFAULT_STRATEGY.delayIfUnsatisfied!;
          }
          if (this.strategy.delayIfFailed) {
            mills = this.strategy.delayIfFailed;
          }
          return mills === 0 ? errResolved : delay(mills).then(() => errResolved);
        })
        .finally(() => { this.semaphore.release() });
    });
  }

  buildInscribeTx(inp: Inscription | InscriptionText): Promise<Tx> {
    return match(inp)
      .returnType<Promise<Tx>>()
      .when(
        () => inp.toString().startsWith("data:"),
        () => this.inscriber.inscribeText(inp as InscriptionText)
      )
      .with(
        { "op": "mint" }, { "op": "deploy" }, { "op": "transfer" },
        () => this.inscriber.inscribe(inp as Inscription)
      )
      .run();
  }

  predicated(): Promise<boolean> {
    return this.strategy?.predicate ?
      this.strategy.predicate!(this.inscriber) :
      DEFAULT_STRATEGY.predicate!(this.inscriber)
  }
}