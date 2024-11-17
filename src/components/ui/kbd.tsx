import { Component, For, JSX, JSXElement, splitProps } from "solid-js";

const Kbd: Component<{ children: JSXElement }> = (props) => {
    const [local, others] = splitProps(props, ["children"]);

    return (
        <kbd class="rounded-sm bg-muted p-2 inline-flex justify-center items-center" {...others}>
            {local.children}
        </kbd>
    );
};

export default Kbd;
