import { createAsyncCached } from "@/hooks/async-cached";
import { getAssignments, IAssignment } from "@/services/BS/scraper/assignment";
import { getQuizzes, IQuizInfo } from "@/services/BS/scraper/quizzes";
import { isPast } from "date-fns";
import { Component, For, Match, Show, Switch } from "solid-js";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { A } from "@solidjs/router";
import { BookOpenIcon, CalendarIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from "lucide-solid";

type CourseWork = (IAssignment & { type: "assignment" }) | (IQuizInfo & { type: "quiz" });

interface CourseWorkItemProps {
    item: CourseWork;
    courseId: string;
}

const CourseWorkItem: Component<CourseWorkItemProps> = (props) => {
    const isPast = () => (props.item.dueDate ? new Date(props.item.dueDate) < new Date() : false);

    return (
        <Card classList={{ "opacity-50": isPast() }}>
            <CardHeader class="p-4">
                <CardTitle class="flex items-center gap-2 text-base">
                    <Switch>
                        <Match when={props.item.type === "assignment"}>
                            <BookOpenIcon size={18} class="flex-shrink-0" />
                        </Match>
                        <Match when={props.item.type === "quiz"}>
                            <ClockIcon size={18} class="flex-shrink-0" />
                        </Match>
                    </Switch>
                    <A href={`/courses/${props.courseId}/coursework?id=${props.item.id}`} class="hover:underline">{props.item.name}</A>
                </CardTitle>
                <CardDescription>
                    {props.item.type.charAt(0).toUpperCase() + props.item.type.slice(1)}
                </CardDescription>
            </CardHeader>
            <CardContent class="px-4 pb-4">
                <div class="space-y-2">
                    <Show when={props.item.dueDate}>
                        <div class="flex items-center gap-2">
                            <CalendarIcon class="text-muted-foreground flex-shrink-0" size={14} />
                            <span class="text-xs">Due: {props.item.dueDate}</span>
                        </div>
                    </Show>

                    <Show when={props.item.type === "assignment"}>
                        <div class="flex items-center gap-2">
                            <Switch>
                                <Match when={props.item.status === "submitted"}>
                                    <CheckCircleIcon
                                        class="text-success-foreground flex-shrink-0"
                                        size={14}
                                    />
                                </Match>
                                <Match when={props.item.status !== "submitted"}>
                                    <XCircleIcon
                                        class="text-error-foreground flex-shrink-0"
                                        size={14}
                                    />
                                </Match>
                            </Switch>
                            <span class="text-xs">
                                Status: {props.item.status?.replaceAll("-", " ") || "Unknown"}
                            </span>
                        </div>
                    </Show>

                    <Show when={props.item.type === "quiz" && props.item.status}>
                        {(status) => (
                            <Badge variant={status() === "completed" ? "outline" : "secondary"}>
                                {status()}
                            </Badge>
                        )}
                    </Show>

                    <Show
                        when={
                            props.item.type === "quiz" &&
                            props.item.attempts !== undefined &&
                            props.item.attemptsAllowed !== undefined
                                ? props.item
                                : null
                        }
                    >
                        {(quiz) => (
                            <div>
                                Attempts: {quiz().attempts} / {quiz().attemptsAllowed}
                            </div>
                        )}
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

    const upcoming = () => {
        const assignmentCws: CourseWork[] = (assignments() ?? []).map((assignment) => ({
            ...assignment,
            type: "assignment",
        }));

        const quizCws: CourseWork[] = (quizzes() ?? []).map((quiz) => ({ ...quiz, type: "quiz" }));

        const items: CourseWork[] = [...assignmentCws, ...quizCws]
            .flat()
            .toSorted(
                (a, b) =>
                    new Date(a?.dueDate || "").getTime() - new Date(b?.dueDate || "").getTime()
            );

        console.log("items", items);

        return items.filter(
            (item) =>
                (item.status !== "submitted" && item.endDate && !isPast(new Date(item.endDate))) ||
                !isPast(new Date(item?.dueDate ?? ""))
        );
        // return items.filter((item) => !isPast(new Date(item?.dueDate ?? "")));
    };

    return (
        <>
            <div class="flex items-center text-base border-b">
                <h2 class="text-xl font-bold px-4 py-2">Upcoming</h2>
                <Badge variant={"secondary"}>{upcoming().length}</Badge>
            </div>

            <div class="p-4 space-y-2 overflow-auto h-full">
                <For each={upcoming()}>
                    {(cw) => <CourseWorkItem item={cw} courseId={props.courseId} />}
                </For>
            </div>
        </>
    );
}
