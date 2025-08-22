import UVicCalendarTermsService from "@/services/calendar-term/uvic-calendar-terms-service";
import { makePersisted } from "@solid-primitives/storage";
import { createSignal } from "solid-js";

export const useUVicCoursePlannerTerms = (
    ...params: ConstructorParameters<typeof UVicCalendarTermsService>
) => {
    const termsSvc = new UVicCalendarTermsService(...params);
    const [terms] = createSignal(termsSvc.calendarTerms);
    const [activeTerm, setActiveTerm] = makePersisted(createSignal(termsSvc.getTerm(params[0])), {
        name: "course-planner-uvic-active-term",
    });

    return { terms, activeTerm, setActiveTerm } as const;
};
