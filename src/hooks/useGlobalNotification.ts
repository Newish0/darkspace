import { GLOBAL_COURSE_ID } from "@/services/BS/api/enrollment";
import { D2LActivityFeedFetcher, INotification } from "@/services/BS/scraper/notification";
import { createResource, createSignal, onCleanup } from "solid-js";



export function useGlobalNotification(category: number) {
    const fetcher = D2LActivityFeedFetcher.create(GLOBAL_COURSE_ID, category);
    const [hasNew, setHasNew] = createSignal(false);

    // Use resource instead of signal so we can use <Suspense />
    const [notifications, { mutate: setNotifications, refetch }] = createResource<INotification[]>(
        () => fetcher.getMoreFeed()
    );

    const unsubscribe = fetcher.subscribeToUpdates((hasNew) => {
        setHasNew(hasNew);
        refetch();
    });

    onCleanup(() => {
        unsubscribe();
    });

    const getOlder = () => {
        fetcher
            .getMoreFeed({
                previousNotifications: notifications(),
            })
            .then((newNotifications) => {
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
