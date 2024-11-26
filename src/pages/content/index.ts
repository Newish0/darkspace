import { renderRoot } from "./main";

/* Need to import css inline because we remove all styles from the page */
import viteCss from "@/styles/global.css?inline";

import favIcon from "@/../public/favicon.ico";
import browser from "webextension-polyfill";

console.debug("[Darkspace] START", performance.now());

function removeBSResources() {
    const favIconUrl = browser.runtime.getURL(favIcon);

    document.documentElement.innerHTML = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8" data-darkspace>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" data-darkspace>
                <title data-darkspace>Darkspace</title>
                <link rel="icon" type="image/x-icon" href="${favIconUrl}" data-darkspace>
            </head>
            <body>
            </body>
        </html>`;

    // Hide everything that was on the page
    for (const eln of document.body?.children) {
        if (eln instanceof HTMLElement) eln.style.display = "none";
    }
}

function init() {
    // Inject our styles
    const style = document.createElement("style");
    style.innerHTML = viteCss;
    style.setAttribute("data-darkspace", "");
    document.head.appendChild(style);

    const root = document.createElement("div");
    root.classList.add("bg-background", "text-foreground");
    root.id = "root";
    root.setAttribute("data-darkspace", "");
    document.body.appendChild(root);
    // document.body.style.overflow = "hidden";

    renderRoot(root);
}

const EXCLUSION_RULES = [
    () => window.location.pathname.indexOf("/content/") == 0, // Don't run in content pages
    () => window.location.pathname.indexOf("/d2l/lms/") == 0, // Don't run in course work (quizzes & assignments)
    () => window.self !== window.top, // Don't run in an iframe
];

if (EXCLUSION_RULES.some((rule) => rule())) {
    /* Do nothing */
} else {
    removeBSResources();
    init();

    console.debug("[Darkspace]", performance.now());
}
