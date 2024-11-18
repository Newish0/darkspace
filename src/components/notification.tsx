import { createSignal, For, Switch, Match, Show, createEffect, Suspense } from "solid-js";
import {
    Bell,
    Megaphone,
    Book,
    GraduationCap,
    MessageSquare,
    FileText,
    MoreHorizontal,
} from "lucide-solid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { useGlobalNotification } from "@/hooks/useGlobalNotification";
import { Skeleton } from "./ui/skeleton";
import { A } from "@solidjs/router";

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

const mockNotifications: INotification[] = [
    {
        type: "announcement",
        title: "New course announcement",
        course: "Mathematics 101",
        link: "/courses/math101/announcements/1",
        timestamp: "2023-05-15T10:00:00Z",
    },
    {
        type: "content",
        title: "New lecture notes available",
        course: "History 202",
        link: "/courses/history202/content/lecture5",
        timestamp: "2023-05-14T14:30:00Z",
    },
    {
        type: "grade",
        title: "Quiz 2 graded",
        course: "Physics 301",
        link: "/courses/physics301/grades/quiz2",
        timestamp: "2023-05-13T16:45:00Z",
        details: {
            score: 85,
            total: 100,
            percentage: 85,
            weightedScore: 8.5,
            weightedTotal: 10,
        },
    },
    {
        type: "feedback",
        title: "Feedback on Assignment 3",
        course: "English Literature 401",
        link: "/courses/literature401/assignments/3/feedback",
        timestamp: "2023-05-12T11:20:00Z",
    },
    {
        type: "assignment",
        title: "New assignment posted",
        course: "Computer Science 201",
        link: "/courses/cs201/assignments/4",
        timestamp: "2023-05-11T09:15:00Z",
    },
];

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

    return (
        <Popover open={isOpen()} onOpenChange={(value) => setIsOpen(value)}>
            <PopoverTrigger as={Button<"button">} variant="outline" size="icon" class="relative">
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
                                                <p class="text-xs text-muted-foreground">
                                                    {new Date(
                                                        notification.timestamp
                                                    ).toLocaleString()}
                                                </p>
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
