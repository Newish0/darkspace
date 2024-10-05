import NestedCourseAccordion from "@/components/nested-course-accordion";
import PageWrapper from "@/components/ui/page-wrapper";
import { getCourseModules } from "@/services/BS/scraper";
import { useParams } from "@solidjs/router";
import { createQuery } from "@tanstack/solid-query";
import { createEffect, For, Match, Show, Switch } from "solid-js";

export default function Course() {
    const params = useParams();

    const modulesQuery = createQuery(() => ({
        queryKey: ["course-modules", params.id],
        queryFn: () => getCourseModules(params.id),
    }));

    createEffect(() => {
        console.log(modulesQuery.data);
    });

    return (
        <PageWrapper title="Course" allowBack={true}>
            <div class="flex gap-4">
                <div class="max-w-64">
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

                <div>
                    A
                </div>
            </div>
        </PageWrapper>
    );
}
