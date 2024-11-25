import { htmlToDocument } from "../util";

export interface IGradeStatistics {
    averagePercentage?: number;
    distributions: IGradeDistribution[];
}

export interface IGradeDistribution {
    minGrade: number;
    maxGrade: number;
    userCount: number;
    distributionPercentage: number;
}

function parseSingleGradeDistributionLine(line: string): IGradeDistribution | null {
    // Match pattern for a single line
    const regex =
        /^(\d+\.\d+) percent of users \((\d+) users\) have an overall quiz grade between (\d+) and (\d+) percent$/;

    const match = line.match(regex);

    if (!match) {
        return null;
    }

    return {
        distributionPercentage: parseFloat(match[1]),
        userCount: parseInt(match[2], 10),
        minGrade: parseInt(match[3], 10),
        maxGrade: parseInt(match[4], 10),
    };
}

// Validation function for a single distribution
function validateSingleDistribution(dist: IGradeDistribution): string[] {
    const errors: string[] = [];

    if (dist.minGrade >= dist.maxGrade) {
        errors.push(
            `Invalid grade range: min (${dist.minGrade}) should be less than max (${dist.maxGrade})`
        );
    }

    if (dist.minGrade < 0 || dist.maxGrade > 100) {
        errors.push("Grade range should be between 0 and 100");
    }

    if (dist.userCount < 0) {
        errors.push("User count cannot be negative");
    }

    if (dist.distributionPercentage < 0 || dist.distributionPercentage > 100) {
        errors.push("Distribution percentage should be between 0 and 100");
    }

    return errors;
}

function percentageStringToNumber(percentageString: string): number {
    const percentage = Number(percentageString.replace("%", ""));
    return percentage;
}

function extractGradeStatistics(html: string): IGradeStatistics {
    const doc = htmlToDocument(html);
    const averageText = doc.querySelector(".d2l-grades-classaverage label")?.textContent?.trim();
    const averagePercentage = averageText ? percentageStringToNumber(averageText) : undefined;

    const bars = Array.from(doc.querySelectorAll('[class*="d2l-histogram-bar"]'));
    const distributions = bars
        .map((bar) => {
            const text = bar.getAttribute("title")?.trim();
            const distribution = text ? parseSingleGradeDistributionLine(text) : null;
            if (distribution) {
                const errors = validateSingleDistribution(distribution);
                if (errors.length > 0) {
                    console.warn(
                        "[scraper.grade.extractGradeStatistics] Invalid distribution found: ",
                        errors
                    );
                }
                return distribution;
            } else {
                return null;
            }
        })
        .filter((d): d is IGradeDistribution => !!d);

    return { averagePercentage, distributions };
}

export async function getGradeStatistics(statisticsUrl: string): Promise<IGradeStatistics> {
    const res = await fetch(statisticsUrl);
    const html = await res.text();
    return extractGradeStatistics(html);
}
