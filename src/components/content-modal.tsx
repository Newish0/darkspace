import { ExternalLink, ExternalLinkIcon, FileTextIcon, PanelsTopLeftIcon } from "lucide-solid";
import { createEffect, createSignal, Match, Switch } from "solid-js";
import { ResourceViewerDialog } from "./ui/resource-viewer-dialog";
import { Button, buttonVariants } from "./ui/button";

interface ContentModalProps {
    url: string;
    title?: string;
    contentType: "webpage" | "pdf"; // TODO: Allow not providing a content type and inferring it from the URL
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const TitleElement = (props: { title?: string; type?: ContentModalProps["contentType"] }) => {
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

const LeftActions = (props: { url: string }) => (
    <>
        <a href={props.url} target="_blank" class={buttonVariants({ variant: "ghost", size: "sm", class: "p-0" })}>
            <ExternalLinkIcon size={16} />
        </a>
    </>
);

const ContentModal = (props: ContentModalProps) => {
    const [internalOpen, setInternalOpen] = createSignal(props.open);

    createEffect(() => {
        setInternalOpen(props.open);
    });

    const handleOpenChange = (open: boolean) => {
        setInternalOpen(open);
        props.onOpenChange?.(open);
    };

    createEffect(() => {
        console.log("Provided URL:", props.url);
    });

    return (
        <ResourceViewerDialog
            open={internalOpen()}
            onOpenChange={handleOpenChange}
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
        </ResourceViewerDialog>
    );
};

export default ContentModal;
