import Notification from "@/components/notification";
import ThemeToggle from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon } from "lucide-solid";
import { Component, JSX, Show, splitProps } from "solid-js";
import { CommandSearch } from "./command-search";
import { createAsyncCached } from "@/hooks/async-cached";
import { getUserProfile } from "@/services/BS/scraper/user";

type RouteSectionProps = {
    title?: string;
    allowBack?: boolean;
    children?: JSX.Element;
    hideOverflow?: boolean;
    rightElement?: JSX.Element;
    centerElement?: JSX.Element;
    sticky?: boolean;
};

const RightElement = () => {
    const userProfile = createAsyncCached(getUserProfile, {
        keys: () => ["user-profile"],
    });

    return (
        <div class="flex justify-end items-center gap-2">
            <CommandSearch />

            <Notification />
            <ThemeToggle />

            <Avatar>
                <AvatarImage src={userProfile()?.profilePic} />
                <AvatarFallback>{`${userProfile()?.first?.[0]}${
                    userProfile()?.last?.[0]
                }`}</AvatarFallback>
            </Avatar>
        </div>
    );
};

const PageWrapper: Component<RouteSectionProps> = (props) => {
    const [{ sticky = true, rightElement = <RightElement /> }, rest] = splitProps(props, [
        "sticky",
        "rightElement",
    ]);

    const goBack = () => {
        window.history.back();
    };

    return (
        <div class="relative flex flex-col h-full p-2">
            <div class={cn("bg-background z-10", sticky ? "sticky top-0" : "")}>
                <div class="grid grid-cols-2 grid-rows-2 lg:grid-cols-3 lg:grid-rows-1">
                    <div class="flex items-center gap-4 flex-0">
                        <Show when={rest.allowBack}>
                            <Button onClick={goBack} variant="link" size="icon">
                                <ArrowLeftIcon class="h-6 w-6" />
                            </Button>
                        </Show>

                        <h1 class="text-2xl font-semibold truncate">{rest.title}</h1>
                    </div>

                    <div class="row-start-2 col-span-2 lg:row-start-1 lg:col-span-1 lg:col-start-2 flex justify-center">
                        {rest.centerElement}
                    </div>

                    <div>{rightElement}</div>
                </div>
            </div>

            <Separator class="my-2" />

            <div class={cn("flex-1 h-full", rest.hideOverflow ? "overflow-hidden" : "")}>
                {rest.children}
            </div>
        </div>
    );
};

export default PageWrapper;
