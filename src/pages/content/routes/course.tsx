import CourseHome from "@/components/course-home";
import { useParams } from "@solidjs/router";
import { Show } from "solid-js";

const Course = () => {
    const params = useParams();

    console.log("Course", params.courseId);


    return (
        <Show when={params.courseId} keyed fallback={<div>Course ID not found</div>}>
            <CourseHome courseId={params.courseId} />
        </Show>
    );
};

export default Course;
