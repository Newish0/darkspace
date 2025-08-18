import { getAsyncCached, setAsyncCached } from "@/hooks/async-cached";
import { getEnrollments, IClass } from "@/services/BS/api/enrollment";

import { getAssignments, IAssignment } from "@/services/BS/scraper/assignment";
import { getGrades, IGradeData } from "@/services/BS/scraper/grades";
import { getQuizzes, IQuizInfo } from "@/services/BS/scraper/quizzes";
import { CourseContent, getUnstableCourseContent } from "./BS/api/unstable-module";
import { getCourseModules, IModule } from "./BS/scraper/course-modules";
import { D2LActivityFeedFetcher } from "./BS/scraper/notification";
import { newsService } from "./BS/api/news";
import { NewsItem } from "./BS/api/dtos/news";

export const initPreloadContentOnNotification = (courseId: string) => {
    const fetcher = D2LActivityFeedFetcher.create(courseId, 0);
    return fetcher.subscribeToUpdates(async (hasNew) => {
        if (hasNew) {
            const notifications = await fetcher.getMoreFeed();
            for (const notification of notifications) {
                const courseIdPattern = /\/courses\/(\d+)/;
                const match = notification.link.match(courseIdPattern);
                if (match) {
                    const courseId = match[1];

                    await preloadCourseContent(courseId);
                }
            }
        }
    });
};

export const preloadCourseContent = async (courseId: string) => {
    const modules = await getCourseModules(courseId);
    setAsyncCached(["course-modules", courseId], modules);
    const announcements = await newsService.getNewsItems(courseId);
    setAsyncCached(["announcements", courseId], announcements);

    const assignments = await getAssignments(courseId);
    setAsyncCached(["assignments", courseId], assignments);
    const quizzes = await getQuizzes(courseId);
    setAsyncCached(["quizzes", courseId], quizzes);

    const grades = await getGrades(courseId);
    setAsyncCached(["grades", courseId], grades);

    const toc = await getUnstableCourseContent(courseId);
    setAsyncCached(["toc", courseId], toc);
};

export const preloadAllContent = async (progressCallback?: (progress: number) => void) => {
    let progress = 0;

    const enrollments = await getEnrollments();
    setAsyncCached(["enrollments"], enrollments);

    progress += 0.05;
    progressCallback?.(progress);

    const promises = enrollments.map(async (course) => {
        await preloadCourseContent(course.id);

        progress += 0.95 / enrollments.length;
        progressCallback?.(progress);
    });

    await Promise.allSettled(promises);
};

export type CachedContent = {
    course: IClass;
    modules: IModule[] | null;
    announcements: NewsItem[] | null;
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
            announcements: await getAsyncCached<NewsItem[]>(["announcements", course.id]),
            assignments: await getAsyncCached<IAssignment[]>(["assignments", course.id]),
            quizzes: await getAsyncCached<IQuizInfo[]>(["quizzes", course.id]),
            grades: await getAsyncCached<IGradeData>(["grades", course.id]),
            toc: await getAsyncCached<CourseContent>(["toc", course.id]),
        })) || []
    );

    return courseContents;
};
