import "@/styles/global.css";

import { render } from "solid-js/web";

import { HashRouter, RouteSectionProps } from "@solidjs/router";

import Home from "./routes/home";

import { Component } from "solid-js";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import Layout from "./layouts/base";

const queryClient = new QueryClient();

const routes = {
    path: "/",
    component: Home,
};

const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <HashRouter root={Layout}>{routes}</HashRouter>
        </QueryClientProvider>
    );
};

export function renderRoot(root: HTMLElement) {
    render(App, root);
}
