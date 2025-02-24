import { htmlToString } from "@/utils/string";
import { UnstableModule } from "./BS/api/unstable-module";
import { CachedContent } from "./content-service";

export type Doc4Index = {
    id: number;
    name: string;
    description: string;
    dsUrl: string;
    contentUrl?: string;
    date: string;
    type: "module" | "topic" | "assignment" | "quiz" | "grade" | "announcement";
};

export async function getDocsFromCachedContent(contents: CachedContent[]) {
    const docs: Doc4Index[] = [];

    let idCount = 0;

    const indexModuleRecursive = (module: UnstableModule, courseId: string, path: string) => {
        docs.push({
            id: idCount++,
            name: module.Title,
            description: `${path} ⋅ ${module.Title}`,
            dsUrl: `/courses/${courseId}/m/${module.ModuleId}?description=1`,
            date: new Date().toString(),
            type: "module",
        });

        for (const topic of module.Topics) {
            docs.push({
                id: idCount++,
                name: topic.Title,
                description: `${path} ⋅ ${module.Title} ⋅ ${topic.Title}`,
                dsUrl: `/courses/${courseId}/m/${module.ModuleId}?topic=${topic.TopicId}`,
                contentUrl: topic.Url,
                date: new Date().toString(),
                type: "topic",
            });
        }

        if (module.Modules) {
            for (const child of module.Modules) {
                indexModuleRecursive(child, courseId, `${path}/${module.Title}`);
            }
        }
    };

    for (const content of contents) {
        for (const module of content.toc?.Modules || []) {
            indexModuleRecursive(module, content.course.id, content.course.name);
        }

        for (const assignment of content.assignments || []) {
            docs.push({
                id: idCount++,
                name: assignment.name,
                description: `${content.course.name} ⋅ ${assignment.name}`,
                dsUrl: `/courses/${content.course.id}/coursework?cw=${assignment.id}`,
                date: new Date().toString(),
                type: "assignment",
            });
        }

        for (const quiz of content.quizzes || []) {
            docs.push({
                id: idCount++,
                name: quiz.name,
                description: `${content.course.name} ⋅ ${quiz.name}`,
                dsUrl: `/courses/${content.course.id}/coursework?cw=${quiz.id}`,
                date: new Date().toString(),
                type: "quiz",
            });
        }

        for (const announcement of content.announcements || []) {
            docs.push({
                id: idCount++,
                name: content.course.name + ": " + (announcement.Title || "Unknown Announcement"),
                description: htmlToString(announcement.Body.Html || announcement.Body.Text || ""),
                dsUrl: `/courses/${content.course.id}`,
                date: announcement.CreatedDate || new Date().toString(),
                type: "announcement",
            });
        }

        for (const cate of content.grades?.categories ?? []) {
            docs.push({
                id: idCount++,
                name: cate.name,
                description: `${content.course.name} ⋅ ${cate.name}`,
                dsUrl: `/courses/${content.course.id}/grades`,
                date: new Date().toString(),
                type: "grade",
            });

            for (const item of cate.items) {
                docs.push({
                    id: idCount++,
                    name: item.name,
                    description: `${content.course.name} ⋅ ${cate.name} ⋅ ${item.name}`,
                    dsUrl: `/courses/${content.course.id}/grades`,
                    date: new Date().toString(),
                    type: "grade",
                });
            }
        }
    }

    return docs;
}
