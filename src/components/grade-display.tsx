import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Award, BookOpen, Library, Calculator, ChartLine } from "lucide-solid";
import { Component, createSignal, For, Match, Show, Suspense, Switch } from "solid-js";
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
import { buildRubricUrl, buildStatisticUrl, remapD2LUrl } from "@/services/BS/url";
import { gradesService } from "@/services/BS/api/grades";
import {
    ComputableGradeValue,
    isComputableGradeValue,
    isNumericGradeObject,
} from "@/services/BS/api/dtos/grades";
import { makePersisted } from "@solid-primitives/storage";
import NormalizedTextContrast from "./normalized-text-contrast";

/* ---------- Base Types ---------- */

export type GradeItem = {
    id: string;
    name: string;
    description: string;
    weight?: number;
    maxPoints?: number;
    isBonus: boolean;
    canExceedMax: boolean;
    excludeFromFinalGrade: boolean;
};

export type GradeCategory = {
    id: string;
    name: string;
    childGrades: GradeItem[];
    canExceedMax: boolean;
    excludeFromFinalGrade: boolean;
    startDate: string | null;
    endDate: string | null;
    weight: number | null;
    maxPoints: number | null;
    numberOfHighestToDrop: number | null;
    numberOfLowestToDrop: number | null;
};

function isGradeCategory(value: any): value is GradeCategory {
    return value && typeof value === "object" && "childGrades" in value && "id" in value;
}

/* ---------- Components ---------- */

type StatisticsModalProps = {
    orgUnitId: string;
    gradeObjectId: string;
};
const StatisticsTriggerAndModal: Component<StatisticsModalProps> = (props) => {
    const url = () => buildStatisticUrl(props.orgUnitId, props.gradeObjectId);
    const statistics = createAsyncCached(() => getGradeStatistics(url()), {
        keys: () => ["grade-statistics", props.orgUnitId, props.gradeObjectId],
    });

    return (
        <Show when={statistics()?.distributions.length ? statistics() : undefined}>
            {(stats) => (
                <Dialog>
                    <DialogTrigger as={Button<"button">} variant={"link"}>
                        View Statistics
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Grade Distribution</DialogTitle>
                            <Show when={stats().averagePercentage}>
                                {(avg) => (
                                    <DialogDescription>
                                        Average Percentage: {avg().toFixed(2)}%
                                    </DialogDescription>
                                )}
                            </Show>
                        </DialogHeader>

                        <Show
                            when={stats().distributions.length > 0}
                            fallback={
                                <div class="text-center text-muted-foreground py-8 flex flex-col items-center gap-4">
                                    <AlertCircle size={36} />
                                    <p>No distributions available</p>
                                </div>
                            }
                        >
                            <GradeDistributionChart data={stats()} />
                        </Show>
                    </DialogContent>
                </Dialog>
            )}
        </Show>
    );
};

