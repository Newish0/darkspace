import { render } from "solid-js/web";

import { HashRouter, RouteDefinition } from "@solidjs/router";

import { lazy, onCleanup } from "solid-js";
import RootLayout from "./layouts/base";

import { GLOBAL_COURSE_ID } from "@/services/BS/api/enrollment";
import { getApiToken } from "@/services/BS/api/token";
import { initPreloadContentOnNotification } from "@/services/content-service";
import { debounce } from "@/utils/debounce";
import { ColorModeProvider, ColorModeScript, createLocalStorageManager } from "@kobalte/core";

const routes: RouteDefinition = {
    path: "/",
    component: RootLayout,
    children: [
        {
            path: "/",
            component: lazy(() => import("./routes/home")),
        },
        {
            path: "/courses",
            component: lazy(() => import("./routes/courses-page-wrapper")),
            children: [
                {
                    path: "/:courseId",
                    component: lazy(() => import("./routes/course")),
                },
                {
                    path: "/:courseId/m/:moduleId",
                    component: lazy(() => import("./routes/module")),
                },
            ],
        },
        {
            path: "/courses/:courseId/t/:topicId",
            component: lazy(() => import("./routes/topic")),
        },

        {
            path: "/courses/:courseId/coursework",
            component: lazy(() => import("./routes/course-coursework")),
        },
        {
            path: "/courses/:courseId/grades",
            component: lazy(() => import("./routes/grades")),
        },
        {
            path: "/courses/:courseId/others",
            component: lazy(() => import("./routes/others")),
        },
        {
            path: "*404",
            component: lazy(() => import("./routes/not-found")),
        },
    ],
};

/**
 * The main Darkspace App component.
 * Do global initialization that does not need to be inside the SolidJS Router here.
 *
 * NOTE: See the RootLayout component for initialization that concerns the SolidJS Router.
 */
const App = () => {
    const storageManager = createLocalStorageManager("vite-ui-theme");

    const cleanupAutoContentPreload = initPreloadContentOnNotification(GLOBAL_COURSE_ID);

    /**
     * Listen for window focus events and refresh the API token when the window is
     * focused. This is done to ensure that the token is refreshed and cached when
     * the user switches back to the browser tab.
     */
    const handleFocus = debounce(() => {
        getApiToken();
    }, 150);

    window.addEventListener("focus", handleFocus);

    onCleanup(() => {
        window.removeEventListener("focus", handleFocus);
        cleanupAutoContentPreload();
    });

    return (
        <>
            <ColorModeScript storageType={storageManager.type} />
            <ColorModeProvider storageManager={storageManager}>
                <HashRouter>{routes}</HashRouter>
            </ColorModeProvider>
        </>
    );
};

export function renderRoot(root: HTMLElement) {
    const dispose = render(App, root);
}
