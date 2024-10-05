import { Separator } from "@/components/ui/separator";
import { ArrowLeftIcon } from "lucide-solid";
import { Component, JSX, Show } from "solid-js";
import { Button, buttonVariants } from "./button";
import { A } from "@solidjs/router";
import { cn } from "@/lib/utils";

interface RouteSectionProps {
    title: string;
    allowBack?: boolean;
    children?: JSX.Element;
    hideOverflow?: boolean;
}

const PageWrapper: Component<RouteSectionProps> = (props) => {
    const goBack = () => {
        window.history.back();
    };

    return (
        <div class="relative flex flex-col h-full">
            <div class="flex items-center gap-4 flex-0">
                <Show when={props.allowBack}>
                    <Button onClick={goBack} variant="link" size="icon">
                        <ArrowLeftIcon class="h-6 w-6" />
                    </Button>
                </Show>

                <h1 class="text-2xl font-semibold">{props.title}</h1>
            </div>

            <Separator class="my-4" />

            <div class={cn("flex-1", props.hideOverflow ? "overflow-hidden" : "")}>
                {props.children}
            </div>
        </div>
    );
};

export default PageWrapper;
