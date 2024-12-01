import { getBaseDocument } from "./base-doc";
import { BASE_URL } from "./url";

export const DEFAULT_TIMEZONE = "America/Vancouver";

/**
 * Cached timezone string, initialized as null.
 * Used to store and reuse the timezone identifier extracted from the base document.
 */
let timezone: string | null = null;

/**
 * Retrieves the timezone identifier from the base document.
 * The document is fetched from the provided URL or the default BASE_URL.
 * @param {string} [baseUrl=BASE_URL] The URL to fetch the base document from.
 * @returns {Promise<string | null>} The timezone identifier or null if not found.
 */
export async function getTimezone(baseUrl: string = BASE_URL): Promise<string | null> {
    if (timezone) {
        return timezone;
    }

    const baseDoc = await getBaseDocument(baseUrl);

    const tzIdObj = baseDoc.querySelector("html")?.getAttribute("data-timezone");

    const tzId = tzIdObj ? JSON.parse(tzIdObj).identifier : null;

    if (tzId) timezone = tzId;

    return tzId;
}
