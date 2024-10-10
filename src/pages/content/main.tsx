import "@/styles/global.css";

import { render } from "solid-js/web";

import { HashRouter } from "@solidjs/router";

import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { children, lazy } from "solid-js";
import RootLayout from "./layouts/base";

const queryClient = new QueryClient();

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
    return (
        <QueryClientProvider client={queryClient}>
            <HashRouter>{routes}</HashRouter>
        </QueryClientProvider>
    );
};

export function renderRoot(root: HTMLElement) {
    render(App, root);
}
