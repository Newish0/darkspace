import { makePersisted } from "@solid-primitives/storage";
import { createSignal } from "solid-js";

interface UserMeta {
    lastUsedVersion?: string;
    preloadedContent: boolean;
}

export function useUserMeta() {
    const [userMeta, setUserMeta] = makePersisted(
        createSignal<UserMeta>({
            lastUsedVersion: undefined, // default
            preloadedContent: false,
        }),
        {
            name: "user-meta",
        }
    );

    return [userMeta, setUserMeta] as const;
}
