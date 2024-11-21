import { makePersisted } from "@solid-primitives/storage";
import { createSignal } from "solid-js";

interface IPersistentNavState {
    isCourseListOpen: boolean;
}

export function usePersistentNav() {
    const [persistentNav, setPersistentNav] = makePersisted(
        createSignal<IPersistentNavState>({ isCourseListOpen: false }),
        { name: `persistent-nav` }
    );

    return [persistentNav, setPersistentNav] as const;
}
