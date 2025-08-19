// ExtensionFetchHttpClient.ts
import { IHttpClient, RequestOptions, Response, ResponseType } from "./IHttpClient";
import browser from "webextension-polyfill";

/**
 * HTTP client implementation using the Fetch API
 */
export class ExtensionFetchHttpClient implements IHttpClient {
    private static readonly DEFAULT_TIMEOUT_SECONDS = 30;

    /**
     * Performs a GET request
     */
    async get(url: string, options?: RequestOptions): Promise<Response> {
        return this.makeRequest(url, "GET", undefined, options);
    }

    /**
     * Performs a POST request
     */
    async post(url: string, body: any, options?: RequestOptions): Promise<Response> {
        return this.makeRequest(url, "POST", body, options);
    }

    /**
     * Core request method
     */
    private async makeRequest(
        url: string,
        method: string,
        body?: any,
        options?: RequestOptions
    ): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = this.setupTimeout(controller, options?.timeout);
        const domain = new URL(url).hostname;

        try {
            const fetchResponse = await fetch(url, {
                method,
                headers: this.buildHeaders(method, body, options?.headers),
                body: this.serializeBody(body),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            this.validateResponse(fetchResponse);

            const data = await this.parseResponse(fetchResponse, options?.responseType);
            const rawHeaders = this.extractHeaders(fetchResponse);

            // HACK: Retrieve cookies from browser
            const cookies = await browser.cookies.getAll({ domain });
            const rawCookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
            rawHeaders["set-cookie"] = rawCookieHeader;

            return { data, rawHeaders };
        } catch (error) {
            clearTimeout(timeoutId);
            throw this.handleError(error, options?.timeout);
        }
    }

    /**
     * Sets up request timeout
     */
    private setupTimeout(
        controller: AbortController,
        timeout?: number
    ): ReturnType<typeof setTimeout> {
        const timeoutMs = (timeout ?? ExtensionFetchHttpClient.DEFAULT_TIMEOUT_SECONDS) * 1000;
        return setTimeout(() => controller.abort(), timeoutMs);
    }

    /**
     * Builds request headers
     */
    private buildHeaders(
        method: string,
        body: any,
        headers?: Record<string, string | string[] | undefined>
    ): HeadersInit {
        const result: HeadersInit = {};

        if (headers) {
            Object.entries(headers).forEach(([key, value]) => {
                if (value !== undefined) {
                    result[key] = Array.isArray(value) ? value.join(", ") : value;
                }
            });
        }

        // Auto-set JSON content type for POST with object body
        if (method === "POST" && body && typeof body === "object" && !(body instanceof FormData)) {
            const hasContentType = Object.keys(result).some(
                (key) => key.toLowerCase() === "content-type"
            );
            if (!hasContentType) {
                result["Content-Type"] = "application/json";
            }
        }

        return result;
    }

    /**
     * Serializes request body
     */
    private serializeBody(body: any): string | FormData | undefined {
        if (body === undefined) return undefined;
        if (body instanceof FormData) return body;
        if (typeof body === "object") return JSON.stringify(body);
        return String(body);
    }

    /**
     * Validates HTTP response status
     */
    private validateResponse(response: globalThis.Response): void {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    }

    /**
     * Parses response based on type
     */
    private async parseResponse(
        response: globalThis.Response,
        responseType?: ResponseType
    ): Promise<any> {
        if (responseType === ResponseType.Text) {
            return await response.text();
        }

        try {
            return await response.json();
        } catch (error) {
            // Ignore JSON parse errors
        }

        return await response.text();
    }

    /**
     * Extracts response headers
     */
    private extractHeaders(response: globalThis.Response): Record<string, string | string[]> {
        const headers: Record<string, string | string[]> = {};

        for (const [key, value] of response.headers.entries()) {
            const lowerCaseKey = key.toLowerCase();
            if (headers[lowerCaseKey] === undefined) {
                headers[lowerCaseKey] = value;
            } else {
                headers[lowerCaseKey] = Array.isArray(headers[lowerCaseKey])
                    ? [...headers[lowerCaseKey], value]
                    : [headers[lowerCaseKey], value];
            }
        }

        return headers;
    }

    /**
     * Handles and transforms errors
     */
    private handleError(error: unknown, timeout?: number): Error {
        if (error instanceof Error && error.name === "AbortError") {
            const timeoutSec = timeout ?? ExtensionFetchHttpClient.DEFAULT_TIMEOUT_SECONDS;
            return new Error(`Request timeout after ${timeoutSec}s`);
        }
        return error instanceof Error ? error : new Error(String(error));
    }
}
