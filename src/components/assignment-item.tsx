import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { IAssignment } from "@/services/BS/scraper/assignment";
import { buildAssignmentSubmitUrl, buildAssignmentFeedbackUrl } from "@/services/BS/url";
import { format, isPast } from "date-fns";
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Clock,
    HelpCircle,
    Link2,
    Play,
    RotateCcw,
} from "lucide-solid";
import { Component, ComponentProps, createSignal, For, JSX, Match, Show, Switch } from "solid-js";
import { Badge } from "./ui/badge";

import { createAsyncCached } from "@/hooks/async-cached";
import { cn } from "@/lib/utils";
import { getAssignmentInfo } from "@/services/BS/scraper/assignment-info";
import { ContentModal, ContentModalContent, ContentModalTrigger } from "./content-modal";
import ControlledSuspense from "./controlled-suspense";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

interface AssignmentItemProps {
    assignment: IAssignment;
    courseId: string;
    defaultModalOpen?: boolean;
    onModalOpenChange?: (open: boolean) => void;
}

// Status Icons Component
const StatusIcon: Component<{ status?: IAssignment["status"] }> = (props) => (
    <Switch fallback={<HelpCircle class="h-5 w-5 text-muted-foreground" />}>
        <Match when={props.status === "submitted"}>
            <CheckCircle class="h-5 w-5 text-success-foreground" />
        </Match>
        <Match when={props.status === "not-submitted"}>
            <AlertCircle class="h-5 w-5 text-error-foreground" />
        </Match>
        <Match when={props.status === "returned"}>
            <Clock class="h-5 w-5 text-warning-foreground" />
        </Match>
    </Switch>
);

// Action Button Component
const ActionButton: Component<{
    status?: IAssignment["status"];
    isPastEndDate: boolean;
    assignmentId?: string;
    assignmentName?: string;
    groupId?: string;
    courseId: string;
    defaultModalOpen?: boolean;
    onModalOpenChange?: (open: boolean) => void;
}> = (props) => {
    const AssignmentModal = (props: {
        triggerContent: JSX.Element;
        url?: string;
        title: string;
        variant: ComponentProps<typeof Button>["variant"];
        defaultOpen?: boolean;
        onModalOpenChange?: (open: boolean) => void;
    }) => (
        <ContentModal defaultOpen={props.defaultOpen} onOpenChange={props.onModalOpenChange}>
            <ContentModalTrigger as={Button<"button">} variant={props.variant} size="sm">
                {props.triggerContent}
            </ContentModalTrigger>
            <ContentModalContent url={props.url} title={props.title} contentType="webpage" />
        </ContentModal>
    );

    const nonFeedbackModalCommonProps = {
        url:
            props.assignmentId &&
            buildAssignmentSubmitUrl(props.courseId, props.assignmentId, props.groupId),
        title: props.assignmentName || "Assignment",
        defaultOpen: props.defaultModalOpen,
        onModalOpenChange: props.onModalOpenChange,
    };

    const feedbackModalCommonProps = {
        url:
            props.assignmentId &&
            buildAssignmentFeedbackUrl(props.courseId, props.assignmentId, props.groupId),
        title: (props.assignmentName || "Assignment") + " Feedback",
        defaultOpen: props.defaultModalOpen,
        onModalOpenChange: props.onModalOpenChange,
    };

    return (
        <>
            <Switch>
                <Match when={props.status === "submitted" && !props.isPastEndDate}>
                    <AssignmentModal
                        triggerContent={
                            <>
                                <RotateCcw class="mr-2 h-4 w-4" /> Resubmit
                            </>
                        }
                        variant="link"
                        {...nonFeedbackModalCommonProps}
                    />
                </Match>
                <Match when={props.status === "not-submitted" && !props.isPastEndDate}>
                    <AssignmentModal
                        triggerContent={
                            <>
                                <Play class="mr-2 h-4 w-4" /> Start Assignment
                            </>
                        }
                        variant="outline"
                        {...nonFeedbackModalCommonProps}
                    />
                </Match>
                <Match when={props.status === "returned"}>
                    <AssignmentModal
                        triggerContent={
                            <>
                                <Link2 class="mr-2 h-4 w-4" /> View Feedback
                            </>
                        }
                        variant="default"
                        {...feedbackModalCommonProps}
                    />
                </Match>
            </Switch>
        </>
    );
};

// Grade Section Component
const GradeSection: Component<{ assignment: IAssignment }> = (props) => (
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
);

// Assignment Details Component
const AssignmentDetails: Component<{ assignment: IAssignment }> = (props) => (
    <div>
        <h3 class="font-semibold mb-2">Assignment Details</h3>
        <ul class="space-y-2">
            <For
                each={[
                    { date: props.assignment.startDate, label: "Start" },
                    { date: props.assignment.endDate, label: "End" },
                    { date: props.assignment.dueDate, label: "Due" },
                ]}
            >
                {(item) => (
                    <Show when={item.date}>
                        <li class="flex items-center">
                            <Calendar class="mr-2 h-4 w-4" />
                            {item.label}: {format(new Date(item.date!), "PPP")}
                        </li>
                    </Show>
                )}
            </For>
            <Show when={props.assignment.group}>
                <li class="flex items-center">
                    <Clock class="mr-2 h-4 w-4" />
                    Group: {props.assignment.group}
                </li>
            </Show>
        </ul>
    </div>
);

