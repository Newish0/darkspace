import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { IGradeCategory, IGradeData, IGradeItem, IGradeScore } from "@/services/BS/scraper/grades";
import { AlertCircle, Award, BookOpen, Library, Calculator, ChartLine } from "lucide-solid";
import { Component, ComponentProps, createEffect, For, Match, Show, Switch } from "solid-js";
import { ContentModal, ContentModalContent, ContentModalTrigger } from "./content-modal";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import UnsafeHtml from "./unsafe-html";
import { getGradeStatistics } from "@/services/BS/scraper/grade-statistics";
import { createAsyncCached } from "@/hooks/async-cached";
import { GradeDistributionChart } from "./grade-distribution-chart";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog";
import { ProgressCircle } from "./ui/progress-circle";
import { cn } from "@/lib/utils";
import { remapHtmlUrls } from "@/utils/html";
import { remapD2LUrl } from "@/services/BS/url";

const StatisticsModal: Component<{ url: string }> = (props) => {
    const statistics = createAsyncCached(() => getGradeStatistics(props.url), {
        keys: () => ["grade-statistics", props.url],
    });

    return (
        <Show when={statistics()} keyed>
            {(statistics) => (
                <Dialog>
                    <DialogTrigger as={Button<"button">} variant={"link"}>
                        View Statistics
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Grade Distribution</DialogTitle>
                            <Show when={statistics.averagePercentage}>
                                {(averagePercentage) => (
                                    <DialogDescription>
                                        Average Percentage: {averagePercentage().toFixed(2)}%
                                    </DialogDescription>
                                )}
                            </Show>
                        </DialogHeader>
                        <Show
                            when={statistics.distributions.length}
                            fallback={
                                <div class="text-center text-muted-foreground py-8 flex flex-col items-center gap-4">
                                    <AlertCircle size={36} />
                                    <p>No distributions available</p>
                                </div>
                            }
                        >
                            <GradeDistributionChart data={statistics} />
                        </Show>
                    </DialogContent>
                </Dialog>
            )}
        </Show>
    );
};

const ScoreDisplay: Component<{ score: IGradeScore; statisticUrl?: string }> = (props) => {
    const getPercentage = () => {
        if (props.score.percentage) {
            const percentage = parseInt(props.score.percentage.replace("%", "").trim(), 10);
            return isNaN(percentage) ? undefined : percentage;
        } else if (props.score.weightAchieved) {
            const parts = props.score.weightAchieved.split("/");
            if (parts.length !== 2) return undefined;
            const nums = parts.map((p) => Number(p.trim()));
            if (nums.some(isNaN)) return undefined;
            return (nums[0] / nums[1]) * 100;
        } else {
            return undefined;
        }
    };

    return (
        <div class="w-full space-y-4">
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-4">
                    <Show when={props.score.points}>
                        <p class="font-medium">{props.score.points}</p>
                    </Show>
                    <Show when={props.score.percentage}>
                        <p class="font-medium">{props.score.percentage?.replace(" ", "")}</p>
                    </Show>
                    <Show when={props.score.weightAchieved}>
                        <p class="text-muted-foreground text-xs">
                            Weight: {props.score.weightAchieved}
                        </p>
                    </Show>
                    <Show when={props.score.isDropped}>
                        <Badge variant="destructive" class="mt-1">
                            Dropped
                        </Badge>
                    </Show>
                </div>
                <div>
                    <Show when={props.statisticUrl}>
                        {(statisticUrl) => <StatisticsModal url={statisticUrl()} />}
                    </Show>
                </div>
            </div>

            <Progress value={getPercentage()} class="" />
        </div>
    );
};

const GradeItem: Component<{ item: IGradeItem; minimal?: boolean }> = (props) => {
    return (
        <div
            class={cn(
                "py-2 border-b border-border last:border-b-0 grid grid-rows-1 gap-4",
                props.minimal ? "grid-cols-1" : "grid-cols-2"
            )}
        >
            <div class="w-full space-y-4">
                <h4 class="text-sm font-medium flex items-center">
                    <BookOpen size={18} class="mr-2 text-primary" />
                    {props.item.name}
                </h4>
                <ScoreDisplay score={props.item.score} statisticUrl={props.item.statisticUrl} />
            </div>
            <Show when={!props.minimal}>
                <div class="flex gap-4">
                    <Separator orientation="vertical"></Separator>

                    <div>
                        <h5 class="font-medium">Comments</h5>
                        <Show
                            when={props.item.comments}
                            fallback={
                                <p class="text-sm font-light text-muted-foreground mt-1 ml-2">
                                    None
                                </p>
                            }
                        >
                            <p class="text-sm font-light text-muted-foreground mt-1 ml-2">
                                <UnsafeHtml
                                    unsafeHtml={remapHtmlUrls(
                                        props.item.comments ?? "",
                                        remapD2LUrl
                                    )}
                                    config={{
                                        ADD_ATTR: ["target"],
                                    }}
                                    class="markdown"
                                />
                            </p>
                        </Show>

                        <h5 class="font-medium">Rubric</h5>
                        <Show
                            when={props.item.rubricUrl}
                            fallback={
                                <p class="text-sm font-light text-muted-foreground mt-1 ml-2">
                                    None
                                </p>
                            }
                        >
                            {(rubricUrl) => (
                                <>
                                    <ContentModal>
                                        <ContentModalTrigger
                                            as={Button<"button">}
                                            variant={"link"}
                                            size={"sm"}
                                        >
                                            Open Rubric
                                        </ContentModalTrigger>
                                        <ContentModalContent
                                            url={rubricUrl()}
                                            contentType="webpage"
                                            title={`${props.item.name} Rubric`}
                                        />
                                    </ContentModal>
                                </>
                            )}
                        </Show>
                    </div>
                </div>
            </Show>
        </div>
    );
};

