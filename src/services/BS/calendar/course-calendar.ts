import { getICS } from "../scraper/course-calendar";
import { CalendarEvent, CalendarTransformerService } from "./calendar-transformer";

export async function getCourseCalendarEvents(courseId?: string): Promise<CalendarEvent[]> {
    const icsContent = await getICS(courseId);
    const calendarTransformer = new CalendarTransformerService();
    return calendarTransformer.transformCalendar(icsContent);
}
