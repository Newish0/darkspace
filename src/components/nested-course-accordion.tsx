import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { IModule } from "@/services/BS/scraper";
import { A } from "@solidjs/router";
import { For, Match, Switch, createSignal } from "solid-js";

const ModuleAccordion = (props: { modules: IModule[] }) => {
    const [openItems, setOpenItems] = createSignal<string[]>([]);

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
                <AccordionItem value={module.moduleId}>
                    <AccordionTrigger onClick={() => toggleItem(module.moduleId)}>
                        {module.name}
                    </AccordionTrigger>
                    <AccordionContent class="pl-4">
                        <ModuleAccordion modules={module.children!} />
                    </AccordionContent>
                </AccordionItem>
            </Match>
            <Match when={!module.children || !module.children.length}>
                <div class="flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline">
                    <A href={`m/${module.moduleId}`}>{module.name}</A>
                </div>
            </Match>
        </Switch>
    );

    return (
        <Accordion multiple={true} value={openItems()} class="w-full">
            <For each={props.modules}>{renderModule}</For>
        </Accordion>
    );
};

export default function NestedCourseAccordion(props: { modules: IModule[] }) {
    return (
        <div class="w-full">
            <h2 class="text-2xl font-bold mb-4">Module List</h2>
            <ModuleAccordion modules={props.modules} />
        </div>
    );
}
