import { extractUuid } from "@/utils/string";
import {
    ApiTokenError,
    EnrollmentUrlError,
    UserIdError,
    EnrollmentFetchError,
    ImageFetchError,
} from "./errors";

function getApiToken(): string {
    try {
        const tokensString = localStorage.getItem("D2L.Fetch.Tokens");
        const tokens = tokensString ? JSON.parse(tokensString) : null;
        const token = tokens?.["*:*:*"]?.access_token;
        if (!token) {
            throw new ApiTokenError("API token not found in local storage");
        }
        return token;
    } catch (error) {
        console.error("Error getting API token:", error);
        throw new ApiTokenError("Failed to retrieve API token");
    }
}

function getEnrollmentsUrl(doc = document): string {
    const apiEndpoint = doc.querySelector("d2l-my-courses")?.getAttribute("enrollments-url");
    if (!apiEndpoint) {
        throw new EnrollmentUrlError("Enrollments URL not found in the document");
    }
    return apiEndpoint;
}

function getUserId(doc = document): string {
    const userId = doc
        .querySelector("d2l-my-courses")
        ?.getAttribute("user-settings-url")
        ?.split("/")
        .at(-1);
    if (!userId) {
        throw new UserIdError("User ID not found in the document");
    }
    return userId;
}

function createApiHeader(): { headers: { authorization: string } } {
    const token = getApiToken();
    return {
        headers: {
            authorization: `Bearer ${token}`,
        },
    };
}

export interface IClass {
    link: string;
    name: string;
    code: string;
    startDate: string | null;
    endDate: string | null;
    isActive: boolean;
    description: string;
    color: string;
    imgRefLink: string;
    imgId: string;
    id: string;
}

function rawClassToIClass(rawClass: any): IClass {
    const { name, code, startDate, endDate, isActive, description } = rawClass.properties;

    const color =
        rawClass.entities.find((entity: any) => entity.class.includes("color"))?.properties
            ?.hexString || "";

    const imgRefLink =
        rawClass.entities.find((entity: any) => entity.class.includes("course-image"))?.href || "";

    const imgId = extractUuid(imgRefLink, { last: true }) || "";

    const link =
        rawClass.entities.find((entity: any) => entity.class.includes("relative-uri"))?.properties
            ?.path || "";

    const id = link.split("/").at(-1);

    return {
        link,
        name,
        code,
        startDate,
        endDate,
        isActive,
        description,
        color,
        imgRefLink,
        imgId,
        id,
    };
}

export async function getEnrollments(): Promise<IClass[]> {
    const url = getEnrollmentsUrl();
    const userId = getUserId();
    const header = createApiHeader();

    try {
        const endpoint = `${url}/users/${userId}?search=&pageSize=1000`;

        const res = await fetch(endpoint, header);
        if (!res.ok) {
            throw new EnrollmentFetchError(`Failed to fetch enrollments: ${res.statusText}`);
        }

        const classEntities = (await res.json()).entities;

        const classList = await Promise.all(
            classEntities.map(async (e: any) => {
                const res = await fetch(e.href, header);
                if (!res.ok) {
                    throw new EnrollmentFetchError(`Failed to fetch class info: ${res.statusText}`);
                }
                const data = await res.json();
                const classInfoRes = await fetch(data.links[1].href, header);
                if (!classInfoRes.ok) {
                    throw new EnrollmentFetchError(
                        `Failed to fetch detailed class info: ${classInfoRes.statusText}`
                    );
                }
                return classInfoRes.json();
            })
        );

        return classList
            .map(rawClassToIClass)
            .sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""));
    } catch (error) {
        console.error("Error fetching enrollments:", error);
        throw new EnrollmentFetchError("Failed to fetch enrollments");
    }
}

/**
 * Construct a URL to fetch the banner image for a course.
 *
 * @param courseId The course ID.
 * @param imgId The image ID.
 * @returns The URL to fetch the image.
 */
export function getBannerImageUrl(courseId: string, imgId: string): string {
    const urlTemplate =
        "https://bright.uvic.ca/d2l/api/lp/1.9/courses/{{COURSE_ID}}/image?height=230&width=540&versionNumber={{IMAGE_UUID}}";
    const url = urlTemplate.replace("{{COURSE_ID}}", courseId).replace("{{IMAGE_UUID}}", imgId);
    return url;
}

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

const UNSTABLE_COURSE_CONTENT_URL =
    "https://bright.uvic.ca/d2l/api/le/unstable/{{COURSE_ID}}/content/toc?loadDescription=true";

export async function getUnstableCourseContent(courseId: string): Promise<CourseContent> {
    const response = await fetch(UNSTABLE_COURSE_CONTENT_URL.replace("{{COURSE_ID}}", courseId));
    const data = await response.json();
    return data;
}
