import { TZDate } from "@date-fns/tz";
import { buildQuizSummaryUrl, buildQuizListUrl, buildFullUrl, BASE_URL } from "../url";
import { htmlToDocument } from "../util";
import { DEFAULT_TIMEZONE, getTimezone } from "../timezone";

// Types
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
    dueDate?: Date;
    startDate?: Date;
    endDate?: Date;
    url?: string;
    id?: string;
    attempts?: number;
    attemptsAllowed?: number;
    status?: "completed" | "in-progress" | "not-started" | "retry-in-progress";
    submissionsUrl?: string;
}

// Constants
const SELECTORS = {
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

        const attemptUrl = new URL(attemptLink.getAttribute("href") || "", BASE_URL).href;
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

function extractQuizInfo(htmlString: string, timezone: string): IQuizInfo[] {
    const doc = htmlToDocument(htmlString);
    const quizRows = doc.querySelectorAll(SELECTORS.QUIZ.ROW);

    return Array.from(quizRows).map((row) => {
        const quizInfo: IQuizInfo = { name: "" };

        extractNameAndUrl(row, quizInfo, doc);
        extractDates(row, quizInfo, timezone);
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
            quizInfo.url = buildQuizSummaryUrl(quizInfo.id, courseId || "");
        }
    }
}

function extractDates(row: Element, quizInfo: IQuizInfo, timezone: string): void {
    const dateSpan = row.querySelector(SELECTORS.QUIZ.DATE_SPAN);

    if (dateSpan) {
        const dateText = dateSpan.textContent || "";

        let dueDateText = dateText;
        if (dateText.includes("Available")) {
            dueDateText = dateText.slice(0, dateText.indexOf("Available")).trim();
        }

        const dueDateMatch = dueDateText.match(REGEX_PATTERNS.DUE_DATE);
        if (dueDateMatch) {
            const sysTimeDueDate = dueDateMatch[1].trim();
            quizInfo.dueDate = new TZDate(sysTimeDueDate, timezone);
        }

        const availableMatch = dateText.match(REGEX_PATTERNS.AVAILABLE_DATE);
        if (availableMatch) {
            const sysStartDate = availableMatch[1].trim();
            const sysEndDate = availableMatch[2].trim();

            quizInfo.startDate = new TZDate(sysStartDate, timezone);
            quizInfo.endDate = new TZDate(sysEndDate, timezone);
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
            quizInfo.submissionsUrl = buildFullUrl(url);
        }
    }
}

/**
 * Must be called after `extractAttempts`
 * @param row
 * @param quizInfo
 */
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

    /* HACK: Fixes completed quizzes but with pending grades */
    if (quizInfo.status === "not-started" && (quizInfo.attempts ?? 0) > 0) {
        quizInfo.status = "completed";
    }
}

export async function getQuizzes(courseId: string): Promise<IQuizInfo[]> {
    const url = buildQuizListUrl(courseId);
    const html = await fetch(url).then((res) => res.text());
    const timezone = (await getTimezone()) || DEFAULT_TIMEZONE;
    return extractQuizInfo(html, timezone);
}
