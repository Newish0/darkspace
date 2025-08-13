import { createAsync } from "@solidjs/router";
import { createEffect, createSignal, onMount } from "solid-js";

class AsyncCache {
    private readonly DB_NAME = "async-cache";
    private readonly STORE_NAME = "cache-store";
    private readonly DB_VERSION = 1;
    private readonly CACHE_DURATION = 72 * 60 * 60 * 1000; // 72 hour in milliseconds

    private async openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME);
                }
            };
        });
    }

    private async getStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
        const db = await this.openDB();
        const transaction = db.transaction(this.STORE_NAME, mode);
        return transaction.objectStore(this.STORE_NAME);
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const store = await this.getStore("readonly");
            return new Promise((resolve, reject) => {
                const request = store.get(key);

                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    const data = request.result;

                    if (!data) {
                        resolve(null);
                        return;
                    }

                    // Check if cache is expired
                    const age = Date.now() - data.timestamp;
                    if (age > this.CACHE_DURATION) {
                        // Delete expired data
                        this.delete(key).catch(console.error);
                        resolve(null);
                        return;
                    }

                    resolve(data.value);
                };
            });
        } catch (error) {
            console.error("Error getting from cache:", error);
            return null;
        }
    }

    async set<T>(key: string, value: T): Promise<void> {
        try {
            const store = await this.getStore("readwrite");
            return new Promise((resolve, reject) => {
                const request = store.put(
                    {
                        value,
                        timestamp: Date.now(),
                    },
                    key
                );

                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve();
            });
        } catch (error) {
            console.error("Error setting cache:", error);
        }
    }

    async delete(key: string): Promise<void> {
        try {
            const store = await this.getStore("readwrite");
            return new Promise((resolve, reject) => {
                const request = store.delete(key);

                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve();
            });
        } catch (error) {
            console.error("Error deleting from cache:", error);
        }
    }

    async clear(): Promise<void> {
        try {
            const store = await this.getStore("readwrite");
            return new Promise((resolve, reject) => {
                const request = store.clear();

                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve();
            });
        } catch (error) {
            console.error("Error clearing cache:", error);
        }
    }
}

const asyncCache = new AsyncCache();

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

    // FIXME:

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
