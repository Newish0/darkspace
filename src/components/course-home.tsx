import PageWrapper from "@/components/page-wrapper";
import { createAsyncCached } from "@/hooks/async-cached";
import { useCourseName } from "@/hooks/use-course-name";
import { getCourseModules } from "@/services/BS/scraper/course-modules";
import { makePersisted } from "@solid-primitives/storage";
import { A } from "@solidjs/router";
import { createSignal, JSX, Show } from "solid-js";
import ControlledSuspense from "./controlled-suspense";
import CourseTabs from "./course-tabs";
import NestedCourseAccordion, {
    NESTED_COURSE_ACCORDION_ROOT_ITEM_STYLE_CLASSES,
} from "./nested-course-accordion";
import { Resizable, ResizableHandle, ResizablePanel } from "./ui/resizable";
import UpcomingDisplay from "./upcoming-display";

export default function CourseHome(props: { courseId: string; children?: JSX.Element }) {
    const [panelSizes, setPanelSizes] = makePersisted(createSignal<number[]>([0.2, 0.65, 0.15]), {
        name: `panel-sizes-course-${props.courseId}`,
    });

    const courseModules = createAsyncCached(() => getCourseModules(props.courseId), {
        keys: () => ["course-modules", props.courseId],
    });

    const courseName = useCourseName(props.courseId, true);

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
            centerElement={<CourseTabs courseId={props.courseId} value="home" />}
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
                                href={`/courses/${props.courseId}/`}
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
                                            courseId={props.courseId}
                                        />
                                    )}
                                </Show>
                            </ControlledSuspense>
                        </div>
                    </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel initialSize={0.65} minSize={0.3} class="overflow-hidden">
                    <div class="flex flex-col h-full">{props.children}</div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel initialSize={0.15} minSize={0.1} class="overflow-hidden">
                    <div class="flex flex-col h-full">
                        <UpcomingDisplay courseId={props.courseId} />
                    </div>
                </ResizablePanel>
            </Resizable>
        </PageWrapper>
    );
}
