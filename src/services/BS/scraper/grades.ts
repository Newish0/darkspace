import {
    buildFinalGradesListUrl,
    buildGradesListUrl,
    buildRubricUrl,
    buildStatisticUrl,
} from "../url";

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
    statisticUrl?: string;
};

export type IGradeData = {
    finalGrade?: {
        calculatedScore?: IGradeScore;
        adjustedScore?: IGradeScore;
        categories: IGradeCategory[];
    };
    categories: IGradeCategory[];
};

const EXPECTED_GRADE_HEADERS = [
    "Grade Item",
    "Points",
    "Weight Achieved",
    "Grade",
    "Comments and Assessments",
];

const EXPECTED_FINAL_GRADE_HEADERS = ["Grade Item", "Weight Achieved"];

const FINAL_GRADE_CALC_NAME = "Calculated Final Grade";
const FINAL_GRADE_ADJUSTED_NAME = "Final Adjusted Grade";

function extractInputValue(strOrHtml: string) {
    const tmpEln = document.createElement("div");
    tmpEln.innerHTML = strOrHtml;
    return tmpEln.textContent;
}
/**
 * Extract points from a string of the format "score/total" or "-/total".
 *
 * @param input - A string of the format "score/total" or "-/total"
 * @returns An array of [score, total] where score is the extracted score and total is the total points.
 *          If the score is missing or dash, returns [undefined, total]
 */
function extractPoints(input: string): [number | undefined, number] {
    // Remove any whitespace
    const cleaned = input.replace(/\s/g, "");

    // Match pattern: optional number or dash, followed by slash, followed by number
    const match = cleaned.match(/^([\d.]+|\-)?\/(\d+\.?\d*)$/);

    if (!match) {
        throw new Error('Invalid score format. Expected format: "score/total" or "-/total"');
    }

    const [_, scoreStr, totalStr] = match;
    const total = parseFloat(totalStr);

    // Handle case where score is missing or dash
    if (!scoreStr || scoreStr === "-") {
        return [undefined, total] as const;
    }

    const score = parseFloat(scoreStr);

    return [score, total] as const;
}

function isCategoryRow(rowTexts: string[], isFinalScore = false): boolean {
    if (isFinalScore) {
        return rowTexts.length === 1;
    }

    if (rowTexts.length !== 4) return false;

    return (
        rowTexts[0] === "" &&
        rowTexts[1].includes("/") &&
        rowTexts[2].includes("%") &&
        rowTexts[3] === ""
    );
}

function isTopLevelRow(rowTexts: string[], isFinalScore = false): boolean {
    if (isFinalScore) return rowTexts.length === 2;

    return rowTexts.length === 4 || rowTexts.length === 3;
}

function removeIsDropped(text: string): string {
    return text.replace("Dropped!", "");
}
function hasIsDropped(text: string): boolean {
    return text.includes("Dropped!");
}

function getFeedback(row: HTMLTableRowElement, courseId: string) {
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
        rubricUrl = buildRubricUrl(courseId, objectId, userId, rubricId);
    }

    return { comments, rubricUrl } as const;
}

function getStatistic(thElement: HTMLTableCellElement, courseId: string): string | undefined {
    const onclickJS = thElement.querySelector("a")?.getAttribute("onclick");
    const match = onclickJS?.match(/(\d+)/);
    const objectId = match?.[1];

    if (!objectId) return undefined;

    return buildStatisticUrl(courseId, objectId);
}

function extractFinalScore(html: string): IGradeData["finalGrade"] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // List of rows in the main grades table
    const mainRows: HTMLTableRowElement[] = Array.from(doc.querySelectorAll(".d2l-table tr"));

    console.log("mainRows", mainRows);

    const headerElements = mainRows.at(0)?.querySelectorAll("th");
    const headers = Array.from(headerElements || []).map(
        (header) => header.textContent?.trim() || ""
    );
    if (
        !headers.every((header) => EXPECTED_FINAL_GRADE_HEADERS.includes(header)) ||
        headers.length !== EXPECTED_FINAL_GRADE_HEADERS.length
    ) {
        console.warn(
            "[scraper.grade.extractGrades] Unexpected grade headers found.",
            "\n\t Expected headers:",
            EXPECTED_GRADE_HEADERS,
            "\n\t Found headers:",
            headers
        );
    }

    const finalGradeData: IGradeData["finalGrade"] = {
        calculatedScore: undefined,
        adjustedScore: undefined,
        categories: [],
    };

    for (const row of mainRows.slice(1)) {
        const tdElements = Array.from(row.querySelectorAll("td"));
        const thElement = row.querySelector("th");
        const tdTexts = tdElements.map((td) => td.textContent?.trim() || "");
        const cleanedTdTexts = tdTexts.map(removeIsDropped);
        const name = thElement?.textContent?.trim() || "";

        // Ignore empty rows
        if (!name && cleanedTdTexts.every((text) => !text)) continue;

        if (name === FINAL_GRADE_CALC_NAME) {
            const [weightAchieved] = cleanedTdTexts;

            finalGradeData.calculatedScore = {
                weightAchieved,
            };
        } else if (name === FINAL_GRADE_ADJUSTED_NAME) {
            const [weightAchieved] = cleanedTdTexts;

            finalGradeData.adjustedScore = {
                weightAchieved,
            };
        } else if (isCategoryRow(tdTexts, true)) {
            const [weightAchieved] = cleanedTdTexts;

            finalGradeData.categories.push({
                name,
                items: [],
                score: {
                    weightAchieved,
                },
            });
        } else {
            const [_, weightAchieved] = cleanedTdTexts;

            const currentCategory = finalGradeData.categories.at(-1);
            currentCategory?.items.push({
                name,
                score: {
                    weightAchieved,
                },
            });
        } // if elses
    } // for

    return finalGradeData;
}

