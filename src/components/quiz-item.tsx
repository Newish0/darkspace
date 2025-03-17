import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { createAsyncCached } from "@/hooks/async-cached";
import {
    getQuizSubmissionsFromUrl,
    IQuizInfo,
    IQuizSubmission,
} from "@/services/BS/scraper/quizzes";
import { buildQuizSummaryUrl } from "@/services/BS/url";
import { formatDate, isPast } from "date-fns";
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
import { ContentModal, ContentModalContent, ContentModalTrigger } from "./content-modal";

interface QuizItemProps {
    quiz: IQuizInfo;
    courseId: string;
    defaultModalOpen?: boolean;
}

// Status Icon Component
const StatusIcon: Component<{ status: IQuizInfo["status"] }> = (props) => (
    <Switch fallback={<HelpCircle class="h-5 w-5 text-muted-foreground" />}>
        <Match when={props.status === "completed"}>
            <CheckCircle class="h-5 w-5 text-success-foreground" />
        </Match>
        <Match when={props.status === "in-progress" || props.status === "retry-in-progress"}>
            <Clock class="h-5 w-5 text-warning-foreground" />
        </Match>
        <Match when={props.status === "not-started"}>
            <AlertCircle class="h-5 w-5 text-error-foreground" />
        </Match>
    </Switch>
);

// Action Button Component
const ActionButton: Component<{
    status: IQuizInfo["status"];
    hasSubmissions: boolean;
    isPastEndDate: boolean;
    quizId?: string;
    quizName?: string;
    courseId: string;
    defaultModalOpen?: boolean;
}> = (props) => {
    const QuizModal = (props: {
        triggerContent: JSX.Element;
        variant: ComponentProps<typeof Button>["variant"];
        defaultOpen?: boolean;
        quizId: string;
        quizName?: string;
        courseId: string;
    }) => (
        <ContentModal defaultOpen={props.defaultOpen}>
            <ContentModalTrigger as={Button<"button">} variant={props.variant} size="sm">
                {props.triggerContent}
            </ContentModalTrigger>
            <ContentModalContent
                url={buildQuizSummaryUrl(props.quizId!, props.courseId)}
                title={props.quizName || "Quiz Summary"}
                contentType="webpage"
            />
        </ContentModal>
    );

    const commonModalProps = {
        quizId: props.quizId!,
        quizName: props.quizName,
        courseId: props.courseId,
        defaultOpen: props.defaultModalOpen,
    } as const;

    return (
        <>
            <Show when={!props.isPastEndDate}>
                <Switch>
                    <Match when={props.status === "in-progress"}>
                        <QuizModal
                            triggerContent={
                                <>
                                    <Play class="mr-2 h-4 w-4" /> Continue
                                </>
                            }
                            variant="default"
                            {...commonModalProps}
                        />
                    </Match>
                    <Match when={props.status === "retry-in-progress"}>
                        <QuizModal
                            triggerContent={
                                <>
                                    <Play class="mr-2 h-4 w-4" /> Continue Retry
                                </>
                            }
                            variant="default"
                            {...commonModalProps}
                        />
                    </Match>
                    <Match when={props.status === "completed"}>
                        <QuizModal
                            triggerContent={
                                <>
                                    <CheckCircle class="mr-2 h-4 w-4" /> Completed
                                </>
                            }
                            variant="link"
                            {...commonModalProps}
                        />
                    </Match>

                    <Match when={props.hasSubmissions}>
                        <QuizModal
                            triggerContent={
                                <>
                                    <RotateCcw class="mr-2 h-4 w-4" /> Retry
                                </>
                            }
                            variant="link"
                            {...commonModalProps}
                        />
                    </Match>
                    <Match when={props.status !== "completed"}>
                        <QuizModal
                            triggerContent={
                                <>
                                    <Play class="mr-2 h-4 w-4" /> Start Quiz
                                </>
                            }
                            variant="outline"
                            {...commonModalProps}
                        />
                    </Match>
                </Switch>
            </Show>
        </>
    );
};

// Best Submission Component
const BestSubmission: Component<{ submission: IQuizSubmission }> = (props) => (
    <CardContent>
        <div class="mb-4">
            <div class="flex items-center justify-between">
                <h3 class="font-semibold mb-2">Best Submission</h3>
                <div class="flex items-center space-x-2">
                    <Show
                        when={
                            props.submission.points !== undefined &&
                            props.submission.totalPoints !== undefined
                        }
                    >
                        <p>
                            {props.submission.points}/{props.submission.totalPoints}
                        </p>
                        <Separator orientation="vertical" class="h-4" />
                    </Show>
                    <p>{props.submission.gradePercentage?.toFixed(2)}%</p>
                </div>
            </div>
            <Progress value={props.submission.gradePercentage} class="mb-2" />
        </div>
    </CardContent>
);

