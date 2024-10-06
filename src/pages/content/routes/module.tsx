import { Component, For, Match, Show, Switch } from "solid-js";
import Course from "./course";
import { RouteSectionProps, useParams } from "@solidjs/router";
import CourseHome from "@/components/course-home";
import { createQuery } from "@tanstack/solid-query";
import { getModuleContent } from "@/services/BS/scraper";
import ModuleContentList from "@/components/module-content-list";

const Module = () => {
    const params = useParams();

    const moduleContentQuery = createQuery(() => ({
        queryKey: ["course", params.courseId, "module", params.moduleId],
        queryFn: () => getModuleContent(params.courseId, params.moduleId),
    }));

    if (!params.courseId) {
        return <div>Course ID not found</div>;
    }

    return (
        <CourseHome courseId={params.courseId}>
            <Switch>
                <Match when={moduleContentQuery.isPending}>
                    <p>Loading...</p>
                </Match>
                <Match when={moduleContentQuery.isError}>
                    <p>Error: {moduleContentQuery.error?.message}</p>
                </Match>
                <Match when={moduleContentQuery.isSuccess}>
                    <div>
                        <h2 class="text-2xl font-bold border-b px-4 py-2">
                            {moduleContentQuery.data?.name}
                        </h2>

                        <div class="p-2">
                            <ModuleContentList items={moduleContentQuery.data?.content} />
                        </div>
                    </div>
                </Match>
            </Switch>
        </CourseHome>
    );
};

export default Module;
