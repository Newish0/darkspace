// ======= Utility Functions =======

import DOMPurify from "dompurify";

const D2L_PARTIAL_WHILE1 = "while(1);";

export function htmlToDocument(unsafeHtml: string, sanitize = false): Document {
    const parser = new DOMParser();
    const sanitizedHtml = sanitize ? DOMPurify.sanitize(unsafeHtml) : unsafeHtml;
    return parser.parseFromString(sanitizedHtml, "text/html");
}

export function parseD2LPartial(d2lPartial: string): any {
    if (!d2lPartial.startsWith(D2L_PARTIAL_WHILE1)) {
        throw new Error("Failed to parse Lit partial: while(1) not found");
    }
    return JSON.parse(d2lPartial.substring(D2L_PARTIAL_WHILE1.length));
}

/**
 * Extracts the value of a specified search parameter from a URL.
 * @param {string} url - The URL to extract the parameter from.
 * @param {string} paramName - The name of the parameter to retrieve.
 * @returns {string | null} - The value of the parameter, or null if not found.
 * @description
 * This function extracts the value of a specified search parameter from a URL.
 * It is used to parse the query string of a URL and retrieve the value of a
 * given parameter.
 * @example
 * const url = "https://example.com/?param1=value1&param2=value2";
 * const paramValue = getSearchParam(url, "param1");
 * console.log(paramValue); // "value1"
 */
export function getSearchParam(url: string, paramName: string): string | null {
    // Decode the URL in case it contains HTML-encoded entities
    const decodedUrl = decodeURIComponent(url);
    // Parse the query string using URLSearchParams
    const urlParams = new URLSearchParams(decodedUrl.split("?")[1]);
    return urlParams.get(paramName);
}
