/**
 * This function is explicitly outside the UrlBuilder class to avoid circular dependencies.
 * @param base - The base URL
 * @returns
 */
export const buildApiSupportedVersionsUrl = (base: string) =>
    "{{BASE}}/d2l/api/versions/".replace("{{BASE}}", base);
