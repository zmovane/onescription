import { Inscription, InscriptionText, Tx } from "./inscriber";
import { Semaphore } from 'async-mutex';
import { delay } from "./utils";
import { match } from 'ts-pattern';
import { ChainInfoProvider, Inscriber } from "./inscriber/inscriber";

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
    this.semaphore = new Semaphore(
      strategy.maxConcurrentRequests ?? DEFAULT_STRATEGY.maxConcurrentRequests!);
  }
  async inscribe(inp: Inscription | InscriptionText): Promise<any> {
    this.semaphore.acquire();
    const predicated = await this.predicated();
    if (!predicated) {
      console.warn("The conditions for execution are not satisfied")
      const mills = this.strategy.delayIfUnsatisfied ?? DEFAULT_STRATEGY.delayIfUnsatisfied!;
      return delay(mills)
        .finally(() => {
          this.semaphore.release();
        });
    }
    return await this.semaphore.runExclusive(() => {
      match(inp)
        .returnType<Promise<Tx>>()
        .with(
          { op: "mint" }, { op: 'deploy' }, { op: "transfer" },
          () => this.inscriber.inscribe(inp as Inscription)
        )
        .when(
          () => inp.toString().startsWith("data:,"),
          () => this.inscriber.inscribeText(inp as InscriptionText)
        )
        .run()
        .then((_) => console.log)
        .catch(async (e) => {
          if (this.strategy.delayIfFailed) {
            await delay(this.strategy.delayIfFailed)
          }
          return Promise.reject(e);
        })
        .finally(() => {
          this.semaphore.release();
        });
    });
  }
  predicated(): Promise<boolean> {
    return this.strategy?.predicate ?
      this.strategy.predicate!(this.inscriber) :
      DEFAULT_STRATEGY.predicate!(this.inscriber)
  }
}