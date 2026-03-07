"use strict";
/*
 * Copyright Elasticsearch B.V. and contributors
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiddlewarePriority = exports.MiddlewareName = void 0;
/**
 * Enum of all registered middleware names.
 * Each middleware should have a unique name for identification and debugging.
 */
var MiddlewareName;
(function (MiddlewareName) {
    MiddlewareName["PRODUCT_CHECK"] = "product-check";
    // Add new middleware names here
})(MiddlewareName || (exports.MiddlewareName = MiddlewareName = {}));
/**
 * Priority values for each middleware.
 * Lower values execute first. Middleware is sorted by priority before execution.
 */
exports.MiddlewarePriority = {
    [MiddlewareName.PRODUCT_CHECK]: 50
    // Add new middleware priorities here
};
//# sourceMappingURL=types.js.map