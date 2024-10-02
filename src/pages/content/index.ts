import "@/styles/global.css";

function removeAllGivenTags(tagName: string) {
    const tags = document.getElementsByTagName(tagName);
    for (const tag of tags) {
        tag.remove();
    }
}

removeAllGivenTags("iframe");
removeAllGivenTags("style");
removeAllGivenTags("link");
