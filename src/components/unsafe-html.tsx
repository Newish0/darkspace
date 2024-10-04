import { Component, createSignal } from "solid-js";
import DOMPurify from "dompurify";

interface UnsafeHtmlProps {
    unsafeHtml: string;
}

const UnsafeHtml: Component<UnsafeHtmlProps> = ({ unsafeHtml }) => {
    const sanitizedHtml = () => DOMPurify.sanitize(unsafeHtml);
    return <div innerHTML={sanitizedHtml()}></div>;
};

export default UnsafeHtml;
