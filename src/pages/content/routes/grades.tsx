import CourseTabs from "@/components/course-tabs";
import GradeDisplay, { GradeCategory, GradeItem } from "@/components/grade-display";
import PageWrapper from "@/components/page-wrapper";
import { createAsyncCached } from "@/hooks/async-cached";
import { useCourseName } from "@/hooks/use-course-name";
// import { getGrades } from "@/services/BS/scraper/grades";
import { gradesService } from "@/services/BS/api/grades";
import { GradeObject, GradeObjectCategory, isGradeObject } from "@/services/BS/api/dtos/grades";
import { useParams } from "@solidjs/router";
import { Accessor, Show } from "solid-js";
import { asThrowable } from "@/utils/error";

const Grades = () => {
    const params = useParams();

    const categorizedGrades = createAsyncCached(
        async () => asThrowable(gradesService.getGradesCategorized(params.courseId)),
        {
            keys: () => ["categorized-grades", params.courseId],
        }
    );

    const courseName = useCourseName(params.courseId, true);

    const gradeDisplayItems: Accessor<(GradeItem | GradeCategory)[] | undefined> = () => {
        const mapGradeObjectToGradeItem = (grade: GradeObject): GradeItem => {
            return {
                id: grade.Id ? grade.Id.toString() : "0",
                name: grade.Name,
                canExceedMax: "CanExceedMaxPoints" in grade ? grade.CanExceedMaxPoints : false,
                excludeFromFinalGrade:
                    "ExcludeFromFinalGradeCalculation" in grade
                        ? grade.ExcludeFromFinalGradeCalculation
                        : false,
                weight: grade.Weight,
                maxPoints: "MaxPoints" in grade ? grade.MaxPoints : undefined,
                description: grade.Description.Html || grade.Description.Text,
                isBonus: "IsBonus" in grade ? grade.IsBonus : false,
            };
        };

        const mapGradeObjectCategoryToGradeCategory = (
            category: GradeObjectCategory
        ): GradeCategory => {
            return {
                id: `${category.Id}`,
                name: category.Name,
                canExceedMax: category.CanExceedMax,
                excludeFromFinalGrade: category.ExcludeFromFinalGrade,
                weight: category.Weight,
                maxPoints: category.MaxPoints,
                childGrades: category.Grades.map(mapGradeObjectToGradeItem),
                startDate: category.StartDate,
                endDate: category.EndDate,
                numberOfHighestToDrop: category.NumberOfHighestToDrop,
                numberOfLowestToDrop: category.NumberOfLowestToDrop,
            };
        };

        return categorizedGrades()?.map((gradeOrCategory) =>
            isGradeObject(gradeOrCategory)
                ? mapGradeObjectToGradeItem(gradeOrCategory)
                : mapGradeObjectCategoryToGradeCategory(gradeOrCategory)
        );
    };

    return (
        <PageWrapper
            title={courseName()}
            allowBack={true}
            hideOverflow={false}
            centerElement={<CourseTabs courseId={params.courseId} value="grades" />}
        >
            <div class="pb-2">
                <Show when={gradeDisplayItems()} keyed>
                    {(data) => <GradeDisplay items={data} orgUnitId={params.courseId} />}
                </Show>
            </div>
        </PageWrapper>
    );
};

export default Grades;
