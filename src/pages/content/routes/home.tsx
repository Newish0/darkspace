import CourseCard from "@/components/course-card";
import ControlledSuspense from "@/components/controlled-suspense";
import PageWrapper from "@/components/ui/page-wrapper";
import { createAsyncCached } from "@/hooks/async-cached";
import { getEnrollments } from "@/services/BS/api/enrollment";
import { createAsync } from "@solidjs/router";
import { query } from "@solidjs/router/dist/data/query";
import { createEffect, For, Match, Suspense, Switch } from "solid-js";

export default function Home() {
    const enrollments = createAsyncCached(() => getEnrollments(), { keys: () => ["enrollments"] });

    createEffect(() => {
        console.log("HOME: enrollments", enrollments());
    });

    return (
        <PageWrapper title="Dashboard" allowBack={false}>
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                <ControlledSuspense hasContent={!!enrollments()} fallback={<p>Loading...</p>}>
                    <For each={enrollments()}>{(c) => <CourseCard course={c} />}</For>
                </ControlledSuspense>
            </div>
        </PageWrapper>
    );
}
