import { Component, ComponentProps, createMemo } from "solid-js";
import DOMPurify from "dompurify";

interface UnsafeHtmlProps extends ComponentProps<"div"> {
    unsafeHtml: string;
    config?: DOMPurify.Config;
}

const UnsafeHtml: Component<UnsafeHtmlProps> = (props) => {
    const sanitizedHtml = createMemo(() =>
        DOMPurify.sanitize(props.unsafeHtml, props.config ?? {})
    );

    if (typeof sanitizedHtml() === "string") {
        return <div {...props} innerHTML={sanitizedHtml() as string}></div>;
    } else {
        return <div {...props}>{sanitizedHtml()}</div>;
    }
};

export default UnsafeHtml;
