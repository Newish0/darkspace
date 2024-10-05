import { getCourseModules } from "@/services/BS/scraper";

import { createQuery } from "@tanstack/solid-query";
import { createEffect, Switch, Match, Show, JSX } from "solid-js";
import NestedCourseAccordion from "./nested-course-accordion";
import PageWrapper from "./ui/page-wrapper";
import { ResizablePanel, ResizableHandle, Resizable } from "./ui/resizable";

export default function CourseHome({
    courseId,
    children,
}: {
    courseId: string;
    children?: JSX.Element;
}) {
    const modulesQuery = createQuery(() => ({
        queryKey: ["course-modules", courseId],
        queryFn: () => getCourseModules(courseId),
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
                                        <NestedCourseAccordion
                                            modules={modulesQuery.data!}
                                            courseId={courseId}
                                        />
                                    </Show>
                                </Match>
                            </Switch>
                        </div>
                    </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel initialSize={0.65} class="overflow-hidden">
                    <div>{children}</div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel initialSize={0.15} class="overflow-hidden">
                    <div>Upcoming</div>
                </ResizablePanel>
            </Resizable>
        </PageWrapper>
    );
}