const GradeCategory: Component<{ category: IGradeCategory; minimal?: boolean }> = (props) => (
    // Display category as if it is a grade item if there are no items in the category and not an category with no score.
    // This is because some standalone grade items are displayed as categories on BS.
    <Show
        when={props.category.items.length || !props.category.score}
        fallback={<GradeItem item={props.category} minimal={props.minimal} />}
    >
        <AccordionItem value={props.category.name} class="border-b border-border last:border-b-0">
            <AccordionTrigger class="hover:no-underline">
                <div class="w-full space-y-4">
                    <h5 class="font-medium flex items-center">
                        <Library size={22} class="mr-2 text-primary" />
                        {props.category.name}
                    </h5>
                    <Show when={props.category.score}>
                        <ScoreDisplay score={props.category.score!} />
                    </Show>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <div class="pl-7 space-y-2">
                    <Switch>
                        <Match when={props.category.items.length > 0}>
                            <For each={props.category.items}>
                                {(item) => <GradeItem item={item} minimal={props.minimal} />}
                            </For>
                        </Match>
                        <Match when={props.category.items.length === 0}>
                            <p class="text-sm text-muted-foreground">No items in this category</p>
                        </Match>
                    </Switch>
                    <Show when={props.category.comments}>
                        <p class="text-sm text-muted-foreground mt-2 italic">
                            Comments: {props.category.comments}
                        </p>
                    </Show>
                </div>
            </AccordionContent>
        </AccordionItem>
    </Show>
);

const FinalGradeCard: Component<{ finalGrade: NonNullable<IGradeData["finalGrade"]> }> = (
    props
) => {
    const getPercentage = (score?: string) => {
        if (!score || !score.includes("/")) return undefined;
        const [achieved, total] = score.split("/").map((p) => Number(p.trim()));
        return !isNaN(achieved) && !isNaN(total) ? (achieved / total) * 100 : undefined;
    };

    return (
        <Card class="w-full shadow-lg">
            <CardContent class="p-6">
                <div class="w-full space-y-4">
                    <h5 class="font-medium flex items-center">
                        <Award size={22} class="mr-2 text-primary" />
                        Final Score
                    </h5>

                    <div class="flex gap-8 justify-between">
                        <div class="flex gap-8">
                            <div class="flex items-center gap-2">
                                <ProgressCircle
                                    value={getPercentage(
                                        props.finalGrade?.calculatedScore?.weightAchieved
                                    )}
                                >
                                    <span class="text-xs font-medium text-slate-700">
                                        {props.finalGrade.calculatedScore?.weightAchieved ||
                                            "- / -"}
                                    </span>
                                </ProgressCircle>
                                <div class="flex items-center gap-2">
                                    <Calculator size={22} />
                                    Calculated Score
                                </div>
                            </div>

                            <div class="flex items-center gap-2">
                                <ProgressCircle
                                    value={getPercentage(
                                        props.finalGrade.adjustedScore?.weightAchieved
                                    )}
                                >
                                    <span class="text-xs font-medium text-slate-700">
                                        {props.finalGrade.adjustedScore?.weightAchieved || "- / -"}
                                    </span>
                                </ProgressCircle>
                                <div class="flex items-center gap-2">
                                    <ChartLine size={22} />
                                    Adjusted Score
                                </div>
                            </div>
                        </div>

                        <Dialog>
                            <DialogTrigger as={Button<"button">} variant={"default"}>
                                See breakdown
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Final Grade Calculation Formula</DialogTitle>
                                    <DialogDescription>
                                        Only items that contribute to the calculated grade are
                                        displayed.
                                    </DialogDescription>
                                </DialogHeader>

                                <Show
                                    when={props.finalGrade.categories.length}
                                    fallback={
                                        <div class="text-center text-muted-foreground py-8 flex flex-col items-center">
                                            <AlertCircle
                                                size={36}
                                                class="mb-2 text-muted-foreground"
                                            />
                                            <p>No grade breakdown available</p>
                                        </div>
                                    }
                                >
                                    <Accordion multiple={false} collapsible class="w-full">
                                        <For each={props.finalGrade.categories}>
                                            {(category) => (
                                                <GradeCategory category={category} minimal={true} />
                                            )}
                                        </For>
                                    </Accordion>
                                </Show>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const GradeDisplay: Component<{ gradeData: IGradeData }> = (props) => {
    return (
        <div class="space-y-2">
            <Show when={props.gradeData.finalGrade}>
                {(finalGrade) => <FinalGradeCard finalGrade={finalGrade()} />}
            </Show>

            <Card class="w-full shadow-lg">
                <CardContent class="p-6">
                    <Show
                        when={props.gradeData.categories.length}
                        fallback={
                            <div class="text-center text-muted-foreground py-8 flex flex-col items-center">
                                <AlertCircle size={48} class="mb-4 text-muted-foreground" />
                                <p>No grade categories available</p>
                            </div>
                        }
                    >
                        <Accordion multiple={false} collapsible class="w-full">
                            <For each={props.gradeData.categories}>
                                {(category) => <GradeCategory category={category} />}
                            </For>
                        </Accordion>
                    </Show>
                </CardContent>
            </Card>
        </div>
    );
};

export default GradeDisplay;
