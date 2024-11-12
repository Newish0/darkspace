import { createAsync } from "@solidjs/router";
import { createEffect, createSignal } from "solid-js";

const CACHE_NAME = "async-cache";
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

async function getFromCache<T>(key: string): Promise<T | null> {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(key);

    if (!response) return null;

    // Check if cache is expired
    const cachedTime = response.headers.get("cached-time");
    if (cachedTime) {
        const age = Date.now() - parseInt(cachedTime);
        if (age > CACHE_DURATION) {
            await cache.delete(key);
            return null;
        }
    }

    return response.json();
}

async function setInCache<T>(key: string, data: T): Promise<void> {
    const cache = await caches.open(CACHE_NAME);
    const headers = new Headers({
        "Content-Type": "application/json",
        "cached-time": Date.now().toString(),
    });

    const response = new Response(JSON.stringify(data), { headers });
    await cache.put(key, response);
}

function getKey(keys: string[]) {
    return keys.join("/");
}

type CreateAsyncCachedOptions = {
    name?: string;
    keys: () => string[];
    deferStream?: boolean;
};

/**
 * Creates a cached async function in which the initial value is fetched from the cache asynchronously.
 * @param fn The function to cache
 * @param options Options to configure the cache
 * @returns The cached async function
 */
export function createAsyncCached<T>(fn: () => Promise<T>, options: CreateAsyncCachedOptions) {
    const key = () => getKey(options.keys());

    const [currentKey, setCurrentKey] = createSignal(key());

    // Workaround to force recreation of `createAsync`
    const [useCache, setUseCache] = createSignal(true);
    const [cachedData, setCachedData] = createSignal<T | undefined>(undefined);

    createEffect(() => {
        if (key() !== currentKey()) {
            setCurrentKey(key());
            setUseCache(true);
        }
    });

    const data = createAsync(
        async () => {
            // Workaround to force recreation of `createAsync`
            if (useCache()) {
                const cachedValue = await getFromCache<T>(key());
                if (cachedValue) {
                    setCachedData(() => cachedValue);

                    // Schedule actual fetch for next tick
                    setTimeout(() => setUseCache(false), 0);
                    return cachedValue;
                }
            }

            // Call the function and cache the result
            const result = await fn();
            await setInCache(key(), result);
            return result;
        },
        {
            name: options.name,
            initialValue: cachedData(),
            deferStream: options.deferStream,
        }
    );

    return data;
}
