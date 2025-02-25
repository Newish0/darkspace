import { createSignal, Show } from "solid-js";
import { Loader2 } from "lucide-solid";
import { Button } from "~/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";

import { Progress } from "./ui/progress";
import { preloadAllContent } from "@/services/content-service";

interface GreetingModalProps {
    isFirstTime: boolean;
    onClose: (preloaded?: boolean) => void;
}

export function GreetingModal(props: GreetingModalProps) {
    const [isOpen, setIsOpen] = createSignal(true);
    const [isLoading, setIsLoading] = createSignal(false);
    const [progress, setProgress] = createSignal(0);
    const [error, setError] = createSignal("");

    const handlePreload = async () => {
        setIsLoading(true);

        try {
            await preloadAllContent((p) => setProgress(p));
            handleOpenChange(false, true);
        } catch (e: any) {
            setError(e?.message || "Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = (isOpen: boolean, preloaded?: boolean) => {
        setIsOpen(isOpen);
        if (!isOpen) props.onClose(preloaded);
    };

    return (
        <Dialog open={isOpen()} onOpenChange={handleOpenChange} >
            <DialogContent class="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {props.isFirstTime
                            ? "Welcome to Darkspace!"
                            : `Thanks for updating to Darkspace ${__APP_ENV__.VERSION}!`}
                    </DialogTitle>
                    <DialogDescription>
                        {props.isFirstTime ? (
                            <>
                                To improve your experience, Darkspace needs to preload all content.
                                This will take a couple of minutes, but will only happen once.
                            </>
                        ) : (
                            <>
                                To ensure you have the latest content, Darkspace needs to preload
                                all content. This will take a couple of minutes, but will only
                                happen once for this version.
                            </>
                        )}

                        <Show when={isLoading()}>
                            <Progress class="mt-4" value={progress()} maxValue={1} />
                        </Show>
                        <Show when={error()}>
                            <p class="mt-4 text-error-foreground">{error()}</p>
                        </Show>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button onClick={handlePreload} disabled={isLoading()}>
                        <Show when={isLoading()} fallback="Yes, preload content">
                            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                            Preloading...
                        </Show>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
