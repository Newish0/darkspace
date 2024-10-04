import "@/styles/global.css";
import { renderRoot } from "./main";

function removeAllGivenTags(tagName: string) {
    const tags = document.getElementsByTagName(tagName);
    for (const tag of tags) {
        tag.remove();
    }
}

removeAllGivenTags("iframe");
removeAllGivenTags("style");
removeAllGivenTags("link");

// Hide everything that was on the page
for (const eln of document.body.children) {
    if (eln instanceof HTMLElement) eln.style.display = "none";
}

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
    "bg-primary-foreground",
    "text-primary"
);
root.id = "root";
document.body.appendChild(root);
// document.body.style.overflow = "hidden";

renderRoot(root);
