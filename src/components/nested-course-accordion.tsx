import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { IModule } from "@/services/BS/scraper";
import { makePersisted } from "@solid-primitives/storage";
import { A } from "@solidjs/router";
import { For, Match, Show, Switch, createSignal } from "solid-js";

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
                        {module.name}
                    </AccordionTrigger>
                    <AccordionContent class="pl-4">
                        <Show when={module.description?.html || module.description?.text}>
                            <A
                                href={`/courses/${props.courseId}/m/${module.moduleId}?description=1`}
                                class={NESTED_COURSE_ACCORDION_ROOT_ITEM_STYLE_CLASSES}
                                activeClass="bg-muted"
                            >
                                Module Description
                            </A>
                        </Show>

                        <ModuleAccordion modules={module.children!} courseId={props.courseId} />
                    </AccordionContent>
                </AccordionItem>
            </Match>
            <Match when={!module.children || !module.children.length}>
                <A
                    href={`/courses/${props.courseId}/m/${module.moduleId}`}
                    class={NESTED_COURSE_ACCORDION_ROOT_ITEM_STYLE_CLASSES}
                    activeClass="bg-muted"
                >
                    {module.name}
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

export const NESTED_COURSE_ACCORDION_ROOT_ITEM_STYLE_CLASSES =
    "flex flex-1 items-center justify-between py-2 px-2 rounded-md font-medium transition-all hover:underline";

export default function NestedCourseAccordion(props: { modules: IModule[]; courseId: string }) {
    return (
        <div class="w-full">
            <ModuleAccordion modules={props.modules} courseId={props.courseId} />
        </div>
    );
}
