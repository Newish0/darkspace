import DOMPurify from "dompurify";

const COURSE_MODULE_URL = "https://bright.uvic.ca/d2l/le/content/{{COURSE_ID}}/Home";

// Course Modules
const COURSE_MODULE_MODULE_TREE_SELECTOR = "#D2L_LE_Content_TreeBrowser";

// Overview, Bookmarks, and Course Schedule
const COURSE_MODULE_PLUGIN_TREE_SELECTOR = "#ContentPluginTree";

const MODULE_ITEM_ID_PATTERN = "TreeItem";

const MODULE_ITEM_SELECTOR = `[id^="${MODULE_ITEM_ID_PATTERN}"]`;

export interface IModule {
    name: string;
    moduleId: string;
    children?: IModule[];
}

function htmlToDocument(unsafeHtml: string) {
    const parser = new DOMParser();
    const sanitizedHtml = DOMPurify.sanitize(unsafeHtml);
    return parser.parseFromString(sanitizedHtml, "text/html");
}

export async function getCourseModules(courseId: string): Promise<IModule[]> {
    const html = await fetch(COURSE_MODULE_URL.replace("{{COURSE_ID}}", courseId)).then((res) =>
        res.text()
    );
    const doc = htmlToDocument(html);
    const moduleTree = doc.querySelector(COURSE_MODULE_MODULE_TREE_SELECTOR);

    // Add Overview, Bookmarks, and Course Schedule modules
    const additionalModuleTree = doc.querySelector(COURSE_MODULE_PLUGIN_TREE_SELECTOR);

    function extractModuleInfo(element: Element): IModule {
        const idElement = element.querySelector(MODULE_ITEM_SELECTOR);

        const module: IModule = {
            name: idElement?.querySelector("div")?.textContent || "",
            moduleId: idElement ? idElement.id.replace(MODULE_ITEM_ID_PATTERN, "") : "",
        };

        const childrenContainer = element.querySelector("ul");
        if (childrenContainer) {
            const childModules = Array.from(childrenContainer.children)
                .filter((child) => child.tagName === "LI")
                .map((child) => extractModuleInfo(child));

            if (childModules.length > 0) {
                module.children = childModules;
            }
        }

        return module;
    }

    const rootModules = Array.from(moduleTree?.children ?? [])
        .filter((child) => child.tagName === "LI")
        .map((child) => extractModuleInfo(child));

    const additionalModules = Array.from(additionalModuleTree?.children ?? [])
        .filter((child) => child.tagName === "LI")
        .map((child) => extractModuleInfo(child));

    return [...additionalModules, ...rootModules];
}

const COURSE_ANNOUNCEMENTS_URL = "https://bright.uvic.ca/d2l/lms/news/main.d2l?ou={{CLASS_ID}}";

const COURSE_ANNOUNCEMENTS_SELECTOR = "#RT_Body > d2l-html-block";

export interface IAnnouncement {
    html: string;
    title?: string;
    dateTime?: string;
}

/**
 * Fetches the course announcements from Brightspace
 * @param courseId The course ID in Brightspace
 * @returns An array of IAnnouncement objects.
 * @warning html is not sanitized.
 *
 */
export async function getCourseAnnouncements(courseId: string): Promise<IAnnouncement[]> {
    const htmlString = await fetch(COURSE_ANNOUNCEMENTS_URL.replace("{{CLASS_ID}}", courseId)).then(
        (res) => res.text()
    );
    const doc = htmlToDocument(htmlString);

    /**
     * The following code assumes that the HTML structure of the page is as follows:
     * <tr>
     *     <td>
     *         <a>Announcement Title</a>
     *     </td>
     *     <td>
     *         <label>Announcement Date and Time</label>
     *     </td>
     * </tr>
     * <tr>
     *     <td>
     *         <d2l-html-block html="announcement HTML content">
     *     </td>
     * </tr>
     */
    return Array.from(doc.querySelectorAll(COURSE_ANNOUNCEMENTS_SELECTOR)).map((eln) => {
        const html = eln.getAttribute("html");
        const currentRow = eln.closest("tr"); // closest <tr> parent that contains the current element
        const previousRow = currentRow?.previousElementSibling; // the previous <tr> tag
        const title = previousRow?.querySelector("a")?.textContent;
        const dateTime = previousRow?.querySelector("label")?.textContent;

        const announcement: IAnnouncement = {
            html: html || "",
            title: title || undefined,
            dateTime: dateTime || undefined,
        };

        return announcement;
    });
}

const D2L_PARTIAL_WHILE1 = "while(1);";

function parseD2LPartial(d2lPartial: string) {
    const while1Index = d2lPartial.indexOf(D2L_PARTIAL_WHILE1);

    if (while1Index !== 0) {
        throw new Error("Failed to parse Lit partial: while(1) not found");
    }

    const json = d2lPartial.substring(D2L_PARTIAL_WHILE1.length);

    return JSON.parse(json);
}

export interface IModuleContent {
    id: string;
    name?: string;
    type?: string;
    url: string;
}

export interface IModuleDetails {
    id: string;
    name?: string;
    content: IModuleContent[];
}

const MODULE_CONTENT_URL =
    "https://bright.uvic.ca/d2l/le/content/{{COURSE_ID}}/ModuleDetailsPartial?mId={{MODULE_ID}}&_d2l_prc&writeHistoryEntry=1";
// const MODULE_CONTENT_URL =
//     "https://bright.uvic.ca/d2l/le/content/{{COURSE_ID}}/PartialMainView?identifier={{MODULE_ID}}&_d2l_prc";

export async function getModuleContent(
    courseId: string,
    moduleId: string
): Promise<IModuleDetails> {
    const d2lPartial = await fetch(
        MODULE_CONTENT_URL.replace("{{COURSE_ID}}", courseId).replace("{{MODULE_ID}}", moduleId)
    ).then((res) => res.text());

    const d2lPartialParsed = parseD2LPartial(d2lPartial);

    if (!d2lPartialParsed?.Payload?.Html) {
        throw new Error("Failed to extract module content: Payload.Html not found");
    }

    const doc = htmlToDocument(d2lPartialParsed.Payload.Html);

    console.log(doc.body.innerHTML);

    const moduleName = doc.querySelector("h1.d2l-page-title")?.textContent;

    // Find all list items that contain the relevant information
    const listItems = doc.querySelectorAll("li.d2l-datalist-item");

    // Extract data from each list item
    const content = Array.from(listItems)
        .map((item) => {
            const linkElement: HTMLAnchorElement | null = item.querySelector("[id^=d2l_content_]");
            const typeElement = item.querySelector(".d2l-textblock.d2l-body-small");
            const id = linkElement?.id.replace("d2l_content_", "").split("_").at(1);

            if (linkElement && typeElement && id) {
                return {
                    name: linkElement.textContent || undefined,
                    type: typeElement.textContent || undefined,
                    url: linkElement.href,
                    id: id,
                };
            }
            return null;
        })
        .filter((item) => item !== null);

    return {
        id: moduleId,
        name: moduleName || undefined,
        content,
    };
}
