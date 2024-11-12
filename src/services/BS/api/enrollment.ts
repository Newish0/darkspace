import { extractUuid } from "@/utils/string";
import { getBaseDocument } from "../base-doc";
import { EnrollmentFetchError, EnrollmentUrlError, UserIdError } from "../errors";
import { createApiHeader } from "./http";

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

export async function getEnrollments(): Promise<IClass[]> {
    const baseDoc = await getBaseDocument();
    const url = getEnrollmentsUrl(baseDoc);
    const userId = getUserId(baseDoc);
    const header = await createApiHeader();

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

function getEnrollmentsUrl(doc: Document): string {
    const apiEndpoint = doc.querySelector("d2l-my-courses")?.getAttribute("enrollments-url");
    if (!apiEndpoint) {
        throw new EnrollmentUrlError("Enrollments URL not found in the document");
    }
    return apiEndpoint;
}

function getUserId(doc: Document): string {
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