// Quiz Details Component
const QuizDetails: Component<{ quiz: IQuizInfo }> = (props) => (
    <div>
        <h3 class="font-semibold mb-2">Quiz Details</h3>
        <ul class="space-y-2">
            <For
                each={[
                    { date: props.quiz.startDate, label: "Start" },
                    { date: props.quiz.endDate, label: "End" },
                    { date: props.quiz.dueDate, label: "Due" },
                ]}
            >
                {(item) => (
                    <Show when={item.date}>
                        <li class="flex items-center">
                            <Calendar class="mr-2 h-4 w-4" />
                            {item.label}:{" "}
                            {item.date ? formatDate(item.date, "MMM d, yyyy h:mm a") : "Unknown"}
                        </li>
                    </Show>
                )}
            </For>
            <Show when={props.quiz.attemptsAllowed}>
                <li class="flex items-center">
                    <Clock class="mr-2 h-4 w-4" />
                    Attempts: {props.quiz.attempts || 0} / {props.quiz.attemptsAllowed}
                </li>
            </Show>
            <Show when={props.quiz.url}>
                <li>
                    <a
                        href={props.quiz.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="flex items-center text-info-foreground hover:underline"
                    >
                        <Link2 class="mr-2 h-4 w-4" />
                        Quiz Link
                    </a>
                </li>
            </Show>
        </ul>
    </div>
);

// Submission List Component
const SubmissionList: Component<{ submissions: IQuizSubmission[] }> = (props) => (
    <div>
        <h3 class="font-semibold mb-2">Submissions</h3>
        <Show when={props.submissions.length > 0} fallback={<p>No submissions yet.</p>}>
            <ul class="space-y-4">
                <For each={props.submissions}>
                    {(submission) => (
                        <li class="border-t border-border pt-2">
                            <p class="font-medium">Attempt {submission.attemptNumber}</p>
                            <Show when={submission.gradePercentage !== undefined}>
                                <Progress value={submission.gradePercentage} class="my-2" />
                            </Show>
                            <p>
                                Grade:{" "}
                                {submission.gradePercentage !== undefined
                                    ? `${submission.gradePercentage.toFixed(2)}%`
                                    : "Not graded"}
                            </p>
                            <Show
                                when={
                                    submission.points !== undefined &&
                                    submission.totalPoints !== undefined
                                }
                            >
                                <p>
                                    Points: {submission.points} / {submission.totalPoints}
                                </p>
                            </Show>
                            <Show when={submission.lateNote}>
                                <p class="text-error-foreground text-sm">{submission.lateNote}</p>
                            </Show>
                            <a
                                href={submission.attemptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="text-info-foreground hover:underline text-sm"
                            >
                                View Attempt
                            </a>
                        </li>
                    )}
                </For>
            </ul>
        </Show>
    </div>
);

// Main Quiz Item Component
const QuizItem: Component<QuizItemProps> = (props) => {
    const [isOpen, setIsOpen] = createSignal(false);

    const submissions = createAsyncCached(
        () => {
            if (props.quiz.submissionsUrl) {
                return getQuizSubmissionsFromUrl(props.quiz.submissionsUrl);
            }
            return Promise.resolve([] as IQuizSubmission[]);
        },
        { keys: () => [props.quiz.submissionsUrl ?? ""] }
    );

    const bestSubmission = () => {
        const s = submissions();
        if (!s?.length) return null;

        return s.reduce(
            (best, current) =>
                (current.gradePercentage || 0) > (best.gradePercentage || 0) ? current : best,
            s[0]
        );
    };

    const isPastEndDate = () => (props.quiz.endDate ? isPast(new Date(props.quiz.endDate)) : false);

    return (
        <Card class="bg-card text-card-foreground">
            <CardHeader>
                <div class="flex items-center justify-between">
                    <CardTitle class="text-xl font-bold">{props.quiz.name}</CardTitle>
                    <div class="flex items-center gap-2">
                        <ActionButton
                            status={props.quiz.status}
                            hasSubmissions={Boolean(submissions()?.length)}
                            isPastEndDate={isPastEndDate()}
                            courseId={props.courseId}
                            quizId={props.quiz.id}
                            quizName={props.quiz.name}
                            defaultModalOpen={props.defaultModalOpen}
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
                        <StatusIcon status={props.quiz.status} />
                        <span class="capitalize">{props.quiz.status?.replaceAll("-", " ")}</span>
                    </div>
                </CardDescription>
            </CardHeader>

            <Show when={bestSubmission()}>{(bs) => <BestSubmission submission={bs()} />}</Show>

            <Collapsible open={isOpen()} onOpenChange={setIsOpen}>
                <CollapsibleContent>
                    <CardContent>
                        <div class="grid gap-4 md:grid-cols-2">
                            <QuizDetails quiz={props.quiz} />
                            <Show when={submissions()}>
                                {(s) => <SubmissionList submissions={s()} />}
                            </Show>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
};

export const QuizItemSkeleton = () => (
    <Skeleton radius={10}>
        <Card class="bg-transparent text-transparent min-h-48">
            <CardHeader>
                <CardTitle class="text-xl font-bold">content</CardTitle>
                <CardDescription />
            </CardHeader>
        </Card>
    </Skeleton>
);

export default QuizItem;
