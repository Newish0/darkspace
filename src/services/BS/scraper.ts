import DOMPurify from "dompurify";
import { getUnstableCourseContent, UnstableModule } from "./api";

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
    description?: {
        text: string;
        html: string;
    };
    children?: IModule[];
}

function htmlToDocument(unsafeHtml: string, sanitize = false) {
    const parser = new DOMParser();
    const sanitizedHtml = sanitize ? DOMPurify.sanitize(unsafeHtml) : unsafeHtml;
    return parser.parseFromString(sanitizedHtml, "text/html");
}

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

function getAdditionalModules(doc: Document): IModule[] {
    // Add Overview, Bookmarks, and Course Schedule modules
    const additionalModuleTree = doc.querySelector(COURSE_MODULE_PLUGIN_TREE_SELECTOR);

    const additionalModules = Array.from(additionalModuleTree?.children ?? [])
        .filter((child) => child.tagName === "LI")
        .map((child) => extractModuleInfo(child));

    return additionalModules;
}

function getRootModules(doc: Document): IModule[] {
    const moduleTree = doc.querySelector(COURSE_MODULE_MODULE_TREE_SELECTOR);

    const rootModules = Array.from(moduleTree?.children ?? [])
        .filter((child) => child.tagName === "LI")
        .map((child) => extractModuleInfo(child));

    return rootModules;
}

