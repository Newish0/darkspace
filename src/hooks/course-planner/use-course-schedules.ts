import { ICourse } from "@/services/course-scraper/types";
import { AsyncCache } from "@/services/storage/async-cache";
import { makePersisted } from "@solid-primitives/storage";
import { createSignal } from "solid-js";

type CourseSchedule = {
    name: string;
    id: string;
    createdAt: string;
    courses: ICourse[];
};

const courseScheduleDb = new AsyncCache("course-planner-uvic-schedules", "course-schedules");

export const useUVicCourseSchedules = () => {
    const [courseSchedules, setCourseSchedules] = makePersisted(
        createSignal<CourseSchedule[]>([]),
        {
            storage: courseScheduleDb,
            name: "course-planner-uvic-schedules",
        }
    );

    const [activeSchedule, setActiveSchedule] = createSignal<string | undefined>(
        courseSchedules()[0]?.id
    );

    return { courseSchedules, setCourseSchedules, activeSchedule, setActiveSchedule } as const;
};
