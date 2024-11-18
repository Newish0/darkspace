import { createSignal, For, Show } from "solid-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyIcon, Download, ExternalLink } from "lucide-solid";
import { IModuleTopic } from "@/services/BS/scraper";
import ContentModal from "./content-modal";
import { toast } from "solid-sonner";

const ModuleContentList = (props: { items?: IModuleTopic[] }) => {
    const [modalData, setModalData] = createSignal<{
        url: string;
        contentType: "webpage" | "pdf";
        open: boolean;
        title?: string;
    }>({
        url: "",
        contentType: "webpage",
        open: false,
        title: "",
    });

    const handleDownload = (url: string, filename: string) => {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
    };

    const handleOpen = (url: string, title?: string) => {
        // window.open(url, "_blank");
        const contentType = url.toLowerCase().includes(".pdf") ? "pdf" : "webpage";
        setModalData({ url, contentType, open: true, title });
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
                            <CardFooter class="flex justify-between mt-auto gap-1">
                                <Button
                                    class="w-full"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpen(item.url, item.name)}
                                >
                                    <ExternalLink class="w-4 h-4 mr-2" />
                                    Open
                                </Button>

                                <Show
                                    when={item.downloadable}
                                    fallback={
                                        <Button
                                            variant="ghost"
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

            <ContentModal
                contentType={modalData().contentType}
                url={modalData().url}
                open={modalData().open}
                onOpenChange={(open) => setModalData((data) => ({ ...data, open }))}
                title={modalData().title}
            />
        </>
    );
};

export default ModuleContentList;
