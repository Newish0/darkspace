export interface ICalendarTerm {
    id: string;
    name: string;
    start: Date;
    end: Date;
}

export default interface ICalendarTermsService {
    /* A list of calendar terms in chronological order */
    calendarTerms: ICalendarTerm[];

    /** Get calendar terms sorted by distance from date */
    getSortedCalendarTerms(date: Date): ICalendarTerm[];

    /** Get calendar term by date */
    getTerm(date: Date): ICalendarTerm | undefined;
}
