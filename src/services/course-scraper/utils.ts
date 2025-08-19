/**
 * Decodes HTML entities in a string.
 *
 * @warning This function is NOT comprehensive and may not decode all HTML entities.
 *
 * @param input The input string
 * @returns The decoded string
 */
export function decodeHtmlEntities(input: string): string {
    // Create a map of common HTML entities
    const htmlEntities: { [key: string]: string } = {
        "&nbsp;": " ",
        "&lt;": "<",
        "&gt;": ">",
        "&amp;": "&",
        "&quot;": '"',
        "&#39;": "'",
        "&apos;": "'",
        "&cent;": "¢",
        "&pound;": "£",
        "&yen;": "¥",
        "&euro;": "€",
        "&copy;": "©",
        "&reg;": "®",
        "&trade;": "™",
    };

    /**
     * Decodes a numeric entity (&#num; or &#xnum;)
     *
     * @param match The match string (&#num; or &#xnum;)
     * @param numStr The numeric string (num or xnum)
     * @returns The decoded character
     */
    const decodeNumericEntity = (match: string, numStr: string): string => {
        const num = parseInt(numStr, numStr.startsWith("x") ? 16 : 10);
        return String.fromCharCode(num);
    };

    let result = input
        // Replace named entities
        .replace(/&[a-zA-Z]+;/g, (entity) => htmlEntities[entity] || entity)
        // Replace decimal entities (&#34;)
        .replace(/&#(\d+);/g, decodeNumericEntity)
        // Replace hex entities (&#x22;)
        .replace(/&#x([0-9a-fA-F]+);/g, decodeNumericEntity);

    return result;
}
