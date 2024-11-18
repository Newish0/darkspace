import { render } from "solid-js/web";

import { HashRouter } from "@solidjs/router";

import { children, lazy } from "solid-js";
import RootLayout from "./layouts/base";

import { ColorModeProvider, ColorModeScript, createLocalStorageManager } from "@kobalte/core";

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
