import { Component, ComponentProps } from "solid-js";
import DOMPurify from "dompurify";

interface UnsafeHtmlProps extends ComponentProps<"div"> {
    unsafeHtml: string;
}

const UnsafeHtml: Component<UnsafeHtmlProps> = ({ unsafeHtml, ...props }) => {
    const sanitizedHtml = () => DOMPurify.sanitize(unsafeHtml);
    return <div {...props} innerHTML={sanitizedHtml()}></div>;
};

export default UnsafeHtml;