type ScoreDisplayProps = {
    orgUnitId: string;
    gradeObjectId: string;
    displayedGrade: string;
    points?: {
        numerator: number | null;
        denominator: number | null;
    };
    weight?: {
        numerator: number | null;
        denominator: number | null;
    };
    isDropped?: boolean;
};
const ScoreDisplay: Component<ScoreDisplayProps> = (props) => {
    const getPercentage = (): number | undefined => {
        if (!props.points) return undefined;
        if (props.points.denominator === null || props.points.denominator === 0) return undefined;
        if (props.points.numerator === null) return undefined;
        return (props.points.numerator / props.points.denominator) * 100;
    };

    return (
        <div class="w-full space-y-4">
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-4">
                    <p class="font-medium">{props.displayedGrade}</p>

                    <Switch>
                        <Match when={props.points && props.points.denominator}>
                            <p class="font-medium">
                                {props.points?.numerator?.toFixed(2) ?? "-"}
                                {" / "}
                                {props.points?.denominator?.toFixed(2) ?? "-"}
                            </p>
                        </Match>
                        <Match when={props.points}>
                            <p class="font-medium">{props.points?.numerator?.toFixed(2) ?? "-"}</p>
                        </Match>
                    </Switch>

                    <Switch>
                        <Match when={props.weight && props.weight.denominator}>
                            <p class="text-muted-foreground text-xs">
                                Weight: {props.weight?.numerator?.toFixed(2) ?? "-"}
                                {" / "}
                                {props.weight?.denominator?.toFixed(2) ?? "-"}
                            </p>
                        </Match>
                        <Match when={props.weight}>
                            <p class="text-muted-foreground text-xs">
                                Weight: {props.weight?.numerator?.toFixed(2) ?? "-"}
                            </p>
                        </Match>
                    </Switch>
                    <Show when={props.isDropped}>
                        <Badge variant="destructive" class="mt-1">
                            Dropped
                        </Badge>
                    </Show>
                </div>
                <div>
                    <StatisticsTriggerAndModal
                        orgUnitId={props.orgUnitId}
                        gradeObjectId={props.gradeObjectId}
                    />
                </div>
            </div>
            <Progress value={getPercentage()} />
        </div>
    );
};

type GradeItemDisplayProps = {
    orgUnitId: string;
    grade: GradeItem;
};
const GradeItemDisplay: Component<GradeItemDisplayProps> = (props) => {
    const myGradeValue = createAsyncCached(
        async () => {
            const result = await gradesService.getMyGradeValue(props.orgUnitId, props.grade.id);
            if (!result || result.isErr()) return null;
            return result.value;
        },
        {
            keys: () => ["my-grade-value", props.orgUnitId, props.grade.id],
        }
    );

    const rubricUrl = () => buildRubricUrl(props.orgUnitId, props.grade.id);

    return (
        <div
            class={cn(
                "py-2 border-b border-border last:border-b-0 grid grid-rows-1 gap-4",
                myGradeValue()?.Comments ? "grid-cols-2" : "grid-cols-1"
            )}
        >
            <div class="w-full space-y-4">
                <h4 class="text-sm font-medium flex items-center">
                    <BookOpen size={18} class="mr-2 text-primary" />
                    {props.grade.name}

                    <Show when={props.grade.isBonus}>
                        <Badge variant="secondary" class="ml-2">
                            Bonus
                        </Badge>
                    </Show>

                    <Show when={props.grade.excludeFromFinalGrade}>
                        <Badge variant="destructive" class="ml-2">
                            Excluded
                        </Badge>
                    </Show>
                </h4>
                <Show
                    when={
                        myGradeValue() && isComputableGradeValue(myGradeValue()!)
                            ? (myGradeValue() as ComputableGradeValue)
                            : null
                    }
                    fallback={
                        <p class="text-sm font-light text-muted-foreground mt-1 ml-2">
                            No numeric grade
                        </p>
                    }
                >
                    {(gradeValue) => (
                        <ScoreDisplay
                            orgUnitId={props.orgUnitId}
                            gradeObjectId={props.grade.id}
                            displayedGrade={gradeValue().DisplayedGrade}
                            points={{
                                numerator: gradeValue().PointsNumerator,
                                denominator: gradeValue().PointsDenominator,
                            }}
                            weight={{
                                numerator: gradeValue().WeightedNumerator,
                                denominator: gradeValue().WeightedDenominator,
                            }}
                            isDropped={false} // TODO: add drop check logic
                        />
                    )}
                </Show>
            </div>

            <Show when={myGradeValue()?.Comments}>
                {(comments) => (
                    <div class="flex gap-4">
                        <Separator orientation="vertical" />
                        <div>
                            <h5 class="font-medium">Comments</h5>
                            <Show
                                when={comments().Html || comments().Text}
                                fallback={
                                    <p class="text-sm font-light text-muted-foreground mt-1 ml-2">
                                        None
                                    </p>
                                }
                            >
                                {(htmlOrText) => (
                                    <p class="text-sm font-light text-muted-foreground mt-1 ml-2">
                                        <NormalizedTextContrast>
                                            <UnsafeHtml
                                                unsafeHtml={remapHtmlUrls(
                                                    htmlOrText(),
                                                    remapD2LUrl
                                                )}
                                                config={{ ADD_ATTR: ["target"] }}
                                                class="markdown"
                                            />
                                        </NormalizedTextContrast>
                                    </p>
                                )}
                            </Show>
                            <h5 class="font-medium">Rubric</h5>
                            <Show
                                when={rubricUrl()}
                                fallback={
                                    <p class="text-sm font-light text-muted-foreground mt-1 ml-2">
                                        None
                                    </p>
                                }
                            >
                                {(rubricUrl) => (
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
                                            title={`${props.grade.name} Rubric`}
                                        />
                                    </ContentModal>
                                )}
                            </Show>
                        </div>
                    </div>
                )}
            </Show>
        </div>
    );
};

