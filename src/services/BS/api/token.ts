import { debounce } from "@/utils/debounce";
import { getBaseDocument } from "../base-doc";
import { ApiTokenError } from "../errors";
import { BASE_URL } from "../url";

// Promise to track ongoing token requests
let tokenRequestPromise: Promise<string> | null = null;

/**
 * Retrieves an API token, fetching it only if it's not cached or expired.
 * @param ignoreCache - If true, ignore the cached token and always fetch a new one.
 * @returns {Promise<string>} The API access token.
 * @throws {ApiTokenError} If the token cannot be retrieved or parsed.
 */
export async function getApiToken(ignoreCache = false): Promise<string> {
    // If there's an ongoing request, return its promise
    if (tokenRequestPromise) {
        return tokenRequestPromise;
    }

    if (!ignoreCache) {
        const cachedToken = getCachedToken();
        if (cachedToken) return cachedToken;
    }

    // Create new token request promise
    tokenRequestPromise = (async () => {
        try {
            const xsrfToken = await getXsrfTokenFromDocument();
            const response = await fetchApiToken(xsrfToken);
            const token = await parseTokenResponse(response);

            cacheToken(token);
            return token.access_token;
        } catch (error) {
            console.error("Error getting API token:", error);
            throw new ApiTokenError("Failed to retrieve API token");
        } finally {
            // Clear the promise reference after completion (success or failure)
            tokenRequestPromise = null;
        }
    })();

    return tokenRequestPromise;
}

/**
 * Extract the XSRF token from the given script string.
 *
 * The JavaScript code stores the XSRF token in the
 * local storage using the following syntax:
 *
 *   localStorage.setItem("XSRF.Token", "<token>");
 *
 * This function extracts the token from the script string.
 *
 * @param script - The JavaScript code to extract the XSRF token from.
 * @returns The extracted XSRF token or null if it was not found.
 */
function extractXsrfToken(script: string): string | null {
    const tokenRegex = /localStorage\.setItem\(['"]XSRF\.Token['"],\s*['"]([^'"]+)['"]\)/;
    const match = script.match(tokenRegex);
    return match ? match[1] : null;
}

function hasXsrfToken(script: string): boolean {
    return !!extractXsrfToken(script);
}

/**
 * Retrieves the XSRF token from the document's scripts.
 * @returns {Promise<string>} The XSRF token.
 * @throws {ApiTokenError} If the token is not found or invalid.
 */
async function getXsrfTokenFromDocument(): Promise<string> {
    const baseDoc = await getBaseDocument();
    const scriptContent = [...baseDoc.querySelectorAll("script")].map((s) => s.innerHTML);
    const script = scriptContent.find(hasXsrfToken);

    if (!script) throw new ApiTokenError("XSRF token not found in the document");

    const xsrfToken = extractXsrfToken(script);
    if (!xsrfToken) throw new ApiTokenError("Invalid XSRF token in document");

    return xsrfToken;
}

/**
 * Makes a POST request to the OAuth endpoint to retrieve an API token.
 * @param xsrfToken - The XSRF token for authorization.
 * @returns {Promise<Response>} The response from the fetch call.
 * @throws {ApiTokenError} If the request fails.
 */
async function fetchApiToken(xsrfToken: string): Promise<Response> {
    const oAuthEndpoint = `${BASE_URL}/d2l/lp/auth/oauth2/token`;
    const headers = {
        accept: "*/*",
        "accept-language": "en-GB,en;q=0.6",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded",
        pragma: "no-cache",
        priority: "u=1, i",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "sec-gpc": "1",
        "x-csrf-token": xsrfToken,
    };

    const response = await fetch(oAuthEndpoint, {
        headers,
        body: "scope=*%3A*%3A*",
        method: "POST",
        mode: "cors",
        credentials: "include",
    });

    if (!response.ok) {
        throw new ApiTokenError(`Failed to retrieve API token: ${response.statusText}`);
    }

    return response;
}

/**
 * Parses the response from the OAuth endpoint to extract the access token.
 * @param response - The fetch response containing the token data.
 * @returns {Promise<{ access_token: string; expires_at: number }>} The token data.
 * @throws {ApiTokenError} If the token data is missing or invalid.
 */
async function parseTokenResponse(
    response: Response
): Promise<{ access_token: string; expires_at: number }> {
    const data = await response.json();
    if (!data.access_token || typeof data.expires_at !== "number") {
        throw new ApiTokenError("API token missing or invalid in the response");
    }
    return data;
}

/**
 * Caches the API token with its expiration time.
 * @param token - The token data containing access_token and expires_at fields.
 */
function cacheToken(token: { access_token: string; expires_at: number }) {
    const tokenData = {
        ...token,
        expires_at: token.expires_at * 1000, // Convert to milliseconds
        // expires_at: Date.now() + 60 * 1000,
    };
    localStorage.setItem("api_token", JSON.stringify(tokenData));
}

/**
 * Retrieves the cached token if it exists and is not expired.
 * @returns {string | null} The cached access token or null if not available/expired.
 */
function getCachedToken(): string | null {
    const tokenData = localStorage.getItem("api_token");
    if (!tokenData) return null;

    const parsedToken = JSON.parse(tokenData);
    if (Date.now() < parsedToken.expires_at) {
        return parsedToken.access_token;
    }

    // Clear expired token
    localStorage.removeItem("api_token");
    return null;
}

/**
 * Clears the cached API token.
 */
function clearCachedToken() {
    localStorage.removeItem("api_token");
}
