import type { Component, JSX, ValidComponent } from "solid-js";
import { splitProps } from "solid-js";

import * as DialogPrimitive from "@kobalte/core/dialog";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";

import { XIcon } from "lucide-solid";
import { cn } from "~/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal: Component<DialogPrimitive.DialogPortalProps> = (props) => {
    const [, rest] = splitProps(props, ["children"]);
    return (
        <DialogPrimitive.Portal {...rest}>
            <div class="fixed inset-0 z-50 flex items-start justify-center sm:items-center">
                {props.children}
            </div>
        </DialogPrimitive.Portal>
    );
};

type DialogOverlayProps<T extends ValidComponent = "div"> =
    DialogPrimitive.DialogOverlayProps<T> & { class?: string | undefined };

const DialogOverlay = <T extends ValidComponent = "div">(
    props: PolymorphicProps<T, DialogOverlayProps<T>>
) => {
    const [, rest] = splitProps(props as DialogOverlayProps, ["class"]);
    return (
        <DialogPrimitive.Overlay
            class={cn(
                "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0",
                props.class
            )}
            {...rest}
        />
    );
};

type DialogContentProps<T extends ValidComponent = "div"> =
    DialogPrimitive.DialogContentProps<T> & {
        class?: string | undefined;
        children?: JSX.Element;
        title?: JSX.Element;
        leftActions?: JSX.Element;
    };

const DialogContent = <T extends ValidComponent = "div">(
    props: PolymorphicProps<T, DialogContentProps<T>>
) => {
    const [, rest] = splitProps(props as DialogContentProps, ["class", "children", "title"]);
    return (
        <DialogPortal>
            <DialogOverlay />

            <DialogPrimitive.Content
                class={cn(
                    "fixed left-1/2 top-1/2 z-50 max-h-screen w-11/12 lg:w-5/6 h-full overflow-visible -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center gap-2 p-0 shadow-lg duration-200 data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-[closed]:zoom-out-95 data-[expanded]:zoom-in-95 data-[closed]:slide-out-to-left-1/2 data-[closed]:slide-out-to-top-[48%] data-[expanded]:slide-in-from-left-1/2 data-[expanded]:slide-in-from-top-[48%] sm:rounded-lg",
                    props.class
                )}
                {...rest}
            >
                {/* Top bar */}
                <div class="w-screen z-50 py-2 px-4 flex justify-between items-center border-b h-min">
                    <div>{props.leftActions}</div>
                    <div>{props.title}</div>
                    <DialogPrimitive.CloseButton class="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[expanded]:bg-accent data-[expanded]:text-muted-foreground">
                        <XIcon size={16} />
                        <span class="sr-only">Close</span>
                    </DialogPrimitive.CloseButton>
                </div>

                <div class="overflow-auto h-full w-full mb-4">{props.children}</div>
            </DialogPrimitive.Content>
        </DialogPortal>
    );
};

export {
    Dialog as ResourceViewerDialog,
    DialogContent as ResourceViewerDialogContent,
    DialogTrigger as ResourceViewerDialogTrigger
};