// Additional Information Component
const AdditionalInfo: Component<{ assignment: IAssignment }> = (props) => (
    <div>
        <h3 class="font-medium mb-2">Additional Information</h3>
        <Show when={props.assignment.accessNote} fallback={<p>None</p>}>
            <p class="text-sm text-muted-foreground">{props.assignment.accessNote}</p>
        </Show>
        <Show when={props.assignment.tags && props.assignment.tags.length > 0}>
            <div class="mt-2">
                <p class="font-medium">Tags:</p>
                <div class="flex flex-wrap gap-2 mt-1">
                    <For each={props.assignment.tags}>{(tag) => <Badge>{tag}</Badge>}</For>
                </div>
            </div>
        </Show>
    </div>
);

const AssignmentSubmissions: Component<{
    assignment: IAssignment;
    courseId: string;
    class?: string;
}> = (props) => {
    const submissions = createAsyncCached(
        () =>
            getAssignmentInfo(props.courseId, props.assignment.id || "", props.assignment.groupId),
        {
            keys: () => [
                "assignments",
                props.courseId,
                props.assignment.id || "",
                props.assignment.groupId || "0",
            ],
        }
    );

    return (
        <Show when={props.assignment.id} fallback={<p>None</p>}>
            <ControlledSuspense hasContent={!!submissions()} fallback={<p>Loading...</p>}>
                {
                    <div class={cn("flex flex-col gap-2", props.class)}>
                        <h3 class="font-medium mb-2">Submissions</h3>
                        <div class="flex flex-col gap-2">
                            <Table class="w-full overflow-hidden">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Submission ID</TableHead>
                                        <TableHead>Submission Date</TableHead>
                                        <TableHead>Student Name</TableHead>
                                        <TableHead>Files</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <For each={submissions()?.submissions}>
                                        {(submission) => (
                                            <TableRow>
                                                <TableCell class="align-top">
                                                    {submission.submissionId}
                                                </TableCell>
                                                <TableCell class="align-top">
                                                    {submission.dateSubmitted}
                                                </TableCell>
                                                <TableCell class="align-top">
                                                    {submission.submitter.name}
                                                </TableCell>
                                                <TableCell class="align-top">
                                                    <For each={submission.files}>
                                                        {(file) => (
                                                            <a href={file.url} target="_blank">
                                                                <Badge
                                                                    variant="secondary"
                                                                    round
                                                                    class="text-nowrap"
                                                                >
                                                                    <Link2 class="h-4 w-4 mr-2" />
                                                                    <p>{file.filename}</p>
                                                                    <p>{file.filesize}</p>
                                                                </Badge>
                                                            </a>
                                                        )}
                                                    </For>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </For>
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                }
            </ControlledSuspense>
        </Show>
    );
};

// Main Component
const AssignmentItem: Component<AssignmentItemProps> = (props) => {
    const [isOpen, setIsOpen] = createSignal(false);

    const isPastEndDate = () => {
        if (!props.assignment.endDate) return false;
        return isPast(new Date(props.assignment.endDate));
    };

    return (
        <Card class="bg-card text-card-foreground">
            <CardHeader>
                <div class="flex items-center justify-between">
                    <CardTitle class="text-xl font-bold">{props.assignment.name}</CardTitle>
                    <div class="flex-shrink-0 flex items-center gap-2">
                        <ActionButton
                            assignmentId={props.assignment.id}
                            assignmentName={props.assignment.name}
                            groupId={props.assignment.groupId}
                            courseId={props.courseId}
                            status={props.assignment.status}
                            isPastEndDate={isPastEndDate()}
                            defaultModalOpen={props.defaultModalOpen}
                            onModalOpenChange={props.onModalOpenChange}
                        />
                        <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen())}>
                            <Show when={isOpen()} fallback={<ChevronDown class="h-4 w-4" />}>
                                <ChevronUp class="h-4 w-4" />
                            </Show>
                        </Button>
                    </div>
                </div>
                <CardDescription>
                    <div class="flex items-center space-x-2">
                        <StatusIcon status={props.assignment.status} />
                        <span class="capitalize">
                            {props.assignment.status?.replaceAll("-", " ") || "Unknown"}
                        </span>
                    </div>
                </CardDescription>
            </CardHeader>

            <GradeSection assignment={props.assignment} />

            <Collapsible open={isOpen()} onOpenChange={setIsOpen}>
                <CollapsibleContent>
                    <CardContent>
                        <div class="grid gap-4 md:grid-cols-2">
                            <AssignmentDetails assignment={props.assignment} />
                            <AdditionalInfo assignment={props.assignment} />
                            <AssignmentSubmissions
                                assignment={props.assignment}
                                courseId={props.courseId}
                                class="md:col-span-2"
                            />
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
};

export default AssignmentItem;
