import { createPersistentStore } from "./persistentStore";

interface IPersistentNavState {
    isCourseListOpen: boolean;
}

export function usePersistentNav() {
    const [persistentNav, setPersistentNav] = createPersistentStore<IPersistentNavState>(
        { isCourseListOpen: false },
        `persistent-nav`
    );

    return [persistentNav, setPersistentNav] as const;
}
