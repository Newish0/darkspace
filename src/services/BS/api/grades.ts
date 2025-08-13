import {
    BaseGradeObjectCategory,
    GradeObject,
    GradeObjectCategory,
    GradeValue,
    isGradeObject,
} from "./dtos/grades";
import { urlBuilder as defaultUrlBuilder } from "./url-builder";
import { Result, ok, err, ResultAsync } from "neverthrow";

type GradeObjectWithMyGradeValue = GradeObject & { MyGradeValue: GradeValue | null };

type ApiResponseError = {
    status: number;
    statusText: string;
    message: string;
    data?: unknown;
};

type UnknownError = {
    message: string;
};

type ApiError = ApiResponseError | UnknownError;

function isApiResponseError(error: ApiError): error is ApiResponseError {
    return "status" in error && "statusText" in error && "message" in error;
}

export class GradesService {
    private urlBuilder = defaultUrlBuilder;

    public constructor(urlBuilder = defaultUrlBuilder) {
        this.urlBuilder = urlBuilder;
    }

    /**
     * Gets all grades, grouped into a category object if grade is in a category (ID is not 0)
     */
    public async getGradesCategorized(
        orgUnitId: string
    ): Promise<Result<(GradeObject | GradeObjectCategory)[], ApiError>> {
        const gradesResult = await this.getGrades(orgUnitId);
        const categoriesResult = await this.getGradeCategories(orgUnitId);

        if (gradesResult.isErr()) {
            return err(gradesResult.error);
        }

        const grades = gradesResult.value;
        const categories: GradeObjectCategory[] = categoriesResult.unwrapOr([]);

        console.log("categories", categories);

        const categorizedGrades: (GradeObjectCategory | GradeObject)[] = [];
        for (const grade of grades) {
            if (grade.CategoryId == 0) {
                categorizedGrades.push(grade);
            } else {
                const existingCategory = categorizedGrades.find(
                    (gradeOrCategory) =>
                        !isGradeObject(gradeOrCategory) && gradeOrCategory.Id === grade.CategoryId
                ) as GradeObjectCategory | undefined;

                if (existingCategory) {
                    existingCategory.Grades.push(grade);
                } else {
                    const category: GradeObjectCategory = categories.find(
                        (category) => category.Id === grade.CategoryId
                    ) ?? {
                        Id: grade.CategoryId ?? -1,
                        Name: "Unknown category",
                        CanExceedMax: false,
                        ExcludeFromFinalGrade: false,
                        Weight: 0,
                        MaxPoints: 0,
                        Grades: [],
                        AutoPoints: false,
                        EndDate: null,
                        StartDate: null,
                        NumberOfHighestToDrop: null,
                        NumberOfLowestToDrop: null,
                        ShortName: "Unknown category",
                        WeightDistributionType: null,
                    };

                    console.log("category", category);

                    categorizedGrades.push({
                        ...category,
                        Grades: [grade],
                    });
                }
            }
        }

        console.log(categorizedGrades);

        return ok(categorizedGrades);
    }

    public async getGradeCategories(
        orgUnitId: string
    ): Promise<Result<GradeObjectCategory[], ApiError>> {
        try {
            const url = this.urlBuilder.buildGradeCategoriesUrl(orgUnitId);
            const res = await fetch(url);

            if (!res.ok) {
                return err({
                    status: res.status,
                    statusText: res.statusText,
                    message: "Failed to fetch grade categories",
                });
            }

            const data = await res.json();
            return ok(data);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            return err({
                message: `Failed to fetch grade categories: ${errorMessage}`,
            });
        }
    }

    public async getGrades(orgUnitId: string): Promise<Result<GradeObject[], ApiError>> {
        try {
            const url = this.urlBuilder.buildGradesUrl(orgUnitId);
            const res = await fetch(url);

            if (!res.ok) {
                return err({
                    status: res.status,
                    statusText: res.statusText,
                    message: "Failed to fetch grades",
                });
            }

            const data = await res.json();
            return ok(data);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            return err({
                message: `Failed to fetch grades: ${errorMessage}`,
            });
        }
    }

    // public async getGradesWithMyGradeValue(
    //     orgUnitId: string
    // ): Promise<GradeObjectWithMyGradeValue[]> {
    //     const grades = await this.getGrades(orgUnitId);
    //     const withMyGradeValue = await Promise.all(
    //         grades.map(async (grade) => ({
    //             ...grade,
    //             MyGradeValue: grade.Id
    //                 ? await this.getMyGradeValue(orgUnitId, grade.Id.toString())
    //                 : null,
    //         }))
    //     );
    //     return withMyGradeValue;
    // }

    // public async getUncategorizedGrades(orgUnitId: string): Promise<GradeObject[]> {
    //     const url = this.urlBuilder.buildGradesUrl(orgUnitId);
    //     const res = await fetch(url);
    //     const data: GradeObject[] = await res.json();
    //     return data.filter((grade) => !grade.CategoryId);
    // }

    // public async getGrade(orgUnitId: string, gradeId: string): Promise<GradeObject> {
    //     const url = this.urlBuilder.buildGradeUrl(orgUnitId, gradeId);
    //     const res = await fetch(url);
    //     const data = await res.json();
    //     return data;
    // }

    public async getMyFinalGradeValue(orgUnitId: string): Promise<Result<GradeValue, ApiError>> {
        try {
            const url = this.urlBuilder.buildMyFinalGradeValueUrl(orgUnitId);
            const res = await fetch(url);

            if (!res.ok) {
                return err({
                    status: res.status,
                    statusText: res.statusText,
                    message: "Failed to fetch my final grade value",
                });
            }

            const data: GradeValue = await res.json();
            return ok(data);
        } catch (error) {
            return err({
                message: `Failed to fetch my final grade value: ${error}`,
            });
        }
    }

    public async getMyGradeValue(
        orgUnitId: string,
        gradeId: string
    ): Promise<Result<GradeValue, ApiError>> {
        try {
            const url = this.urlBuilder.buildMyGradeValueUrl(orgUnitId, gradeId);
            const res = await fetch(url);

            if (!res.ok) {
                return err({
                    status: res.status,
                    statusText: res.statusText,
                    message: "Failed to fetch my grade value",
                });
            }

            const data = await res.json();
            return ok(data);
        } catch (error) {
            return err({
                message: `Failed to fetch my grade value: ${error}`,
            });
        }
    }
}

export const gradesService = new GradesService();
