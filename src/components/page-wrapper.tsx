import { Separator } from "@/components/ui/separator";
import { ArrowLeftIcon, SearchIcon } from "lucide-solid";
import { children, Component, JSX, Show } from "solid-js";
import { Button, buttonVariants } from "@/components/ui/button";
import { A } from "@solidjs/router";
import { cn } from "@/lib/utils";
import Notification from "@/components/notification";
import Kbd from "@/components/ui/kbd";
import ThemeToggle from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type RouteSectionProps = {
    title: string;
    allowBack?: boolean;
    children?: JSX.Element;
    hideOverflow?: boolean;
    rightElement?: JSX.Element;
    centerElement?: JSX.Element;
    sticky?: boolean;
};

const RightElement = () => (
    <div class="flex justify-end items-center gap-2">
        <Button variant={"outline"} class="gap-8 text-muted-foreground hover:text-foreground">
            <div class="flex items-center gap-2">
                <SearchIcon size={16} />
                <span>Search...</span>
            </div>
            <div class="space-x-2 h-min hidden xl:block">
                <Kbd>Ctrl</Kbd>
                <Kbd>P</Kbd>
            </div>
        </Button>

        <Notification />
        <ThemeToggle />

        <Avatar>
            <AvatarImage src="" />
            <AvatarFallback>ME</AvatarFallback>
        </Avatar>
    </div>
);

const PageWrapper: Component<RouteSectionProps> = ({
    sticky = true,
    rightElement = <RightElement />,
    ...props
}) => {
    const goBack = () => {
        window.history.back();
    };

    // const centerElement = () => children(() => <div>{props.centerElement}</div>);

    return (
        <div class="relative flex flex-col h-full p-2">
            <div class={cn("bg-background z-10", sticky ? "sticky top-0" : "")}>
                <div class="grid grid-cols-2 grid-rows-2 lg:grid-cols-3 lg:grid-rows-1">
                    <div class="flex items-center gap-4 flex-0">
                        <Show when={props.allowBack}>
                            <Button onClick={goBack} variant="link" size="icon">
                                <ArrowLeftIcon class="h-6 w-6" />
                            </Button>
                        </Show>

                        <h1 class="text-2xl font-semibold">{props.title}</h1>
                    </div>

                    <div class="row-start-2 col-span-2 lg:row-start-1 lg:col-span-1 lg:col-start-2 flex justify-center">
                        {props.centerElement}
                    </div>

                    <div>{rightElement}</div>
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
