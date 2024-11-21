import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGlobalNotification } from "@/hooks/useGlobalNotification";
import { A } from "@solidjs/router";
import { Bell, Book, FileText, GraduationCap, Megaphone, MessageSquare } from "lucide-solid";
import { createEffect, createSignal, For, Match, Show, Suspense, Switch } from "solid-js";
import { Skeleton } from "./ui/skeleton";
import { formatDistance, formatDistanceToNow } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface INotification {
    type: "announcement" | "content" | "grade" | "feedback" | "assignment" | "unknown";
    title: string;
    course: string;
    link: string;
    timestamp: string;
    details?: IGradeDetails;
    icon?: string;
}

interface IGradeDetails {
    score: number;
    total: number;
    percentage: number;
    weightedScore: number;
    weightedTotal: number;
}

const NotificationItemSkeleton = () => {
    return (
        <>
            <Skeleton height={82} width={298} radius={0} class="m-1" />
            <Skeleton height={82} width={298} radius={0} class="m-1" />
            <Skeleton height={82} width={298} radius={0} class="m-1" />
            <Skeleton height={82} width={298} radius={0} class="m-1" />
            <Skeleton height={82} width={298} radius={0} class="m-1" />
        </>
    );
};

const Notification = () => {
    const {
        notifications,
        getOlder: loadMoreOldNotifications,
        hasNew: hasNewNotifications,
        readAll: readAllNotifications,
    } = useGlobalNotification(1);
    const [isOpen, setIsOpen] = createSignal(false);

    const getIcon = (type: INotification["type"]) => {
        return (
            <Switch>
                <Match when={type === "announcement"}>
                    <Megaphone class="h-4 w-4" />
                </Match>
                <Match when={type === "content"}>
                    <Book class="h-4 w-4" />
                </Match>
                <Match when={type === "grade"}>
                    <GraduationCap class="h-4 w-4" />
                </Match>
                <Match when={type === "feedback"}>
                    <MessageSquare class="h-4 w-4" />
                </Match>
                <Match when={type === "assignment"}>
                    <FileText class="h-4 w-4" />
                </Match>
                <Match when={true}>
                    <Bell class="h-4 w-4" />
                </Match>
            </Switch>
        );
    };

    createEffect(() => {
        if (isOpen()) {
            readAllNotifications();
        }
    });

    const loadMore = () => {
        loadMoreOldNotifications();
    };

    const timestampAsDate = (timestamp: string) => new Date(timestamp);

    return (
        <Popover open={isOpen()} onOpenChange={(value) => setIsOpen(value)}>
            <PopoverTrigger
                as={Button<"button">}
                variant="ghost"
                size="sm"
                class="w-9 px-0 relative"
            >
                <Bell class="h-4 w-4" />
                <Show when={hasNewNotifications()}>
                    <div class="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-destructive"></div>
                </Show>
            </PopoverTrigger>
            <PopoverContent class="w-80 p-0">
                <ScrollArea class="h-[400px]">
                    <div class="space-y-1">
                        <Suspense fallback={<NotificationItemSkeleton />}>
                            <For each={notifications()}>
                                {(notification) => (
                                    <div class="p-4 border-b last:border-b-0">
                                        <A
                                            href={notification.link}
                                            class="flex items-start space-x-4"
                                        >
                                            <div class="mt-1">{getIcon(notification.type)}</div>
                                            <div class="flex-1 space-y-1">
                                                <p class="text-sm font-medium leading-none">
                                                    {notification.title}
                                                </p>
                                                <p class="text-xs text-muted-foreground">
                                                    {notification.course}
                                                </p>

                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <p class="text-xs text-muted-foreground">
                                                            {formatDistanceToNow(
                                                                notification.timestamp,
                                                                {
                                                                    addSuffix: true,
                                                                }
                                                            )}
                                                        </p>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {timestampAsDate(
                                                            notification.timestamp
                                                        ).toLocaleString()}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </A>
                                    </div>
                                )}
                            </For>
                        </Suspense>
                    </div>
                    <div class="w-full flex justify-center">
                        <Button variant="link" onClick={loadMore}>
                            Load More
                        </Button>
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
};

export default Notification;
