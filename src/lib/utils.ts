import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Extracts a single UUID from a given string.
 * Supports both dash-separated and continuous UUID formats.
 * Preserves the original case of the UUID.
 *
 * @param input - The string to extract UUID from
 * @param options - Configuration options
 * @param options.last - If true, returns the last UUID found instead of the first. Defaults to false
 * @returns The extracted UUID string or null if no UUID is found
 *
 * @example
 * // Get first UUID
 * extractUuid('path/123e4567-E89B-12d3-a456-426614174000/file');
 * // Returns: '123e4567-E89B-12d3-a456-426614174000'
 *
 * // Get last UUID with continuous format
 * extractUuid('first: 123e4567-e89b-12d3-a456-426614174000, last: 987FCDEB51A243FEBA98765432198765', { last: true });
 * // Returns: '987FCDEB-51A2-43FE-BA98-765432198765'
 */
export function extractUuid(
    input: string,
    options: { last?: boolean } = { last: false }
): string | null {
    // Match both hyphenated and continuous UUIDs
    const uuidRegex =
        /[0-9a-fA-F]{8}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{12}/g;

    // Find all matches
    const matches = input.match(uuidRegex);

    if (!matches) {
        return null;
    }

    // Select the UUID based on options
    const uuid = options.last ? matches[matches.length - 1] : matches[0];

    // Format UUID to ensure consistent dash separation while preserving case
    if (!uuid.includes("-")) {
        return [
            uuid.slice(0, 8),
            uuid.slice(8, 12),
            uuid.slice(12, 16),
            uuid.slice(16, 20),
            uuid.slice(20),
        ].join("-");
    }

    return uuid;
}
