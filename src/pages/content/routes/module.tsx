import ControlledSuspense from "@/components/controlled-suspense";
import DescriptionRenderer from "@/components/description-renderer";
import ModuleContentList from "@/components/module-content-list";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { createAsyncCached } from "@/hooks/async-cached";
import { getModuleContent } from "@/services/BS/scraper/module-content";
import { buildContentDownloadUrl, remapD2LUrl } from "@/services/BS/url";
import { saveFileFromUrl } from "@/utils/file";
import { remapHtmlUrls } from "@/utils/html";
import { makePersisted } from "@solid-primitives/storage";
import { useParams, useSearchParams } from "@solidjs/router";
import { Grid3x3Icon, Rows2Icon } from "lucide-solid";
import { createSignal, Show } from "solid-js";

const Module = () => {
    const params = useParams();
    const [searchParams] = useSearchParams();

    // FIXME: Key not reactive to page changes ==> stays with last layout used
    const layoutPersistentKey = () =>
        `course-${params.courseId}-module-${params.moduleId}-content-layout`;
    const [moduleContentListLayout, setModuleContentListLayout] = makePersisted(
        createSignal<"grid" | "list">("grid"),
        {
            name: layoutPersistentKey(),
        }
    );

    const moduleContent = createAsyncCached(
        () => getModuleContent(params.courseId, params.moduleId),
        {
            keys: () => ["moduleContent", params.courseId, params.moduleId],
        }
    );

    const downloadableTopics = () => moduleContent()?.topics.filter((t) => t.downloadable);

    const handleDownloadAll = () => {
        for (const t of downloadableTopics() || []) {
            saveFileFromUrl(
                buildContentDownloadUrl(params.courseId, t.id),
                t.name || `topic-${t.id}`
            );
        }
    };

    return (
        <ControlledSuspense hasContent={!!moduleContent()} fallback={<div>Loading...</div>}>
            <h2 class="text-xl font-bold border-b px-4 py-2 flex justify-between items-center">
                {moduleContent()?.name}

                <Show when={downloadableTopics()?.length}>
                    <Tooltip>
                        <TooltipTrigger
                            as={Button<"button">}
                            variant="link"
                            size={"sm"}
                            class="h-7 font-medium text-sm"
                            onClick={handleDownloadAll}
                        >
                            Download all
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{moduleContent()?.topics.length} files</p>
                        </TooltipContent>
                    </Tooltip>
                </Show>
            </h2>

            <div class="overflow-auto px-4 py-2 space-y-4">
                {/* Render the module's description as HTML or text */}
                <DescriptionRenderer
                    description={moduleContent()?.description}
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

                <div class="flex justify-end mt-4 pb-2 border-b border-border">
                    <ToggleGroup
                        value={moduleContentListLayout()}
                        onChange={setModuleContentListLayout}
                    >
                        <ToggleGroupItem value="grid" size="sm">
                            <Grid3x3Icon class="w-4 h-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="list" size="sm">
                            <Rows2Icon class="w-4 h-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>

                <div class="">
                    <ModuleContentList
                        items={moduleContent()?.topics}
                        courseId={params.courseId}
                        openedTopicId={
                            Array.isArray(searchParams.topic)
                                ? searchParams.topic?.at(0)
                                : searchParams.topic
                        }
                        layout={moduleContentListLayout()}
                    />
                </div>
            </div>
        </ControlledSuspense>
    );
};

export default Module;
