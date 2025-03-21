import ControlledSuspense from "@/components/controlled-suspense";
import CourseCard from "@/components/course-card";
import PageWrapper from "@/components/page-wrapper";
import { createAsyncCached } from "@/hooks/async-cached";
import { getEnrollments } from "@/services/BS/api/enrollment";
import { For } from "solid-js";

export default function Home() {
    const enrollments = createAsyncCached(() => getEnrollments(), { keys: () => ["enrollments"] });

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
