import NestedCourseAccordion from "@/components/nested-course-accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageWrapper from "@/components/ui/page-wrapper";
import { Resizable, ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
import { getCourseModules } from "@/services/BS/scraper";
import { RouteSectionProps, useParams } from "@solidjs/router";
import { createQuery } from "@tanstack/solid-query";
import { Component, createEffect, For, Match, Show, Switch } from "solid-js";

const Course: Component<RouteSectionProps<unknown>> = (props) => {
    const params = useParams();

    const modulesQuery = createQuery(() => ({
        queryKey: ["course-modules", params.id],
        queryFn: () => getCourseModules(params.id),
    }));

    createEffect(() => {
        console.log(modulesQuery.data);
    });

    return (
        <PageWrapper title="Course" allowBack={true} hideOverflow={true}>
            <Resizable class="h-full rounded-lg shadow-sm border my-2">
                <ResizablePanel initialSize={0.2} class="overflow-hidden">
                    <div class="p-4 h-full">
                        <h2 class="text-2xl font-bold">Module List</h2>

                        <div class="h-full overflow-auto">
                            <Switch>
                                <Match when={modulesQuery.isPending}>
                                    <p>Loading...</p>
                                </Match>
                                <Match when={modulesQuery.isError}>
                                    <p>Error: {modulesQuery.error?.message}</p>
                                </Match>
                                <Match when={modulesQuery.isSuccess}>
                                    <Show when={modulesQuery.data !== undefined}>
                                        <NestedCourseAccordion modules={modulesQuery.data!} />
                                    </Show>
                                </Match>
                            </Switch>
                        </div>
                    </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel initialSize={0.65} class="overflow-hidden">
                    <div>{props.children}</div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel initialSize={0.15} class="overflow-hidden">
                    <div>Upcoming</div>
                </ResizablePanel>
            </Resizable>
        </PageWrapper>
    );
};

export default Course;
