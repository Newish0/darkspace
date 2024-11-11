import { Component, createEffect, For, Match, Show, Suspense, Switch } from "solid-js";
import Course from "./course";
import { createAsync, RouteSectionProps, useParams } from "@solidjs/router";
import CourseHome from "@/components/course-home";
import { getModuleContent } from "@/services/BS/scraper";
import ModuleContentList from "@/components/module-content-list";
import UnsafeHtml from "@/components/unsafe-html";
import { Badge } from "@/components/ui/badge";

const Module = () => {
    const params = useParams();

    const moduleContent = createAsync(() => getModuleContent(params.courseId, params.moduleId));

    if (!params.courseId) {
        return <div>Course ID not found</div>;
    }

    createEffect(() => {
        console.log("SHOWING MODULE ID", moduleContent()?.id);
        console.log("MODULE DESCRIPTION", moduleContent()?.description);
        console.log("MODULE TOPICS", moduleContent()?.topics);
    });

    return (
        <CourseHome courseId={params.courseId}>
            <Suspense fallback={<div>Loading...</div>}>
                <h2 class="text-2xl font-bold border-b px-4 py-2 flex justify-between items-center">
                    {moduleContent()?.name}

                    {/* <Show when={moduleContent()?.content.length}>
                            <Badge variant={"default"}>{moduleContent()?.content.length} Topics</Badge>
                        </Show> */}
                </h2>

                <div class="overflow-auto px-4 py-2 space-y-4">
                    <div class="markdown">
                        <Switch>
                            <Match when={moduleContent()?.description?.html}>
                                <UnsafeHtml
                                    unsafeHtml={moduleContent()!.description!.html!}
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
                            <Match when={moduleContent()?.description?.text}>
                                <p>{moduleContent()!.description!.text!}</p>
                            </Match>
                        </Switch>
                    </div>

                    <div class="">
                        <ModuleContentList items={moduleContent()?.topics} />
                    </div>
                </div>
            </Suspense>
        </CourseHome>
    );
};

export default Module;
