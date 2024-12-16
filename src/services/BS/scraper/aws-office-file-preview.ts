import { buildContentViewUrl } from "../url";
import { htmlToDocument } from "../util";

function extractOfficeFilePreviewUrl(html: string): string | null {
    const doc = htmlToDocument(html);
    const previewUrl = doc.querySelector("[data-location]")?.getAttribute("data-location");
    return previewUrl ?? null;
}

export async function getOfficeFilePreviewUrl(
    courseId: string,
    topicId: string
): Promise<string | null> {
    const url = buildContentViewUrl(courseId, topicId);

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch office file preview URL: ${res.statusText}`);
    }
    const html = await res.text();

    return extractOfficeFilePreviewUrl(html);
}
