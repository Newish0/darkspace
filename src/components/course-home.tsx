import PageWrapper from "@/components/page-wrapper";
import { createAsyncCached } from "@/hooks/async-cached";
import { useCourseName } from "@/hooks/use-course-name";
import { getCourseModules } from "@/services/BS/scraper/course-modules";
import { makePersisted } from "@solid-primitives/storage";
import { A } from "@solidjs/router";
import { formatDate } from "date-fns";
import { CalendarIcon, MessageSquareXIcon } from "lucide-solid";
import { createSignal, For, JSX, Show } from "solid-js";
import ControlledSuspense from "./controlled-suspense";
import CourseTabs from "./course-tabs";
import NestedCourseAccordion, {
    NESTED_COURSE_ACCORDION_ROOT_ITEM_STYLE_CLASSES,
} from "./nested-course-accordion";
import { Resizable, ResizableHandle, ResizablePanel } from "./ui/resizable";
import { Separator } from "./ui/separator";
import UnsafeHtml from "./unsafe-html";
import UpcomingDisplay from "./upcoming-display";
import { remapHtmlUrls } from "@/utils/html";
import { remapD2LUrl } from "@/services/BS/url";
import { getNewsItems, NewsItem } from "@/services/BS/api/news";
import NewsDisplay from "./news-display";

export default function CourseHome({
    courseId,
    children,
}: {
    courseId: string;
    children?: JSX.Element;
}) {
    const [panelSizes, setPanelSizes] = makePersisted(createSignal<number[]>([0.2, 0.65, 0.15]), {
        name: `panel-sizes-course-${courseId}`,
    });

    const courseModules = createAsyncCached(() => getCourseModules(courseId), {
        keys: () => ["course-modules", courseId],
    });

    const courseAnnouncements = createAsyncCached(() => getNewsItems(courseId), {
        keys: () => ["announcements", courseId],
    });

    const courseName = useCourseName(courseId, true);

    const handlePanelResize = (sizes?: number[]) => {
        // Need to check if sizes are valid because router can make sizes funky
        if (sizes?.length === 3 && !sizes?.some((s) => s === null)) {
            setPanelSizes(sizes);
        }
    };

    return (
        <PageWrapper
            title={courseName()}
            allowBack={true}
            hideOverflow={true}
            centerElement={<CourseTabs courseId={courseId} value="home" />}
        >
            <Resizable
                class="h-full rounded-lg shadow-sm border"
                onSizesChange={handlePanelResize}
                sizes={panelSizes()}
            >
                <ResizablePanel initialSize={0.2} minSize={0.1} class="overflow-hidden">
                    <div class="flex flex-col h-full">
                        <h2 class="text-xl font-bold border-b px-4 py-2">Module List</h2>

                        <div class="h-full flex-shrink-1 overflow-auto p-4">
                            <A
                                class={NESTED_COURSE_ACCORDION_ROOT_ITEM_STYLE_CLASSES}
                                href={`/courses/${courseId}/`}
                            >
                                Home
                            </A>

                            <ControlledSuspense
                                hasContent={!!courseModules()}
                                fallback={<p>Loading...</p>}
                            >
                                <Show when={courseModules()}>
                                    {(courseModules) => (
                                        <NestedCourseAccordion
                                            modules={courseModules()}
                                            courseId={courseId}
                                        />
                                    )}
                                </Show>
                            </ControlledSuspense>
                        </div>
                    </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel initialSize={0.65} minSize={0.3} class="overflow-hidden">
                    <div class="flex flex-col h-full">
                        <Show
                            when={children !== undefined}
                            keyed
                            fallback={
                                <ControlledSuspense
                                    hasContent={!!courseAnnouncements()}
                                    fallback={<p>Loading...</p>}
                                >
                                    <Show when={courseAnnouncements()}>
                                        <AnnouncementList
                                            announcements={courseAnnouncements()}
                                            courseId={courseId}
                                        />
                                    </Show>
                                </ControlledSuspense>
                            }
                        >
                            {children}
                        </Show>
                    </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel initialSize={0.15} minSize={0.1} class="overflow-hidden">
                    <div class="flex flex-col h-full">
                        <UpcomingDisplay courseId={courseId} />
                    </div>
                </ResizablePanel>
            </Resizable>
        </PageWrapper>
    );
}

function AnnouncementList(props: { courseId: string; announcements?: NewsItem[] }) {
    return (
        <>
            <h2 class="text-xl font-bold border-b px-4 py-2">Announcements</h2>

            <Show when={!props.announcements || props.announcements.length === 0}>
                <div class="text-center text-muted-foreground py-8 flex flex-col items-center">
                    <MessageSquareXIcon size={48} class="mb-4 text-muted-foreground" />
                    <p>No announcements yet!</p>
                </div>
            </Show>

            <div class="h-full flex-shrink-1 overflow-auto p-4 space-y-4">
                <For each={props.announcements}>
                    {(a) => (
                        <div class="rounded-lg border p-4">
                            <NewsDisplay news={a} orgUnitId={props.courseId} />
                        </div>
                    )}
                </For>
            </div>
        </>
    );
}
