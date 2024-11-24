import CourseTabs from "@/components/course-tabs";
import GradeDisplay from "@/components/grade-display";
import PageWrapper from "@/components/page-wrapper";
import { createAsyncCached } from "@/hooks/async-cached";
import { getGrades } from "@/services/BS/scraper/grades";
import { useParams } from "@solidjs/router";
import { Show } from "solid-js";

const Grades = () => {
    const params = useParams();

    const gradeData = createAsyncCached(() => getGrades(params.courseId), {
        keys: () => ["grades", params.courseId],
    });

    return (
        <PageWrapper
            title="Grades"
            allowBack={true}
            hideOverflow={false}
            centerElement={<CourseTabs courseId={params.courseId} value="grades" />}
        >
            <Show when={gradeData()} keyed>
                {(data) => <GradeDisplay gradeData={data} />}
            </Show>
        </PageWrapper>
    );
};

export default Grades;
