import { CourseScheduler } from "@/components/course-planner/course-scheduler";
import RootLayout from "../RootLayout";
import { createAsyncCached } from "@/hooks/async-cached";
import { useParams } from "@solidjs/router";
import { CourseScraper } from "@/services/course-scraper";
import { ExtensionFetchHttpClient } from "@/services/course-scraper/ExtensionFetchHttpClient";

export default function Schedule() {
    const params = useParams();

    const courses = createAsyncCached(
        async () => {
            const scraper = new CourseScraper(new ExtensionFetchHttpClient());
            return await scraper.scrapeCourses("202509");
        },
        {
            keys: () => [`course-planner-uvic-${params.term}-schedule`],
        }
    );
    return (
        <div>
            <CourseScheduler courses={courses() || []} />
        </div>
    );
}
