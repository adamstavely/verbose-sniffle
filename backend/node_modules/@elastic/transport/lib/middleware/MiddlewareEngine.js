"use strict";
/*
 * Copyright Elasticsearch B.V. and contributors
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiddlewareEngine = exports.MiddlewareException = void 0;
const errors_1 = require("../errors");
class MiddlewareException extends Error {
    constructor(message, options) {
        super(message, options);
        this.name = 'MiddlewareException';
    }
}
exports.MiddlewareException = MiddlewareException;
class MiddlewareEngine {
    constructor() {
        Object.defineProperty(this, "middleware", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
    }
    register(middleware) {
        this.middleware.push(middleware);
        this.middleware.sort((a, b) => { var _a, _b; return ((_a = a.priority) !== null && _a !== void 0 ? _a : 100) - ((_b = b.priority) !== null && _b !== void 0 ? _b : 100); });
    }
    executePhase(phase, context, result) {
        for (const middleware of this.middleware) {
            const handler = middleware[phase];
            if (handler == null)
                continue;
            try {
                const handlerResult = handler(context, result);
                if ((handlerResult === null || handlerResult === void 0 ? void 0 : handlerResult.continue) === false) {
                    return;
                }
            }
            catch (error) {
                if (error instanceof errors_1.ElasticsearchClientError) {
                    throw error;
                }
                throw new MiddlewareException(`Middleware ${middleware.name} failed in ${phase}`, { cause: error });
            }
        }
    }
}
exports.MiddlewareEngine = MiddlewareEngine;
//# sourceMappingURL=MiddlewareEngine.js.map