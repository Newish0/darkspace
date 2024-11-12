import { A, createAsync, RouteSectionProps } from "@solidjs/router";
import { Component, ErrorBoundary, Match, Show, Suspense, Switch } from "solid-js";

import { createSignal, For } from "solid-js";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, LayoutDashboard, ChevronDown, ChevronRight, Github, Library } from "lucide-solid";
import { getEnrollments } from "@/services/BS/api/enrollment";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Toaster } from "solid-sonner";
import ErrorMessageAlert from "@/components/ui/error-message-alert";
import ControlledSuspense from "@/components/controlled-suspense";
import { createAsyncCached } from "@/hooks/async-cached";

const VERSION = import.meta.env.VERSION || "1.0.0";

function NavContent() {
    const enrollment = createAsyncCached(() => getEnrollments(), { keys: () => ["enrollments"] });

    const [showAllCourses, setShowAllCourses] = createSignal(false);

    const filteredEnrollments = () => {
        if (showAllCourses()) {
            return enrollment();
        } else {
            return enrollment()?.slice(0, 10);
        }
    };

    return (
        <div class="flex flex-col h-full">
            <div class="p-4">
                <h2 class="text-lg font-semibold">Logo</h2>
            </div>
            <ScrollArea class="flex-1">
                <nav class="flex flex-col gap-2 p-4">
                    <A
                        href="/"
                        class="flex items-center gap-2 text-sm font-medium p-2 rounded-md"
                        // activeClass="bg-muted"
                    >
                        <LayoutDashboard class="h-4 w-4" />
                        Dashboard
                    </A>
                    <div>
                        <Accordion multiple={false} collapsible class="p-2">
                            <AccordionItem value="enrollments" class="border-none">
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
                                                {(course) => (
                                                    <A
                                                        href={`/courses/${course.id}`}
                                                        class="block text-sm p-2 rounded-md truncate"
                                                        activeClass="bg-muted"
                                                    >
                                                        {course.name}
                                                    </A>
                                                )}
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
    return (
        <div class="flex h-screen overflow-hidden">
            {/* Desktop view */}
            <aside class="flex-shrink-0 flex-grow-0 hidden lg:flex flex-col w-56 border-r">
                <NavContent />
            </aside>

            <div class="flex-1 flex flex-col">
                {/* Top bar */}
                <div class="flex items-center justify-between p-x pt-4">
                    {/* Mobile view */}
                    <Sheet>
                        <SheetTrigger
                            as={Button}
                            variant="outline"
                            size="icon"
                            class="lg:hidden sticky top-4 left-4 z-40"
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