type GradeCategoryAccordionItemProps = {
    category: GradeCategory;
    orgUnitId: string;
};
const GradeCategoryAccordionItem: Component<GradeCategoryAccordionItemProps> = (props) => (
    <AccordionItem value={props.category.id} class="border-b border-border last:border-b-0">
        <AccordionTrigger class="hover:no-underline">
            <div class="w-full space-y-4">
                <div class="flex justify-start gap-2 items-center">
                    <h5 class="font-medium flex items-center">
                        <Library size={22} class="mr-2 text-primary" />
                        {props.category.name}
                    </h5>
                    <Show when={props.category.numberOfHighestToDrop}>
                        {(n) => (
                            <Badge variant={"destructive"} class="text-xs">
                                Drop highest {n()}
                            </Badge>
                        )}
                    </Show>
                    <Show when={props.category.numberOfLowestToDrop}>
                        {(n) => (
                            <Badge variant={"destructive"} class="text-xs">
                                Drop lowest {n()}
                            </Badge>
                        )}
                    </Show>
                </div>

                {/* <Show when={props.gradeCategory.score}>{(s) => <ScoreDisplay {...s()!} />}</Show> */}
            </div>
        </AccordionTrigger>
        <AccordionContent>
            <div class="pl-7 space-y-2">
                <Show
                    when={props.category.childGrades?.length}
                    fallback={
                        <p class="text-sm text-muted-foreground">No items in this category</p>
                    }
                >
                    <For each={props.category.childGrades}>
                        {(g) => <GradeItemDisplay grade={g} orgUnitId={props.orgUnitId} />}
                    </For>
                </Show>
            </div>
        </AccordionContent>
    </AccordionItem>
);

