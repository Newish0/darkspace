import { query } from "@solidjs/router";
import { BASE_URL } from "../url";
import { getAsyncCached, setAsyncCached } from "@/hooks/async-cached";

/*
 * Using Unstable Content API
 * WARNING: Type inferred by ChatGPT; may be incorrect
 */
export type UnstableModule = {
    SortOrder: number;
    StartDateTime: string | null;
    EndDateTime: string | null;
    DueDateTime: string | null;
    IsHidden: boolean;
    IsLocked: boolean;
    PacingStartDate: string | null;
    PacingEndDate: string | null;
    DefaultPath: string;
    HasReleaseConditions: boolean;
    CompositionHash: number;
    Color: string | null;
    ModuleId: number;
    Title: string;
    Modules: UnstableModule[]; // Recursive type for nested modules
    Topics: Topic[];
    Description: {
        Text: string;
        Html: string;
    };
};

/*
 * WARNING: Type inferred by ChatGPT; may be incorrect
 */
export type Topic = {
    SortOrder: number;
    StartDateTime: string | null;
    StartDateType: string | null;
    EndDateTime: string | null;
    EndDateType: string | null;
    DueDateTime: string | null;
    IsHidden: boolean;
    IsLocked: boolean;
    IsBroken: boolean;
    ActivityId: string;
    IsExempt: boolean;
    HasReleaseConditions: boolean;
    IsContentServiceAudioOrVideo: boolean;
    SupportsMultipleGrades: boolean;
    activityDisplayHref: string | null;
    activityDisplayReturnPoint: string | null;
    IsOptional: boolean;
    CanToggleCompletionRequirement: boolean;
    IsDownloadDisabled: boolean | null;
    ContentUrl: string;
    ActivityTextLinks: string[];
    IsConvertedFile: boolean;
    TopicId: number;
    Identifier: string;
    TypeIdentifier: string;
    Title: string;
    Bookmarked: boolean;
    Unread: boolean;
    Url: string;
    ToolId: number | null;
    ToolItemId: number | null;
    ActivityType: number;
    GradeItemId: number | null;
    LastModifiedDate: string;
    Description: {
        Text: string;
        Html: string;
    };
};

/*
 * WARNING: Type inferred by ChatGPT; may be incorrect
 */
export type CourseContent = {
    Modules: UnstableModule[];
};

const UNSTABLE_COURSE_CONTENT_URL = `${BASE_URL}/d2l/api/le/unstable/{{COURSE_ID}}/content/toc?loadDescription=true`;

export const getUnstableCourseContent = query(async (courseId: string): Promise<CourseContent> => {
    const response = await fetch(UNSTABLE_COURSE_CONTENT_URL.replace("{{COURSE_ID}}", courseId));
    const data = await response.json();
    return data;
}, "unstableCourseContentByCourseId");

export async function getModuleId(courseId: string, topicId: string): Promise<number | null> {
    // Try cache first then fetch and cache
    let toc = await getAsyncCached<CourseContent>(["toc", courseId]);
    if (!toc) toc = await getUnstableCourseContent(courseId);
    if (toc) setAsyncCached(["toc", courseId], toc);

    const recursiveFindModule = (module: UnstableModule): number | null => {
        // Check if the current module contains the topic
        if (module.Topics.some((topic) => topic.TopicId.toString() === topicId)) {
            return module.ModuleId;
        }

        // Search through all nested modules
        for (const nextModule of module.Modules) {
            const result = recursiveFindModule(nextModule);
            if (result !== null) {
                return result;
            }
        }

        return null;
    };

    // Search through all top-level modules
    for (const module of toc.Modules) {
        const result = recursiveFindModule(module);
        if (result !== null) {
            return result;
        }
    }

    return null;
}
