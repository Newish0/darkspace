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
    id: string;
}

function rawClassToIClass(rawClass: any): IClass {
    const { name, code, startDate, endDate, isActive, description } = rawClass.properties;

    const color =
        rawClass.entities.find((entity: any) => entity.class.includes("color"))?.properties
            ?.hexString || "";

    const imgRefLink =
        rawClass.entities.find((entity: any) => entity.class.includes("course-image"))?.href || "";

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

// Define possible image classes
type ImageClass = "tile" | "banner";
type ImageDensity = "low-density" | "high-density";
type ImageSize = "max" | "mid" | "min";
type BannerWidth = "wide" | "narrow";

function selectImageLink(
    response: any,
    imageClass: ImageClass,
    density: ImageDensity,
    size: ImageSize,
    bannerWidth?: BannerWidth
): string {
    const link = response.links.find((link: any) => {
        if (!link.class) return false;

        const matchesClass = link.class.includes(imageClass);
        const matchesDensity = link.class.includes(density);
        const matchesSize = link.class.includes(size);

        if (imageClass === "banner") {
            return (
                matchesClass && matchesDensity && matchesSize && link.class.includes(bannerWidth!)
            );
        } else {
            return matchesClass && matchesDensity && matchesSize;
        }
    });

    if (!link) {
        throw new ImageFetchError("No matching image link found");
    }

    return link.href;
}

export async function getImgFromImgRefLink(
    imgRefLink: string,
    imageClass: ImageClass,
    density: ImageDensity,
    size: ImageSize,
    bannerWidth?: BannerWidth
): Promise<string> {
    try {
        const response = await fetch(imgRefLink);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return selectImageLink(data, imageClass, density, size, bannerWidth);
    } catch (error) {
        console.error("Error fetching image link:", error);
        throw new ImageFetchError("Failed to fetch image link");
    }
}