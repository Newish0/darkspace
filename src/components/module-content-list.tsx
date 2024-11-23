import { createResource, createSignal, For, Show } from "solid-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyIcon, Download, ExternalLink } from "lucide-solid";
import { IModuleTopic } from "@/services/BS/scraper";
import { ContentModal, ContentModalContent, ContentModalTrigger } from "./content-modal";
import { toast } from "solid-sonner";
import { isOfficeFile } from "@/utils/path";
import { getOfficeFilePreviewUrl } from "@/services/BS/scraper/aws-office-file-preview";
import { createAsyncCached } from "@/hooks/async-cached";
import ControlledSuspense from "./controlled-suspense";
import { Skeleton } from "./ui/skeleton";

const TopicModalWithTrigger = (props: { topic: IModuleTopic; courseId: string }) => {
    const previewUrl = isOfficeFile(props.topic.url)
        ? createAsyncCached(() => getOfficeFilePreviewUrl(props.courseId, props.topic.id), {
              keys: () => ["office-file-preview-url", props.courseId, props.topic.id],
          })
        : () => props.topic.url;

    const contentType = () => {
        if (isOfficeFile(props.topic.url)) return "pdf";
        return props.topic.url.toLowerCase().includes(".pdf") ? "pdf" : "webpage";
    };

    return (
        <ControlledSuspense
            hasContent={!!previewUrl()}
            fallback={<Skeleton radius={5} width={82} height={34} />}
        >
            <ContentModal>
                <ContentModalTrigger as={Button<"button">} variant="outline" size="sm">
                    <ExternalLink class="w-4 h-4 mr-2" />
                    Open
                </ContentModalTrigger>
                <ContentModalContent
                    toolbar={!isOfficeFile(props.topic.url)}
                    url={props.topic.url}
                    previewUrl={previewUrl()!}
                    title={props.topic.name}
                    contentType={contentType()}
                />
            </ContentModal>
        </ControlledSuspense>
    );
};

const ModuleContentList = (props: { items?: IModuleTopic[]; courseId: string }) => {
    const handleDownload = (url: string, filename: string) => {
        const a = document.createElement("a");
        a.href = url;
        a.download = url.split("/").pop() || filename;
        a.click();
    };

    const handleCopyLink = (url: string) => {
        navigator.clipboard.writeText(url);

        // TODO: Get <Toaster /> working so that we can show a toast
        toast.success("Link copied to clipboard");
    };

    return (
        <>
            <div class="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                <For each={props.items}>
                    {(item) => (
                        <Card class="flex flex-col">
                            <CardHeader>
                                <CardTitle class="break-words">
                                    {item.name || "Unnamed Item"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p class="text-sm text-muted-foreground">
                                    Type: {item.type || "Unknown"}
                                </p>
                            </CardContent>
                            <CardFooter class="flex flex-wrap mt-auto gap-1">
                                <TopicModalWithTrigger topic={item} courseId={props.courseId} />
                                <Show
                                    when={item.downloadable}
                                    fallback={
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleCopyLink(item.url)}
                                        >
                                            <CopyIcon class="w-4 h-4 mr-2" />
                                            Copy
                                        </Button>
                                    }
                                >
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            handleDownload(item.url, item.name || "download")
                                        }
                                    >
                                        <Download class="w-4 h-4 mr-2" />
                                        Save
                                    </Button>
                                </Show>
                            </CardFooter>
                        </Card>
                    )}
                </For>
            </div>
        </>
    );
};

export default ModuleContentList;
