import { buildCalendarSubUrl, buildCalendarFeedUrl } from "../url";
import { getSearchParam, htmlToDocument } from "../util";

const SELECTORS = {
    FEED_URL_CONTAINER: ".subscribe-feed-url-partial-container",
};

function extractCalendarFeedToken(html: string) {
    const doc = htmlToDocument(html);
    const container = doc.querySelector(SELECTORS.FEED_URL_CONTAINER);
    const url = container?.textContent;

    if (!url) {
        return null;
    }

    const token = getSearchParam(url, "token");
    return token;
}

async function getCalendarFeedToken() {
    const res = await fetch(buildCalendarSubUrl());

    if (!res.ok) {
        throw new Error(`Failed to fetch calendar feed token: ${res.statusText}`);
    }

    const html = await res.text();
    return extractCalendarFeedToken(html);
}

async function getCalendarFeedUrl(courseId?: string) {
    const token = await getCalendarFeedToken();

    if (!token) {
        throw new Error("Failed to get calendar feed token");
    }

    return buildCalendarFeedUrl(token, courseId);
}

export async function getICS(courseId?: string) {
    const url = await getCalendarFeedUrl(courseId);
    const res = await fetch(url);

    if (!res.ok) {
        throw new Error(`Failed to fetch calendar feed: ${res.statusText}`);
    }

    return res.text();
}
