import { Component, For, JSX, JSXElement, splitProps } from "solid-js";

const Kbd: Component<{ children: JSXElement }> = (props) => {
    const [local, others] = splitProps(props, ["children"]);

    return (
        <kbd class="rounded-sm text-xs bg-muted p-1 inline-flex justify-center items-center" {...others}>
            {local.children}
        </kbd>
    );
};

export default Kbd;
