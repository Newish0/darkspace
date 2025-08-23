import { cn } from "@/lib/utils";
import { children, Component, JSX, splitProps } from "solid-js";

interface ScrollAreaProps extends JSX.HTMLAttributes<HTMLDivElement> {
    class?: string;
    children: JSX.Element;
}

export const ScrollArea: Component<ScrollAreaProps> = (props) => {
    const [local, others] = splitProps(props, ["class", "children"]);
    const resolved = children(() => local.children);

    return (
        <div class={cn(`relative overflow-hidden`, local.class)} {...others}>
            <div class="h-full w-full overflow-auto">{resolved()}</div>
            {/* <div class="absolute right-1.5 top-1.5 bottom-1.5 w-2.5 transition-all">
                <div class="relative h-full w-full rounded-full bg-border opacity-0 transition-opacity hover:opacity-100">
                    <div class="absolute top-0 left-0 h-1/3 w-full rounded-full bg-primary" />
                </div>
            </div> */}
        </div>
    );
};
