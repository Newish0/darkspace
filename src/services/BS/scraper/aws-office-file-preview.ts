import { BASE_URL } from "../url";
import { htmlToDocument } from "../util";

const URL_TEMPLATE = `${BASE_URL}/d2l/le/content/{{COURSE_ID}}/viewContent/{{TOPIC_ID}}/View`;

function getContentViewUrl(courseId: string, topicId: string): string {
    const url = URL_TEMPLATE.replace("{{COURSE_ID}}", courseId).replace("{{TOPIC_ID}}", topicId);
    return url;
}

function extractOfficeFilePreviewUrl(html: string): string | null {
    const doc = htmlToDocument(html);
    const previewUrl = doc.querySelector("[data-location]")?.getAttribute("data-location");
    return previewUrl ?? null;
}

export async function getOfficeFilePreviewUrl(
    courseId: string,
    topicId: string
): Promise<string | null> {
    const url = getContentViewUrl(courseId, topicId);

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch office file preview URL: ${res.statusText}`);
    }
    const html = await res.text();

    return extractOfficeFilePreviewUrl(html);
}
