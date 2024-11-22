/**
 * Extract extension name from a URL
 * @param url - URL to extract from
 * @example
 * extractExtensionName("https://example.com/path/to/file.pdf") // returns "pdf"
 * @returns the extension name
 */
export function extractExtensionName(url: string): string {
    const urlObj = new URL(url, "https://DONTCAREWHATTHISIS123321ABCDEFG.net");
    const pathSplit = urlObj.pathname.split(".");
    return pathSplit[pathSplit.length - 1];
}

/**
 * Checks if file extension matches any of office files
 * @param url - URL to check
 * @returns true if the file is an office file, false otherwise
 */
export function isOfficeFile(url: string): boolean {
    const officeExtensions = ["doc", "docx", "ppt", "pptx", "xls", "xlsx"];
    return officeExtensions.includes(extractExtensionName(url));
}
