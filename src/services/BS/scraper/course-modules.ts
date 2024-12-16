import { getUnstableCourseContent, UnstableModule } from "@/services/BS/api/unstable-module";
import { htmlToDocument } from "@/services/BS/util";
import { buildCourseModuleUrl } from '../url';

// Types
export interface IModule {
    name: string;
    moduleId: string;
    description?: {
        text: string;
        html: string;
    };
    hasTopics?: boolean;
    children?: IModule[];
}

// Constants
const SELECTORS = {
    MODULE: {
        TREE: "#D2L_LE_Content_TreeBrowser",
        PLUGIN_TREE: "#ContentPluginTree",
        ITEM_ID_PATTERN: "TreeItem",
        ITEM: `[id^="TreeItem"]`,
    },
};

/**
 * Extracts module information from an HTML element.
 * Recursively extracts child modules if present.
 *
 * @param element - The HTML element representing the module.
 * @returns An object representing the module with its name, moduleId, and optionally children.
 */
function extractModuleInfo(element: Element): IModule {
    // Select the module item element
    const idElement = element.querySelector(SELECTORS.MODULE.ITEM);

    // Create a module object with name and moduleId
    const module: IModule = {
        name: idElement?.querySelector("div")?.textContent || "",
        moduleId: idElement ? idElement.id.replace(SELECTORS.MODULE.ITEM_ID_PATTERN, "") : "",
    };

    // Check for child modules
    const childrenContainer = element.querySelector("ul");
    if (childrenContainer) {
        const childModules = Array.from(childrenContainer.children)
            .filter((child) => child.tagName === "LI")
            .map((child) => extractModuleInfo(child));

        // Add child modules to the module if any are found
        if (childModules.length > 0) {
            module.children = childModules;
        }
    }

    return module;
}

/**
 * Extract additional modules (Overview, Bookmarks, and Course Schedule) from the document
 */
function getAdditionalModules(doc: Document): IModule[] {
    // Get the plugin tree element
    const additionalModuleTree = doc.querySelector(SELECTORS.MODULE.PLUGIN_TREE);

    // Extract the list items from the plugin tree
    const additionalModules = Array.from(additionalModuleTree?.children ?? [])
        .filter((child) => child.tagName === "LI")
        .map((child) => extractModuleInfo(child));

    return additionalModules;
}

// function getRootModules(doc: Document): IModule[] {
//     const moduleTree = doc.querySelector(SELECTORS.MODULE.TREE);

//     const rootModules = Array.from(moduleTree?.children ?? [])
//         .filter((child) => child.tagName === "LI")
//         .map((child) => extractModuleInfo(child));

//     return rootModules;
// }

export async function getCourseModules(courseId: string): Promise<IModule[]> {
    const html = await fetch(buildCourseModuleUrl(courseId)).then(
        (res) => res.text()
    );
    const doc = htmlToDocument(html);

    const additionalModules = getAdditionalModules(doc);
    let rootModules: IModule[] = [];

    // We only want the overview module (at least for now, I don't see how others are useful)
    const filteredAdditionalModules = additionalModules.filter((m) => m.name === "Overview");

    const unstableContent = await getUnstableCourseContent(courseId);

    const unstableModuleToIModule = (um: UnstableModule): IModule => {
        return {
            name: um.Title,
            description: {
                text: um.Description.Text,
                html: um.Description.Html,
            },
            hasTopics: um.Topics?.length > 0,
            moduleId: um.ModuleId.toString(),
            children: um.Modules.map(unstableModuleToIModule),
        };
    };

    rootModules = unstableContent.Modules.map(unstableModuleToIModule);

    return [...filteredAdditionalModules, ...rootModules];
}
