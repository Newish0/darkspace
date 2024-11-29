import ICAL from "ical.js";

// Types for our transformed calendar events
export interface CalendarEvent {
    title: string;
    courseName: string;
    description: string;
    startTime: Date;
    endTime: Date;
    itemUrls: string[];
    viewEventUrl?: string;
}

export class CalendarTransformerService {
    /**
     * Extracts URLs from description that appear before the "View event" delimiter
     */
    private extractUrls(description: string): string[] {
        const urlDelimiter = "\n\n\nView event";
        const contentBeforeViewEvent = description.split(urlDelimiter)[0];

        // Regular expression to match bright.uvic.ca URLs
        const urlRegex = /https:\/\/bright\.uvic\.ca\/[^\s\n]+/g;
        return contentBeforeViewEvent.match(urlRegex) || [];
    }

    /**
     * Transform a single ICS event into our CalendarEvent format
     */
    private transformEvent(icalEvent: ICAL.Event): CalendarEvent {
        const description = icalEvent.description || "";
        const itemUrls = this.extractUrls(description);

        return {
            title: icalEvent.summary || "",
            courseName: icalEvent.location || "",
            description: description,
            startTime: icalEvent.startDate.toJSDate(),
            endTime: icalEvent.endDate.toJSDate(),
            itemUrls,
            viewEventUrl: itemUrls.find((url) => url.includes("/calendar/")),
        };
    }

    /**
     * Transform ICS content into CalendarEvents
     */
    public transformCalendar(icsContent: string): CalendarEvent[] {
        try {
            // Parse the ICS content using ical.js
            const jcalData = ICAL.parse(icsContent);
            const comp = new ICAL.Component(jcalData);

            // Get all events from the calendar
            const vevents = comp.getAllSubcomponents("vevent");

            // Transform each event
            return vevents.map((vevent) => {
                const icalEvent = new ICAL.Event(vevent);
                return this.transformEvent(icalEvent);
            });
        } catch (error) {
            console.error("Error transforming calendar:", error);
            throw new Error("Failed to transform calendar data");
        }
    }

    /**
     * Get events for a specific course
     */
    public getEventsByCourse(events: CalendarEvent[], courseName: string): CalendarEvent[] {
        return events.filter((event) =>
            event.courseName.toLowerCase().includes(courseName.toLowerCase())
        );
    }

    /**
     * Get upcoming events from a specific date
     */
    public getUpcomingEvents(
        events: CalendarEvent[],
        fromDate: Date = new Date()
    ): CalendarEvent[] {
        return events
            .filter((event) => event.startTime > fromDate)
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }

    /**
     * Get events within a date range
     */
    public getEventsInRange(
        events: CalendarEvent[],
        startDate: Date,
        endDate: Date
    ): CalendarEvent[] {
        return events
            .filter((event) => event.startTime >= startDate && event.startTime <= endDate)
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }
}
