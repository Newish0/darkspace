import { makePersisted } from "@solid-primitives/storage";
import { createSignal } from "solid-js";

interface UserMeta {
    isFirstTimeUser: boolean;
    preloadedContent: boolean;
}

export function useUserMeta() {
    const [userMeta, setUserMeta] = makePersisted(
        createSignal<UserMeta>({
            isFirstTimeUser: true,
            preloadedContent: false,
        }),
        {
            name: "user-meta",
        }
    );

    return [userMeta, setUserMeta] as const;
}
