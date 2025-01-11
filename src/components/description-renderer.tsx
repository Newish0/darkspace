import { Component, ComponentProps, Show } from "solid-js";
import UnsafeHtml from "./unsafe-html";

/** Renders the given html and/or text with remapping */
const DescriptionRenderer: Component<{
    description?: {
        html?: string;
        text?: string;
    };
    remapFunc?: (html: string) => string;
    config?: ComponentProps<typeof UnsafeHtml>["config"];

    /* If true, show both html and text. Otherwise, prefer HTML over text. (Fallback to text when no HTML) */
    showBothHtmlAndText?: boolean;
}> = (props) => {
    return (
        <>
            {/* Create ".markdown" container to use custom markdown styles (defined in `global.css`) */}
            <div class="markdown">
                <Show when={props.description?.html}>
                    {(html) => (
                        <UnsafeHtml
                            unsafeHtml={props.remapFunc ? props.remapFunc(html()) : html()}
                            config={props.config}
                        />
                    )}
                </Show>
                <Show when={props.showBothHtmlAndText && props.description?.text}>
                    {(text) => <p>{text()}</p>}
                </Show>
            </div>
        </>
    );
};

export default DescriptionRenderer;
