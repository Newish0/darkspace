import { RouteSectionProps } from "@solidjs/router";
import { Component } from "solid-js";

const Transparent: Component<RouteSectionProps<unknown>> = (props) => {
    return <>{props.children}</>;
};

export default Transparent;
