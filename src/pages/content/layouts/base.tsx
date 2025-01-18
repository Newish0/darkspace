import { A, RouteSectionProps, useMatch, useNavigate } from "@solidjs/router";
import { Component, ErrorBoundary, Show } from "solid-js";

import ControlledSuspense from "@/components/controlled-suspense";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import ErrorMessageAlert from "@/components/ui/error-message-alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { createAsyncCached } from "@/hooks/async-cached";
import { usePersistentNav } from "@/hooks/persistent-nav";
import { cn } from "@/lib/utils";
import { getEnrollments, isClassActuallyActive } from "@/services/BS/api/enrollment";
import { matchD2LUrl, remapD2LUrl } from "@/services/BS/url";
import { Github, LayoutDashboard, Library, Menu } from "lucide-solid";
import { createSignal, For } from "solid-js";

const VERSION = __APP_ENV__.VERSION || "unknown";

function NavContent() {
    const COURSE_LIST_VALUE = "enrollments";
    const enrollment = createAsyncCached(() => getEnrollments(), { keys: () => ["enrollments"] });

    const [persistNav, setPersistNav] = usePersistentNav();

    const [showAllCourses, setShowAllCourses] = createSignal(false);

    const filteredEnrollments = () => {
        const activeEnrollments = enrollment()?.filter(isClassActuallyActive);
        if (showAllCourses()) {
            return activeEnrollments;
        } else {
            return activeEnrollments?.slice(0, 10);
        }
    };

    const handleCourseListChange = (values: string[]) => {
        setPersistNav({ isCourseListOpen: values.includes(COURSE_LIST_VALUE) });
    };

    return (
        <div class="flex flex-col h-full">
            <div class="p-4">
                <h2 class="text-lg font-semibold p-2">Darkspace</h2>
            </div>
            <ScrollArea class="flex-1">
                <nav class="flex flex-col gap-2 p-4">
                    <A href="/" class="flex items-center gap-2 text-sm font-medium p-2 rounded-md">
                        <LayoutDashboard class="h-4 w-4" />
                        Dashboard
                    </A>
                    <div>
                        <Accordion
                            multiple={false}
                            collapsible
                            class="p-2"
                            value={persistNav().isCourseListOpen ? [COURSE_LIST_VALUE] : undefined}
                            defaultValue={[COURSE_LIST_VALUE]}
                            onChange={handleCourseListChange}
                        >
                            <AccordionItem value={COURSE_LIST_VALUE} class="border-none">
                                <AccordionTrigger class="py-0">
                                    <div class="flex items-center gap-2">
                                        <Library class="h-4 w-4" />
                                        Courses
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div class="space-y-2 my-2">
                                        <ControlledSuspense
                                            hasContent={!!filteredEnrollments()}
                                            fallback={<p>Loading...</p>}
                                        >
                                            <For each={filteredEnrollments()}>
                                                {(course) => {
                                                    const href = `/courses/${course.id}`;
                                                    const match = useMatch(() => href);
                                                    return (
                                                        <Tooltip openDelay={1000}>
                                                            <TooltipTrigger
                                                                as={"a"}
                                                                href={href}
                                                                class={cn(
                                                                    "block text-sm p-2 rounded-md truncate",
                                                                    match() ? "bg-muted" : ""
                                                                )}
                                                            >
                                                                {course.name}
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                {course.name}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    );
                                                }}
                                            </For>

                                            <Show when={!showAllCourses()}>
                                                <Button
                                                    onClick={() => setShowAllCourses(true)}
                                                    variant="link"
                                                    size="sm"
                                                    class="text-muted-foreground text-center w-full"
                                                >
                                                    Show all {enrollment()?.length} courses
                                                </Button>
                                            </Show>
                                        </ControlledSuspense>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </nav>
            </ScrollArea>
            <div class="mt-auto p-4 border-t">
                <a
                    href="https://github.com/yourusername/yourrepo"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-2 text-sm font-medium mb-2"
                >
                    <Github class="h-4 w-4" />
                    GitHub
                </a>
                <div class="text-xs text-muted-foreground">Version: {VERSION}</div>
            </div>
        </div>
    );
}

const Layout: Component<RouteSectionProps<unknown>> = (props) => {
    const navigate = useNavigate();
    /**
     * If we find an equivalent Darkspace page for the current Brightspace page
     * user is viewing, we will redirect to that page.
     *
     * NOTE: The redirecting must be done within the SolidJS Router. Therefore,
     *       this is done inside of the RootLayout component instead of the App component.
     */
    const redirectToDarkspacePage = () => {
        const dsUrl = remapD2LUrl(window.location.pathname);
        const isLikelyDsNonRootPage = window.location.hash && window.location.hash !== "#/";
        if (dsUrl && !isLikelyDsNonRootPage) {
            navigate(dsUrl);
        }
    };
    redirectToDarkspacePage();

    return (
        <div class="flex h-screen overflow-hidden">
            {/* Desktop view */}
            <aside class="flex-shrink-0 flex-grow-0 hidden lg:flex flex-col w-56 border-r">
                <NavContent />
            </aside>

            <div class="flex-grow-1 w-full overflow-auto flex flex-col">
                {/* Top bar */}
                <div class="grid items-center grid-cols-2 p-2">
                    {/* Mobile view */}
                    <Sheet>
                        <SheetTrigger
                            as={Button}
                            variant="outline"
                            size="icon"
                            class="lg:hidden sticky top-4 left-4 z-40 col-start-1"
                        >
                            <Menu class="h-4 w-4" />
                        </SheetTrigger>
                        <SheetContent
                            position="left"
                            class="w-[240px] sm:w-[300px] bg-background text-foreground"
                        >
                            <NavContent />
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Main content area */}
                <main class="flex-1 h-full overflow-auto">
                    {/* Global catch all error boundary. More granular error boundaries should be used inside but this is a good default. */}
                    <ErrorBoundary
                        fallback={
                            <div class="p-4">
                                <ErrorMessageAlert onRetry={() => window.location.reload()} />
                            </div>
                        }
                    >
                        {props.children}
                    </ErrorBoundary>
                </main>
            </div>
        </div>
    );
};

export default Layout;
