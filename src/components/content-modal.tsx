import { createEffect, createSignal, JSX } from "solid-js";
import { X } from "lucide-solid";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FullScreenModalProps {
    url: string;
    contentType: "webpage" | "pdf";
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const FullScreenModal = (props: FullScreenModalProps) => {
    const [internalOpen, setInternalOpen] = createSignal(props.open);

    createEffect(() => {
        setInternalOpen(props.open);
    });

    const handleOpenChange = (open: boolean) => {
        setInternalOpen(open);
        props.onOpenChange?.(open);
    };

    return (
        <Dialog open={internalOpen()} onOpenChange={handleOpenChange}>
            {/* <DialogContent class="max-w-full max-h-full w-screen h-screen p-0"> */}
            <DialogContent class="max-w-full max-h-full w-3/4 h-4/5 p-0">
                <div class="relative w-full h-full">
                    {props.contentType === "webpage" && (
                        <iframe
                            src={props.url}
                            class="w-full h-full border-none"
                            title="Full-screen content"
                        />
                    )}
                    {props.contentType === "pdf" && (
                        <embed src={props.url} type="application/pdf" class="w-full h-full" />
                    )}
                    {/* <Button
                        variant="outline"
                        size="icon"
                        class="absolute top-4 right-4 rounded-full"
                        onClick={() => handleOpenChange(false)}
                    >
                        <X class="h-4 w-4" />
                        <span class="sr-only">Close</span>
                    </Button> */}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default FullScreenModal;
