import { renderRoot } from "./main";

/* Need to import css inline because we remove all styles from the page */
import viteCss from "@/styles/global.css?inline";

import favIcon from "@/../public/favicon.ico";
import browser from "webextension-polyfill";
import { remapD2LUrl } from "@/services/BS/url";

console.debug("[Darkspace] START", performance.now());

function replacePage() {
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

function removeAllNonDarkspaceElements() {
    const bodies = Array.from(document.querySelectorAll("body"));
    const elns = [...bodies.map((eln) => [...eln.children]).flat(), ...document.head?.children];
    for (const eln of elns) {
        if (
            eln instanceof HTMLElement &&
            !eln.hasAttribute("data-darkspace") &&
            !eln.querySelector("[data-darkspace]")
        ) {
            eln.remove();
        }
    }

    delete (window as any).D2L; // Remove D2L namespace
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
    () => remapD2LUrl(window.location.pathname) === "", // Don't run if we don't have a Darkspace equivalent page
    () => window.self !== window.top, // Don't run in an iframe
];

if (EXCLUSION_RULES.some((rule) => rule())) {
    /* Do nothing */
} else {
    replacePage();
    init();

    const observer = new MutationObserver(() => {
        removeAllNonDarkspaceElements();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    observer.observe(document.head, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 10000);

    console.debug("[Darkspace]", performance.now());
}
