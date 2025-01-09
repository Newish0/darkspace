type RemapUrlFunction = (url: string) => string;

export function remapHtmlUrls(html: string, remapUrl: RemapUrlFunction): string {
    // Create a new DOM parser and parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Helper function to process URLs in text content
    const processTextContent = (text: string): string => {
        const urlRegex = /(https?:\/\/[^\s<>"]+|www\.[^\s<>"]+)/g;
        return text.replace(urlRegex, (url) => {
            const remappedUrl = remapUrl(url);
            return remappedUrl || url;
        });
    };

    // Process text nodes
    const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);

    let textNode;
    while ((textNode = walker.nextNode())) {
        const newText = processTextContent(textNode.textContent || "");
        if (newText !== textNode.textContent) {
            textNode.textContent = newText;
        }
    }

    // Process href attributes
    doc.querySelectorAll("a").forEach((link) => {
        const href = link.getAttribute("href");
        if (href) {
            const remappedUrl = remapUrl(href);

            if (remappedUrl) {
                link.setAttribute("href", remappedUrl);
            } else {
                // If no remap match, keep original URL but add target="_blank"
                link.setAttribute("target", "_blank");
                link.setAttribute("rel", "noopener noreferrer");
            }
        }
    });

    // Process src attributes in various tags
    const srcElements = doc.querySelectorAll<HTMLElement>(
        "img, video, audio, iframe, script, source"
    );
    srcElements.forEach((element) => {
        const src = element.getAttribute("src");
        if (src) {
            const remappedUrl = remapUrl(src);
            if (remappedUrl) {
                element.setAttribute("src", remappedUrl);
            }
        }
    });

    // Process srcset attributes
    doc.querySelectorAll("img, source").forEach((element) => {
        const srcset = element.getAttribute("srcset");
        if (srcset) {
            const remappedSrcset = srcset
                .split(",")
                .map((src) => {
                    const [url, size] = src.trim().split(/\s+/);
                    const remappedUrl = remapUrl(url);
                    return `${remappedUrl || url}${size ? ` ${size}` : ""}`;
                })
                .join(", ");
            element.setAttribute("srcset", remappedSrcset);
        }
    });

    // Process background images in style attributes
    doc.querySelectorAll<HTMLElement>("[style]").forEach((element) => {
        const style = element.getAttribute("style");
        if (style) {
            const urlRegex = /url\(['"]?(.*?)['"]?\)/g;
            const newStyle = style.replace(urlRegex, (match, url) => {
                const remappedUrl = remapUrl(url);
                return `url('${remappedUrl || url}')`;
            });
            element.setAttribute("style", newStyle);
        }
    });

    // Return the processed HTML
    return doc.body.innerHTML;
}
