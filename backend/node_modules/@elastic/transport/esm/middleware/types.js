/*
 * Copyright Elasticsearch B.V. and contributors
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Enum of all registered middleware names.
 * Each middleware should have a unique name for identification and debugging.
 */
export var MiddlewareName;
(function (MiddlewareName) {
    MiddlewareName["PRODUCT_CHECK"] = "product-check";
    // Add new middleware names here
})(MiddlewareName || (MiddlewareName = {}));
/**
 * Priority values for each middleware.
 * Lower values execute first. Middleware is sorted by priority before execution.
 */
export const MiddlewarePriority = {
    [MiddlewareName.PRODUCT_CHECK]: 50
    // Add new middleware priorities here
};
//# sourceMappingURL=types.js.map