import { createAsyncCached } from "@/hooks/async-cached";
import { getAssignments, IAssignment } from "@/services/BS/scraper/assignment";
import { getQuizzes, IQuizInfo } from "@/services/BS/scraper/quizzes";
import { format as formatDate, isPast } from "date-fns";
import { Component, createEffect, For, Match, Show, Switch } from "solid-js";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarEvent } from "@/services/BS/calendar/calendar-transformer";
import { getCourseCalendarEvents } from "@/services/BS/calendar/course-calendar";
import { A } from "@solidjs/router";
import {
    BookOpenIcon,
    CalendarDaysIcon,
    CalendarIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
} from "lucide-solid";

interface UpcomingItemProps {
    type: "assignment" | "quiz" | "calendar";
    item: IAssignment | IQuizInfo | CalendarEvent;
    courseId: string;
}

const UpcomingItem: Component<UpcomingItemProps> = (props) => {
    const isPastDueDate = () => {
        if (props.type === "quiz" || props.type === "assignment") {
            const item = props.item as IAssignment | IQuizInfo;
            return item.dueDate ? item.dueDate < new Date() : false;
        } else if (props.type === "calendar") {
            const event = props.item as CalendarEvent;
            if (event.eventType === "due")
                return event.dueDate ? event.dueDate < new Date() : false;
        }
    };

    const dueDate = (): string | undefined => {
        if (props.type === "quiz" || props.type === "assignment") {
            const item = props.item as IAssignment | IQuizInfo;
            return item.dueDate ? formatDate(item.dueDate, "MMM d, yyyy h:mm a") : "Unknown";
        } else if (props.type === "calendar") {
            const event = props.item as CalendarEvent;
            if (event.eventType === "due")
                return event.dueDate && formatDate(event.dueDate, "MMM d, yyyy h:mm a");
        }
    };

    const DynamicIcon = () => (
        <Switch>
            <Match when={props.type === "assignment" ? props.item : null}>
                <BookOpenIcon size={18} class="flex-shrink-0" />
            </Match>
            <Match when={props.type === "quiz"}>
                <ClockIcon size={18} class="flex-shrink-0" />
            </Match>
            <Match when={props.type === "calendar"}>
                <CalendarDaysIcon size={18} class="flex-shrink-0" />
            </Match>
        </Switch>
    );

    const ItemLink = () => (
        <Switch>
            <Match when={props.type === "assignment" ? props.item : null}>
                <A
                    href={`/courses/${props.courseId}/coursework?id=${
                        (props.item as IAssignment).id
                    }`}
                    class="hover:underline"
                >
                    {props.item.name}
                </A>
            </Match>
            <Match when={props.type === "quiz"}>
                <A
                    href={`/courses/${props.courseId}/coursework?id=${
                        (props.item as IQuizInfo).id
                    }`}
                    class="hover:underline"
                >
                    {props.item.name}
                </A>
            </Match>
            <Match when={props.type === "calendar"}>
                {(_) => {
                    const event = props.item as CalendarEvent;

                    const url = () => {
                        if (event.itemType === "topic") {
                            return `/courses/${event.courseId}/m/${event.moduleId}?topic=${event.topicId}`;
                        }

                        return "";
                    };

                    return (
                        <A href={url()} class="hover:underline">
                            {props.item.name}
                        </A>
                    );
                }}
            </Match>
        </Switch>
    );

    return (
        <Card classList={{ "opacity-50": isPastDueDate() }}>
            <CardHeader class="p-4">
                <CardTitle class="flex items-center gap-2 text-base">
                    <DynamicIcon />
                    <ItemLink />
                </CardTitle>
                <CardDescription>
                    {props.type.charAt(0).toUpperCase() + props.type.slice(1)}
                </CardDescription>
            </CardHeader>
            <CardContent class="px-4 pb-4">
                <div class="space-y-2">
                    <Show when={dueDate()}>
                        <div class="flex items-center gap-2">
                            <CalendarIcon class="text-muted-foreground flex-shrink-0" size={14} />
                            <span class="text-xs">Due: {dueDate()}</span>
                        </div>
                    </Show>

                    <Show when={props.type === "assignment"}>
                        {(_) => {
                            const assignment = props.item as IAssignment;
                            return (
                                <div class="flex items-center gap-2">
                                    <Show
                                        when={
                                            assignment.status === "submitted" ||
                                            assignment.status === "returned"
                                        }
                                        fallback={
                                            <XCircleIcon
                                                class="text-error-foreground flex-shrink-0"
                                                size={14}
                                            />
                                        }
                                    >
                                        <CheckCircleIcon
                                            class="text-success-foreground flex-shrink-0"
                                            size={14}
                                        />
                                    </Show>

                                    <span class="text-xs">
                                        Status:{" "}
                                        {assignment.status?.replaceAll("-", " ") || "Unknown"}
                                    </span>
                                </div>
                            );
                        }}
                    </Show>

                    <Show when={props.type === "quiz"}>
                        {(_) => {
                            const quiz = props.item as IQuizInfo;
                            const status = quiz.status;
                            return (
                                <div class="flex items-center gap-2">
                                    <Switch>
                                        <Match
                                            when={
                                                status === "not-started" || status === "in-progress"
                                            }
                                        >
                                            <XCircleIcon
                                                class="text-error-foreground flex-shrink-0"
                                                size={14}
                                            />
                                        </Match>
                                        <Match when={status === "completed"}>
                                            <CheckCircleIcon
                                                class="text-success-foreground flex-shrink-0"
                                                size={14}
                                            />
                                        </Match>
                                        <Match when={status === "retry-in-progress"}>
                                            <ClockIcon
                                                class="text-warning-foreground flex-shrink-0"
                                                size={14}
                                            />
                                        </Match>
                                    </Switch>

                                    <span class="text-xs">
                                        Status: {status?.replaceAll("-", " ") || "Unknown"}
                                    </span>
                                </div>
                            );
                        }}
                    </Show>
                </div>
            </CardContent>
        </Card>
    );
};

