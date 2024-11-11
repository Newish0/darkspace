import {
    getCourseAnnouncements,
    getCourseModules,
    getQuizzes,
    IAnnouncement,
} from "@/services/BS/scraper";
import { createAsync } from "@solidjs/router";
import { A } from "@solidjs/router";
import { CalendarIcon } from "lucide-solid";
import { createEffect, For, JSX, Match, Show, Suspense, Switch } from "solid-js";
import CourseTabs from "./course-tabs";
import NestedCourseAccordion, {
    NESTED_COURSE_ACCORDION_ROOT_ITEM_STYLE_CLASSES,
} from "./nested-course-accordion";
import PageWrapper from "./ui/page-wrapper";
import { Resizable, ResizableHandle, ResizablePanel } from "./ui/resizable";
import { Separator } from "./ui/separator";
import UnsafeHtml from "./unsafe-html";

export default function CourseHome({
    courseId,
    children,
}: {
    courseId: string;
    children?: JSX.Element;
}) {
    const courseModules = createAsync(() => getCourseModules(courseId));

    const courseAnnouncements = createAsync(() => getCourseAnnouncements(courseId));

    // createEffect(() => {
    //     // console.log(modulesQuery.data);
    //     // console.log(JSON.stringify(announcementsQuery.data, null, 2));
    // });

    return (
        <PageWrapper
            title="Course"
            allowBack={true}
            hideOverflow={true}
            centerElement={<CourseTabs courseId={courseId} value="home" />}
        >
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

                            <Suspense fallback={<p>Loading...</p>}>
                                <Show when={courseModules()}>
                                    <NestedCourseAccordion
                                        modules={courseModules()!}
                                        courseId={courseId}
                                    />
                                </Show>
                            </Suspense>
                        </div>
                    </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel initialSize={0.65} class="overflow-hidden">
                    <div class="flex flex-col h-full">
                        <Show
                            when={children !== undefined}
                            fallback={
                                <Suspense fallback={<p>Loading...</p>}>
                                    <Show when={courseAnnouncements()}>
                                        <AnnouncementList announcements={courseAnnouncements()} />
                                    </Show>
                                </Suspense>
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
