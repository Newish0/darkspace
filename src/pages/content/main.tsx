import "@/styles/global.css";

import { render } from "solid-js/web";

import { HashRouter, RouteSectionProps } from "@solidjs/router";

import { children, Component, lazy } from "solid-js";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
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
            path: "/courses/:id",
            component: lazy(() => import("./routes/course")),
        },
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
