import CourseCard from "@/components/course-card";
import PageWrapper from "@/components/ui/page-wrapper";
import { getEnrollments } from "@/services/BS";
import { createQuery } from "@tanstack/solid-query";
import { For, Match, Switch } from "solid-js";

export default function Home() {
    const query = createQuery(() => ({
        queryKey: ["enrollments"],
        queryFn: getEnrollments,
    }));

    getEnrollments().then((c) => console.log(c));

    return (
        <PageWrapper title="Dashboard" allowBack={false}>
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                <Switch>
                    <Match when={query.isPending}>
                        <p>Loading...</p>
                    </Match>
                    <Match when={query.isError}>
                        <p>Error: {query.error?.message}</p>
                    </Match>
                    <Match when={query.isSuccess}>
                        <For each={query.data}>{(c) => <CourseCard course={c} />}</For>
                    </Match>
                </Switch>
            </div>
        </PageWrapper>
    );
}
