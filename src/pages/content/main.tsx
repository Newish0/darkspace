import { render } from "solid-js/web";

import { HashRouter } from "@solidjs/router";

import { children, lazy, onCleanup } from "solid-js";
import RootLayout from "./layouts/base";

import { ColorModeProvider, ColorModeScript, createLocalStorageManager } from "@kobalte/core";
import { debounce } from "@/utils/debounce";
import { getApiToken } from "@/services/BS/api/token";

const routes = {
    path: "/",
    component: RootLayout,
    children: [
        {
            path: "/",
            component: lazy(() => import("./routes/home")),
        },
        {
            path: "/courses/:courseId",
            component: lazy(() => import("./routes/course")),
        },
        {
            path: "/courses/:courseId/m/:moduleId",
            component: lazy(() => import("./routes/module")),
        },

        {
            path: "/courses/:courseId/coursework",
            component: lazy(() => import("./routes/course-coursework")),
        },
        {
            path: "/courses/:courseId/grades",
            component: lazy(() => import("./routes/grades")),
        },
        // {
        //     path: "/courses/:courseId/others",
        //     component: lazy(() => import("./routes/others")),
        // },
    ],
};

const App = () => {
    const storageManager = createLocalStorageManager("vite-ui-theme");

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
