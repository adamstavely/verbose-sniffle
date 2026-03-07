import { Transport, TransportRequestOptions, TransportRequestOptionsWithMeta, TransportRequestOptionsWithOutMeta, TransportResult } from '@elastic/transport';
import * as T from '../types.js';
import { kAcceptedParams } from '../../symbols.js';
interface That {
    transport: Transport;
    [kAcceptedParams]: Record<string, {
        path: string[];
        body: string[];
        query: string[];
    }>;
}
export default class Project {
    transport: Transport;
    [kAcceptedParams]: Record<string, {
        path: string[];
        body: string[];
        query: string[];
    }>;
    constructor(transport: Transport);
    /**
      * Get tags. Get the tags that are defined for the project.
      * @see {@link https://www.elastic.co/docs/api/doc/elasticsearch-serverless/operation/operation-project-tags | Elasticsearch API documentation}
      */
    tags(this: That, params?: T.ProjectTagsRequest, options?: TransportRequestOptionsWithOutMeta): Promise<T.ProjectTagsResponse>;
    tags(this: That, params?: T.ProjectTagsRequest, options?: TransportRequestOptionsWithMeta): Promise<TransportResult<T.ProjectTagsResponse, unknown>>;
    tags(this: That, params?: T.ProjectTagsRequest, options?: TransportRequestOptions): Promise<T.ProjectTagsResponse>;
}
export {};
//# sourceMappingURL=project.d.ts.map