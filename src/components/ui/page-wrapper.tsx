import { Separator } from "@/components/ui/separator";
import { ArrowLeftIcon } from "lucide-solid";
import { Component, JSX, Show } from "solid-js";
import { Button } from "./button";

interface RouteSectionProps {
    title: string;
    allowBack?: boolean;
    children?: JSX.Element;
}

const PageWrapper: Component<RouteSectionProps> = (props) => {
    return (
        <div>
            <div class="flex items-center gap-4">
                <Show when={props.allowBack}>
                    <Button variant={"link"} size={"icon"}>
                        <ArrowLeftIcon class="h-6 w-6" />
                    </Button>
                </Show>

                <h1 class="text-2xl font-semibold">{props.title}</h1>
            </div>
            <Separator class="my-4" />
            {props.children}
        </div>
    );
};

export default PageWrapper;
