import { Component, createSignal, Switch, Match, Show, For } from "solid-js";
import { format, isPast } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    ChevronDown,
    ChevronUp,
    Calendar,
    Clock,
    Link2,
    CheckCircle,
    AlertCircle,
    HelpCircle,
    Play,
    RotateCcw,
} from "lucide-solid";
import { IAssignment } from "@/services/BS/scraper/assignment";
import { Badge } from "./ui/badge";

interface AssignmentItemProps {
    assignment: IAssignment;
}

const AssignmentItem: Component<AssignmentItemProps> = (props) => {
    const [isOpen, setIsOpen] = createSignal(false);

    const getStatusIcon = (status?: IAssignment["status"]) => (
        <Switch fallback={<HelpCircle class="h-5 w-5 text-muted-foreground" />}>
            <Match when={status === "submitted"}>
                <CheckCircle class="h-5 w-5 text-success" />
            </Match>
            <Match when={status === "not-submitted"}>
                <AlertCircle class="h-5 w-5 text-error" />
            </Match>
            <Match when={status === "returned"}>
                <Clock class="h-5 w-5 text-warning" />
            </Match>
        </Switch>
    );

    const isPastDueDate = () => {
        if (!props.assignment.dueDate) return false;
        return isPast(new Date(props.assignment.dueDate));
    };

    const ActionButton: Component = () => (
        <Show when={!isPastDueDate()}>
            <Switch>
                <Match when={props.assignment.status === "submitted"}>
                    <Button variant="link" size="sm" class="text-muted-foreground">
                        <RotateCcw class="mr-2 h-4 w-4" /> Resubmit
                    </Button>
                </Match>
                <Match when={props.assignment.status === "not-submitted"}>
                    <Button variant="outline" size="sm" class="bg-primary text-primary-foreground">
                        <Play class="mr-2 h-4 w-4" /> Start Assignment
                    </Button>
                </Match>
                <Match when={props.assignment.status === "returned"}>
                    <Button variant="default" size="sm">
                        <Play class="mr-2 h-4 w-4" /> View Feedback
                    </Button>
                </Match>
            </Switch>
        </Show>
    );

    return (
        <Card class="bg-card text-card-foreground">
            <CardHeader>
                <div class="flex items-center justify-between">
                    <CardTitle class="text-xl font-bold">{props.assignment.name}</CardTitle>
                    <div class="flex items-center gap-2">
                        <ActionButton />
                        <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen())}>
                            <Show when={isOpen()} fallback={<ChevronDown class="h-4 w-4" />}>
                                <ChevronUp class="h-4 w-4" />
                            </Show>
                        </Button>
                    </div>
                </div>
                <CardDescription>
                    <div class="flex items-center space-x-2">
                        {getStatusIcon(props.assignment.status)}
                        <span class="capitalize">
                            {props.assignment.status?.replaceAll("-", " ") || "Unknown"}
                        </span>
                    </div>
                </CardDescription>
            </CardHeader>

            <Show when={props.assignment.gradePercentage !== undefined}>
                <CardContent>
                    <div class="mb-4">
                        <div class="flex items-center justify-between">
                            <h3 class="font-semibold mb-2">Grade</h3>
                            <div class="flex items-center space-x-2">
                                <Show
                                    when={
                                        props.assignment.points !== undefined &&
                                        props.assignment.totalPoints !== undefined
                                    }
                                >
                                    <p>
                                        {props.assignment.points}/{props.assignment.totalPoints}
                                    </p>
                                    <Separator orientation="vertical" class="h-4" />
                                </Show>
                                <p>{props.assignment.gradePercentage!.toFixed(2)}%</p>
                            </div>
                        </div>
                        <Progress value={props.assignment.gradePercentage} class="mb-2" />
                    </div>
                </CardContent>
            </Show>

            <Collapsible open={isOpen()} onOpenChange={setIsOpen}>
                <CollapsibleContent>
                    <CardContent>
                        <div class="grid gap-4 md:grid-cols-2">
                            <div>
                                <h3 class="font-semibold mb-2">Assignment Details</h3>
                                <ul class="space-y-2">
                                    <Show when={props.assignment.startDate}>
                                        <li class="flex items-center">
                                            <Calendar class="mr-2 h-4 w-4" />
                                            Start:{" "}
                                            {format(new Date(props.assignment.startDate!), "PPP")}
                                        </li>
                                    </Show>
                                    <Show when={props.assignment.endDate}>
                                        <li class="flex items-center">
                                            <Calendar class="mr-2 h-4 w-4" />
                                            End:{" "}
                                            {format(new Date(props.assignment.endDate!), "PPP")}
                                        </li>
                                    </Show>
                                    <Show when={props.assignment.dueDate}>
                                        <li class="flex items-center">
                                            <Calendar class="mr-2 h-4 w-4" />
                                            Due:{" "}
                                            {format(new Date(props.assignment.dueDate!), "PPP")}
                                        </li>
                                    </Show>
                                    <Show when={props.assignment.group}>
                                        <li class="flex items-center">
                                            <Clock class="mr-2 h-4 w-4" />
                                            Group: {props.assignment.group}
                                        </li>
                                    </Show>
                                    <Show when={props.assignment.feedbackUrl}>
                                        <li>
                                            <a
                                                href={props.assignment.feedbackUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="flex items-center"
                                            >
                                                <Link2 class="mr-2 h-4 w-4" />
                                                <span class="text-info-foreground hover:underline">
                                                    Feedback
                                                </span>
                                            </a>
                                        </li>
                                    </Show>
                                </ul>
                            </div>
                            <div>
                                <h3 class="font-medium mb-2">Additional Information</h3>
                                <Show when={props.assignment.accessNote} fallback={<p>None</p>}>
                                    <p class="text-sm text-muted-foreground">
                                        {props.assignment.accessNote}
                                    </p>
                                </Show>
                                <Show
                                    when={props.assignment.tags && props.assignment.tags.length > 0}
                                >
                                    <div class="mt-2">
                                        <p class="font-medium">Tags:</p>
                                        <div class="flex flex-wrap gap-2 mt-1">
                                            <For each={props.assignment.tags}>
                                                {(tag) => <Badge>{tag}</Badge>}
                                            </For>
                                        </div>
                                    </div>
                                </Show>
                            </div>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
};

export default AssignmentItem;
