import { getCourseAnnouncements, getCourseModules, IAnnouncement } from "@/services/BS/scraper";

import { createQuery } from "@tanstack/solid-query";
import { createEffect, Switch, Match, Show, JSX, For } from "solid-js";
import NestedCourseAccordion, {
    NESTED_COURSE_ACCORDION_ROOT_ITEM_STYLE_CLASSES,
} from "./nested-course-accordion";
import PageWrapper from "./ui/page-wrapper";
import { ResizablePanel, ResizableHandle, Resizable } from "./ui/resizable";
import UnsafeHtml from "./unsafe-html";
import { CalendarIcon } from "lucide-solid";
import { Separator } from "./ui/separator";
import { A } from "@solidjs/router";

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

    const announcementsQuery = createQuery(() => ({
        queryKey: ["course-announcements", courseId],
        queryFn: () => getCourseAnnouncements(courseId),
    }));

    createEffect(() => {
        // console.log(modulesQuery.data);
        // console.log(JSON.stringify(announcementsQuery.data, null, 2));
    });

    return (
        <PageWrapper title="Course" allowBack={true} hideOverflow={true}>
            <Resizable class="h-full rounded-lg shadow-sm border">
                <ResizablePanel initialSize={0.2} class="overflow-hidden">
                    <div class="flex flex-col h-full">
                        <h2 class="text-2xl font-bold border-b px-4 py-2">Module List</h2>

                        <div class="h-full flex-shrink-1 overflow-auto p-4">
                            <A
                                class={NESTED_COURSE_ACCORDION_ROOT_ITEM_STYLE_CLASSES}
                                href={`/courses/${courseId}/`}
                            >
                                Home
                            </A>

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
                    <div class="flex flex-col h-full">
                        <Show
                            when={children !== undefined}
                            fallback={
                                <Switch>
                                    <Match when={announcementsQuery.isPending}>
                                        <p>Loading...</p>
                                    </Match>
                                    <Match when={announcementsQuery.isError}>
                                        <p>Error: {announcementsQuery.error?.message}</p>
                                    </Match>
                                    <Match when={announcementsQuery.isSuccess}>
                                        <Show when={announcementsQuery.data !== undefined}>
                                            <AnnouncementList
                                                announcements={announcementsQuery.data}
                                            />
                                        </Show>
                                    </Match>
                                </Switch>
                            }
                        >
                            {children}
                        </Show>
                    </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel initialSize={0.15} class="overflow-hidden">
                    <div>Upcoming</div>
                </ResizablePanel>
            </Resizable>
        </PageWrapper>
    );
}

function AnnouncementList({ announcements }: { announcements?: IAnnouncement[] }) {
    return (
        <>
            <h2 class="text-2xl font-bold border-b px-4 py-2">Announcements</h2>

            <div class="h-full flex-shrink-1 overflow-auto p-4 space-y-4">
                <For each={announcements}>
                    {(a) => (
                        <div class="rounded-lg border p-2">
                            <div class="flex flex-wrap justify-between items-center">
                                <h3 class="text-xl font-medium">{a.title}</h3>
                                <div class="flex items-center text-sm text-muted-foreground">
                                    <CalendarIcon class="mr-1 h-4 w-4" />
                                    <span>{a.dateTime}</span>
                                </div>
                            </div>
                            <Separator class="my-2" />
                            <UnsafeHtml unsafeHtml={a.html} class="markdown overflow-auto" />
                        </div>
                    )}
                </For>
            </div>
        </>
    );
}
