/*
 * Copyright Elasticsearch B.V. and contributors
 * SPDX-License-Identifier: Apache-2.0
 */
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6;
import Debug from 'debug';
import os from 'node:os';
import zlib from 'node:zlib';
import buffer from 'node:buffer';
import { promisify } from 'node:util';
import process from 'node:process';
import ms from 'ms';
import { ConnectionError, RequestAbortedError, NoLivingConnectionsError, ResponseError, ConfigurationError, TimeoutError } from './errors.js';
import { isBinary } from './connection/BaseConnection.js';
import Diagnostic from './Diagnostic.js';
import Serializer from './Serializer.js';
import { kSniffEnabled, kNextSniff, kIsSniffing, kSniffInterval, kSniffOnConnectionFault, kSniffEndpoint, kRequestTimeout, kRetryOnTimeout, kCompression, kMaxRetries, kName, kOpaqueIdPrefix, kGenerateRequestId, kContext, kConnectionPool, kSerializer, kDiagnostic, kHeaders, kNodeFilter, kNodeSelector, kProductCheck, kMaxResponseSize, kMaxCompressedResponseSize, kJsonContentType, kNdjsonContentType, kAcceptHeader, kRedaction, kRetryBackoff, kOtelTracer, kOtelOptions, kMiddlewareEngine } from './symbols.js';
import { setTimeout } from 'node:timers/promises';
import opentelemetry, { SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { suppressTracing } from '@opentelemetry/core';
import { MiddlewareEngine, ProductCheck } from './middleware/index.js';
import { transportVersion } from './version.generated.js';
const nodeVersion = process.versions.node;
const debug = Debug('elasticsearch');
const gzip = promisify(zlib.gzip);
const unzip = promisify(zlib.unzip);
const { createGzip } = zlib;
const userAgent = `elastic-transport-js/${transportVersion} (${os.platform()} ${os.release()}-${os.arch()}; Node.js ${process.version})`; // eslint-disable-line
class Transport {
    constructor(opts) {
        var _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29;
        Object.defineProperty(this, _a, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _b, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _c, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _d, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _e, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _f, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _g, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _h, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _j, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _k, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _l, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _m, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _o, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _p, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _q, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _r, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _s, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _t, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _u, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _v, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _w, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _x, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _y, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _z, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _0, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _1, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _2, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _3, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _4, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _5, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _6, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        if (opts.connectionPool == null) {
            throw new ConfigurationError('The Connection Pool option is not defined');
        }
        if (typeof opts.maxRetries === 'number' && opts.maxRetries < 0 && Number.isInteger(opts.maxRetries)) {
            throw new ConfigurationError('The maxRetries option must be a positive integer or zero');
        }
        if (opts.sniffInterval === true ||
            (typeof opts.sniffInterval === 'number' && opts.sniffInterval < 0 && Number.isInteger(opts.sniffInterval))) {
            throw new ConfigurationError('The sniffInterval option must be false or a positive integer');
        }
        if (opts.maxResponseSize != null && opts.maxResponseSize > buffer.constants.MAX_STRING_LENGTH) {
            throw new ConfigurationError(`The maxResponseSize cannot be bigger than ${buffer.constants.MAX_STRING_LENGTH}`);
        }
        if (opts.maxCompressedResponseSize != null && opts.maxCompressedResponseSize > buffer.constants.MAX_LENGTH) {
            throw new ConfigurationError(`The maxCompressedResponseSize cannot be bigger than ${buffer.constants.MAX_LENGTH}`);
        }
        this[kNodeFilter] = (_7 = opts.nodeFilter) !== null && _7 !== void 0 ? _7 : defaultNodeFilter;
        this[kNodeSelector] = (_8 = opts.nodeSelector) !== null && _8 !== void 0 ? _8 : roundRobinSelector();
        this[kHeaders] = Object.assign({}, { 'user-agent': userAgent }, (opts.enableMetaHeader == null ? true : opts.enableMetaHeader) ? { 'x-elastic-client-meta': `et=${transportVersion},js=${nodeVersion}` } : null, opts.compression === true ? { 'accept-encoding': 'gzip,deflate' } : null, lowerCaseHeaders(opts.headers));
        this[kDiagnostic] = (_9 = opts.diagnostic) !== null && _9 !== void 0 ? _9 : new Diagnostic();
        this[kConnectionPool] = opts.connectionPool;
        this[kSerializer] = (_10 = opts.serializer) !== null && _10 !== void 0 ? _10 : new Serializer();
        this[kContext] = (_11 = opts.context) !== null && _11 !== void 0 ? _11 : null;
        this[kGenerateRequestId] = (_12 = opts.generateRequestId) !== null && _12 !== void 0 ? _12 : generateRequestId();
        this[kOpaqueIdPrefix] = (_13 = opts.opaqueIdPrefix) !== null && _13 !== void 0 ? _13 : null;
        this[kName] = (_14 = opts.name) !== null && _14 !== void 0 ? _14 : 'elastic-transport-js';
        this[kMaxRetries] = typeof opts.maxRetries === 'number' ? opts.maxRetries : 3;
        this[kCompression] = opts.compression === true;
        this[kRequestTimeout] = opts.requestTimeout != null ? toMs(opts.requestTimeout) : null;
        this[kRetryOnTimeout] = opts.retryOnTimeout != null ? opts.retryOnTimeout : false;
        this[kSniffInterval] = (_15 = opts.sniffInterval) !== null && _15 !== void 0 ? _15 : false;
        this[kSniffEnabled] = typeof this[kSniffInterval] === 'number';
        this[kNextSniff] = this[kSniffEnabled] ? (Date.now() + this[kSniffInterval]) : 0;
        this[kIsSniffing] = false;
        this[kSniffOnConnectionFault] = (_16 = opts.sniffOnConnectionFault) !== null && _16 !== void 0 ? _16 : false;
        this[kSniffEndpoint] = (_17 = opts.sniffEndpoint) !== null && _17 !== void 0 ? _17 : null;
        this[kProductCheck] = (_18 = opts.productCheck) !== null && _18 !== void 0 ? _18 : null;
        this[kMaxResponseSize] = (_19 = opts.maxResponseSize) !== null && _19 !== void 0 ? _19 : buffer.constants.MAX_STRING_LENGTH;
        this[kMaxCompressedResponseSize] = (_20 = opts.maxCompressedResponseSize) !== null && _20 !== void 0 ? _20 : buffer.constants.MAX_LENGTH;
        this[kJsonContentType] = (_22 = (_21 = opts.vendoredHeaders) === null || _21 === void 0 ? void 0 : _21.jsonContentType) !== null && _22 !== void 0 ? _22 : 'application/json';
        this[kNdjsonContentType] = (_24 = (_23 = opts.vendoredHeaders) === null || _23 === void 0 ? void 0 : _23.ndjsonContentType) !== null && _24 !== void 0 ? _24 : 'application/x-ndjson';
        this[kAcceptHeader] = (_26 = (_25 = opts.vendoredHeaders) === null || _25 === void 0 ? void 0 : _25.accept) !== null && _26 !== void 0 ? _26 : 'application/json, text/plain';
        this[kRedaction] = (_27 = opts.redaction) !== null && _27 !== void 0 ? _27 : { type: 'replace', additionalKeys: [] };
        this[kRetryBackoff] = (_28 = opts.retryBackoff) !== null && _28 !== void 0 ? _28 : retryBackoff;
        this[kOtelTracer] = opentelemetry.trace.getTracer('@elastic/transport', transportVersion);
        const otelEnabledDefault = process.env.OTEL_ELASTICSEARCH_ENABLED != null ? (process.env.OTEL_ELASTICSEARCH_ENABLED.toLowerCase() !== 'false') : true;
        this[kOtelOptions] = Object.assign({}, {
            enabled: otelEnabledDefault,
            suppressInternalInstrumentation: false
        }, (_29 = opts.openTelemetry) !== null && _29 !== void 0 ? _29 : {});
        // Initialize middleware engine with ProductCheck
        this[kMiddlewareEngine] = new MiddlewareEngine();
        this[kMiddlewareEngine].register(new ProductCheck({
            productCheck: this[kProductCheck]
        }));
        if (opts.sniffOnStart === true) {
            this.sniff({
                reason: Transport.sniffReasons.SNIFF_ON_START,
                requestId: this[kGenerateRequestId]({ method: 'GET', path: this[kSniffEndpoint] }, { context: this[kContext] }),
                context: this[kContext]
            });
        }
    }
    get connectionPool() {
        return this[kConnectionPool];
    }
    get sniffEnabled() {
        return this[kSniffEnabled];
    }
    get nextSniff() {
        return this[kNextSniff];
    }
    get sniffEndpoint() {
        return this[kSniffEndpoint];
    }
    get isSniffing() {
        return this[kIsSniffing];
    }
    set isSniffing(val) {
        if (typeof val !== 'boolean') {
            throw new ConfigurationError(`isSniffing must be a boolean, instead got ${typeof val}`);
        }
        this[kIsSniffing] = val;
    }
    get diagnostic() {
        return this[kDiagnostic];
    }
    async _request(params, options = {}, otelSpan) {
        var _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25;
        const connectionParams = {
            method: params.method,
            path: params.path
        };
        const meta = {
            context: null,
            request: {
                params: connectionParams,
                options,
                id: (_7 = options.id) !== null && _7 !== void 0 ? _7 : this[kGenerateRequestId](params, options)
            },
            name: this[kName],
            connection: null,
            attempts: 0,
            aborted: false
        };
        const returnMeta = (_8 = options.meta) !== null && _8 !== void 0 ? _8 : false;
        if (this[kContext] != null && options.context != null) {
            meta.context = Object.assign({}, this[kContext], options.context);
        }
        else if (this[kContext] !== null) {
            meta.context = this[kContext];
        }
        else if (options.context != null) {
            meta.context = options.context;
        }
        const result = {
            // the default body value can't be `null`
            // as it's a valid JSON value
            body: undefined,
            statusCode: 0,
            headers: {},
            meta,
            get warnings() {
                var _7;
                if (((_7 = this.headers) === null || _7 === void 0 ? void 0 : _7.warning) == null) {
                    return null;
                }
                const { warning } = this.headers;
                // if multiple HTTP headers have the same name, Undici represents them as an array
                const warnings = Array.isArray(warning) ? warning : [warning];
                return warnings
                    .flatMap(w => w.split(/(?!\B"[^"]*),(?![^"]*"\B)/))
                    .filter((warning) => warning.match(/^\d\d\d Elasticsearch-/));
            }
        };
        // We should not retry if we are sending a stream body, because we should store in memory
        // a copy of the stream to be able to send it again, but since we don't know in advance
        // the size of the stream, we risk to take too much memory.
        // Furthermore, copying every time the stream is very a expensive operation.
        const maxRetries = isStream((_9 = params.body) !== null && _9 !== void 0 ? _9 : params.bulkBody) ? 0 : (typeof options.maxRetries === 'number' ? options.maxRetries : this[kMaxRetries]);
        const compression = typeof options.compression === 'boolean' ? options.compression : this[kCompression];
        const signal = options.signal;
        const maxResponseSize = (_10 = options.maxResponseSize) !== null && _10 !== void 0 ? _10 : this[kMaxResponseSize];
        const maxCompressedResponseSize = (_11 = options.maxCompressedResponseSize) !== null && _11 !== void 0 ? _11 : this[kMaxCompressedResponseSize];
        const errorOptions = {
            redaction: typeof options.redaction === 'object' ? options.redaction : this[kRedaction]
        };
        this[kDiagnostic].emit('serialization', null, result);
        const headers = Object.assign({}, this[kHeaders], lowerCaseHeaders(options.headers));
        if (options.opaqueId !== undefined) {
            headers['x-opaque-id'] = typeof this[kOpaqueIdPrefix] === 'string'
                ? this[kOpaqueIdPrefix] + options.opaqueId // eslint-disable-line
                : options.opaqueId;
        }
        // handle json body
        if (params.body != null) {
            if (shouldSerialize(params.body)) {
                try {
                    connectionParams.body = this[kSerializer].serialize(params.body);
                }
                catch (err) {
                    this[kDiagnostic].emit('request', err, result);
                    throw err;
                }
                headers['content-type'] = (_12 = headers['content-type']) !== null && _12 !== void 0 ? _12 : this[kJsonContentType];
                headers.accept = (_13 = headers.accept) !== null && _13 !== void 0 ? _13 : this[kJsonContentType];
            }
            else {
                if (params.body !== '') {
                    headers['content-type'] = (_14 = headers['content-type']) !== null && _14 !== void 0 ? _14 : 'text/plain';
                    headers.accept = (_15 = headers.accept) !== null && _15 !== void 0 ? _15 : this[kAcceptHeader];
                }
                connectionParams.body = params.body;
            }
            // handle ndjson body
        }
        else if (params.bulkBody != null) {
            if (shouldSerialize(params.bulkBody)) {
                try {
                    connectionParams.body = this[kSerializer].ndserialize(params.bulkBody);
                }
                catch (err) {
                    this[kDiagnostic].emit('request', err, result);
                    throw err;
                }
            }
            else {
                connectionParams.body = params.bulkBody;
            }
            if (connectionParams.body !== '') {
                headers['content-type'] = (_16 = headers['content-type']) !== null && _16 !== void 0 ? _16 : this[kNdjsonContentType];
                headers.accept = (_17 = headers.accept) !== null && _17 !== void 0 ? _17 : this[kJsonContentType];
            }
        }
        // serializes the querystring
        if (options.querystring == null) {
            connectionParams.querystring = this[kSerializer].qserialize(params.querystring);
        }
        else {
            connectionParams.querystring = this[kSerializer].qserialize(Object.assign({}, params.querystring, options.querystring));
        }
        // handle compression
        if (connectionParams.body !== '' && connectionParams.body != null) {
            if (isStream(connectionParams.body)) {
                if (compression) {
                    headers['content-encoding'] = 'gzip';
                    connectionParams.body = connectionParams.body.pipe(createGzip());
                }
            }
            else if (compression) {
                try {
                    connectionParams.body = await gzip(connectionParams.body);
                }
                catch (err) {
                    /* istanbul ignore next */
                    this[kDiagnostic].emit('request', err, result);
                    /* istanbul ignore next */
                    throw err;
                }
                headers['content-encoding'] = 'gzip';
                headers['content-length'] = '' + Buffer.byteLength(connectionParams.body); // eslint-disable-line
            }
            else {
                headers['content-length'] = '' + Buffer.byteLength(connectionParams.body); // eslint-disable-line
            }
        }
        headers.accept = (_18 = headers.accept) !== null && _18 !== void 0 ? _18 : this[kAcceptHeader];
        // Set default content-type header for empty requests
        // Only set if no content-type is already specified and there's no body
        if (headers['content-type'] == null && (connectionParams.body == null || connectionParams.body === '')) {
            headers['content-type'] = 'application/json';
        }
        connectionParams.headers = headers;
        while (meta.attempts <= maxRetries) {
            // Capture start time for request duration tracking
            const startTime = process.hrtime.bigint();
            try {
                if (signal === null || signal === void 0 ? void 0 : signal.aborted) { // eslint-disable-line
                    throw new RequestAbortedError('Request has been aborted by the user', result, errorOptions);
                }
                meta.connection = this.getConnection({
                    requestId: meta.request.id,
                    context: meta.context
                });
                if (meta.connection === null) {
                    throw new NoLivingConnectionsError('There are no living connections', result, errorOptions);
                }
                // generate required OpenTelemetry attributes from the request URL
                const requestUrl = meta.connection.url;
                otelSpan === null || otelSpan === void 0 ? void 0 : otelSpan.setAttributes({
                    'url.full': requestUrl.toString(),
                    'server.address': requestUrl.hostname
                });
                if (requestUrl.port === '') {
                    if (requestUrl.protocol === 'https:') {
                        otelSpan === null || otelSpan === void 0 ? void 0 : otelSpan.setAttribute('server.port', 443);
                    }
                    else if (requestUrl.protocol === 'http:') {
                        otelSpan === null || otelSpan === void 0 ? void 0 : otelSpan.setAttribute('server.port', 80);
                    }
                }
                else {
                    const port = parseInt(requestUrl.port, 10);
                    if (!Number.isNaN(port))
                        otelSpan === null || otelSpan === void 0 ? void 0 : otelSpan.setAttribute('server.port', port);
                }
                this[kDiagnostic].emit('request', null, result);
                // set timeout defaults
                let timeout = (_20 = (_19 = options.requestTimeout) !== null && _19 !== void 0 ? _19 : this[kRequestTimeout]) !== null && _20 !== void 0 ? _20 : undefined;
                if (timeout != null)
                    timeout = toMs(timeout);
                // perform the actual http request
                let { statusCode, headers, body } = await meta.connection.request(connectionParams, {
                    requestId: meta.request.id,
                    name: this[kName],
                    context: meta.context,
                    maxResponseSize,
                    maxCompressedResponseSize,
                    signal,
                    timeout,
                    ...(options.asStream === true ? { asStream: true } : null)
                });
                result.statusCode = statusCode;
                result.headers = headers;
                otelSpan === null || otelSpan === void 0 ? void 0 : otelSpan.setAttribute('db.response.status_code', statusCode.toString());
                if (headers['x-found-handling-cluster'] != null) {
                    otelSpan === null || otelSpan === void 0 ? void 0 : otelSpan.setAttribute('db.namespace', headers['x-found-handling-cluster']);
                }
                if (headers['x-found-handling-instance'] != null) {
                    otelSpan === null || otelSpan === void 0 ? void 0 : otelSpan.setAttribute('elasticsearch.node.name', headers['x-found-handling-instance']);
                }
                // Execute middleware onResponse phase (handles product check)
                const middlewareContext = {
                    request: {
                        method: connectionParams.method,
                        path: connectionParams.path,
                        body: connectionParams.body,
                        querystring: connectionParams.querystring,
                        headers
                    },
                    params,
                    options,
                    meta: {
                        requestId: meta.request.id,
                        name: this[kName],
                        context: meta.context,
                        connection: meta.connection,
                        attempts: meta.attempts
                    }
                };
                this[kMiddlewareEngine].executePhase('onResponse', middlewareContext, result);
                if (options.asStream === true) {
                    result.body = body;
                    // Calculate request duration in milliseconds
                    const endTime = process.hrtime.bigint();
                    meta.duration = Number(endTime - startTime) / 1e6;
                    this[kDiagnostic].emit('response', null, result);
                    return returnMeta ? result : body;
                }
                const contentEncoding = ((_21 = headers['content-encoding']) !== null && _21 !== void 0 ? _21 : '').toLowerCase();
                if (contentEncoding.includes('gzip') || contentEncoding.includes('deflate')) {
                    body = await unzip(body);
                }
                if (Buffer.isBuffer(body) && !isBinary((_22 = headers['content-type']) !== null && _22 !== void 0 ? _22 : '')) {
                    body = body.toString();
                }
                const isHead = params.method === 'HEAD';
                // we should attempt the payload deserialization only if:
                //    - a `content-type` is defined and is equal to `application/json`
                //    - the request is not a HEAD request
                //    - the payload is not an empty string
                if (headers['content-type'] !== undefined &&
                    (((_23 = headers['content-type']) === null || _23 === void 0 ? void 0 : _23.includes('application/json')) ||
                        ((_24 = headers['content-type']) === null || _24 === void 0 ? void 0 : _24.includes('application/vnd.elasticsearch+json'))) &&
                    !isHead && body !== '') { // eslint-disable-line
                    result.body = this[kSerializer].deserialize(body);
                }
                else {
                    // cast to boolean if the request method was HEAD and there was no error
                    result.body = isHead && statusCode < 400 ? true : body;
                }
                // we should ignore the statusCode if the user has configured the `ignore` field with
                // the statusCode we just got or if the request method is HEAD and the statusCode is 404
                const ignoreStatusCode = (Array.isArray(options.ignore) && options.ignore.includes(statusCode)) ||
                    (isHead && statusCode === 404);
                if (!ignoreStatusCode && (statusCode === 502 || statusCode === 503 || statusCode === 504)) {
                    // if the statusCode is 502/3/4 we should run our retry strategy
                    // and mark the connection as dead
                    this[kConnectionPool].markDead(meta.connection);
                    // retry logic
                    if (meta.attempts < maxRetries) {
                        meta.attempts++;
                        debug(`Retrying request, there are still ${maxRetries - meta.attempts} attempts`, params);
                        continue;
                    }
                }
                else {
                    // everything has worked as expected, let's mark
                    // the connection as alive (or confirm it)
                    this[kConnectionPool].markAlive(meta.connection);
                }
                if (!ignoreStatusCode && statusCode >= 400) {
                    throw new ResponseError(result, errorOptions);
                }
                else {
                    // cast to boolean if the request method was HEAD
                    if (isHead && statusCode === 404) {
                        result.body = false;
                    }
                    // Calculate request duration in milliseconds
                    const endTime = process.hrtime.bigint();
                    meta.duration = Number(endTime - startTime) / 1e6;
                    this[kDiagnostic].emit('response', null, result);
                    return returnMeta ? result : result.body;
                }
            }
            catch (error) {
                // Calculate request duration in milliseconds
                const endTime = process.hrtime.bigint();
                meta.duration = Number(endTime - startTime) / 1e6;
                switch (error.name) {
                    // should not retry
                    case 'ProductNotSupportedError':
                    case 'NoLivingConnectionsError':
                    case 'DeserializationError':
                    case 'ResponseError':
                        this[kDiagnostic].emit('response', error, result);
                        throw error;
                    case 'RequestAbortedError': {
                        meta.aborted = true;
                        // Wrap the error to get a clean stack trace
                        const wrappedError = new RequestAbortedError(error.message, result, errorOptions);
                        this[kDiagnostic].emit('response', wrappedError, result);
                        throw wrappedError;
                    }
                    // should maybe retry
                    // @ts-expect-error `case` fallthrough is intentional: should retry if retryOnTimeout is true
                    case 'TimeoutError':
                        if (!this[kRetryOnTimeout]) {
                            const wrappedError = new TimeoutError(error.message, result, errorOptions);
                            this[kDiagnostic].emit('response', wrappedError, result);
                            throw wrappedError;
                        }
                    // should retry
                    // eslint-disable-next-line no-fallthrough
                    case 'ConnectionError': {
                        // if there is an error in the connection
                        // let's mark the connection as dead
                        this[kConnectionPool].markDead(meta.connection);
                        if (this[kSniffOnConnectionFault]) {
                            this.sniff({
                                reason: Transport.sniffReasons.SNIFF_ON_CONNECTION_FAULT,
                                requestId: meta.request.id,
                                context: meta.context
                            });
                        }
                        // retry logic
                        if (meta.attempts < maxRetries) {
                            meta.attempts++;
                            debug(`Retrying request, there are still ${maxRetries - meta.attempts} attempts`, params);
                            // don't use exponential backoff until retrying on each node
                            if (meta.attempts >= this[kConnectionPool].size) {
                                // exponential backoff on retries, with jitter
                                const backoff = (_25 = options.retryBackoff) !== null && _25 !== void 0 ? _25 : this[kRetryBackoff];
                                const backoffWait = backoff(0, 4, meta.attempts);
                                if (backoffWait > 0) {
                                    await setTimeout(backoffWait * 1000);
                                }
                            }
                            continue;
                        }
                        // Wrap the error to get a clean stack trace
                        const wrappedError = error.name === 'TimeoutError'
                            ? new TimeoutError(error.message, result, errorOptions)
                            : new ConnectionError(error.message, result, errorOptions);
                        this[kDiagnostic].emit('response', wrappedError, result);
                        throw wrappedError;
                    }
                    // edge cases, such as bad compression
                    default:
                        this[kDiagnostic].emit('response', error, result);
                        throw error;
                }
            }
        }
        return returnMeta ? result : result.body;
    }
    async request(params, options = {}) {
        var _7, _8, _9, _10, _11, _12;
        const otelOptions = Object.assign({}, this[kOtelOptions], (_7 = options.openTelemetry) !== null && _7 !== void 0 ? _7 : {});
        // wrap in OpenTelemetry span
        if (((_8 = otelOptions === null || otelOptions === void 0 ? void 0 : otelOptions.enabled) !== null && _8 !== void 0 ? _8 : true) && ((_9 = params.meta) === null || _9 === void 0 ? void 0 : _9.name) != null) {
            let context = opentelemetry.context.active();
            if ((_10 = otelOptions.suppressInternalInstrumentation) !== null && _10 !== void 0 ? _10 : false) {
                context = suppressTracing(context);
            }
            // gather OpenTelemetry attributes
            const attributes = {
                'db.system': 'elasticsearch',
                'http.request.method': params.method,
                'db.operation.name': (_11 = params.meta) === null || _11 === void 0 ? void 0 : _11.name
            };
            // add path params as otel attributes
            if (((_12 = params.meta) === null || _12 === void 0 ? void 0 : _12.pathParts) != null) {
                for (const [key, value] of Object.entries(params.meta.pathParts)) {
                    if (value == null)
                        continue;
                    attributes[`db.operation.parameter.${key}`] = value.toString();
                    if (['index', '_index', 'indices'].includes(key)) {
                        let indices = [];
                        if (typeof value === 'string') {
                            indices.push(value);
                        }
                        else if (Array.isArray(value)) {
                            indices = indices.concat(value.map(v => v.toString()));
                        }
                        else if (typeof value === 'object') {
                            try {
                                const keys = Object.keys(value);
                                indices = indices.concat(keys.map(v => v.toString()));
                            }
                            catch {
                                // ignore
                            }
                        }
                        if (indices.length > 0)
                            attributes['db.collection.name'] = indices.join(', ');
                    }
                }
            }
            return await this[kOtelTracer].startActiveSpan(params.meta.name, { attributes, kind: SpanKind.CLIENT }, context, async (otelSpan) => {
                var _7;
                let response;
                try {
                    response = await this._request(params, options, otelSpan);
                }
                catch (err) {
                    otelSpan.recordException(err);
                    otelSpan.setStatus({ code: SpanStatusCode.ERROR });
                    otelSpan.setAttribute('error.type', (_7 = err.name) !== null && _7 !== void 0 ? _7 : 'Error');
                    throw err;
                }
                finally {
                    otelSpan.end();
                }
                return response;
            });
        }
        else {
            return await this._request(params, options);
        }
    }
    getConnection(opts) {
        const now = Date.now();
        if (this[kSniffEnabled] && now > this[kNextSniff]) {
            this[kNextSniff] = now + this[kSniffInterval];
            this.sniff({
                reason: Transport.sniffReasons.SNIFF_INTERVAL,
                requestId: opts.requestId,
                context: opts.context
            });
        }
        return this[kConnectionPool].getConnection({
            filter: this[kNodeFilter],
            selector: this[kNodeSelector],
            requestId: opts.requestId,
            name: this[kName],
            context: opts.context,
            now
        });
    }
    /* istanbul ignore next */
    sniff(opts) { }
}
_a = kNodeFilter, _b = kNodeSelector, _c = kHeaders, _d = kDiagnostic, _e = kConnectionPool, _f = kSerializer, _g = kContext, _h = kGenerateRequestId, _j = kOpaqueIdPrefix, _k = kName, _l = kMaxRetries, _m = kCompression, _o = kRequestTimeout, _p = kRetryOnTimeout, _q = kSniffEnabled, _r = kNextSniff, _s = kIsSniffing, _t = kSniffInterval, _u = kSniffOnConnectionFault, _v = kSniffEndpoint, _w = kProductCheck, _x = kMaxResponseSize, _y = kMaxCompressedResponseSize, _z = kJsonContentType, _0 = kNdjsonContentType, _1 = kAcceptHeader, _2 = kRedaction, _3 = kRetryBackoff, _4 = kOtelTracer, _5 = kOtelOptions, _6 = kMiddlewareEngine;
Object.defineProperty(Transport, "sniffReasons", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: {
        SNIFF_ON_START: 'sniff-on-start',
        SNIFF_INTERVAL: 'sniff-interval',
        SNIFF_ON_CONNECTION_FAULT: 'sniff-on-connection-fault',
        DEFAULT: 'default'
    }
});
export default Transport;
function toMs(time) {
    if (typeof time === 'string') {
        return ms(time);
    }
    return time;
}
function shouldSerialize(obj) {
    return typeof obj !== 'string' &&
        typeof obj.pipe !== 'function' &&
        !Buffer.isBuffer(obj);
}
function isStream(obj) {
    return obj != null && typeof obj.pipe === 'function';
}
function defaultNodeFilter(node) {
    return true;
}
function roundRobinSelector() {
    let current = -1;
    return function _roundRobinSelector(connections) {
        if (++current >= connections.length) {
            current = 0;
        }
        return connections[current];
    };
}
export function generateRequestId() {
    const maxInt = 2147483647;
    let nextReqId = 0;
    return function genReqId(params, options) {
        return (nextReqId = (nextReqId + 1) & maxInt);
    };
}
export function lowerCaseHeaders(oldHeaders) {
    if (oldHeaders == null)
        return null;
    const newHeaders = {};
    for (const header in oldHeaders) {
        // @ts-expect-error
        newHeaders[header.toLowerCase()] = oldHeaders[header];
    }
    return newHeaders;
}
/**
 * Function for calculating how long to sleep, in seconds, before the next request retry
 * Uses the AWS "equal jitter" algorithm noted in this post:
 * https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
 * @param min The minimum number of seconds to wait
 * @param max The maximum number of seconds to wait
 * @param attempt How many retry attempts have been made
 * @returns The number of seconds to wait before the next retry
 */
function retryBackoff(min, max, attempt) {
    const ceiling = Math.min(max, 2 ** attempt) / 2;
    return ceiling + ((Math.random() * (ceiling - min)) + min);
}
//# sourceMappingURL=Transport.js.map