import { ExternalLink, ExternalLinkIcon, FileTextIcon, PanelsTopLeftIcon } from "lucide-solid";
import { createEffect, createSignal, Match, Switch } from "solid-js";
import {
    ResourceViewerDialog,
    ResourceViewerDialogContent,
    ResourceViewerDialogTrigger,
} from "./ui/resource-viewer-dialog";
import { Button, buttonVariants } from "./ui/button";
import { D2LOfficeFileViewer } from "./d2l-aws-office-file-viewer";

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
    contentType: "webpage" | "pdf";
    toolbar?: boolean;
}

const ContentModalContent = ({
    contentType,
    url,
    toolbar = true,
    title,
}: ContentModalContentProps) => {
    console.log("[Content URL]", url);

    return (
        <ResourceViewerDialogContent
            title={<TitleElement title={title} type={contentType} />}
            leftActions={<LeftActions url={url} />}
        >
            <Switch>
                <Match when={contentType === "webpage"}>
                    <iframe src={url} class="w-full h-full border-none" title={title} />
                </Match>
                <Match when={contentType === "pdf"}>
                    <embed
                        src={`${url}#${toolbar ? "toolbar=1" : "toolbar=0"}`}
                        type="application/pdf"
                        class="w-full h-full"
                    />
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
