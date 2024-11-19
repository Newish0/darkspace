import { ExternalLink, ExternalLinkIcon, FileTextIcon, PanelsTopLeftIcon } from "lucide-solid";
import { createEffect, createSignal, Match, Switch } from "solid-js";
import {
    ResourceViewerDialog,
    ResourceViewerDialogContent,
    ResourceViewerDialogTrigger,
} from "./ui/resource-viewer-dialog";
import { Button, buttonVariants } from "./ui/button";

const TitleElement = (props: {
    title?: string;
    type?: ContentModalContentProps["contentType"];
}) => {
    return (
        <div class="flex items-center justify-between gap-2">
            <Switch>
                <Match when={props.type === "webpage"}>
                    <PanelsTopLeftIcon size={16} />
                </Match>
                <Match when={props.type === "pdf"}>
                    <FileTextIcon size={16} />
                </Match>
            </Switch>

            <span>{props.title}</span>
        </div>
    );
};

const LeftActions = (props: { url?: string }) => (
    <>
        {/*  TODO: add disabled state on undefined url */}
        <a
            href={props.url}
            target="_blank"
            class={buttonVariants({ variant: "ghost", size: "sm", class: "p-0" })}
        >
            <ExternalLinkIcon size={16} />
        </a>
    </>
);

interface ContentModalContentProps {
    url?: string;
    title?: string;
    contentType: "webpage" | "pdf"; // TODO: Allow not providing a content type and inferring it from the URL
}

const ContentModalContent = (props: ContentModalContentProps) => {
    return (
        <ResourceViewerDialogContent
            title={<TitleElement title={props.title} type={props.contentType} />}
            leftActions={<LeftActions url={props.url} />}
        >
            <Switch>
                <Match when={props.contentType === "webpage"}>
                    <iframe src={props.url} class="w-full h-full border-none" title={props.title} />
                </Match>
                <Match when={props.contentType === "pdf"}>
                    <embed src={props.url} type="application/pdf" class="w-full h-full" />
                </Match>
            </Switch>
        </ResourceViewerDialogContent>
    );
};

export {
    ResourceViewerDialog as ContentModal,
    ContentModalContent,
    ResourceViewerDialogTrigger as ContentModalTrigger,
};
