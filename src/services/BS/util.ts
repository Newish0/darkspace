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
