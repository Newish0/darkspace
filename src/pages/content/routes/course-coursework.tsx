import CourseTabs from "@/components/course-tabs";
import PageWrapper from "@/components/ui/page-wrapper";
import { useParams } from "@solidjs/router";
import { Show } from "solid-js";

const CourseCoursework = () => {
    const params = useParams();

    console.log("Course", params.courseId);

    if (!params.courseId) {
        return <div>Course ID not found</div>;
    }

    return (
        <Show when={params.courseId} keyed>
            <PageWrapper
                title="Coursework"
                allowBack={true}
                centerElement={<CourseTabs courseId={params.courseId} value="coursework" />}
            >
                <p>Course ID: {params.courseId}</p>
            </PageWrapper>
        </Show>
    );
};

export default CourseCoursework;
