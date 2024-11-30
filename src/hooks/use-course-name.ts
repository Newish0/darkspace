import { getEnrollments } from "@/services/BS/api/enrollment";
import { createAsyncCached } from "./async-cached";
import { createEffect, createMemo } from "solid-js";

export function useCourseName(courseId: string, shortName?: boolean) {
    const enrollments = createAsyncCached(() => getEnrollments(), { keys: () => ["enrollments"] });

    // Create a memo to derive the course name, which will update when either
    // enrollments or courseId changes
    const name = createMemo(() => {
        const enrollmentData = enrollments();
        if (!enrollmentData) return undefined;

        const name = enrollmentData.find((c) => c.id === courseId)?.name;

        if (shortName && name) {
            // Regex pattern: captures the course code and everything after it until end of line or next course code
            const pattern = /([A-Z]{2,5}\s?\d{3}[A-Z]?)/g;

            const codeMatch = pattern.exec(name);

            const index = codeMatch?.index ?? 0;

            return name.substring(index);
        }

        return name;
    });

    return name;
}
