import { For } from "solid-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ExternalLink } from "lucide-solid";
import { IModuleContent } from "@/services/BS/scraper";

const ModuleContentList = (props: { items?: IModuleContent[] }) => {
    const handleDownload = (url: string, filename: string) => {
        throw new Error("Not implemented");
    };

    return (
        <div class="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            <For each={props.items}>
                {(item) => (
                    <Card class="flex flex-col">
                        <CardHeader>
                            <CardTitle class="break-words">{item.name || "Unnamed Item"}</CardTitle>
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
                                onClick={() => window.open(item.url, "_blank")}
                            >
                                <ExternalLink class="w-4 h-4 mr-2" />
                                Open
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(item.url, item.name || "download")}
                            >
                                <Download class="w-4 h-4 mr-2" />
                                Save
                            </Button>
                        </CardFooter>
                    </Card>
                )}
            </For>
        </div>
    );
};

export default ModuleContentList;
