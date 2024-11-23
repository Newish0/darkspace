import { D2LActivityFeedFetcher, INotification } from "@/services/BS/scraper/notification";
import { createResource, createSignal, onCleanup } from "solid-js";

const GLOBAL_ID = "6606";

export function useGlobalNotification(category: number) {
    const fetcher = D2LActivityFeedFetcher.create(GLOBAL_ID, category);
    const [hasNew, setHasNew] = createSignal(false);

    // Use resource instead of signal so we can use <Suspense />
    const [notifications, { mutate: setNotifications }] = createResource(() => {
        if (fetcher.getCurrentFeed().length) {
            return fetcher.getCurrentFeed();
        } else {
            return fetcher.getMoreFeed();
        }
    });

    const unsubscribe = fetcher.subscribeToUpdates((hasNew) => {
        setHasNew(hasNew);
    });

    onCleanup(() => {
        unsubscribe();
    });

    const getOlder = () => {
        fetcher.getMoreFeed().then((newNotifications) => {
            setNotifications((prevNotifications = []) => [
                ...prevNotifications,
                ...newNotifications,
            ]);
        });
    };

    const readAll = () => {
        setHasNew(false); // optimistic update
        fetcher.markAllAsRead().then((successful) => setHasNew(!successful)); // actual update
    };

    return {
        notifications,
        getOlder,
        hasNew,
        readAll,
    } as const;
}
