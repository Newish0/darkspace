import { formatDate } from "date-fns";
import { CalendarIcon, File, Link2 } from "lucide-solid";
import { Separator } from "./ui/separator";
import UnsafeHtml from "./unsafe-html";
import { remapHtmlUrls } from "@/utils/html";
import { NewsItem, FileAttachment as NewsFileAttachment } from "@/services/BS/api/news";
import { buildNewsItemAttachmentUrl, remapD2LUrl } from "@/services/BS/url";
import { For, Show } from "solid-js";
import { formatFileSize } from "@/utils/format";
import { Badge } from "./ui/badge";
import { ContentModal, ContentModalContent, ContentModalTrigger } from "./content-modal";
import { Button } from "./ui/button";

function FileAttachment(props: {
    orgUnitId: string;
    newsId: string;
    attachment: NewsFileAttachment;
}) {
    const attachmentUrl = () =>
        buildNewsItemAttachmentUrl(
            props.orgUnitId,
            props.newsId,
            props.attachment.FileId.toString()
        );

    return (
        <ContentModal>
            <ContentModalTrigger as={Badge} variant="secondary" round class="text-nowrap">
                <File class="h-4 w-4 mr-2" />
                <span class="mr-1">{props.attachment.FileName}</span>
                <Show when={props.attachment.Size}>
                    <span>({formatFileSize(props.attachment.Size)})</span>
                </Show>
            </ContentModalTrigger>
            <ContentModalContent
                url={attachmentUrl()}
                previewUrl={attachmentUrl()!}
                title={props.attachment.FileName}
                contentType={props.attachment.FileName.endsWith(".pdf") ? "pdf" : "webpage"}
            />
        </ContentModal>
    );
}

export default function NewsDisplay(props: { orgUnitId: string; news: NewsItem }) {
    return (
        <>
            <div class="flex flex-wrap justify-between items-center">
                <h3 class="text-xl font-medium">{props.news.Title}</h3>
                <div class="flex items-center text-sm text-muted-foreground">
                    <CalendarIcon class="mr-1 h-4 w-4" />
                    <span>
                        {props.news.StartDate
                            ? formatDate(props.news.StartDate, "PPp")
                            : "Unknown"}
                    </span>
                </div>
            </div>
            <Separator class="my-2" />
            <UnsafeHtml
                unsafeHtml={remapHtmlUrls(props.news.Body.Html, remapD2LUrl)}
                config={{
                    ADD_ATTR: ["target"],
                }}
                class="markdown overflow-auto"
            />

            <div class="flex gap-1 mt-2">
                <For each={props.news.Attachments}>
                    {(attachment) => (
                        <FileAttachment
                            orgUnitId={props.orgUnitId}
                            newsId={props.news.Id.toString()}
                            attachment={attachment}
                        />
                    )}
                </For>
            </div>
        </>
    );
}
