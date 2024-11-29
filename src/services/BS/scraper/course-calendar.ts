import { BASE_URL } from "../url";
import { getSearchParam, htmlToDocument } from "../util";

const URL_CONFIG = {
    CALENDAR_SUB_URL: `${BASE_URL}/d2l/le/calendar/6606/subscribe/subscribeDialogLaunch?subscriptionOptionId=-1`,
    FEED_URL: `${BASE_URL}/d2l/le/calendar/feed/user/feed.ics?token={{TOKEN}}`,
};

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
    const res = await fetch(URL_CONFIG.CALENDAR_SUB_URL);

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

    let url = URL_CONFIG.FEED_URL.replace("{{TOKEN}}", token);

    if (courseId) {
        url += `&feedOU=${courseId}`;
    }

    return url;
}

export async function getICS(courseId?: string) {
    const url = await getCalendarFeedUrl(courseId);
    const res = await fetch(url);

    if (!res.ok) {
        throw new Error(`Failed to fetch calendar feed: ${res.statusText}`);
    }

    return res.text();
}