export async function getCourseModules(courseId: string, useUnstable = true): Promise<IModule[]> {
    const html = await fetch(COURSE_MODULE_URL.replace("{{COURSE_ID}}", courseId)).then((res) =>
        res.text()
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

// const MODULE_CONTENT_URL =
//     "https://bright.uvic.ca/d2l/le/content/{{COURSE_ID}}/ModuleDetailsPartial?mId={{MODULE_ID}}&_d2l_prc&writeHistoryEntry=1";
const MODULE_CONTENT_URL =
    "https://bright.uvic.ca/d2l/le/content/{{COURSE_ID}}/PartialMainView?identifier={{MODULE_ID}}&_d2l_prc";

async function getModuleContentFromD2LPartial(
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

const CONTENT_SVC_URL = "https://bright.uvic.ca/d2l/le/contentservice/topic/{{TOPIC_ID}}/launch";

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
                        url = CONTENT_SVC_URL.replace("{{TOPIC_ID}}", t.TopicId.toString());
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

const QIAI_SELECTORS = {
    FORM: "form",
    ATTEMPT_TABLE: "table#z_c",
    ATTEMPT_ROW: "table#z_c tr:not(.d_gh)",
    ATTEMPT_LINK: "a.d2l-link",
    LATE_NOTE: ".ds_a",
    GRADE_CELL: "td.d_gn",
    POINTS_LABEL: 'label[id^="z_"]',
    TOTAL_POINTS_LABEL: 'label[id^="z_"]:nth-of-type(3)',
    PERCENTAGE_LABEL: 'label[id^="z_"]:last-child',
};

const QIAI_REGEX = {
    QUIZ_ID: /qi=(\d+)/,
    ATTEMPT_ID: /ai=(\d+)/,
};

const URL_BASE = "https://bright.uvic.ca";

function extractQuizSubmissions(html: string): IQuizSubmission[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const submissions: IQuizSubmission[] = [];

    const form = doc.querySelector(QIAI_SELECTORS.FORM);
    const quizId = form?.getAttribute("action")?.match(QIAI_REGEX.QUIZ_ID)?.[1] || "";

    const rows = doc.querySelectorAll(QIAI_SELECTORS.ATTEMPT_ROW);

    rows.forEach((row, index) => {
        if (!(row instanceof HTMLTableRowElement)) return;
        if (row.cells.length < 2) return;

        const attemptLink = row.querySelector(QIAI_SELECTORS.ATTEMPT_LINK);
        if (!attemptLink) return;

        const attemptUrl = new URL(attemptLink.getAttribute("href") || "", URL_BASE).href;
        const attemptId = attemptUrl.match(QIAI_REGEX.ATTEMPT_ID)?.[1] || "";
        const attemptNumber = index + 1;

        const lateNote =
            row.querySelector(QIAI_SELECTORS.LATE_NOTE)?.textContent?.trim() || undefined;

        const gradeCell = row.querySelector(QIAI_SELECTORS.GRADE_CELL);
        const pointsLabel = gradeCell?.querySelector(QIAI_SELECTORS.POINTS_LABEL)?.textContent;
        const totalPointsLabel = gradeCell?.querySelector(
            QIAI_SELECTORS.TOTAL_POINTS_LABEL
        )?.textContent;
        const percentageLabel = gradeCell?.querySelector(
            QIAI_SELECTORS.PERCENTAGE_LABEL
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

// Constants to avoid magic strings
const QI_SELECTORS = {
    QUIZ_ROW: 'table[type="list"] tr:not(.d_gh):not([colspan])',
    NAME_LINK: "a.d2l-link.d2l-link-inline",
    DATE_SPAN: ".ds_b",
    ATTEMPTS_CELL: "td.d_gn.d_gc",
    FEEDBACK_CELL: "td.d_gn",
    IN_PROGRESS_IMG: 'img[alt="You have an attempt in progress"]',
};

const QI_REGEX = {
    QUIZ_ID: /GoToQuiz\((\d+)/,
    COURSE_ID: /ou=(\d+)/,
    DUE_DATE: /Due on (.*?)(?=$|\n)/,
    AVAILABLE_DATE: /Available on (.*?) until (.*?)(?=$|\n)/,
};

const QI_URL_TEMPLATE = {
    QUIZ_SUMMARY:
        "https://bright.uvic.ca/d2l/lms/quizzing/user/quiz_summary.d2l?qi={{QUIZ_ID}}&ou={{COURSE_ID}}",
    QUIZZES_LIST: "https://bright.uvic.ca/d2l/lms/quizzing/user/quizzes_list.d2l?ou={{COURSE_ID}}",
};

function extractQuizInfo(htmlString: string): IQuizInfo[] {
    const document = htmlToDocument(htmlString);
    const quizRows = document.querySelectorAll(QI_SELECTORS.QUIZ_ROW);

    console.log("Found", quizRows.length, "quizzes");

    return Array.from(quizRows).map((row) => {
        const quizInfo: IQuizInfo = { name: "" };

        extractNameAndUrl(row, quizInfo, document);
        extractDates(row, quizInfo);
        extractAttempts(row, quizInfo);
        determineStatus(row, quizInfo);
        extractQuizSubmissionsUrl(row, quizInfo);

        return quizInfo;
    });
}

function extractNameAndUrl(row: Element, quizInfo: IQuizInfo, document: Document): void {
    const nameLink = row.querySelector(QI_SELECTORS.NAME_LINK);
    if (nameLink) {
        quizInfo.name = nameLink.textContent?.trim() || "";
        const onclick = nameLink.getAttribute("onclick");
        const idMatch = onclick?.match(QI_REGEX.QUIZ_ID);
        if (idMatch) {
            quizInfo.id = idMatch[1];
            const courseId = document
                .querySelector("form")
                ?.getAttribute("action")
                ?.match(QI_REGEX.COURSE_ID)?.[1];
            quizInfo.url = QI_URL_TEMPLATE.QUIZ_SUMMARY.replace("{{QUIZ_ID}}", quizInfo.id).replace(
                "{{COURSE_ID}}",
                courseId || ""
            );
        }
    }
}

function extractDates(row: Element, quizInfo: IQuizInfo): void {
    const dateSpan = row.querySelector(QI_SELECTORS.DATE_SPAN);
    if (dateSpan) {
        const dateText = dateSpan.textContent || "";
        const dueDateMatch = dateText.match(QI_REGEX.DUE_DATE);
        if (dueDateMatch) {
            quizInfo.dueDate = dueDateMatch[1].trim();
        }
        const availableMatch = dateText.match(QI_REGEX.AVAILABLE_DATE);
        if (availableMatch) {
            quizInfo.startDate = availableMatch[1].trim();
            quizInfo.endDate = availableMatch[2].trim();
        }
    }
}

function extractAttempts(row: Element, quizInfo: IQuizInfo): void {
    const attemptsCell = row.querySelector(QI_SELECTORS.ATTEMPTS_CELL);
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
    const feedbackCell = row.querySelector(QI_SELECTORS.FEEDBACK_CELL);

    if (feedbackCell) {
        const url = feedbackCell.querySelector("a")?.getAttribute("href");
        if (url) {
            quizInfo.submissionsUrl = new URL(url, URL_BASE).href;
        }
    }
}

function determineStatus(row: Element, quizInfo: IQuizInfo): void {
    const feedbackCell = row.querySelector(QI_SELECTORS.FEEDBACK_CELL);
    const attemptsCell = row.querySelector(QI_SELECTORS.ATTEMPTS_CELL);

    // const inProgress = attemptsCell
    //     ?.querySelector("img")
    //     ?.getAttribute("alt")
    //     ?.toLowerCase()
    //     .includes("attempt in progress");

    if (feedbackCell) {
        const feedbackText = feedbackCell.textContent || "";
        if (feedbackText.toLowerCase().includes("feedback")) {
            if (row.querySelector(QI_SELECTORS.IN_PROGRESS_IMG)) {
                quizInfo.status = "retry-in-progress";
            } else {
                quizInfo.status = "completed";
            }
        } else if (row.querySelector(QI_SELECTORS.IN_PROGRESS_IMG)) {
            quizInfo.status = "in-progress";
        } else {
            quizInfo.status = "not-started";
        }
    }
}

export async function getQuizzes(courseId: string): Promise<IQuizInfo[]> {
    const url = QI_URL_TEMPLATE.QUIZZES_LIST.replace("{{COURSE_ID}}", courseId);
    const html = await fetch(url).then((res) => res.text());
    return extractQuizInfo(html);
}
