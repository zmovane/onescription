import { Inscriber, Inscription } from "./inscriber";
export type Strategy = {
    maxConcurrentRequests?: number;
    statusToWait?: "requested" | "submitted" | "confirmed";
    predicate?: (inscriber: Inscriber) => boolean;
    delayIfFailed?: number;
    delayIfUnsatisfied?: number;
};
export declare const DEFAULT_STRATEGY: Strategy;
export declare class Onescription {
    private readonly semaphore;
    readonly inscriber: Inscriber;
    readonly strategy: Strategy;
    constructor(inscriber: Inscriber, strategy: Strategy);
    inscribe(inp: Inscription): Promise<any>;
    predicated(): boolean;
}
