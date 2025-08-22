import { asyncCache } from "@/services/storage/async-cache";
import { createAsync } from "@solidjs/router";
import { createSignal, onMount } from "solid-js";

function getKey(keys: string[]) {
    return keys.join("/");
}

type CreateAsyncCachedOptions = {
    name?: string;
    keys: () => string[];
    deferStream?: boolean;
    staleTime?: number; // TODO: implement
};

/**
 * An export/wrapper around `asyncCache.get<T>` to allow direct access to the cache
 * without reactivity provided by `createAsyncCached()`
 *
 * Retrieves a cached value associated with the provided keys.
 * @template T The type of the cached value.
 * @param keys An array of strings representing the keys to identify the cached value.
 * @returns A Promise that resolves to the cached value of type T or null if not found.
 */
export function getAsyncCached<T>(keys: string[]): Promise<T | null> {
    // Generate a cache key by joining the array of keys
    const cacheKey = getKey(keys);

    // Retrieve the cached value using the generated cache key
    return asyncCache.get<T>(cacheKey);
}

export function setAsyncCached<T>(keys: string[], value: T) {
    return asyncCache.set<T>(getKey(keys), value);
}

/**
 * Creates a cached async function in which the initial value is fetched from the cache asynchronously.
 * @param fn The function to cache
 * @param options Options to configure the cache
 * @returns The cached async function
 */
export function createAsyncCached<T>(fn: () => Promise<T>, options: CreateAsyncCachedOptions) {
    const key = () => getKey(options.keys());

    const [cachedData, setCachedData] = createSignal<T | null>(null);

    // Load cache whenever key changes
    onMount(() => {
        (async () => {
            const cached = await asyncCache.get<T>(key());
            if (cached) {
                setCachedData(() => cached);
            }
        })();
    });

    const latestData = createAsync(
        async () => {
            // Get actual value and check if it has changed. Only re-create createAsync if changed
            const result = await fn();

            if (!cachedData() || JSON.stringify(result) !== JSON.stringify(cachedData())) {
                await asyncCache.set<T>(key(), result);
                setCachedData(null); // Force latestData to be shown instead of cachedData
            }
            return result;
        },
        {
            name: options.name,
            initialValue: undefined,
            deferStream: options.deferStream,
        }
    );

    return () => cachedData() ?? latestData();
}
