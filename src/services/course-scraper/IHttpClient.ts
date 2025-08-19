// IHttpClient.ts
export interface IHttpClient {
    get(url: string, options?: RequestOptions): Promise<Response>;
    post(url: string, body: any, options?: RequestOptions): Promise<Response>;
}

export enum ResponseType {
    Text,
    JSON,
}

type Headers = {
    host?: string;
    "User-Agent"?: string;
    referer?: string;
    "set-cookie"?: string | string[];
    [key: string]: string | string[] | undefined;
};

export interface RequestOptions {
    headers?: Headers;
    timeout?: number;
    responseType?: ResponseType;
}

export interface Response {
    data: any;
    rawHeaders?: Headers;
}
