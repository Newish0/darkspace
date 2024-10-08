import { Component, createEffect, For, Match, Show, Switch } from "solid-js";
import Course from "./course";
import { RouteSectionProps, useParams } from "@solidjs/router";
import CourseHome from "@/components/course-home";
import { createQuery } from "@tanstack/solid-query";
import { getModuleContent } from "@/services/BS/scraper";
import ModuleContentList from "@/components/module-content-list";
import UnsafeHtml from "@/components/unsafe-html";
import { Badge } from "@/components/ui/badge";

const Module = () => {
    const params = useParams();

    const moduleContentQuery = createQuery(() => ({
        queryKey: ["course", params.courseId, "module", params.moduleId],
        queryFn: () => getModuleContent(params.courseId, params.moduleId),
    }));

    if (!params.courseId) {
        return <div>Course ID not found</div>;
    }

    createEffect(() => {
        console.log("SHOWING MODULE ID", moduleContentQuery.data?.id);
        console.log("MODULE DESCRIPTION", moduleContentQuery.data?.description);
    });

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
                    <h2 class="text-2xl font-bold border-b px-4 py-2 flex justify-between items-center">
                        {moduleContentQuery.data?.name}

                        {/* <Show when={moduleContentQuery.data?.content.length}>
                            <Badge variant={"default"}>{moduleContentQuery.data?.content.length} Topics</Badge>
                        </Show> */}
                    </h2>

                    <div class="overflow-auto px-4 py-2 space-y-4">
                        <div class="markdown">
                            <Switch>
                                <Match when={moduleContentQuery.data?.description?.html}>
                                    <UnsafeHtml
                                        unsafeHtml={moduleContentQuery.data!.description!.html!}
                                        config={{
                                            ADD_TAGS: ["iframe"],
                                            ADD_ATTR: [
                                                "allow",
                                                "allowfullscreen",
                                                "frameborder",
                                                "scrolling",
                                            ],
                                        }}
                                    />
                                </Match>
                                <Match when={moduleContentQuery.data?.description?.text}>
                                    <p>{moduleContentQuery.data!.description!.text!}</p>
                                </Match>
                            </Switch>
                        </div>

                        <div class="">
                            <ModuleContentList items={moduleContentQuery.data?.content} />
                        </div>
                    </div>
                </Match>
            </Switch>
        </CourseHome>
    );
};

export default Module;
