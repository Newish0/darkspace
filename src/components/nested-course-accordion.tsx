import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { IModule } from "@/services/BS/scraper/course-modules";
import { makePersisted } from "@solid-primitives/storage";
import { A } from "@solidjs/router";
import { formatDate } from "date-fns";
import { Component, For, Match, Show, Switch, createSignal } from "solid-js";

const ModuleAccordion = (props: { modules: IModule[]; courseId: string }) => {
    const [openItems, setOpenItems] = makePersisted(createSignal<string[]>([]), {
        name: `course-${props.courseId}-modules-open-items`,
    });

    const toggleItem = (itemId: string) => {
        setOpenItems((prev) => {
            if (prev.includes(itemId)) {
                return prev.filter((id) => id !== itemId);
            } else {
                return [...prev, itemId];
            }
        });
    };

    const renderModule = (module: IModule) => (
        <Switch>
            <Match when={module.children && module.children.length}>
                <AccordionItem value={module.moduleId} class="border-none px-2">
                    <AccordionTrigger onClick={() => toggleItem(module.moduleId)} class="text-left">
                        <div class="flex gap-2 items-center">
                            <div> {module.name}</div>

                            <ModuleStartEndDateDisplay
                                startDateTime={module.startDateTime}
                                endDateTime={module.endDateTime}
                            />
                        </div>
                    </AccordionTrigger>
                    <AccordionContent class="pl-4">
                        {/* Add an extra module called "Module Content" or "Module Description" to the accordion
                        when the module itself has topics or a description. This will allow users to view those details. */}
                        <Show
                            when={
                                module.hasTopics ||
                                module.description?.html ||
                                module.description?.text
                            }
                        >
                            <A
                                href={`/courses/${props.courseId}/m/${module.moduleId}?description=1`}
                                class={NESTED_COURSE_ACCORDION_ROOT_ITEM_STYLE_CLASSES}
                                activeClass="bg-muted"
                            >
                                Module {module.hasTopics ? "Content" : "Description"}
                            </A>
                        </Show>

                        {/* Recursively render child modules */}
                        <ModuleAccordion modules={module.children!} courseId={props.courseId} />
                    </AccordionContent>
                </AccordionItem>
            </Match>
            <Match when={!module.children || !module.children.length}>
                <A
                    href={`/courses/${props.courseId}/m/${module.moduleId}`}
                    class={cn(NESTED_COURSE_ACCORDION_ROOT_ITEM_STYLE_CLASSES)}
                    activeClass="bg-muted"
                >
                    <div class="flex gap-2 items-center">
                        <div>{module.name}</div>

                        <ModuleStartEndDateDisplay
                            startDateTime={module.startDateTime}
                            endDateTime={module.endDateTime}
                        />
                    </div>
                </A>
            </Match>
        </Switch>
    );

    return (
        <Accordion multiple={true} value={openItems()} class="w-full">
            <For each={props.modules}>{renderModule}</For>
        </Accordion>
    );
};

const ModuleStartEndDateDisplay: Component<Pick<IModule, "startDateTime" | "endDateTime">> = (
    props
) => {
    /* Show module start and end date if it exist  */
    return (
        <div class="text-xs font-light text-muted-foreground">
            <Show when={props.startDateTime || props.endDateTime}>
                <span class="pl-1 pr-2">⋅</span>
            </Show>
            <Switch>
                <Match when={props.startDateTime && props.endDateTime}>
                    {formatDate(props.startDateTime!, "MMM d") +
                        " to " +
                        formatDate(props.endDateTime!, "MMM d")}
                </Match>
                <Match when={props.startDateTime}>
                    Starts {formatDate(props.startDateTime!, "MMM d")}
                </Match>
                <Match when={props.endDateTime}>
                    Ends {formatDate(props.endDateTime!, "MMM d")}
                </Match>
            </Switch>
        </div>
    );
};

export const NESTED_COURSE_ACCORDION_ROOT_ITEM_STYLE_CLASSES =
    "flex flex-1 items-center justify-between py-2 px-2 rounded-md font-medium transition-all hover:underline";

export default function NestedCourseAccordion(props: { modules: IModule[]; courseId: string }) {
    return (
        <div class="w-full">
            <ModuleAccordion modules={props.modules} courseId={props.courseId} />
        </div>
    );
}
