import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { createAsyncCached } from "@/hooks/async-cached";
import { getOfficeFilePreviewUrl } from "@/services/BS/scraper/aws-office-file-preview";
import { IModuleTopic } from "@/services/BS/scraper/module-content";
import { isOfficeFile } from "@/utils/path";
import { CopyIcon, Download, ExternalLink } from "lucide-solid";
import { createEffect, For, Show } from "solid-js";
import { toast } from "solid-sonner";
import { ContentModal, ContentModalContent, ContentModalTrigger } from "./content-modal";
import ControlledSuspense from "./controlled-suspense";
import { Skeleton } from "./ui/skeleton";
import { buildContentDownloadUrl, remapD2LUrl } from "@/services/BS/url";
import DescriptionRenderer from "./description-renderer";
import { remapHtmlUrls } from "@/utils/html";
import { saveFileFromUrl } from "@/utils/file";
import { cn } from "@/lib/utils";

const TopicModalWithTrigger = (props: {
    topic: IModuleTopic;
    courseId: string;
    defaultOpen?: boolean;
}) => {
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
            <ContentModal defaultOpen={props.defaultOpen}>
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

interface ModuleContentListProps {
    items?: IModuleTopic[];
    courseId: string;
    openedTopicId?: string;
    layout?: "grid" | "list";
}

const ModuleContentList = (props: ModuleContentListProps) => {
    const handleCopyLink = (url: string) => {
        navigator.clipboard.writeText(url);

        // TODO: Get <Toaster /> working so that we can show a toast
        toast.success("Link copied to clipboard");
    };

    const getFileType = (providedType: string | undefined, url: string) => {
        const extension = url.split(".").pop();
        if (providedType === "File" && extension) {
            return `${extension.toUpperCase()} File`;
        }

        return providedType || "Unknown Type";
    };

    createEffect(() => {
        if (props.openedTopicId) {
            const element = document.getElementById(props.openedTopicId);
            if (element) {
                element.scrollIntoView({ behavior: "smooth" });
            }
        }
    });

    return (
        <>
            <div
                class={cn(
                    "grid gap-2",
                    props.layout === "list" ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"
                )}
            >
                <For each={props.items}>
                    {(item) => (
                        <Card class="flex flex-col">
                            <CardHeader>
                                <CardTitle class="break-words">
                                    {item.name || "Unnamed Item"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent class="space-y-2">
                                <p class="text-sm text-muted-foreground">
                                    Type: {getFileType(item.type, item.url)}
                                </p>

                                {/* Also show topic description (empty if no description) */}
                                <p class="text-sm">
                                    <DescriptionRenderer
                                        description={item.description}
                                        config={{
                                            ADD_TAGS: ["iframe"],
                                            ADD_ATTR: [
                                                "allow",
                                                "allowfullscreen",
                                                "frameborder",
                                                "scrolling",
                                                "target",
                                            ],
                                        }}
                                        remapFunc={(html) => remapHtmlUrls(html, remapD2LUrl)}
                                    />
                                </p>
                            </CardContent>
                            <CardFooter class="flex flex-wrap mt-auto gap-1">
                                <TopicModalWithTrigger
                                    topic={item}
                                    courseId={props.courseId}
                                    defaultOpen={item.id === props.openedTopicId}
                                />
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
                                            saveFileFromUrl(
                                                buildContentDownloadUrl(props.courseId, item.id),
                                                item.name || `topic-${item.id}`
                                            )
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
