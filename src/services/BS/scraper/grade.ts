import { getRubricUrl } from "@/services/BS/url";

export type IGradeScore = {
    points?: string; // e.g., "27 / 30"
    percentage?: string; // e.g., "90 %"
    weightAchieved?: string; // e.g., "54 / 60"
    isDropped?: boolean;
};

export type IGradeCategory = IGradeItem & {
    items: IGradeItem[];
};

export type IGradeItem = {
    name: string;
    score: IGradeScore;
    comments?: string;
    rubricUrl?: string;
};

export type IGradeData = {
    categories: IGradeCategory[];
};

function extractInputValue(strOrHtml: string) {
    const tmpEln = document.createElement("div");
    tmpEln.innerHTML = strOrHtml;
    return tmpEln.textContent;
}

function extractGrades(html: string, courseId: string): IGradeData {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const rows = doc.querySelectorAll("tr");

    const gradeData: IGradeData = {
        categories: [],
    };

    let currentCategory: IGradeCategory | null = null;

    rows.forEach((row) => {
        // Skip header row
        if (row.classList.contains("d_gh")) return;

        const isCategory = !row.querySelector(".d_g_treeNodeImage");
        const nameCell = row.querySelector("th label");
        if (!nameCell) return;

        const name = nameCell.textContent?.trim() || "";

        // Extract score data
        const extractScore = (row: Element): IGradeScore => {
            // Get all cells including those with empty values
            const cells = Array.from(row.querySelectorAll("td.d_gn.d_gr.d_gt"));

            // Get all raw values that are not HEX colors
            const inputValues = cells.map((cell) => {
                const input = Array.from(cell.querySelectorAll("input"))
                    .filter((input) => input && !/^#[0-9A-F]{6}$/i.test(input.value))
                    .at(0);
                const inputVal = input ? extractInputValue(input?.value) : "";
                return inputVal;
            });

            const points = inputValues.at(0)?.trim() || undefined;
            const weightAchieved = inputValues.at(1)?.trim() || undefined;
            const percentage = inputValues.at(2)?.trim() || undefined;

            const isDropped = row.querySelector('[title="Dropped"]') !== null;

            return {
                points,
                percentage,
                weightAchieved: weightAchieved !== "-" ? weightAchieved : undefined,
                isDropped,
            };
        };

        // Extract comments
        const comments = row.querySelector("d2l-html-block")?.getAttribute("html")?.trim();

        // Extract rubric URL
        let rubricUrl: string | undefined = undefined;
        const rubricOnClick = row
            .querySelector("a[onclick^='ViewActivities']")
            ?.getAttribute("onclick");
        const numbers = rubricOnClick?.match(/\d+/g);
        if (numbers && numbers.length === 3) {
            const [objectId, userId, rubricId] = numbers;
            rubricUrl = getRubricUrl(courseId, objectId, userId, rubricId);
        }

        if (isCategory) {
            currentCategory = {
                name,
                items: [],
                score: extractScore(row),
            };
            if (comments) currentCategory.comments = comments;
            if (rubricUrl) currentCategory.rubricUrl = rubricUrl;
            gradeData.categories.push(currentCategory);
        } else if (currentCategory) {
            const item: IGradeItem = {
                name,
                score: extractScore(row),
            };
            if (comments) item.comments = comments;
            if (rubricUrl) item.rubricUrl = rubricUrl;

            currentCategory.items.push(item);
        }
    });

    return gradeData;
}

const URL_CONFIG = {
    GRADES_LIST: "https://bright.uvic.ca/d2l/lms/grades/my_grades/main.d2l?ou={{COURSE_ID}}",
};

export async function getGrades(courseId: string): Promise<IGradeData> {
    const url = URL_CONFIG.GRADES_LIST.replace("{{COURSE_ID}}", courseId);

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch grades: ${res.statusText}`);
    }
    const html = await res.text();

    return extractGrades(html, courseId);
}
