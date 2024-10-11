import { createSignal, Show, For } from "solid-js";
import { format } from "date-fns";
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
} from "lucide-solid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { IQuizInfo, IQuizSubmission } from "@/services/BS/scraper";
import { Separator } from "./separator";

interface QuizItemProps {
    quiz: IQuizInfo;
    submissions?: IQuizSubmission[];
}

const QuizItem = (props: QuizItemProps) => {
    const [isOpen, setIsOpen] = createSignal(false);

    const getStatusIcon = (status: IQuizInfo["status"]) => {
        switch (status) {
            case "completed":
                return <CheckCircle class="h-5 w-5 text-success-foreground" />;
            case "in-progress":
                return <Clock class="h-5 w-5 text-warning-foreground" />;
            case "not-started":
                return <AlertCircle class="h-5 w-5 text-error-foreground" />;
            default:
                return <HelpCircle class="h-5 w-5 text-muted-foreground" />;
        }
    };

    const bestSubmission = () =>
        props.submissions?.reduce(
            (best, current) =>
                (current.gradePercentage || 0) > (best.gradePercentage || 0) ? current : best,
            props.submissions[0]
        );

    return (
        <Card class="mb-4 bg-card text-card-foreground">
            <CardHeader>
                <div class="flex items-center justify-between">
                    <CardTitle class="text-xl font-bold">{props.quiz.name}</CardTitle>
                    <Show
                        when={
                            (props.submissions && props.submissions.length > 0) ||
                            props.quiz.status !== "not-started"
                        }
                        fallback={
                            <Button
                                variant="outline"
                                size="sm"
                                class="bg-primary text-primary-foreground"
                            >
                                <Play class="mr-2 h-4 w-4" /> Start Quiz
                            </Button>
                        }
                    >
                        <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen())}>
                            {isOpen() ? (
                                <ChevronUp class="h-4 w-4" />
                            ) : (
                                <ChevronDown class="h-4 w-4" />
                            )}
                        </Button>
                    </Show>
                </div>
                <CardDescription>
                    <div class="flex items-center space-x-2">
                        {getStatusIcon(props.quiz.status)}
                        <span class="capitalize">{props.quiz.status || "Unknown"}</span>
                    </div>
                </CardDescription>
            </CardHeader>
            <Show when={bestSubmission()}>
                <CardContent>
                    <div class="mb-4">
                        <div class="flex items-center justify-between">
                            <h3 class="font-semibold mb-2">Best Submission</h3>
                            <div class="flex items-center space-x-2">
                                <Show
                                    when={
                                        bestSubmission()?.points !== undefined &&
                                        bestSubmission()?.totalPoints !== undefined
                                    }
                                >
                                    <p>
                                        {bestSubmission()?.points}/{bestSubmission()?.totalPoints}
                                    </p>
                                    <Separator orientation="vertical" class="h-4" /> 
                                </Show>

                                <p>{bestSubmission()?.gradePercentage?.toFixed(2)}%</p>
                            </div>
                        </div>
                        <Progress value={bestSubmission()?.gradePercentage} class="mb-2" />
                    </div>
                </CardContent>
            </Show>
            <Collapsible open={isOpen()} onOpenChange={setIsOpen}>
                <CollapsibleContent>
                    <CardContent>
                        <div class="grid gap-4 md:grid-cols-2">
                            <div>
                                <h3 class="font-semibold mb-2">Quiz Details</h3>
                                <ul class="space-y-2">
                                    <Show when={props.quiz.startDate}>
                                        <li class="flex items-center">
                                            <Calendar class="mr-2 h-4 w-4" />
                                            Start: {format(new Date(props.quiz.startDate!), "PPP")}
                                        </li>
                                    </Show>
                                    <Show when={props.quiz.endDate}>
                                        <li class="flex items-center">
                                            <Calendar class="mr-2 h-4 w-4" />
                                            End: {format(new Date(props.quiz.endDate!), "PPP")}
                                        </li>
                                    </Show>
                                    <Show when={props.quiz.dueDate}>
                                        <li class="flex items-center">
                                            <Calendar class="mr-2 h-4 w-4" />
                                            Due: {format(new Date(props.quiz.dueDate!), "PPP")}
                                        </li>
                                    </Show>
                                    <Show when={props.quiz.attemptsAllowed}>
                                        <li class="flex items-center">
                                            <Clock class="mr-2 h-4 w-4" />
                                            Attempts: {props.quiz.attempts || 0} /{" "}
                                            {props.quiz.attemptsAllowed}
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
                            <div>
                                <h3 class="font-semibold mb-2">Submissions</h3>
                                <Show
                                    when={props.submissions && props.submissions.length > 0}
                                    fallback={<p>No submissions yet.</p>}
                                >
                                    <ul class="space-y-4">
                                        <For each={props.submissions}>
                                            {(submission) => (
                                                <li class="border-t border-border pt-2">
                                                    <p class="font-medium">
                                                        Attempt {submission.attemptNumber}
                                                    </p>
                                                    <Show
                                                        when={
                                                            submission.gradePercentage !== undefined
                                                        }
                                                    >
                                                        <Progress
                                                            value={submission.gradePercentage}
                                                            class="my-2"
                                                        />
                                                    </Show>
                                                    <p>
                                                        Grade:{" "}
                                                        {submission.gradePercentage !== undefined
                                                            ? `${submission.gradePercentage.toFixed(
                                                                  2
                                                              )}%`
                                                            : "Not graded"}
                                                    </p>
                                                    <Show
                                                        when={
                                                            submission.points !== undefined &&
                                                            submission.totalPoints !== undefined
                                                        }
                                                    >
                                                        <p>
                                                            Points: {submission.points} /{" "}
                                                            {submission.totalPoints}
                                                        </p>
                                                    </Show>
                                                    <Show when={submission.lateNote}>
                                                        <p class="text-error-foreground text-sm">
                                                            {submission.lateNote}
                                                        </p>
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
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
};

export default QuizItem;
