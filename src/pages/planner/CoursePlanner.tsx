import { ColorModeProvider, ColorModeScript, createLocalStorageManager } from "@kobalte/core";
import { Separator } from "@/components/ui/separator";
import icon from "@/../public/icon/128.png";
import browser from "webextension-polyfill";
import { buttonVariants } from "@/components/ui/button";
import { CourseScraper } from "@/services/course-scraper";
import { ExtensionFetchHttpClient } from "@/services/course-scraper/ExtensionFetchHttpClient";
import { CourseScheduler } from "@/components/course-planner/course-scheduler";

const VERSION = __APP_ENV__.VERSION || "unknown";

export default function CoursePlanner() {
    const storageManager = createLocalStorageManager("vite-ui-theme");
    const scraper = new CourseScraper(new ExtensionFetchHttpClient());
    scraper.scrapeCourses("202509").then((courses) => console.log(courses));

    return (
        <>
            <ColorModeScript storageType={storageManager.type} />
            <ColorModeProvider storageManager={storageManager}>
                <CourseScheduler />
            </ColorModeProvider>
        </>
    );
}
