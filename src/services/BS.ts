function getApiToken() {
    try {
        const tokensString = localStorage.getItem("D2L.Fetch.Tokens");
        const tokens = tokensString ? JSON.parse(tokensString) : null;
        const token = tokens?.["*:*:*"]?.access_token;
        return token ?? null;
    } catch (error) {
        console.error("Error getting API token:", error);
        return null;
    }
}

function getEnrollmentsUrl(doc = document) {
    const apiEndpoint = doc.querySelector("d2l-my-courses")?.getAttribute("enrollments-url");
    return apiEndpoint ?? null;
}

function getUserId(doc = document) {
    const userId = doc
        .querySelector("d2l-my-courses")
        ?.getAttribute("user-settings-url")
        ?.split("/")
        .at(-1);
    return userId ?? null;
}

function createApiHeader() {
    const token = getApiToken();

    if (!token) return null;

    const header = {
        headers: {
            authorization: `Bearer ${token}`,
        },
    };

    return header;
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

export async function getEnrollments() {
    const url = getEnrollmentsUrl();
    const userId = getUserId();
    const header = createApiHeader();

    if (!url || !userId || !header) return null;

    // Skip to course list
    const res = await fetch(`${url}/users/${userId}`, header);

    const classEntities = (await res.json()).entities;

    const classList = await Promise.all(
        classEntities.map(async (e: any) => {
            const res = await fetch(e.href, header);
            const data = await res.json(); // Link to class info
            const classInfo = await fetch(data.links[1].href, header).then((res) => res.json()); // the actual class info
            return classInfo;
        })
    );

    return classList.map(rawClassToIClass);
}

// Define possible image classes
type ImageClass = "tile" | "banner";
type ImageDensity = "low-density" | "high-density";
type ImageSize = "max" | "mid" | "min";
type BannerWidth = "wide" | "narrow";

// Function to select the appropriate image link
function selectImageLink(
    response: any,
    imageClass: ImageClass,
    density: ImageDensity,
    size: ImageSize,
    bannerWidth?: BannerWidth
): string | null {
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

    return link ? link.href : null;
}

// Main function to fetch and process the image link
export async function getImgFromImgRefLink(
    imgRefLink: string,
    imageClass: ImageClass,
    density: ImageDensity,
    size: ImageSize,
    bannerWidth?: BannerWidth
): Promise<string | null> {
    try {
        const response = await fetch(imgRefLink);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return selectImageLink(data, imageClass, density, size, bannerWidth);
    } catch (error) {
        console.error("Error fetching image link:", error);
        return null;
    }
}
