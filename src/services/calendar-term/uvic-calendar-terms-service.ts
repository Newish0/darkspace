import ICalendarTermsService, { ICalendarTerm } from "./calendar-terms-service";

// Define constants for term durations and start months
const TERM_DURATION_MONTHS = 4; // Each term lasts 4 months
const WINTER_TERM_START_MONTH = 0; // January (0-indexed)
const SUMMER_TERM_START_MONTH = 4; // May (0-indexed)
const FALL_TERM_START_MONTH = 8; // September (0-indexed)

// Helper function to generate an array of numbers (like Python's range)
const range = (start: number, end: number): number[] =>
    Array.from({ length: end - start }, (_, i) => start + i);

export default class UVicCalendarTermsService implements ICalendarTermsService {
    public readonly calendarTerms: ICalendarTerm[];

    constructor(date: Date, numFutureTerms: number, numPastTerms: number) {
        // Determine the current term based on the provided date.
        // We'll use this as our anchor.
        const currentTermAnchor = this.getTerm(date);

        if (!currentTermAnchor) {
            console.warn("Could not determine current term for date:", date);
            this.calendarTerms = []; // Initialize as empty if current term can't be found
            return;
        }

        // --- Generate Past Terms ---
        // Create an array of negative offsets to represent past terms relative to the anchor.
        // e.g., for numPastTerms = 2, we need terms at -1 * TERM_DURATION_MONTHS and -2 * TERM_DURATION_MONTHS
        const pastTermOffsets = range(1, numPastTerms + 1)
            .map((i) => -i * TERM_DURATION_MONTHS)
            .reverse(); // Reverse to get them in chronological order

        const pastTerms = pastTermOffsets
            .map((offsetMonths) => {
                const termDate = new Date(currentTermAnchor.start);
                termDate.setMonth(termDate.getMonth() + offsetMonths);
                return this.getTerm(termDate);
            })
            .filter((term): term is ICalendarTerm => term !== undefined); // Filter out any undefined terms

        // --- Generate Future Terms ---
        // Create an array of positive offsets for future terms.
        const futureTermOffsets = range(1, numFutureTerms + 1).map((i) => i * TERM_DURATION_MONTHS);

        const futureTerms = futureTermOffsets
            .map((offsetMonths) => {
                const termDate = new Date(currentTermAnchor.start);
                termDate.setMonth(termDate.getMonth() + offsetMonths);
                return this.getTerm(termDate);
            })
            .filter((term): term is ICalendarTerm => term !== undefined); // Filter out any undefined terms

        // Combine all terms in chronological order
        this.calendarTerms = [...pastTerms, currentTermAnchor, ...futureTerms];
    }

    getTerm(date: Date): ICalendarTerm | undefined {
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-indexed

        let termStartDate: Date;
        let termName: string;

        if (month >= WINTER_TERM_START_MONTH && month < SUMMER_TERM_START_MONTH) {
            termStartDate = new Date(year, WINTER_TERM_START_MONTH, 1);
            termName = "Winter";
        } else if (month >= SUMMER_TERM_START_MONTH && month < FALL_TERM_START_MONTH) {
            termStartDate = new Date(year, SUMMER_TERM_START_MONTH, 1);
            termName = "Summer";
        } else if (month >= FALL_TERM_START_MONTH && month <= 11) {
            termStartDate = new Date(year, FALL_TERM_START_MONTH, 1);
            termName = "Fall";
        } else {
            return undefined;
        }

        const termEndDate = new Date(termStartDate);
        termEndDate.setMonth(termEndDate.getMonth() + TERM_DURATION_MONTHS);
        termEndDate.setDate(termEndDate.getDate() - 1);

        return {
            id: `${year}${(termStartDate.getMonth() + 1).toString().padStart(2, "0")}`,
            name: `${termName} ${year}`,
            start: termStartDate,
            end: termEndDate,
        };
    }

    getSortedCalendarTerms(date: Date): ICalendarTerm[] {
        return this.calendarTerms
            .map((term) => [term.start.getTime() - date.getTime(), term] as const)
            .toSorted((a, b) => a[0] - b[0])
            .map(([, term]) => term);
    }
}
