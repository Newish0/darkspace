import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { IGradeCategory, IGradeData, IGradeItem, IGradeScore } from "@/services/BS/scraper/grade";
import { AlertCircle, Award, BookOpen } from "lucide-solid";
import { Component, For, Match, Show, Switch } from "solid-js";
import { ContentModal, ContentModalContent, ContentModalTrigger } from "./content-modal";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import UnsafeHtml from "./unsafe-html";

const ScoreDisplay: Component<{ score: IGradeScore }> = (props) => {
    const getPercentage = () => {
        if (!props.score.percentage) return 0;
        const percentage = parseInt(props.score.percentage.replace("%", "").trim(), 10);
        return isNaN(percentage) ? 0 : percentage;
    };

    return (
        <div class="w-full space-y-4">
            <div class="flex justify-start items-center gap-4">
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

            <Progress value={getPercentage()} class="" />
        </div>
    );
};

const GradeItem: Component<{ item: IGradeItem }> = (props) => {
    return (
        <div class="py-2 border-b border-border last:border-b-0 grid grid-cols-2 grid-rows-1 gap-4">
            <div class="w-full space-y-4">
                <h4 class="text-sm font-medium flex items-center">
                    <BookOpen class="w-4 h-4 mr-2 text-primary" />
                    {props.item.name}
                </h4>
                <ScoreDisplay score={props.item.score} />
            </div>
            <div class="flex gap-4">
                <Separator orientation="vertical"></Separator>

                <div>
                    <h5 class="font-medium">Comments</h5>
                    <Show
                        when={props.item.comments}
                        fallback={
                            <p class="text-sm font-light text-muted-foreground mt-1 ml-2">None</p>
                        }
                    >
                        <p class="text-sm font-light text-muted-foreground mt-1 ml-2">
                            <UnsafeHtml unsafeHtml={props.item.comments ?? ""} class="markdown" />
                        </p>
                    </Show>

                    <h5 class="font-medium">Rubric</h5>
                    <Show
                        when={props.item.rubricUrl}
                        fallback={
                            <p class="text-sm font-light text-muted-foreground mt-1 ml-2">None</p>
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
        </div>
    );
};

const GradeCategory: Component<{ category: IGradeCategory }> = (props) => (
    // Display category as if it is a grade item if there are no items in the category and not an category with no score.
    // This is because some standalone grade items are displayed as categories on BS.
    <Show
        when={props.category.items.length || !props.category.score}
        fallback={<GradeItem item={props.category} />}
    >
        <AccordionItem value={props.category.name} class="border-b border-border last:border-b-0">
            <AccordionTrigger class="hover:no-underline">
                <div class="w-full space-y-4">
                    <h5 class="font-medium flex items-center">
                        <Award class="w-5 h-5 mr-2 text-primary" />
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
                                {(item) => <GradeItem item={item} />}
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

const GradeDisplay: Component<{ gradeData: IGradeData }> = (props) => {
    return (
        <Card class="w-full shadow-lg">
            <CardContent class="p-6">
                <Accordion multiple={false} collapsible class="w-full">
                    <Switch>
                        <Match when={props.gradeData.categories.length > 0}>
                            <For each={props.gradeData.categories}>
                                {(category) => <GradeCategory category={category} />}
                            </For>
                        </Match>
                        <Match when={props.gradeData.categories.length === 0}>
                            <div class="text-center text-muted-foreground py-8 flex flex-col items-center">
                                <AlertCircle class="w-12 h-12 mb-4 text-muted-foreground" />
                                <p>No grade categories available</p>
                            </div>
                        </Match>
                    </Switch>
                </Accordion>
            </CardContent>
        </Card>
    );
};

export default GradeDisplay;