type FinalGradeCardProps = {
    orgUnitId: string;
    displayedGrade: string;
    points?: {
        numerator: number | null;
        denominator: number | null;
    };
    weight?: {
        numerator: number | null;
        denominator: number | null;
    };
    comments?: string;
    finalGradeItems: (GradeItem | GradeCategory)[];
};
const FinalGradeCard: Component<FinalGradeCardProps> = (props) => {
    const getPercentage = (): number | undefined => {
        if (!props.points) return undefined;
        if (props.points.denominator === null || props.points.denominator === 0) return undefined;
        if (props.points.numerator === null) return undefined;
        return (props.points.numerator / props.points.denominator) * 100;
    };

    const weightAchievedText = (): string | undefined => {
        if (!props.weight) return "- / -";
        return (
            (props.weight.numerator?.toFixed(2) ?? "-") +
            " / " +
            (props.weight.denominator?.toFixed(2) ?? "-")
        );
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
                                <ProgressCircle value={getPercentage()} class="w-96">
                                    <span class="text-xs font-medium text-foreground">
                                        {weightAchievedText()}
                                    </span>
                                </ProgressCircle>
                                <div class="flex items-center gap-2">
                                    <Calculator size={22} />
                                    Calculated Score
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <ProgressCircle value={0}>
                                    <span class="text-xs font-medium text-foreground">
                                        {"- / -"}
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
                                    when={props.finalGradeItems.length}
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
                                    <Accordion multiple={true} collapsible class="w-full">
                                        <For each={props.finalGradeItems}>
                                            {(gradeOrCategory) =>
                                                isGradeCategory(gradeOrCategory) ? (
                                                    <GradeCategoryAccordionItem
                                                        category={gradeOrCategory}
                                                        orgUnitId={props.orgUnitId}
                                                    />
                                                ) : (
                                                    <GradeItemDisplay
                                                        grade={gradeOrCategory}
                                                        orgUnitId={props.orgUnitId}
                                                    />
                                                )
                                            }
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

type GradeDisplayProps = {
    items: (GradeItem | GradeCategory)[];
    orgUnitId: string;
};
const GradeDisplay: Component<GradeDisplayProps> = (props) => {
    const [openGradeCategories, setOpenGradeCategories] = makePersisted(
        createSignal<string[]>(props.items.filter(isGradeCategory).map((c) => c.id)),
        {
            name: `course-${props.orgUnitId}-open-grade-categories`,
        }
    );

    const finalGrade = createAsyncCached(
        async () => {
            const result = await gradesService.getMyFinalGradeValue(props.orgUnitId);
            if (!result || result.isErr()) return null;
            return result.value;
        },
        {
            keys: () => ["final-grade", props.orgUnitId],
        }
    );

    const finalGradeItems = () =>
        props.items
            .filter((item) => !item.excludeFromFinalGrade)
            .map((item) => {
                if (isGradeCategory(item)) {
                    return {
                        ...item,
                        childGrades: item.childGrades.filter((g) => !g.excludeFromFinalGrade),
                    };
                } else {
                    return item;
                }
            });
    return (
        <div class="space-y-2">
            <Switch>
                <Match
                    when={
                        finalGrade() && isComputableGradeValue(finalGrade()!)
                            ? (finalGrade() as ComputableGradeValue)
                            : undefined
                    }
                >
                    {(fg) => (
                        <FinalGradeCard
                            orgUnitId={props.orgUnitId}
                            displayedGrade={fg().DisplayedGrade}
                            points={{
                                denominator: fg().PointsDenominator,
                                numerator: fg().PointsNumerator,
                            }}
                            weight={{
                                denominator: fg().WeightedDenominator,
                                numerator: fg().WeightedNumerator,
                            }}
                            comments={fg().Comments.Html || fg().Comments.Text}
                            finalGradeItems={finalGradeItems()}
                        />
                    )}
                </Match>
            </Switch>

            <Card class="w-full shadow-lg">
                <CardContent class="p-6">
                    <Show
                        when={props.items.length}
                        fallback={
                            <div class="text-center text-muted-foreground py-8 flex flex-col items-center">
                                <AlertCircle size={48} class="mb-4 text-muted-foreground" />
                                <p>No grade categories available</p>
                            </div>
                        }
                    >
                        <Accordion
                            multiple={true}
                            collapsible
                            value={openGradeCategories()}
                            onChange={setOpenGradeCategories}
                            class="w-full"
                        >
                            <For each={props.items}>
                                {(gradeOrCategory) =>
                                    isGradeCategory(gradeOrCategory) ? (
                                        <GradeCategoryAccordionItem
                                            category={gradeOrCategory}
                                            orgUnitId={props.orgUnitId}
                                        />
                                    ) : (
                                        <GradeItemDisplay
                                            grade={gradeOrCategory}
                                            orgUnitId={props.orgUnitId}
                                        />
                                    )
                                }
                            </For>
                        </Accordion>
                    </Show>
                </CardContent>
            </Card>
        </div>
    );
};

export default GradeDisplay;
