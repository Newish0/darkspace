import CourseHome from "@/components/course-home";
import { RouteSectionProps, useParams } from "@solidjs/router";
import { Component, Show } from "solid-js";

const CoursePageWrapper: Component<RouteSectionProps<unknown>> = (props) => {
    const params = useParams();

    return (
        <Show when={params.courseId} keyed fallback={<div>Course ID not found</div>}>
            {(courseId) => <CourseHome courseId={courseId}>{props.children}</CourseHome>}
        </Show>
    );
};

export default CoursePageWrapper;
