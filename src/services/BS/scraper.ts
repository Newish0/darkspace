// ======= Types & Interfaces =======
import { getUnstableCourseContent, UnstableModule } from "./api/unstable-module";
import { htmlToDocument, parseD2LPartial } from "@/services/BS/util";

export interface IModule {
    name: string;
    moduleId: string;
    description?: {
        text: string;
        html: string;
    };
    children?: IModule[];
}

export interface IAnnouncement {
    html: string;
    title?: string;
    dateTime?: string;
}

export interface IModuleTopic {
    id: string;
    name?: string;
    type?: "File" | "Link" | "ContentService" | string;
    downloadable?: boolean;
    url: string;
}

export interface IModuleDetails {
    id: string;
    name?: string;
    topics: IModuleTopic[];
    description?: {
        text?: string;
        html?: string;
    };
}

export interface IQuizSubmission {
    quizId: string;
    attemptNumber: number;
    attemptId: string;
    attemptUrl: string;
    gradePercentage?: number;
    totalPoints?: number;
    points?: number;
    lateNote?: string;
}

export interface IQuizInfo {
    name: string;
    dueDate?: string;
    startDate?: string;
    endDate?: string;
    url?: string;
    id?: string;
    attempts?: number;
    attemptsAllowed?: number;
    status?: "completed" | "in-progress" | "not-started" | "retry-in-progress";
    submissionsUrl?: string;
}

// ======= Constants =======
const URL_CONFIG = {
    BASE: "https://bright.uvic.ca",
    COURSE_MODULE: "https://bright.uvic.ca/d2l/le/content/{{COURSE_ID}}/Home",
    COURSE_ANNOUNCEMENTS: "https://bright.uvic.ca/d2l/lms/news/main.d2l?ou={{CLASS_ID}}",
    MODULE_CONTENT:
        "https://bright.uvic.ca/d2l/le/content/{{COURSE_ID}}/PartialMainView?identifier={{MODULE_ID}}&_d2l_prc",
    CONTENT_SERVICE: "https://bright.uvic.ca/d2l/le/contentservice/topic/{{TOPIC_ID}}/launch",
    QUIZ_SUMMARY:
        "https://bright.uvic.ca/d2l/lms/quizzing/user/quiz_summary.d2l?qi={{QUIZ_ID}}&ou={{COURSE_ID}}",
    QUIZZES_LIST: "https://bright.uvic.ca/d2l/lms/quizzing/user/quizzes_list.d2l?ou={{COURSE_ID}}",
};

const SELECTORS = {
    MODULE: {
        TREE: "#D2L_LE_Content_TreeBrowser",
        PLUGIN_TREE: "#ContentPluginTree",
        ITEM_ID_PATTERN: "TreeItem",
        ITEM: `[id^="TreeItem"]`,
    },
    ANNOUNCEMENTS: {
        MAIN: "#RT_Body > d2l-html-block",
    },
    QUIZ: {
        ROW: 'table[type="list"] tr:not(.d_gh):not([colspan])',
        NAME_LINK: "a.d2l-link.d2l-link-inline",
        DATE_SPAN: ".ds_b",
        ATTEMPTS_CELL: "td.d_gn.d_gc",
        FEEDBACK_CELL: "td.d_gn",
        IN_PROGRESS_IMG: 'img[alt="You have an attempt in progress"]',
    },
    QUIZ_SUBMISSION: {
        FORM: "form",
        ATTEMPT_TABLE: "table#z_c",
        ATTEMPT_ROW: "table#z_c tr:not(.d_gh)",
        ATTEMPT_LINK: "a.d2l-link",
        LATE_NOTE: ".ds_a",
        GRADE_CELL: "td.d_gn",
        POINTS_LABEL: 'label[id^="z_"]',
        TOTAL_POINTS_LABEL: 'label[id^="z_"]:nth-of-type(3)',
        PERCENTAGE_LABEL: 'label[id^="z_"]:last-child',
    },
};

const REGEX_PATTERNS = {
    QUIZ_ID_FROM_ONCLICK: /(\d+)/,
    QUIZ_ID_FROM_URL: /qi=(\d+)/,
    ATTEMPT_ID: /ai=(\d+)/,
    COURSE_ID: /ou=(\d+)/,
    DUE_DATE: /Due on (.*?)(?=$|\n)/,
    AVAILABLE_DATE: /Available on (.*?) until (.*?)(?=$|\n)/,
};

