export interface IModule {
    name: string;
    moduleId: string;
    children?: IModule[];
}

export async function getCourseModules(courseId: string): Promise<IModule[]> {
    const html = await fetch(`https://bright.uvic.ca/d2l/le/content/${courseId}/Home`).then((res) =>
        res.text()
    );
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const moduleTree = doc.querySelector("#D2L_LE_Content_TreeBrowser");

    // Add Overview, Bookmarks, and Course Schedule modules
    const additionalModuleTree = doc.querySelector("#ContentPluginTree");

    function extractModuleInfo(element: Element): IModule {
        const idElement = element.querySelector('[id^="TreeItem"]');

        const module: IModule = {
            name: idElement?.querySelector("div")?.textContent || "",
            moduleId: idElement ? idElement.id.replace("TreeItem", "") : "",
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

    const rootModules = Array.from(moduleTree?.children ?? [])
        .filter((child) => child.tagName === "LI")
        .map((child) => extractModuleInfo(child));

    const additionalModules = Array.from(additionalModuleTree?.children ?? [])
        .filter((child) => child.tagName === "LI")
        .map((child) => extractModuleInfo(child));

    return [...additionalModules, ...rootModules];
}
