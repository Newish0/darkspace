import { BASE_URL } from "./url";

let baseDocument: Document | null = null;
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
