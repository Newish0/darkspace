import { getAsyncCached, setAsyncCached } from "@/hooks/async-cached";
import { getEnrollments, IClass } from "@/services/BS/api/enrollment";

import { getAssignments, IAssignment } from "@/services/BS/scraper/assignment";
import { getGrades, IGradeData } from "@/services/BS/scraper/grades";
import { getQuizzes, IQuizInfo } from "@/services/BS/scraper/quizzes";
import { CourseContent, getUnstableCourseContent } from "./BS/api/unstable-module";
import { getCourseAnnouncements, IAnnouncement } from "./BS/scraper/announcements";
import { getCourseModules, IModule } from "./BS/scraper/course-modules";

export const preloadContent = async (progressCallback?: (progress: number) => void) => {
    let progress = 0;

    const enrollments = await getEnrollments();
    setAsyncCached(["enrollments"], enrollments);

    progress += 0.05;
    progressCallback?.(progress);

    const promises = enrollments.map(async (course) => {
        const modules = await getCourseModules(course.id);
        setAsyncCached(["course-modules", course.id], modules);
        const announcements = await getCourseAnnouncements(course.id);
        setAsyncCached(["announcements", course.id], announcements);

        const assignments = await getAssignments(course.id);
        setAsyncCached(["assignments", course.id], assignments);
        const quizzes = await getQuizzes(course.id);
        setAsyncCached(["quizzes", course.id], quizzes);

        const grades = await getGrades(course.id);
        setAsyncCached(["grades", course.id], grades);

        const toc = await getUnstableCourseContent(course.id);
        setAsyncCached(["toc", course.id], toc);

        progress += 0.95 / enrollments.length;
        progressCallback?.(progress);
    });

    await Promise.allSettled(promises);
};

export type CachedContent = {
    course: IClass;
    modules: IModule[] | null;
    announcements: IAnnouncement[] | null;
    assignments: IAssignment[] | null;
    quizzes: IQuizInfo[] | null;
    grades: IGradeData | null;
    toc: CourseContent | null;
};

export const getCachedContent = async (): Promise<CachedContent[]> => {
    const enrollments = await getAsyncCached<IClass[]>(["enrollments"]);

    const courseContents = await Promise.all(
        enrollments?.map(async (course) => ({
            course: course,
            modules: await getAsyncCached<IModule[]>(["course-modules", course.id]),
            announcements: await getAsyncCached<IAnnouncement[]>(["announcements", course.id]),
            assignments: await getAsyncCached<IAssignment[]>(["assignments", course.id]),
            quizzes: await getAsyncCached<IQuizInfo[]>(["quizzes", course.id]),
            grades: await getAsyncCached<IGradeData>(["grades", course.id]),
            toc: await getAsyncCached<CourseContent>(["toc", course.id]),
        })) || []
    );

    return courseContents;
};
