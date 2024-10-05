import CourseHome from "@/components/course-home";
import { useParams } from "@solidjs/router";

const Course = () => {
    const params = useParams();

    console.log("Course", params.courseId);

    if (!params.courseId) {
        return <div>Course ID not found</div>;
    }

    return <CourseHome courseId={params.courseId} />;
};

export default Course;
