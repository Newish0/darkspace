import { renderRoot } from "./main";

/* Need to import css inline because we remove all styles from the page */
import viteCss from "@/styles/global.css?inline";

import favIcon from "@/../public/favicon.ico";
import Browser from "webextension-polyfill";

console.log("START", performance.now());

function removeAllGivenTags(tagName: string, except?: (eln: Element) => boolean) {
    const tags = document.querySelectorAll(tagName);
    for (const tag of tags) {
        if (except && except(tag as HTMLElement)) continue;
        tag.remove();
    }
}

function removeBSResources() {
    const favIconUrl = Browser.runtime.getURL(favIcon);

    document.documentElement.innerHTML = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Darkspace</title>
                <link rel="icon" type="image/x-icon" href="${favIconUrl}">
            </head>
            <body>
            </body>
        </html>`;
    // // removeAllGivenTags("iframe");
    // // removeAllGivenTags("style");
    // // removeAllGivenTags("link");
    // // removeAllGivenTags("script");

    // Hide everything that was on the page
    for (const eln of document.body?.children) {
        if (eln instanceof HTMLElement) eln.style.display = "none";
    }
}

function init() {
    // Inject our styles
    const style = document.createElement("style");
    style.innerHTML = viteCss;
    document.head.appendChild(style);

    const root = document.createElement("div");
    root.classList.add(
        // "dark", // Dark mode
        // "w-full",
        // "h-full",
        // "overflow-auto",
        // "absolute",
        // "top-0",
        // "left-0",
        // "z-[100]",
        "bg-background",
        "text-foreground"
    );
    root.id = "root";
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

    console.log("END", performance.now());
}

