import ICAL from "ical.js";
import { getModuleId } from "../api/unstable-module";
import { getSearchParam } from "../util";
import { D2L_URL_PATTERNS, remapD2LUrl } from "../url";

// Constants
const URL_PATTERNS = {
    ASSIGNMENT: "/d2l/lms/dropbox/user/folder_submit_files.d2l",
    QUIZ: "/d2l/lms/quizzing/quizzing.d2l",
    TOPIC: "/viewContent/",
} as const;

const EVENT_TYPES = {
    DUE: "due",
    START: "available",
    END: "availability ends",
} as const;

// Types
interface BaseEventMetadata {
    name: string;
    courseName: string;
    description: string;
    itemUrls?: string[];
    eventUrl?: string;
}

interface ItemTypeMap {
    assignment: { assignmentId: string; courseId: string };
    quiz: { quizId: string; courseId: string };
    topic: { moduleId: string; topicId: string; courseId: string };
    unknown: Record<string, never>;
}

type ItemType = keyof ItemTypeMap;
type EventType = "due" | "start" | "end" | "unknown";

type CalendarEventBase<T extends ItemType> = BaseEventMetadata &
    ItemTypeMap[T] & {
        itemType: T;
    };

type EventTypeMap = {
    due: { eventType: "due"; dueDate?: Date };
    start: { eventType: "start"; startTime?: Date };
    end: { eventType: "end"; endTime?: Date };
    unknown: { eventType: "unknown"; startTime?: Date; endTime?: Date };
};

export type CalendarEvent = {
    [T in ItemType]: {
        [E in keyof EventTypeMap]: CalendarEventBase<T> & EventTypeMap[E];
    }[keyof EventTypeMap];
}[ItemType];

// Utility functions
class CalendarEventBuilder {
    private static extractUrls(description: string): string[] {
        const urlDelimiter = "\n\n\nView event";
        const contentBeforeViewEvent = description.split(urlDelimiter)[0];
        const urlRegex = /https:\/\/bright\.uvic\.ca\/[^\s\n]+/g;
        return contentBeforeViewEvent.match(urlRegex) || [];
    }

    private static cleanTitle(rawTitle: string): string {
        return rawTitle.slice(0, rawTitle.lastIndexOf("-")).trim();
    }

    private static determineEventType(rawTitle: string): EventType {
        const typeComponent = rawTitle
            .slice(rawTitle.lastIndexOf("-") + 1)
            .trim()
            .toLowerCase();

        if (typeComponent === EVENT_TYPES.DUE) return "due";
        if (typeComponent === EVENT_TYPES.START) return "start";
        if (typeComponent === EVENT_TYPES.END) return "end";
        return "unknown";
    }

    private static inferItemType(itemUrl: string): ItemType {
        if (itemUrl.includes(URL_PATTERNS.ASSIGNMENT)) return "assignment";
        if (itemUrl.includes(URL_PATTERNS.QUIZ)) return "quiz";
        if (itemUrl.includes(URL_PATTERNS.TOPIC)) return "topic";
        return "unknown";
    }

    private static async extractIds(
        itemUrl: string,
        itemType: ItemType
    ): Promise<Partial<ItemTypeMap[ItemType]>> {
        switch (itemType) {
            case "topic": {
                const params = D2L_URL_PATTERNS.topic.extractParams(itemUrl);
                if (params.courseId && params.topicId) {
                    const moduleId = await getModuleId(params.courseId, params.topicId);
                    if (moduleId) {
                        return {
                            moduleId: moduleId.toString(),
                            topicId: params.topicId,
                            courseId: params.courseId,
                        };
                    }
                }
                break;
            }
            case "assignment": {
                const params = D2L_URL_PATTERNS.assignment.extractParams(itemUrl);
                if (params.courseId) {
                    return {
                        assignmentId: getSearchParam(itemUrl, "db") || "",
                        courseId: params.courseId,
                    };
                }
                break;
            }
            case "quiz": {
                const params = D2L_URL_PATTERNS.quiz.extractParams(itemUrl);
                if (params.courseId && params.quizId) {
                    return { quizId: params.quizId, courseId: params.courseId };
                }
                break;
            }
        }
        return {};
    }

    static async buildEvent(icalEvent: ICAL.Event): Promise<CalendarEvent> {
        const rawTitle = icalEvent.summary || "";
        const title = this.cleanTitle(rawTitle);
        const eventType = this.determineEventType(rawTitle);
        const description = icalEvent.description || "";
        const itemUrls = this.extractUrls(description);

        // Determine item type from URLs
        const itemType = itemUrls.reduce<ItemType>((acc, url) => {
            const type = this.inferItemType(url);
            return type === "unknown" ? acc : type;
        }, "unknown");

        // Extract IDs from URLs
        const itemIds = await itemUrls.reduce(async (accPromise, url) => {
            const acc = await accPromise;
            const ids = await this.extractIds(url, itemType);
            return { ...acc, ...ids };
        }, Promise.resolve({}));

        // Get the event URL by remapping the first item URL if available
        const eventUrl =
            itemUrls.length > 0 ? remapD2LUrl(itemUrls[0], itemType, itemIds) : undefined;

        const baseEvent: any = {
            name: title,
            courseName: icalEvent.location || "",
            description,
            itemUrls,
            itemType,
            eventType,
            eventUrl,
            ...itemIds,
        };

        // Add time-specific properties based on event type
        switch (eventType) {
            case "due":
                return { ...baseEvent, dueDate: icalEvent.endDate.toJSDate() };
            case "start":
                return { ...baseEvent, startTime: icalEvent.startDate.toJSDate() };
            case "end":
                return { ...baseEvent, endTime: icalEvent.endDate.toJSDate() };
            default:
                return {
                    ...baseEvent,
                    startTime: icalEvent.startDate.toJSDate(),
                    endTime: icalEvent.endDate.toJSDate(),
                };
        }
    }
}

export class CalendarTransformerService {
    /**
     * Transform ICS content into CalendarEvents
     */
    public async transformCalendar(icsContent: string): Promise<CalendarEvent[]> {
        try {
            const jcalData = ICAL.parse(icsContent);
            const comp = new ICAL.Component(jcalData);
            const vevents = comp.getAllSubcomponents("vevent");

            return await Promise.all(
                vevents.map((vevent) => CalendarEventBuilder.buildEvent(new ICAL.Event(vevent)))
            );
        } catch (error) {
            console.error("Error transforming calendar:", error);
            throw new Error("Failed to transform calendar data");
        }
    }
}
