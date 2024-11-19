interface ISubmissionFile {
    filename: string;
    filesize?: string;
    status: "read" | "unread" | "deleted";
    url?: string;
}

interface ISubmission {
    submissionId: string;
    submitter: {
        name: string;
        userId: string;
    };
    dateSubmitted: string;
    files: ISubmissionFile[];
}

interface IAssignmentInfo {
    assignmentName: string;
    assignmentType: string;
    groupCategory?: string;
    groupName?: string;
    submissions: ISubmission[];
}

function parseSubmissionsHTML(html: string): IAssignmentInfo {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Extract assignment info
    const assignmentInfo: IAssignmentInfo = {
        assignmentName: doc.querySelector("select option[selected]")?.textContent?.trim() || "",
        assignmentType: doc.querySelector("tr#z_d label")?.textContent?.trim() || "",
        groupCategory: doc.querySelector("tr#z_e label")?.textContent?.trim(),
        groupName: doc.querySelector("tr#z_f label")?.textContent?.trim(),
        submissions: [],
    };

    // Find all submission rows (direct children of the table)
    const submissionRows = Array.from(doc.querySelectorAll("table#z_g > tbody > tr"));
    // .filter(
    //     (row) => row.querySelector("label:first-child")?.textContent?.trim()
    // );

    console.log("submissionRows", submissionRows);

    const processFileRow = (row: Element) => {
        const file = processFileCell(row.querySelector("td:nth-child(2)"));
        return file;
    };

    const processMainRow = (row: Element) => {
        const submissionId = row.querySelector("label")?.textContent?.trim() || "";
        const submitterLink = row.querySelector("td.d_gc a");
        const dateSubmitted = row.querySelector("td:last-child label")?.textContent?.trim() || "";
        const file = processFileRow(row);

        const submission: ISubmission = {
            submissionId,
            submitter: {
                name: submitterLink?.textContent?.trim() || "",
                userId: extractUserId(submitterLink?.getAttribute("onclick") || ""),
            },
            dateSubmitted,
            files: file ? [file] : [],
        };

        return submission;
    };

    // Process each submission row.
    // NOTE: each row can be either a main submission row or
    //       a file row that is part of the last submission row.
    for (let i = 0; i < submissionRows.length; i++) {
        const row = submissionRows[i];
        const isFileRow = !row.querySelector("label:first-child")?.textContent?.trim();

        if (isFileRow) {
            const file = processFileRow(row);
            if (file) {
                assignmentInfo.submissions?.at(-1)?.files.push(file);
            }
        } else {
            const submission = processMainRow(row);
            if (submission) {
                assignmentInfo.submissions.push(submission);
            }
        }
    }

    return assignmentInfo;
}

function processFileCell(cell: Element | null): ISubmissionFile | null {
    if (!cell) return null;

    const isDeleted = cell.textContent?.includes("(file deleted)");
    const fileLink = cell.querySelector("a");
    const fileSpan = cell.querySelector(".dfl span");
    const fileSizeSpan = cell.querySelector(".dfl span + span");
    const readStatus = cell.querySelector(".di_s_icon d2l-icon")?.getAttribute("alt");

    return {
        filename: fileLink?.querySelector("span")?.textContent || fileSpan?.textContent || "",
        filesize: fileSizeSpan?.textContent?.trim().replace(/[()]/g, "") || undefined,
        status: isDeleted
            ? "deleted"
            : readStatus?.toLowerCase().includes("read")
            ? "read"
            : "unread",
        url: fileLink?.getAttribute("href") || undefined,
    };
}

function extractUserId(onclick: string): string {
    const match = onclick.match(/EmailUser\((\d+)\)/);
    return match ? match[1] : "";
}

const URL_CONFIG = {
    SUBMISSIONS:
        "https://bright.uvic.ca/d2l/lms/dropbox/user/folders_history.d2l?db={{ASSIGNMENT_ID}}&grpid={{GROUP_ID}}&ou={{COURSE_ID}}",
};

export async function getAssignmentInfo(
    courseId: string,
    assignmentId: string,
    groupId?: string
): Promise<IAssignmentInfo> {
    const url = URL_CONFIG.SUBMISSIONS.replace("{{COURSE_ID}}", courseId)
        .replace("{{ASSIGNMENT_ID}}", assignmentId)
        .replace("{{GROUP_ID}}", groupId || "0");

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch assignment info: ${res.statusText}`);
    }
    const html = await res.text();

    return parseSubmissionsHTML(html);
}