function extractGrades(html: string, courseId: string): { hasFinalScore: boolean } & IGradeData {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // List of rows in the top final grades table
    const topFinalGradeRows = Array.from(doc.querySelectorAll("table[role='presentation'] tr"));

    // HACK: Find the final calculated grade.
    //       We actually don't know if this is the calculated or adjusted grade
    //       because I can't find an example of adjusted grades with no detail
    //       distribution list.
    const finalWeight = topFinalGradeRows
        .find((row) => row.textContent?.includes("/"))
        ?.textContent?.trim();

    const hasFinalScore = topFinalGradeRows.length > 0;

    // List of rows in the main grades table
    const mainRows: HTMLTableRowElement[] = Array.from(doc.querySelectorAll(".d2l-table tr"));

    const gradeData: ReturnType<typeof extractGrades> = {
        hasFinalScore,
        finalGrade: hasFinalScore
            ? {
                  calculatedScore: finalWeight
                      ? {
                            weightAchieved: finalWeight,
                        }
                      : undefined,
                  adjustedScore: undefined,
                  categories: [],
              }
            : undefined,
        categories: [],
    };

    const headerElements = mainRows.at(0)?.querySelectorAll("th");
    const headers = Array.from(headerElements || []).map(
        (header) => header.textContent?.trim() || ""
    );
    if (
        !headers.every((header) => EXPECTED_GRADE_HEADERS.includes(header)) ||
        headers.length !== EXPECTED_GRADE_HEADERS.length
    ) {
        console.warn(
            "[scraper.grade.extractGrades] Unexpected grade headers found.",
            "\n\t Expected headers:",
            EXPECTED_GRADE_HEADERS,
            "\n\t Found headers:",
            headers
        );
    }

    const hasWeightAchieved = headers.includes("Weight Achieved");

    for (const row of mainRows.slice(1)) {
        const tdElements = Array.from(row.querySelectorAll("td"));
        const thElement = row.querySelector("th");

        let tdTexts = tdElements.map((td) => td.textContent?.trim() || "");

        // Add missing weight achieved so it can be parsed
        if (!hasWeightAchieved) {
            const index = tdTexts.length === 3 ? 1 : 2;
            tdTexts.splice(index, 0, "- / -");
        }

        const cleanedTdTexts = tdTexts.map(removeIsDropped);
        const isDropped = tdTexts.some(hasIsDropped);
        const name = thElement?.textContent?.trim() || "";

        const statisticUrl = thElement ? getStatistic(thElement, courseId) : undefined;

        if (isCategoryRow(tdTexts)) {
            const [_, weightAchieved, percentage] = cleanedTdTexts;

            gradeData.categories.push({
                name,
                items: [],
                score: {
                    weightAchieved,
                    percentage,
                    isDropped,
                },
            });
        } else if (isTopLevelRow(tdTexts)) {
            const [points, weightAchieved, percentage] = cleanedTdTexts;
            const { comments, rubricUrl } = getFeedback(row, courseId);

            gradeData.categories.push({
                name,
                score: {
                    points,
                    weightAchieved,
                    percentage,
                    isDropped,
                },
                comments,
                rubricUrl,
                statisticUrl,
                items: [],
            });
        } else {
            const [_, points, weightAchieved, percentage] = cleanedTdTexts;
            const { comments, rubricUrl } = getFeedback(row, courseId);

            const currentCategory = gradeData.categories.at(-1);
            currentCategory?.items.push({
                name,
                score: {
                    points,
                    weightAchieved,
                    percentage,
                    isDropped,
                },
                comments,
                rubricUrl,
                statisticUrl,
            });
        } // if elses
    } // for

    return gradeData;
}

export async function getGrades(courseId: string): Promise<IGradeData> {
    const url = buildGradesListUrl(courseId);

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch grades: ${res.statusText}`);
    }
    const html = await res.text();

    const { hasFinalScore, ...grades } = extractGrades(html, courseId);

    if (hasFinalScore) {
        const finalGradeUrl = buildFinalGradesListUrl(courseId);

        const finalGradeRes = await fetch(finalGradeUrl);

        // Get detailed final grades if available
        if (finalGradeRes.ok) {
            const finalHtml = await finalGradeRes.text();

            return {
                ...grades,
                finalGrade: extractFinalScore(finalHtml),
            };
        }
    }

    return grades;
}
