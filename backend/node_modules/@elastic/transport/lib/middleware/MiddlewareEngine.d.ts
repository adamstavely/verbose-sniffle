import { Middleware, MiddlewareContext } from './types';
import { TransportResult } from '../types';
import { NativeErrorOptions } from '../errors';
export declare class MiddlewareException extends Error {
    constructor(message: string, options?: NativeErrorOptions);
}
export declare class MiddlewareEngine {
    private readonly middleware;
    register(middleware: Middleware): void;
    executePhase(phase: 'onResponse', context: MiddlewareContext, result: TransportResult): void;
}
