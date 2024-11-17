import { Separator } from "@/components/ui/separator";
import { ArrowLeftIcon } from "lucide-solid";
import { children, Component, JSX, Show } from "solid-js";
import { Button, buttonVariants } from "./button";
import { A } from "@solidjs/router";
import { cn } from "@/lib/utils";
import Notification from "@/components/notification";

type RouteSectionProps = {
    title: string;
    allowBack?: boolean;
    children?: JSX.Element;
    hideOverflow?: boolean;
    rightElement?: JSX.Element;
    centerElement?: JSX.Element;
    sticky?: boolean;
};

const PageWrapper: Component<RouteSectionProps> = ({
    sticky = true,

    ...props
}) => {
    const goBack = () => {
        window.history.back();
    };

    // const centerElement = () => children(() => <div>{props.centerElement}</div>);

    return (
        <div class="relative flex flex-col h-full p-2">
            <div class={cn("bg-background z-10", sticky ? "sticky top-0" : "")}>
                <div class="grid grid-cols-2 grid-rows-2 md:grid-cols-3 md:grid-rows-1">
                    <div class="flex items-center gap-4 flex-0">
                        <Show when={props.allowBack}>
                            <Button onClick={goBack} variant="link" size="icon">
                                <ArrowLeftIcon class="h-6 w-6" />
                            </Button>
                        </Show>

                        <h1 class="text-2xl font-semibold">{props.title}</h1>
                    </div>

                    <div class="row-start-2 col-span-2 md:row-start-1 md:col-span-1 md:col-start-2 flex justify-center">
                        {props.centerElement}
                    </div>

                    <div>{props.rightElement}</div>
                </div>
            </div>

            <Separator class="my-2" />

            <div class={cn("flex-1", props.hideOverflow ? "overflow-hidden" : "")}>
                {props.children}
            </div>
        </div>
    );
};

export default PageWrapper;