function extractModuleInfo(element: Element): IModule {
    const idElement = element.querySelector(SELECTORS.MODULE.ITEM);

    const module: IModule = {
        name: idElement?.querySelector("div")?.textContent || "",
        moduleId: idElement ? idElement.id.replace(SELECTORS.MODULE.ITEM_ID_PATTERN, "") : "",
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

function getAdditionalModules(doc: Document): IModule[] {
    // Add Overview, Bookmarks, and Course Schedule modules
    const additionalModuleTree = doc.querySelector(SELECTORS.MODULE.PLUGIN_TREE);

    const additionalModules = Array.from(additionalModuleTree?.children ?? [])
        .filter((child) => child.tagName === "LI")
        .map((child) => extractModuleInfo(child));

    return additionalModules;
}

function getRootModules(doc: Document): IModule[] {
    const moduleTree = doc.querySelector(SELECTORS.MODULE.TREE);

    const rootModules = Array.from(moduleTree?.children ?? [])
        .filter((child) => child.tagName === "LI")
        .map((child) => extractModuleInfo(child));

    return rootModules;
}

export async function getCourseModules(courseId: string, useUnstable = true): Promise<IModule[]> {
    const html = await fetch(URL_CONFIG.COURSE_MODULE.replace("{{COURSE_ID}}", courseId)).then(
        (res) => res.text()
    );
    const doc = htmlToDocument(html);

    const additionalModules = getAdditionalModules(doc);
    let rootModules: IModule[] = [];

    if (useUnstable) {
        const unstableContent = await getUnstableCourseContent(courseId);

        const unstableModuleToIModule = (um: UnstableModule): IModule => {
            return {
                name: um.Title,
                description: {
                    text: um.Description.Text,
                    html: um.Description.Html,
                },
                moduleId: um.ModuleId.toString(),
                children: um.Modules.map(unstableModuleToIModule),
            };
        };

        rootModules = unstableContent.Modules.map(unstableModuleToIModule);
    } else {
        rootModules = getRootModules(doc);
    }

    return [...additionalModules, ...rootModules];
}

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
    const htmlString = await fetch(
        URL_CONFIG.COURSE_ANNOUNCEMENTS.replace("{{CLASS_ID}}", courseId)
    ).then((res) => res.text());
    const doc = htmlToDocument(htmlString, false);

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
    return Array.from(doc.querySelectorAll(SELECTORS.ANNOUNCEMENTS.MAIN)).map((eln) => {
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

async function getModuleContentFromD2LPartial(
    courseId: string,
    moduleId: string
): Promise<IModuleDetails> {
    const d2lPartial = await fetch(
        URL_CONFIG.MODULE_CONTENT.replace("{{COURSE_ID}}", courseId).replace(
            "{{MODULE_ID}}",
            moduleId
        )
    ).then((res) => res.text());

    const d2lPartialParsed = parseD2LPartial(d2lPartial);

    if (!d2lPartialParsed?.Payload?.Html) {
        throw new Error("Failed to extract module content: Payload.Html not found");
    }

    const doc = htmlToDocument(d2lPartialParsed.Payload.Html);

    const moduleName = doc.querySelector("h1.d2l-page-title")?.textContent;

    // Find all list items that contain the relevant information
    const listItems = doc.querySelectorAll("li.d2l-datalist-item");

    // Extract data from each list item
    const topics = Array.from(listItems)
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
        topics,
    };
}

export async function getModuleContent(
    courseId: string,
    moduleId: string,
    useUnstable = true
): Promise<IModuleDetails> {
    if (useUnstable) {
        const unstableContent = await getUnstableCourseContent(courseId);

        const findModule = (m: UnstableModule) => m.ModuleId.toString() === moduleId;

        const recursiveFindModule = (m: UnstableModule): UnstableModule | undefined => {
            if (findModule(m)) {
                return m;
            } else {
                return m.Modules.find(recursiveFindModule);
            }
        };

        let um: UnstableModule | undefined = undefined;
        for (const m of unstableContent.Modules) {
            um = recursiveFindModule(m);
            if (um) break;
        }

        if (!um) {
            throw new Error("Module not found");
        }

        console.log("[getModuleContent] Found module", um);

        return {
            name: um.Title || undefined,
            id: um.ModuleId.toString(),
            topics:
                um.Topics.map((t) => {
                    let url = t.Url;

                    if (t.IsContentServiceAudioOrVideo) {
                        // url = t.ContentUrl;
                        url = URL_CONFIG.CONTENT_SERVICE.replace(
                            "{{TOPIC_ID}}",
                            t.TopicId.toString()
                        );
                    }

                    const topic = {
                        name: t.Title,
                        type: t.TypeIdentifier, // OR t.Url.split(".").at(-1) || ""; // TODO: infer from extension
                        url,
                        id: t.TopicId.toString(),
                        downloadable: t.TypeIdentifier === "File", // TODO: handle other types
                    };
                    return topic;
                }) ?? [],
            description: {
                text: um.Description.Text,
                html: um.Description.Html,
            },
        };
    } else {
        return getModuleContentFromD2LPartial(courseId, moduleId);
    }
}

function extractQuizSubmissions(html: string): IQuizSubmission[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const submissions: IQuizSubmission[] = [];

    const form = doc.querySelector(SELECTORS.QUIZ_SUBMISSION.FORM);
    const quizId = form?.getAttribute("action")?.match(REGEX_PATTERNS.QUIZ_ID_FROM_URL)?.[1] || "";

    const rows = doc.querySelectorAll(SELECTORS.QUIZ_SUBMISSION.ATTEMPT_ROW);

    rows.forEach((row, index) => {
        if (!(row instanceof HTMLTableRowElement)) return;
        if (row.cells.length < 2) return;

        const attemptLink = row.querySelector(SELECTORS.QUIZ_SUBMISSION.ATTEMPT_LINK);
        if (!attemptLink) return;

        const attemptUrl = new URL(attemptLink.getAttribute("href") || "", URL_CONFIG.BASE).href;
        const attemptId = attemptUrl.match(REGEX_PATTERNS.ATTEMPT_ID)?.[1] || "";
        const attemptNumber = index + 1;

        const lateNote =
            row.querySelector(SELECTORS.QUIZ_SUBMISSION.LATE_NOTE)?.textContent?.trim() ||
            undefined;

        const gradeCell = row.querySelector(SELECTORS.QUIZ_SUBMISSION.GRADE_CELL);
        const pointsLabel = gradeCell?.querySelector(
            SELECTORS.QUIZ_SUBMISSION.POINTS_LABEL
        )?.textContent;
        const totalPointsLabel = gradeCell?.querySelector(
            SELECTORS.QUIZ_SUBMISSION.TOTAL_POINTS_LABEL
        )?.textContent;
        const percentageLabel = gradeCell?.querySelector(
            SELECTORS.QUIZ_SUBMISSION.PERCENTAGE_LABEL
        )?.textContent;

        const points = pointsLabel ? parseFloat(pointsLabel) : undefined;
        const totalPoints = totalPointsLabel ? parseFloat(totalPointsLabel) : undefined;
        const gradePercentage = percentageLabel ? parseFloat(percentageLabel) : undefined;

        submissions.push({
            quizId,
            attemptNumber,
            attemptId,
            attemptUrl,
            gradePercentage,
            totalPoints,
            points,
            lateNote,
        });
    });

    return submissions;
}

export async function getQuizSubmissionsFromUrl(url: string): Promise<IQuizSubmission[]> {
    const html = await fetch(url).then((res) => res.text());
    return extractQuizSubmissions(html);
}

function extractQuizInfo(htmlString: string): IQuizInfo[] {
    const doc = htmlToDocument(htmlString);
    const quizRows = doc.querySelectorAll(SELECTORS.QUIZ.ROW);

    return Array.from(quizRows).map((row) => {
        const quizInfo: IQuizInfo = { name: "" };

        extractNameAndUrl(row, quizInfo, doc);
        extractDates(row, quizInfo);
        extractAttempts(row, quizInfo);
        determineStatus(row, quizInfo);
        extractQuizSubmissionsUrl(row, quizInfo);

        return quizInfo;
    });
}

function extractNameAndUrl(row: Element, quizInfo: IQuizInfo, document: Document): void {
    const nameLink = row.querySelector(SELECTORS.QUIZ.NAME_LINK);
    if (nameLink) {
        quizInfo.name = nameLink.textContent?.trim() || "";
        const onclick = nameLink.getAttribute("onclick");
        const idMatch = onclick?.match(REGEX_PATTERNS.QUIZ_ID_FROM_ONCLICK);
        if (idMatch) {
            quizInfo.id = idMatch[1];
            const courseId = document
                .querySelector("form")
                ?.getAttribute("action")
                ?.match(REGEX_PATTERNS.COURSE_ID)?.[1];
            quizInfo.url = URL_CONFIG.QUIZ_SUMMARY.replace("{{QUIZ_ID}}", quizInfo.id).replace(
                "{{COURSE_ID}}",
                courseId || ""
            );
        }
    }
}

function extractDates(row: Element, quizInfo: IQuizInfo): void {
    const dateSpan = row.querySelector(SELECTORS.QUIZ.DATE_SPAN);

    console.log(dateSpan);
    if (dateSpan) {
        const dateText = dateSpan.textContent || "";

        let dueDateText = dateText;
        if (dateText.includes("Available")) {
            dueDateText = dateText.slice(0, dateText.indexOf("Available")).trim();
        }

        const dueDateMatch = dueDateText.match(REGEX_PATTERNS.DUE_DATE);
        if (dueDateMatch) {
            quizInfo.dueDate = dueDateMatch[1].trim();
        }

        const availableMatch = dateText.match(REGEX_PATTERNS.AVAILABLE_DATE);
        if (availableMatch) {
            quizInfo.startDate = availableMatch[1].trim();
            quizInfo.endDate = availableMatch[2].trim();
        }
    }
}

function extractAttempts(row: Element, quizInfo: IQuizInfo): void {
    const attemptsCell = row.querySelector(SELECTORS.QUIZ.ATTEMPTS_CELL);
    if (attemptsCell) {
        const attemptsText = attemptsCell.textContent || "";
        const [attempts, attemptsAllowed] = attemptsText.split("/").map((s) => s.trim());
        quizInfo.attempts = parseInt(attempts, 10);
        quizInfo.attemptsAllowed =
            attemptsAllowed.toLowerCase() === "unlimited"
                ? Infinity
                : parseInt(attemptsAllowed, 10);
    }
}

function extractQuizSubmissionsUrl(row: Element, quizInfo: IQuizInfo): void {
    const feedbackCell = row.querySelector(SELECTORS.QUIZ.FEEDBACK_CELL);

    if (feedbackCell) {
        const url = feedbackCell.querySelector("a")?.getAttribute("href");
        if (url) {
            quizInfo.submissionsUrl = new URL(url, URL_CONFIG.BASE).href;
        }
    }
}

function determineStatus(row: Element, quizInfo: IQuizInfo): void {
    const feedbackCell = row.querySelector(SELECTORS.QUIZ.FEEDBACK_CELL);
    const attemptsCell = row.querySelector(SELECTORS.QUIZ.ATTEMPTS_CELL);

    // const inProgress = attemptsCell
    //     ?.querySelector("img")
    //     ?.getAttribute("alt")
    //     ?.toLowerCase()
    //     .includes("attempt in progress");

    if (feedbackCell) {
        const feedbackText = feedbackCell.textContent || "";
        if (feedbackText.toLowerCase().includes("feedback")) {
            if (row.querySelector(SELECTORS.QUIZ.IN_PROGRESS_IMG)) {
                quizInfo.status = "retry-in-progress";
            } else {
                quizInfo.status = "completed";
            }
        } else if (row.querySelector(SELECTORS.QUIZ.IN_PROGRESS_IMG)) {
            quizInfo.status = "in-progress";
        } else {
            quizInfo.status = "not-started";
        }
    }
}

export async function getQuizzes(courseId: string): Promise<IQuizInfo[]> {
    const url = URL_CONFIG.QUIZZES_LIST.replace("{{COURSE_ID}}", courseId);
    const html = await fetch(url).then((res) => res.text());
    const quizzes = extractQuizInfo(html);
    // HACK: Filter out quizzes that don't have an ID because we can't do anything with them (Likely an error)
    if (quizzes.some((q) => !q.id)) {
        console.warn(
            "[scraper.getQuizzes] Found quiz without an ID. Likely an error with scraping."
        );
    }
    return quizzes.filter((q) => q.id);
}
