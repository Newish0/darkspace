import { Show, Suspense, Switch } from "solid-js";

/**
 * A wrapper around the built-in `Suspense` component that allows it to be
 * controlled. If the `hasContent` prop is true, the children will be rendered
 * immediately. Otherwise, the fallback will be used.
 *
 * @param {Parameters<typeof Suspense>[0] & { hasContent?: boolean }} props
 * @returns {JSX.Element}
 */
export default function ControlledSuspense(
    props: Parameters<typeof Suspense>[0] & { hasContent?: boolean }
) {
    return (
        <Show
            when={props.hasContent}
            fallback={<Suspense fallback={props.fallback}>{props.children}</Suspense>}
        >
            {props.children}
        </Show>
    );
}
