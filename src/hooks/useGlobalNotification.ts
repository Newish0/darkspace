// import { D2LActivityFeedFetcher, INotification } from "@/services/BS/scraper/notification";
// import { createPersistentStore } from "./persistentStore";
// import { createStore } from "solid-js/store";
// import { onCleanup, onMount } from "solid-js";

import { D2LActivityFeedFetcher, INotification } from "@/services/BS/scraper/notification";
import { createSignal, onCleanup } from "solid-js";

const GLOBAL_ID = "6606";

export function useGlobalNotification(category: number) {
    const fetcher = D2LActivityFeedFetcher.create(GLOBAL_ID, category);
    const [notifications, setNotifications] = createSignal<INotification[]>([]);
    const [hasNew, setHasNew] = createSignal(false);

    if (fetcher.getCurrentFeed().length) {
        setNotifications(fetcher.getCurrentFeed());
    } else {
        fetcher.getInitialFeed().then((latestNotifications) => {
            setNotifications(latestNotifications);
        });
    }

    const unsubscribe = fetcher.subscribeToUpdates((hasNew) => {
        if (hasNew) setHasNew(hasNew);
    });

    onCleanup(() => {
        unsubscribe();
    });

    const getOlder = () => {
        fetcher.getMoreFeed().then((newNotifications) => {
            setNotifications((prevNotifications) => [...prevNotifications, ...newNotifications]);
        });
    };

    const readAll = () => {
        setHasNew(false);
    };

    return {
        notifications,
        getOlder,
        hasNew,
        readAll,
    } as const;
}
