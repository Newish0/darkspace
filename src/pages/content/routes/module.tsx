import { Component } from "solid-js";
import Course from "./course";
import { RouteSectionProps, useParams } from "@solidjs/router";
import CourseHome from "@/components/course-home";

const Module = () => {
    const params = useParams();

    if (!params.courseId) {
        return <div>Course ID not found</div>;
    }

    return (
        <CourseHome courseId={params.courseId}>
            <div>Module {params.moduleId}</div>
        </CourseHome>
    );
};

export default Module;
