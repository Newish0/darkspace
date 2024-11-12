export interface IAssignment {
    name: string;
    id?: string;
    groupId?: string;
    tags?: string[];
    group?: string;
    dueDate?: string;
    startDate?: string;
    endDate?: string;
    accessNote?: string;
    gradePercentage?: number;
    totalPoints?: number;
    points?: number;
    status?: "submitted" | "not-submitted" | "returned";
    feedbackUrl?: string;
}

const URL_CONFIG = {
    ASSIGNMENTS_LIST:
        "https://bright.uvic.ca/d2l/lms/dropbox/user/folders_list.d2l?ou={{COURSE_ID}}",
};

const SELECTORS = {
    ROW: "tr",
    TAG_CONTAINER: ".ds_i",
    HEADER_ROW: ".d_gh",
    ASSIGNMENT_NAME_CONTAINER: ".d2l-foldername-medium-font",
    ASSIGNMENT_NAME: ".d2l-foldername-medium-font strong",
    GROUP_ICON: ".di_i",
    DUE_DATE: ".d2l-dates-text strong",
    DATE_INFO: "d2l-tooltip-help li",
    SUBMISSION_STATUS: "td:nth-child(2)",
    GRADE_CONTAINER: ".d2l-grades-score",
    GRADE_LABELS: "label",
    FEEDBACK_LINK: 'a[title^="View Feedback"]',
    SUBMISSION_HISTORY_LINK: 'a[title^="Submission history"]', // New selector
    SUBMIT_FILES_LINK: 'a[title^="Submit files"]', // New selector
};

const TEXT = {
    DUE_DATE_PREFIX: "Due on ",
    AVAILABLE_ON: "Available on ",
    AVAILABLE_UNTIL: "Available until ",
    SUBMISSION: "Submission",
    NOT: "Not",
};

const INDEXES = {
    SUBMISSION_STATUS_CELL: 0,
    POINTS_LABEL: 0,
    TOTAL_POINTS_LABEL: 2,
    PERCENTAGE_LABEL: 4,
};

function parseAssignments(html: string): IAssignment[] {
    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const assignments: IAssignment[] = [];
    let currentTag = "";

    // Process each row in the table
    const rows = doc.querySelectorAll(SELECTORS.ROW);
    rows.forEach((row) => {
        // Check if this is a tag row
        const tagElement = row.querySelector(SELECTORS.TAG_CONTAINER);
        if (tagElement) {
            currentTag = tagElement.textContent?.trim() ?? "";
            return;
        }

        // Skip header rows and rows without assignment info
        if (
            row.classList.contains(SELECTORS.HEADER_ROW.slice(1)) ||
            !row.querySelector(SELECTORS.ASSIGNMENT_NAME_CONTAINER)
        ) {
            return;
        }

        const assignment: IAssignment = {
            tags: currentTag ? [currentTag] : undefined,
            name: row.querySelector(SELECTORS.ASSIGNMENT_NAME)?.textContent?.trim() ?? "",
            group: row.querySelector(SELECTORS.GROUP_ICON)?.getAttribute("title") ?? undefined,
        };

        // Extract assignment ID and group ID from links
        const historyLink: HTMLAnchorElement | null = row.querySelector(
            SELECTORS.SUBMISSION_HISTORY_LINK
        );
        const submitLink: HTMLAnchorElement | null = row.querySelector(SELECTORS.SUBMIT_FILES_LINK);
        const anyLink = historyLink || submitLink;

        if (anyLink?.href) {
            const url = new URL(anyLink.href);
            const params = new URLSearchParams(url.search);

            assignment.id = params.get("db") || undefined;
            assignment.groupId = params.get("grpid") || undefined;

            // Convert groupId "0" to undefined for individual assignments
            if (assignment.groupId === "0") {
                assignment.groupId = undefined;
            }
        }

        // Parse dates
        const dueDate = row.querySelector(SELECTORS.DUE_DATE)?.textContent?.trim();
        if (dueDate) {
            assignment.dueDate = dueDate.replace(TEXT.DUE_DATE_PREFIX, "");
        }

        // Parse availability dates and access notes
        row.querySelectorAll(SELECTORS.DATE_INFO).forEach((dateItem) => {
            const dateText = dateItem.childNodes[0].textContent?.trim() ?? "";
            const note = dateItem.querySelector("strong")?.textContent?.trim();

            if (dateText.includes(TEXT.AVAILABLE_ON)) {
                assignment.startDate = dateText.replace(TEXT.AVAILABLE_ON, "");
            } else if (dateText.includes(TEXT.AVAILABLE_UNTIL)) {
                assignment.endDate = dateText.replace(TEXT.AVAILABLE_UNTIL, "");
            }

            if (note) {
                assignment.accessNote = note;
            }
        });

        // Parse submission status
        const submissionText =
            row.querySelectorAll("td")[INDEXES.SUBMISSION_STATUS_CELL]?.textContent?.trim() ?? "";

        if (submissionText.includes(TEXT.SUBMISSION)) {
            assignment.status = "submitted";
        } else if (submissionText.includes(TEXT.NOT)) {
            assignment.status = "not-submitted";
        }

        // Parse grades
        const gradeContainer = row.querySelector(SELECTORS.GRADE_CONTAINER);

        if (gradeContainer) {
            const labels = gradeContainer.querySelectorAll(SELECTORS.GRADE_LABELS);

            const points = parseFloat(labels[INDEXES.POINTS_LABEL]?.textContent ?? "");
            const totalPoints = parseFloat(labels[INDEXES.TOTAL_POINTS_LABEL]?.textContent ?? "");
            const percentageText = labels[INDEXES.PERCENTAGE_LABEL]?.textContent ?? "";

            if (!isNaN(points)) assignment.points = points;
            if (!isNaN(totalPoints)) assignment.totalPoints = totalPoints;
            if (percentageText) {
                const percentage = parseFloat(percentageText);
                if (!isNaN(percentage)) assignment.gradePercentage = percentage;
            }
        }

        // Parse feedback URL
        const feedbackLink = row.querySelector(SELECTORS.FEEDBACK_LINK);
        if (feedbackLink) {
            assignment.status = "returned";
            assignment.feedbackUrl = feedbackLink.getAttribute("href") ?? undefined;
        }

        assignments.push(assignment);
    });

    return assignments;
}

export async function getAssignments(courseId: string): Promise<IAssignment[]> {
    const url = URL_CONFIG.ASSIGNMENTS_LIST.replace("{{COURSE_ID}}", courseId);

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch assignments: ${res.statusText}`);
    }
    const html = await res.text();

    return parseAssignments(html);
}
