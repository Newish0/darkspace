import { TZDate } from "@date-fns/tz";
import { BASE_URL } from "../url";
import { htmlToDocument } from "../util";
import { DEFAULT_TIMEZONE, getTimezone } from "../timezone";

// Types
export interface IAnnouncement {
    html: string;
    title?: string;
    dateTime?: Date;
}

// Constants
const URL_CONFIG = {
    COURSE_ANNOUNCEMENTS: `${BASE_URL}/d2l/lms/news/main.d2l?ou={{CLASS_ID}}`,
};

const SELECTORS = {
    ANNOUNCEMENTS: {
        MAIN: "#RT_Body > d2l-html-block",
    },
};

/**
 * Fetches the course announcements from Brightspace
 * @param courseId The course ID in Brightspace
 * @returns An array of IAnnouncement objects.
 * @warning html is not sanitized.
 *
 */
export async function getCourseAnnouncements(courseId: string): Promise<IAnnouncement[]> {
    const htmlString = await fetch(
        URL_CONFIG.COURSE_ANNOUNCEMENTS.replace("{{CLASS_ID}}", courseId)
    ).then((res) => res.text());
    const doc = htmlToDocument(htmlString, false);

    const timezone = (await getTimezone()) || DEFAULT_TIMEZONE;

    /**
     * The following code assumes that the HTML structure of the page is as follows:
     * <tr>
     *     <td>
     *         <a>Announcement Title</a>
     *     </td>
     *     <td>
     *         <label>Announcement Date and Time</label>
     *     </td>
     * </tr>
     * <tr>
     *     <td>
     *         <d2l-html-block html="announcement HTML content">
     *     </td>
     * </tr>
     */
    return Array.from(doc.querySelectorAll(SELECTORS.ANNOUNCEMENTS.MAIN)).map((eln) => {
        const html = eln.getAttribute("html");
        const currentRow = eln.closest("tr"); // closest <tr> parent that contains the current element
        const previousRow = currentRow?.previousElementSibling; // the previous <tr> tag
        const title = previousRow?.querySelector("a")?.textContent;
        const sysDateTime = previousRow?.querySelector("label")?.textContent;

        const dateTime = sysDateTime ? new TZDate(sysDateTime, timezone) : undefined;

        const announcement: IAnnouncement = {
            html: html || "",
            title: title || undefined,
            dateTime,
        };

        return announcement;
    });
}
