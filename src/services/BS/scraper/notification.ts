import { getAsyncCached, setAsyncCached } from "@/hooks/async-cached";
import { CourseContent, getUnstableCourseContent, UnstableModule } from "../api/unstable-module";
import { buildActivityFeedUrl, buildActivityFeedCheckUrl, buildFullUrl, remapD2LUrl } from "../url";
import { getSearchParam, parseD2LPartial } from "../util";
import { IModule } from "./course-modules";

// Interfaces for the parsed data
export interface INotification {
    type: "announcement" | "content" | "grade" | "feedback" | "assignment" | "unknown";
    title: string;
    course: string;
    link: string;
    timestamp: string; // This timestamp is in ISO format (timezone included).
    details?: IGradeDetails;
    icon?: string;
}

export interface IGradeDetails {
    score: number;
    total: number;
    percentage: number;
    weightedScore: number;
    weightedTotal: number;
}

interface FetchOptions {
    timestamp?: string;
    previousNotifications?: INotification[];
}

type SubscriptionCallback = (hasUpdates: boolean) => void;
type UnsubscribeFn = () => void;

/**
 * @example
 * // Create fetcher instance for a specific course
 * const fetcher = D2LActivityFeedFetcher.create('360474');
 *
 * try {
 *   // Get initial feed
 *   const initialNotifications = await fetcher.getMoreFeed();
 *   console.log('Initial notifications:', initialNotifications);
 *
 *   // Load more by passing the last timestamp
 *   const lastTimestamp = initialNotifications.at(-1)?.timestamp;
 *   if (lastTimestamp) {
 *     const moreNotifications = await fetcher.getMoreFeed({ timestamp: lastTimestamp });
 *     console.log('Additional notifications:', moreNotifications);
 *   }
 * } catch (error) {
 *   console.error('Error fetching feed:', error);
 * }
 */
export class D2LActivityFeedFetcher {
    private baseUrl: string;
    private courseId: string;
    private category: number;
    private updateSubscriptions: Set<SubscriptionCallback> = new Set();
    private alreadyPolling = false;
    private pollingInterval = 60 * 1000; // 1 minute

    /**
     * Internal map to store the fetcher instances, keyed by the course ID and category.
     * This is used to reuse the same fetcher instance for multiple calls to {@link create}.
     */
    private static fetcherStore = new Map<string, D2LActivityFeedFetcher>();

    /**
     * Returns a string that can be used as a key to identify a fetcher instance in the internal store.
     * The key is composed of the course ID and category, separated by a hyphen.
     * @param courseId - The course ID
     * @param category - The category
     * @returns A string key to identify the fetcher instance
     */
    private static getFetcherKey(courseId: string, category: number): string {
        return `${courseId}-${category}`;
    }

    public static create(
        courseId: string,
        category: number = 1,
        baseUrl: string = "https://bright.uvic.ca"
    ): D2LActivityFeedFetcher {
        const fetcherKey = D2LActivityFeedFetcher.getFetcherKey(courseId, category);

        if (D2LActivityFeedFetcher.fetcherStore.has(fetcherKey)) {
            return D2LActivityFeedFetcher.fetcherStore.get(fetcherKey)!;
        } else {
            const fetcher = new D2LActivityFeedFetcher(courseId, category, baseUrl);
            D2LActivityFeedFetcher.fetcherStore.set(fetcherKey, fetcher);
            return fetcher;
        }
    }

    private constructor(
        courseId: string,
        category: number = 1,
        baseUrl: string = "https://bright.uvic.ca"
    ) {
        this.baseUrl = baseUrl;
        this.courseId = courseId;
        this.category = category;
    }

    /**
     * Fetches and returns feed data. Can optionally use a timestamp or previous notifications
     * to determine what data to fetch next.
     * @param options Optional parameters including timestamp or previous notifications
     * @returns Promise resolving to an array of new notifications
     */
    async getMoreFeed(options: FetchOptions = {}): Promise<INotification[]> {
        // Determine the timestamp to use
        const timestamp =
            options.timestamp ??
            options.previousNotifications?.at(-1)?.timestamp ??
            new Date().toISOString();

        const response = await this.fetchFeed(
            timestamp === new Date().toISOString() ? "GetAlertsDaylight" : "GetMoreAlerts",
            timestamp
        );

        const d2lPartial = await response.text();
        const html = parseD2LPartial(d2lPartial)?.Payload?.Html || "";

        return await parseD2LNotifications(html);
    }

