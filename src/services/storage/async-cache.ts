import { AsyncStorage } from "@solid-primitives/storage";

export class AsyncCache implements AsyncStorage {
    private readonly DEFAULT_DB_NAME = "async-cache";
    private readonly DEFAULT_STORE_NAME = "cache-store";
    private readonly DB_VERSION = 1;
    private readonly CACHE_DURATION = 72 * 60 * 60 * 1000; // 72h in ms

    constructor(
        private dbName = this.DEFAULT_DB_NAME,
        private storeName = this.DEFAULT_STORE_NAME
    ) {
        return new Proxy(this, {
            get: (target, prop: string) => {
                if (prop in target) {
                    return (target as any)[prop]; // keep normal methods working
                }
                return target.get(prop); // allow asyncCache["foo"]
            },
            set: (target, prop: string, value) => {
                target.set(prop, value); // async save
                return true;
            },
            deleteProperty: (target, prop: string) => {
                target.delete(prop); // async delete
                return true;
            },
        });
    }

    private async openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.DB_VERSION);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
        });
    }

    private async getStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
        const db = await this.openDB();
        const transaction = db.transaction(this.storeName, mode);
        return transaction.objectStore(this.storeName);
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const store = await this.getStore("readonly");
            return new Promise((resolve, reject) => {
                const request = store.get(key);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    const data = request.result;
                    if (!data) return resolve(null);

                    const age = Date.now() - data.timestamp;
                    if (age > this.CACHE_DURATION) {
                        this.delete(key).catch(console.error);
                        return resolve(null);
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
                const request = store.put({ value, timestamp: Date.now() }, key);
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

    /* AsyncStorage interface */
    async getItem(key: string): Promise<string | null> {
        return this.get(key);
    }

    async setItem(key: string, value: string): Promise<void> {
        return this.set(key, value);
    }

    async removeItem(key: string): Promise<void> {
        return this.delete(key);
    }
}

export const asyncCache = new AsyncCache();
