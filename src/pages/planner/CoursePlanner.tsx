import { ColorModeProvider, ColorModeScript, createLocalStorageManager } from "@kobalte/core";

import { HashRouter, RouteDefinition } from "@solidjs/router";

import RootLayout from "./RootLayout";

const VERSION = __APP_ENV__.VERSION || "unknown";

const routes: RouteDefinition = {
    path: "/",
    component: RootLayout,
    // children: [
    //     {
    //         path: "/",
    //         component: lazy(() => import("./routes/home")),
    //     },
    // ],
};

export default function CoursePlanner() {
    const storageManager = createLocalStorageManager("darkspace-ui-theme");

    // const [courses] = createResource(async () => {
    //     const scraper = new CourseScraper(new ExtensionFetchHttpClient());
    //     return await scraper.scrapeCourses("202509");
    // });

    return (
        <>
            <ColorModeScript storageType={storageManager.type} />
            <ColorModeProvider storageManager={storageManager}>
                {/* <CourseScheduler courses={courses() || []} /> */}
                <HashRouter>{routes}</HashRouter>
            </ColorModeProvider>
        </>
    );
}
