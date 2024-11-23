import { getUnstableCourseContent, UnstableModule } from "@/services/BS/api/unstable-module";
import { htmlToDocument } from "@/services/BS/util";
import { BASE_URL } from "../url";

// Types
export interface IModule {
    name: string;
    moduleId: string;
    description?: {
        text: string;
        html: string;
    };
    children?: IModule[];
}

// Constants
const URL_CONFIG = {
    COURSE_MODULE: `${BASE_URL}/d2l/le/content/{{COURSE_ID}}/Home`,
};

const SELECTORS = {
    MODULE: {
        TREE: "#D2L_LE_Content_TreeBrowser",
        PLUGIN_TREE: "#ContentPluginTree",
        ITEM_ID_PATTERN: "TreeItem",
        ITEM: `[id^="TreeItem"]`,
    },
};

function extractModuleInfo(element: Element): IModule {
    const idElement = element.querySelector(SELECTORS.MODULE.ITEM);

    const module: IModule = {
        name: idElement?.querySelector("div")?.textContent || "",
        moduleId: idElement ? idElement.id.replace(SELECTORS.MODULE.ITEM_ID_PATTERN, "") : "",
    };

    const childrenContainer = element.querySelector("ul");
    if (childrenContainer) {
        const childModules = Array.from(childrenContainer.children)
            .filter((child) => child.tagName === "LI")
            .map((child) => extractModuleInfo(child));

        if (childModules.length > 0) {
            module.children = childModules;
        }
    }

    return module;
}

function getAdditionalModules(doc: Document): IModule[] {
    // Add Overview, Bookmarks, and Course Schedule modules
    const additionalModuleTree = doc.querySelector(SELECTORS.MODULE.PLUGIN_TREE);

    const additionalModules = Array.from(additionalModuleTree?.children ?? [])
        .filter((child) => child.tagName === "LI")
        .map((child) => extractModuleInfo(child));

    return additionalModules;
}

function getRootModules(doc: Document): IModule[] {
    const moduleTree = doc.querySelector(SELECTORS.MODULE.TREE);

    const rootModules = Array.from(moduleTree?.children ?? [])
        .filter((child) => child.tagName === "LI")
        .map((child) => extractModuleInfo(child));

    return rootModules;
}

export async function getCourseModules(courseId: string, useUnstable = true): Promise<IModule[]> {
    const html = await fetch(URL_CONFIG.COURSE_MODULE.replace("{{COURSE_ID}}", courseId)).then(
        (res) => res.text()
    );
    const doc = htmlToDocument(html);

    const additionalModules = getAdditionalModules(doc);
    let rootModules: IModule[] = [];

    if (useUnstable) {
        const unstableContent = await getUnstableCourseContent(courseId);

        const unstableModuleToIModule = (um: UnstableModule): IModule => {
            return {
                name: um.Title,
                description: {
                    text: um.Description.Text,
                    html: um.Description.Html,
                },
                moduleId: um.ModuleId.toString(),
                children: um.Modules.map(unstableModuleToIModule),
            };
        };

        rootModules = unstableContent.Modules.map(unstableModuleToIModule);
    } else {
        rootModules = getRootModules(doc);
    }

    return [...additionalModules, ...rootModules];
}
