import { createEffect, createSignal, JSX, Switch } from "solid-js";
import { X } from "lucide-solid";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ResourceViewerDialog } from "./ui/resource-viewer-dialog";
import { Match } from "solid-js";

interface ContentModalProps {
    url: string;
    title?: string;
    contentType: "webpage" | "pdf"; // TODO: Allow not providing a content type and inferring it from the URL
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

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
            title={props.title}
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
