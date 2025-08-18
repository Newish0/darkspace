import ControlledSuspense from "@/components/controlled-suspense";
import CourseHome from "@/components/course-home";
import NewsDisplay from "@/components/news-display";
import { createAsyncCached } from "@/hooks/async-cached";
import { NewsItem } from "@/services/BS/api/dtos/news";
import { newsService } from "@/services/BS/api/news";
import { asThrowable } from "@/utils/error";
import { useParams } from "@solidjs/router";
import { MessageSquareXIcon } from "lucide-solid";
import { For, Show } from "solid-js";

const Course = () => {
    const params = useParams();

    const courseAnnouncements = createAsyncCached(
        () => asThrowable(newsService.getNewsItems(params.courseId)),
        {
            keys: () => ["announcements", params.courseId],
        }
    );

    return (
        <>
            <ControlledSuspense hasContent={!!courseAnnouncements()} fallback={<p>Loading...</p>}>
                <Show when={courseAnnouncements()}>
                    <AnnouncementList
                        announcements={courseAnnouncements()}
                        courseId={params.courseId}
                    />
                </Show>
            </ControlledSuspense>
        </>
    );
};

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

export default Course;
