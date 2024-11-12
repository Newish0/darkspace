let baseDocument: Document | null = null;
export async function getBaseDocument(): Promise<Document> {
    if (baseDocument) {
        return baseDocument;
    }

    const url = "https://bright.uvic.ca/";
    const res = await fetch(url);

    if (!res.ok) {
        throw new Error(`Failed to fetch base document: ${res.statusText}`);
    }

    const domParser = new DOMParser();
    baseDocument = domParser.parseFromString(await res.text(), "text/html");

    return baseDocument;
}
