import "@/styles/global.css";

import { render } from "solid-js/web";

import { HashRouter } from "@solidjs/router";

import { children, lazy } from "solid-js";
import RootLayout from "./layouts/base";

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
        // {
        //     path: "/courses/:courseId/grades",
        //     component: lazy(() => import("./routes/grades")),
        // },
        // {
        //     path: "/courses/:courseId/others",
        //     component: lazy(() => import("./routes/others")),
        // },
    ],
};

const App = () => {
    return <HashRouter>{routes}</HashRouter>;
};

export function renderRoot(root: HTMLElement) {
    const dispose = render(App, root);
}
