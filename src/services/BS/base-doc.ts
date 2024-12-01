import { BASE_URL } from "./url";

/**
 * Cached base Document object, initialized as null.
 * Used to store and reuse the HTML document fetched from a URL.
 */
let baseDocument: Document | null = null;

/**
 * Retrieves the base document for the given URL.
 * The base document is cached for the entire runtime of the app.
 * @param {string} [baseUrl=BASE_URL] The URL to fetch the base document from.
 * @returns {Promise<Document>} The HTML document.
 */
export async function getBaseDocument(baseUrl = BASE_URL): Promise<Document> {
    if (baseDocument) {
        return baseDocument;
    }

    const url = baseUrl;
    const res = await fetch(url);

    if (!res.ok) {
        throw new Error(`Failed to fetch base document: ${res.statusText}`);
    }

    const domParser = new DOMParser();
    baseDocument = domParser.parseFromString(await res.text(), "text/html");

    return baseDocument;
}