interface UpcomingDisplayProps {
    courseId: string;
}

export default function UpcomingDisplay(props: UpcomingDisplayProps) {
    const quizzes = createAsyncCached(() => getQuizzes(props.courseId), {
        keys: () => ["quizzes", props.courseId],
    });

    const assignments = createAsyncCached(() => getAssignments(props.courseId), {
        keys: () => ["assignments", props.courseId],
    });

    const calendarEvents = createAsyncCached(() => getCourseCalendarEvents(props.courseId), {
        keys: () => ["calendar-events", props.courseId],
    });

    const upcoming = () => {
        const assignmentItems =
            assignments()?.map((assignment) => ({
                item: assignment,
                type: "assignment",
            })) ?? [];

        const quizItems = quizzes()?.map((quiz) => ({ item: quiz, type: "quiz" })) ?? [];

        const dueCalendarEventItems =
            calendarEvents()
                // Only events that are due
                ?.filter((event) => event.eventType === "due")

                // Only topics and unknown because assignments and quizzes are handled above
                ?.filter((event) => event.itemType === "topic" || event.itemType === "unknown")

                // convert to upcoming item
                .map((event) => ({ item: event, type: "calendar" })) ?? [];

        // Sort by due date
        const items = [assignmentItems, quizItems, dueCalendarEventItems]
            .flat()
            .toSorted((a, b) => {
                const aDate = a?.item?.dueDate;
                const bDate = b?.item?.dueDate;
                return new Date(aDate || "").getTime() - new Date(bDate || "").getTime();
            });

        // Only show future items
        return items.filter((item) => {
            // Only show calendar events that are due in the future
            if (item.type === "calendar") {
                const event = item.item as CalendarEvent;
                if (event.eventType === "due" && event.dueDate) return !isPast(event.dueDate);
                else return false;
            }

            const assignmentOrQuiz = item.item as IAssignment | IQuizInfo;

            // Only show assignments and quizzes that are not submitted and not reached the end date
            // Otherwise, remove from the list once submitted and past the due date.
            return (
                (assignmentOrQuiz.status !== "submitted" &&
                    assignmentOrQuiz.endDate &&
                    !isPast(new Date(assignmentOrQuiz.endDate))) ||
                !isPast(new Date(assignmentOrQuiz?.dueDate ?? ""))
            );
        }) as Omit<UpcomingItemProps, "courseId">[]; // Need to be careful here with type since we are using `as`
    };

    return (
        <>
            <div class="flex items-center text-base border-b">
                <h2 class="text-xl font-bold px-4 py-2">Upcoming</h2>
                <Badge variant={"secondary"}>{upcoming().length}</Badge>
            </div>

            <div class="p-4 space-y-2 overflow-auto h-full">
                <For each={upcoming()}>
                    {(upcoming) => <UpcomingItem {...upcoming} courseId={props.courseId} />}
                </For>
            </div>
        </>
    );
}
