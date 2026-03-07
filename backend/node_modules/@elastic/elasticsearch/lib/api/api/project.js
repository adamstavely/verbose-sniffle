"use strict";
/*
 * Copyright Elasticsearch B.V. and contributors
 * SPDX-License-Identifier: Apache-2.0
 */
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const symbols_1 = require("../../symbols");
class Project {
    constructor(transport) {
        Object.defineProperty(this, "transport", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _a, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.transport = transport;
        this[symbols_1.kAcceptedParams] = {
            'project.tags': {
                path: [],
                body: [],
                query: [
                    'project_routing'
                ]
            }
        };
    }
    async tags(params, options) {
        const { path: acceptedPath } = this[symbols_1.kAcceptedParams]['project.tags'];
        const userQuery = params === null || params === void 0 ? void 0 : params.querystring;
        const querystring = userQuery != null ? { ...userQuery } : {};
        let body;
        const userBody = params === null || params === void 0 ? void 0 : params.body;
        if (userBody != null) {
            if (typeof userBody === 'string') {
                body = userBody;
            }
            else {
                body = { ...userBody };
            }
        }
        params = params !== null && params !== void 0 ? params : {};
        for (const key in params) {
            if (acceptedPath.includes(key)) {
                continue;
            }
            else if (key !== 'body' && key !== 'querystring') {
                // @ts-expect-error
                querystring[key] = params[key];
            }
        }
        const method = body != null ? 'POST' : 'GET';
        const path = '/_project/tags';
        const meta = {
            name: 'project.tags',
            acceptedParams: {
                path: [],
                body: [],
                query: ['project_routing']
            }
        };
        return await this.transport.request({ path, method, querystring, body, meta }, options);
    }
}
_a = symbols_1.kAcceptedParams;
exports.default = Project;
//# sourceMappingURL=project.js.map