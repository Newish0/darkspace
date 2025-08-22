import { ColorModeProvider, ColorModeScript, createLocalStorageManager } from "@kobalte/core";

import { HashRouter, RouteDefinition } from "@solidjs/router";

import RootLayout from "./RootLayout";
import { lazy } from "solid-js";

const VERSION = __APP_ENV__.VERSION || "unknown";

const routes: RouteDefinition = {
    path: "/",
    component: RootLayout,
    children: [
        {
            path: "/",
            component: lazy(() => import("./routes/term-redirect")),
        },
        {
            path: "/:term",
            component: lazy(() => import("./routes/empty")),
        },
        {
            path: "/:term/:scheduleId",
            component: lazy(() => import("./routes/schedule")),
        },
    ],
};

export default function CoursePlanner() {
    const storageManager = createLocalStorageManager("darkspace-ui-theme");

    return (
        <>
            <ColorModeScript storageType={storageManager.type} />
            <ColorModeProvider storageManager={storageManager}>
                <HashRouter>{routes}</HashRouter>
            </ColorModeProvider>
        </>
    );
}
