import { Inscriber, Inscription, Tx } from "./inscriber";
import { Semaphore } from 'async-mutex';
import { delay } from "./utils";


export type Strategy = {
    maxConcurrentRequests?: number;
    statusToWait?: "requested" | "submitted" | "confirmed";
    predicate?: (inscriber: Inscriber) => boolean
    delayIfFailed?: number;
    delayIfUnsatisfied?: number;
};

export const DEFAULT_STRATEGY: Strategy = {
    maxConcurrentRequests: 1,
    statusToWait: "submitted",
    predicate: undefined,
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
    async inscribe(inp: Inscription): Promise<any> {
        if (!this.predicated()) {
            return await delay(this.strategy.delayIfUnsatisfied ?? DEFAULT_STRATEGY.delayIfUnsatisfied!);
        }
        this.semaphore.acquire();
        return await this.semaphore.runExclusive(() => {
            this.inscriber
                .inscribe(inp)
                .then((_) => console.log)
                .catch((e) => {
                    console.error("Inscribe failed: ", e);
                    if (this.strategy.delayIfFailed) {
                        return delay(this.strategy.delayIfFailed)
                    }
                })
                .finally(() => {
                    this.semaphore.release();
                });
        });
    }
    predicated(): boolean {
        return this.strategy?.predicate ? this.strategy.predicate!(this.inscriber) : true
    }
}