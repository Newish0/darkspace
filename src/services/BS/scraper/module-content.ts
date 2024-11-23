import { getUnstableCourseContent, UnstableModule } from "../api/unstable-module";
import { BASE_URL } from "../url";
import { parseD2LPartial, htmlToDocument } from "../util";

// Types
export interface IModuleTopic {
    id: string;
    name?: string;
    type?: "File" | "Link" | "ContentService" | string;
    downloadable?: boolean;
    url: string;
}

export interface IModuleDetails {
    id: string;
    name?: string;
    topics: IModuleTopic[];
    description?: {
        text?: string;
        html?: string;
    };
}

// Constants
const URL_CONFIG = {
    MODULE_CONTENT: `${BASE_URL}/d2l/le/content/{{COURSE_ID}}/PartialMainView?identifier={{MODULE_ID}}&_d2l_prc`,
    CONTENT_SERVICE: `${BASE_URL}/d2l/le/contentservice/topic/{{TOPIC_ID}}/launch`,
};

const PARTIAL_ONLY_MODULES = ["Overview"];

async function getPartialAsDoc(url: string): Promise<Document> {
    const d2lPartial = await fetch(url).then((res) => res.text());

    const d2lPartialParsed = parseD2LPartial(d2lPartial);

    if (!d2lPartialParsed?.Payload?.Html) {
        throw new Error("Failed to extract module content: Payload.Html not found");
    }

    const doc = htmlToDocument(d2lPartialParsed.Payload.Html);

    return doc;
}

async function getModuleContentFromD2LPartial(
    courseId: string,
    moduleId: string
): Promise<IModuleDetails> {
    console.log("[getModuleContentFromD2LPartial] Fetching module", courseId, moduleId);

    const url = URL_CONFIG.MODULE_CONTENT.replace("{{COURSE_ID}}", courseId).replace(
        "{{MODULE_ID}}",
        moduleId
    );

    const doc = await getPartialAsDoc(url);

    const moduleName = doc.querySelector("h1.d2l-page-title")?.textContent;

    // Find all list items that contain the relevant information
    const listItems = doc.querySelectorAll("li.d2l-datalist-item");

    // Extract data from each list item
    const topics = Array.from(listItems)
        .map((item) => {
            const linkElement: HTMLAnchorElement | null = item.querySelector("[id^=d2l_content_]");
            const typeElement = item.querySelector(".d2l-textblock.d2l-body-small");
            const id = linkElement?.id.replace("d2l_content_", "").split("_").at(1);

            if (linkElement && typeElement && id) {
                return {
                    name: linkElement.textContent || undefined,
                    type: typeElement.textContent || undefined,
                    url: linkElement.href,
                    id: id,
                };
            }
            return null;
        })
        .filter((item) => item !== null);

    // Extract HTML descriptions
    const descriptionElement = doc.querySelector("d2l-html-block");
    const html = descriptionElement?.getAttribute("html");

    return {
        id: moduleId,
        name: moduleName || undefined,
        topics,
        description: {
            html: html || undefined,
        },
    };
}

export async function getModuleContent(
    courseId: string,
    moduleId: string
): Promise<IModuleDetails> {
    if (PARTIAL_ONLY_MODULES.includes(moduleId)) {
        return getModuleContentFromD2LPartial(courseId, moduleId);
    }

    const unstableContent = await getUnstableCourseContent(courseId);

    const findModule = (m: UnstableModule) => m.ModuleId.toString() === moduleId;

    const recursiveFindModule = (m: UnstableModule): UnstableModule | undefined => {
        if (findModule(m)) {
            return m;
        } else {
            return m.Modules.find(recursiveFindModule);
        }
    };

    let um: UnstableModule | undefined = undefined;
    for (const m of unstableContent.Modules) {
        um = recursiveFindModule(m);
        if (um) break;
    }

    if (!um) {
        throw new Error("Module not found");
    }

    console.log("[getModuleContent] Found module", um);

    return {
        name: um.Title || undefined,
        id: um.ModuleId.toString(),
        topics:
            um.Topics.map((t) => {
                let url = t.Url;

                if (t.IsContentServiceAudioOrVideo) {
                    // url = t.ContentUrl;
                    url = URL_CONFIG.CONTENT_SERVICE.replace("{{TOPIC_ID}}", t.TopicId.toString());
                }

                const topic = {
                    name: t.Title,
                    type: t.TypeIdentifier, // OR t.Url.split(".").at(-1) || ""; // TODO: infer from extension
                    url,
                    id: t.TopicId.toString(),
                    downloadable: t.TypeIdentifier === "File", // TODO: handle other types
                };
                return topic;
            }) ?? [],
        description: {
            text: um.Description.Text,
            html: um.Description.Html,
        },
    };
}