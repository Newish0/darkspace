import { createSignal, For, Show } from "solid-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyIcon, Download, ExternalLink } from "lucide-solid";
import { IModuleTopic } from "@/services/BS/scraper";
import { ContentModal, ContentModalContent, ContentModalTrigger } from "./content-modal";
import { toast } from "solid-sonner";

const ModuleContentList = (props: { items?: IModuleTopic[] }) => {
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
                                <ContentModal>
                                    <ContentModalTrigger
                                        as={Button<"button">}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <ExternalLink class="w-4 h-4 mr-2" />
                                        Open
                                    </ContentModalTrigger>
                                    <ContentModalContent
                                        url={item.url}
                                        title={item.name}
                                        contentType={
                                            item.url.toLowerCase().includes(".pdf")
                                                ? "pdf"
                                                : "webpage"
                                        }
                                    />
                                </ContentModal>

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
