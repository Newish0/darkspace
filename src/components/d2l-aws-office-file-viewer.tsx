import { createAsyncCached } from "@/hooks/async-cached";
import { getOfficeFilePreviewUrl } from "@/services/BS/scraper/aws-office-file-preview";
import { Component, createSignal } from "solid-js";
import ControlledSuspense from "./controlled-suspense";

export const D2LOfficeFileViewer: Component<{ courseId: string; topicId: string }> = (props) => {
    const url = createAsyncCached(() => getOfficeFilePreviewUrl(props.courseId, props.topicId), {
        keys: () => ["office-file-preview-url", props.courseId, props.topicId],
    });

    return (
        <ControlledSuspense hasContent={!!url()} fallback={<p>Loading...</p>}>
            <embed src={url() + "#toolbar=0"} type="application/pdf" class="w-full h-full" />
        </ControlledSuspense>
    );
};
