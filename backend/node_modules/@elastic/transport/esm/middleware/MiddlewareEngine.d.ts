import { Middleware, MiddlewareContext } from './types.js';
import { TransportResult } from '../types.js';
import { NativeErrorOptions } from '../errors.js';
export declare class MiddlewareException extends Error {
    constructor(message: string, options?: NativeErrorOptions);
}
export declare class MiddlewareEngine {
    private readonly middleware;
    register(middleware: Middleware): void;
    executePhase(phase: 'onResponse', context: MiddlewareContext, result: TransportResult): void;
}
//# sourceMappingURL=MiddlewareEngine.d.ts.map