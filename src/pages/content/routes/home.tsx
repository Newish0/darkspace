import CourseCard from "@/components/course-card";
import PageWrapper from "@/components/ui/page-wrapper";
import { getEnrollments } from "@/services/BS/api/enrollment";
import { createAsync } from "@solidjs/router";
import { createEffect, For, Match, Suspense, Switch } from "solid-js";

export default function Home() {
    const enrollments = createAsync(() => getEnrollments());
    // getEnrollments().then((c) => console.log(c));

    createEffect(() => {
        console.log("HOME: enrollments", enrollments());
    });

    return (
        <PageWrapper title="Dashboard" allowBack={false}>
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                <Suspense fallback={<div>Loading...</div>}>
                    <For each={enrollments()}>{(c) => <CourseCard course={c} />}</For>
                </Suspense>
            </div>
        </PageWrapper>
    );
}
