import CourseTabs from "@/components/course-tabs";
import GradeDisplay from "@/components/grade-display";
import PageWrapper from "@/components/page-wrapper";
import { createAsyncCached } from "@/hooks/async-cached";
import { useCourseName } from "@/hooks/use-course-name";
import { getGrades } from "@/services/BS/scraper/grades";
import { useParams } from "@solidjs/router";
import { Show } from "solid-js";

const Grades = () => {
    const params = useParams();

    const gradeData = createAsyncCached(() => getGrades(params.courseId), {
        keys: () => ["grades", params.courseId],
    });

    const courseName = useCourseName(params.courseId, true);

    return (
        <PageWrapper
            title={courseName()}
            allowBack={true}
            hideOverflow={false}
            centerElement={<CourseTabs courseId={params.courseId} value="grades" />}
        >
            <div class="pb-2">
                <Show when={gradeData()} keyed>
                    {(data) => <GradeDisplay gradeData={data} />}
                </Show>
            </div>
        </PageWrapper>
    );
};

export default Grades;
