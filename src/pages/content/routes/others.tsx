import CourseTabs from "@/components/course-tabs";
import PageWrapper from "@/components/page-wrapper";
import { useCourseName } from "@/hooks/use-course-name";
import { useParams } from "@solidjs/router";
import { Show } from "solid-js";

const Others = () => {
    const params = useParams();

    const courseName = useCourseName(params.courseId, true);

    return (
        <Show when={params.courseId} keyed fallback={<div>Course ID not found</div>}>
            <PageWrapper
                title={courseName()}
                allowBack={true}
                hideOverflow={false}
                centerElement={<CourseTabs courseId={params.courseId} value="others" />}
            >
                <iframe
                    src={`https://bright.uvic.ca/d2l/home/${params.courseId}`}
                    class="w-full h-full"
                ></iframe>
            </PageWrapper>
        </Show>
    );
};

export default Others;
