// import { D2LActivityFeedFetcher, INotification } from "@/services/BS/scraper/notification";
// import { createPersistentStore } from "./persistentStore";
// import { createStore } from "solid-js/store";
// import { onCleanup, onMount } from "solid-js";

import { D2LActivityFeedFetcher, INotification } from "@/services/BS/scraper/notification";
import { createResource, createSignal, onCleanup } from "solid-js";

const GLOBAL_ID = "6606";

export function useGlobalNotification(category: number) {
    const fetcher = D2LActivityFeedFetcher.create(GLOBAL_ID, category);
    const [hasNew, setHasNew] = createSignal(false);

    // Use resource instead of signal so we can use <Suspense />
    let resolver: (value: INotification[]) => void;
    const [_notifications, { mutate: _setNotifications }] = createResource(
        // Defer actual fetching until notifications() access.
        // This is because calling getInitialFeed() will cause
        // backend to "mark all notifications as read".
        () =>
            new Promise<INotification[]>((r) => {
                resolver = r;
            })
    );

    if (fetcher.getCurrentFeed().length) {
        _setNotifications(fetcher.getCurrentFeed());
    }

    // Actual accessor for notifications
    const getNotifications = () => {
        if (!_notifications()?.length) {
            fetcher.getInitialFeed().then(resolver);
        }

        return _notifications();
    };

    const unsubscribe = fetcher.subscribeToUpdates((hasNew) => {
        if (hasNew) setHasNew(hasNew);
    });

    onCleanup(() => {
        unsubscribe();
    });

    const getOlder = () => {
        fetcher.getMoreFeed().then((newNotifications) => {
            _setNotifications((prevNotifications = []) => [
                ...prevNotifications,
                ...newNotifications,
            ]);
        });
    };

    const readAll = () => {
        setHasNew(false);
    };

    return {
        notifications: getNotifications,
        getOlder,
        hasNew,
        readAll,
    } as const;
}