    /**
     * Marks all notifications as read. Returns true on success, false if the request fails.
     */
    async markAllAsRead(): Promise<boolean> {
        const response = await this.fetchFeed("GetAlertsDaylight", new Date().toISOString());
        return response.ok;
    }

    /**
     * Checks if there are new notifications. Returns true if there are updates, false otherwise.
     */
    async checkForUpdates(): Promise<boolean> {
        const urlParams = new URLSearchParams({
            isXhr: "true",
            requestId: Math.floor(Math.random() * 1000).toString(),
        });

        const url = buildActivityFeedCheckUrl(urlParams);

        return fetch(url, {
            headers: {
                Accept: "application/json",
                "X-Requested-With": "XMLHttpRequest",
            },
        })
            .then((res) => res.text())
            .then(parseD2LPartial)
            .then((json) => !!json.Payload);
    }

    /**
     * Starts a polling loop to check for new notifications.
     */
    private startPolling() {
        const pollingLoop = async () => {
            const hasUpdates = await this.checkForUpdates();
            if (hasUpdates) {
                this.updateSubscriptions.forEach((callback) => callback(hasUpdates));
            }

            if (this.updateSubscriptions.size > 0) {
                setTimeout(pollingLoop, this.pollingInterval);
            } else {
                this.alreadyPolling = false;
            }
        };

        this.alreadyPolling = true;
        setTimeout(pollingLoop, this.pollingInterval);
        pollingLoop();
    }

    /**
     * Subscribes to update notifications. Returns a function to unsubscribe.
     * @param callback Function to call when new notifications are available
     */
    subscribeToUpdates(callback: SubscriptionCallback): UnsubscribeFn {
        this.updateSubscriptions.add(callback);

        if (!this.alreadyPolling) {
            this.startPolling();
        }

        return () => this.updateSubscriptions.delete(callback);
    }

    /**
     * Fetches the activity feed from the specified endpoint.
     * @param endpoint The endpoint to fetch data from
     * @param timestamp The timestamp to use for fetching more alerts
     */
    private async fetchFeed(
        endpoint: "GetAlertsDaylight" | "GetMoreAlerts",
        timestamp: string
    ): Promise<Response> {
        const urlParams = new URLSearchParams({
            Category: this.category.toString(),
            isXhr: "true",
            requestId: Math.floor(Math.random() * 1000).toString(),
            _d2l_prc$headingLevel: "2",
            _d2l_prc$scope: "",
            _d2l_prc$hasActiveForm: "false",
        });

        if (endpoint === "GetMoreAlerts") {
            urlParams.append("LastMessage", timestamp);
            urlParams.append("_d2l_prc$validClassNames", "d2l-datalist-item-placeholder");
            urlParams.append("_d2l_prc$validClassNames", "d2l-datalist-simpleitem");
        }

        const url = buildActivityFeedUrl(this.courseId, endpoint, urlParams);

        return fetch(url, {
            headers: {
                Accept: "application/json",
                "X-Requested-With": "XMLHttpRequest",
            },
        });
    }
}

/**
 * Determines notification type based on icon and content
 * @param iconElement The d2l-icon element
 * @param courseText The course text containing type information
 * @returns The notification type
 */
function determineNotificationType(
    iconElement: Element | null,
    courseText: string
): INotification["type"] {
    // First try to determine from icon
    const iconType = iconElement?.getAttribute("icon")?.split(":")[1];
    switch (iconType) {
        case "news":
            return "announcement";
        case "grade":
            return "grade";
        case "file-document":
            return "content";
        case "feedback":
            return "feedback";
        case "assignments":
            return "assignment";
        default:
            break;
    }

    // Fallback to text-based detection
    // NOTE: Use course text as fallback instead of `div.d2l-textblock.d2l-offscreen`
    //       because the `d2l-offscreen` does not distinguish between feedback and assignments
    if (courseText.startsWith("Announcement")) return "announcement";
    if (courseText.startsWith("Grade")) return "grade";
    if (courseText.startsWith("Content")) return "content";
    if (courseText.startsWith("Feedback")) return "feedback";
    if (courseText.startsWith("Assignment")) return "assignment";

    return "unknown"; // Default type
}

/**
 * Extracts course name from the full course text
 * @param courseText The full course text (e.g., "Content Created - Fall 2024 CSC 355 A01 (10790)")
 * @returns The cleaned course name
 */
function extractCourseName(courseText: string): string {
    const parts = courseText.split("-");
    if (parts.length < 2) return courseText.trim();

    // Remove any trailing CO or similar suffixes
    return parts[1].replace(/\s+CO$/, "").trim();
}

