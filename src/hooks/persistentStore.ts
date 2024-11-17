import { onCleanup } from "solid-js";
import { createStore, reconcile } from "solid-js/store";

export function createPersistentStore<T extends object>(
    initialState: T,
    name: string,
    options: {
        serialize?: (state: T) => string;
        deserialize?: (saved: string) => T;
        storage?: Storage;
    } = {}
) {
    const {
        serialize = JSON.stringify,
        deserialize = JSON.parse,
        storage = localStorage,
    } = options;

    const savedState = storage.getItem(name);
    const [state, setState] = createStore<T>(savedState ? deserialize(savedState) : initialState);

    const saveState = () => {
        try {
            storage.setItem(name, serialize(state));
        } catch (e) {
            console.error("Failed to save state", e);
        }
    };

    const setAndPersistState = (value: T | ((state: T) => T)) => {
        if (typeof value === "function") {
            value = value(state);
        }

        setState(reconcile({ ...value }));
        saveState();
    };

    // Function to handle storage events
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === name && event.newValue) {
            setState(reconcile(deserialize(event.newValue)));
        }
    };

    // Add event listener
    window.addEventListener("storage", handleStorageChange);

    // Cleanup function to remove the event listener
    onCleanup(() => {
        window.removeEventListener("storage", handleStorageChange);
    });

    return [state, setAndPersistState] as const;
}
