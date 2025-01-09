/**
 * Type definition for a URL remapping function
 * @callback RemapUrlFunction
 * @param {string} url - The original URL to be remapped
 * @returns {string} The remapped URL, or an empty string if no remapping is possible
 */
type RemapUrlFunction = (url: string) => string;

/**
 * Configuration options for URL remapping
 */
interface RemapUrlOptions {
    /**
     * Whether to add target="_blank" to links that aren't remapped
     * @default true
     */
    addTargetBlank?: boolean;
}

/**
 * Processes HTML content and remaps all URLs found within using the provided remapping function.
 * This includes URLs in text content and href attributes.
 *
 * @param {string} html - The HTML content to process
 * @param {RemapUrlFunction} remapUrl - Function to remap URLs found in the HTML
 * @param {RemapUrlOptions} [options] - Configuration options
 * @returns {string} The processed HTML with remapped URLs
 *
 * @example
 * ```typescript
 * const html = '<a href="https://example.com">Link</a>';
 * const remapped = remapHtmlUrls(html,
 *   (url) => url.replace('example.com', 'newdomain.com'),
 *   { addTargetBlank: false }
 * );
 * // Result: '<a href="https://newdomain.com">Link</a>'
 * ```
 *
 * @details
 * Processes the following:
 * - Text content: URLs found in text nodes
 * - <a> tags: href attributes (adds target="_blank" if no remap and options.addTargetBlank is true)
 *
 * @throws {Error} May throw if invalid HTML is provided or DOM operations fail
 */
export function remapHtmlUrls(
    html: string,
    remapUrl: RemapUrlFunction,
    options: RemapUrlOptions = { addTargetBlank: true }
): string {
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
            } else if (options.addTargetBlank) {
                // If no remap match and addTargetBlank is true, add target="_blank"
                link.setAttribute("target", "_blank");
                link.setAttribute("rel", "noopener noreferrer");
            }
        }
    });

    // Return the processed HTML
    return doc.body.innerHTML;
}