/**
 * Parses grade details from the title text
 * @param titleText The title text containing grade information
 * @returns Grade details object or undefined if parsing fails
 */
function parseGradeDetails(titleText: string): IGradeDetails | undefined {
    const gradeMatch = titleText.match(
        /(\d+\.?\d*)\s*\/\s*(\d+\.?\d*),\s*(\d+\.?\d*)\s*%,\s*(\d+\.?\d*)\s*\/\s*(\d+\.?\d*)%/
    );

    if (gradeMatch) {
        return {
            score: parseFloat(gradeMatch[1]),
            total: parseFloat(gradeMatch[2]),
            percentage: parseFloat(gradeMatch[3]),
            weightedScore: parseFloat(gradeMatch[4]),
            weightedTotal: parseFloat(gradeMatch[5]),
        };
    }
    return undefined;
}

/**
 * Extracts notifications from D2L HTML content
 * @param htmlString The HTML string to parse
 * @returns Array of parsed notifications
 */
async function parseD2LNotifications(htmlString: string): Promise<INotification[]> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");

    const items = doc.querySelectorAll(".d2l-datalist-item-actionable");

    const notifications: (INotification | undefined)[] = await Promise.all(
        Array.from(items).map(async (item) => {
            // Skip placeholder items
            if (item.classList.contains("d2l-datalist-item-placeholder")) {
                return;
            }

            const contentDiv = item.querySelector(".d2l-datalist-item-content");
            if (!contentDiv) return;

            const link = item.querySelector("a.d2l-link");
            const courseSpan = item.querySelector(".d2l-textblock-secondary.vui-emphasis");
            const timestampAbbr = item.querySelector("abbr.d2l-fuzzydate");
            const iconElement = item.querySelector("d2l-icon");

            if (!link || !courseSpan || !timestampAbbr) return;

            const titleText = link.textContent?.trim() || "";
            const courseText = courseSpan.textContent?.trim() || "";
            const type = determineNotificationType(iconElement, courseText);

            const notification: INotification = {
                type,
                title: titleText,
                course: extractCourseName(courseText),
                link: await remapD2LActivityFeedUrl(link.getAttribute("href") || "", type),

                // No need to use timezone here as `data-date` is Unix timestamp
                timestamp: new Date(
                    parseInt(timestampAbbr.getAttribute("data-date") || "")
                ).toISOString(),

                icon: iconElement?.getAttribute("icon") || undefined,
            };

            // Add grade details if it's a grade notification
            if (type === "grade") {
                const details = parseGradeDetails(titleText);
                if (details) {
                    notification.details = details;
                }
            }

            return notification;
        })
    );

    return notifications.filter((notification): notification is INotification => !!notification);
}

/**
 * Remap the D2L activity feed URL to a URL that is more consistent with this app's routing.
 * @param href The URL to remap.
 * @param type The type of notification this is for.
 * @returns The remapped URL.
 */
async function remapD2LActivityFeedUrl(href: string, type: INotification["type"]) {
    if (type === "content") {
        // Special handling for content type since it needs moduleId
        const match = href.replace("/d2l/le/content/", "").match(/(\d+)/g);
        const courseId = match?.[0];
        const topicId = match?.[1];
        
        if (courseId && topicId) {
            const moduleId = await getModuleId(courseId, topicId);
            if (moduleId) {
                return remapD2LUrl(href, type, { moduleId: moduleId.toString() });
            }
        }
        return `/courses/${courseId}`;
    }

    return remapD2LUrl(href, type);
}

async function getModuleId(courseId: string, topicId: string): Promise<number | null> {
    // Try cache first then fetch and cache
    let toc = await getAsyncCached<CourseContent>(["toc", courseId]);
    if (!toc) toc = await getUnstableCourseContent(courseId);
    if (toc) setAsyncCached(["toc", courseId], toc);

    const recursiveFindModule = (module: UnstableModule): number | null => {
        // Check if the current module contains the topic
        if (module.Topics.some((topic) => topic.TopicId.toString() === topicId)) {
            return module.ModuleId;
        }

        // Search through all nested modules
        for (const nextModule of module.Modules) {
            const result = recursiveFindModule(nextModule);
            if (result !== null) {
                return result;
            }
        }

        return null;
    };

    // Search through all top-level modules
    for (const module of toc.Modules) {
        const result = recursiveFindModule(module);
        if (result !== null) {
            return result;
        }
    }

    return null;
}
