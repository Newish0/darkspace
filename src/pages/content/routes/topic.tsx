import { getAsyncCached, setAsyncCached } from "@/hooks/async-cached";
import {
    CourseContent,
    getUnstableCourseContent,
    UnstableModule,
} from "@/services/BS/api/unstable-module";
import { D2L_URL_PATTERNS } from "@/services/BS/url";
import { useNavigate, useParams } from "@solidjs/router";
import { createEffect } from "solid-js";

/**
 * The topic route asynchronously loads the module ID required by the Darkspace topic route,
 * given a course ID and topic ID, then redirects with the Darkspace topic route.
 */
const Topic = () => {
    const params = useParams();
    const navigate = useNavigate();

    createEffect(async () => {
        async function getModuleId(courseId: string, topicId: string): Promise<number | null> {
            // Try cache first then fetch and cache
            let toc = await getAsyncCached<CourseContent>(["toc", courseId]);
            if (!toc) toc = await getUnstableCourseContent(courseId);
            if (toc) setAsyncCached(["toc", courseId], toc);

            const recursiveFindModule = (module: UnstableModule): number | null => {
                // Check if the current module contains the topic
                if (module.Topics.some((topic) => topic.TopicId.toString() === topicId)) {
                    return module.ModuleId;
                }

                // Search through all nested modules
                for (const nextModule of module.Modules) {
                    const result = recursiveFindModule(nextModule);
                    if (result !== null) {
                        return result;
                    }
                }

                return null;
            };

            // Search through all top-level modules
            for (const module of toc.Modules) {
                const result = recursiveFindModule(module);
                if (result !== null) {
                    return result;
                }
            }

            return null;
        }

        if (!params.courseId || !params.topicId) {
            return navigate("/404");
        }

        const moduleId = await getModuleId(params.courseId, params.topicId);

        if (moduleId === null) {
            return navigate("/404");
        }

        const dsPath = D2L_URL_PATTERNS.topic.buildPath({
            ...params,
            moduleId: moduleId.toString(),
        });

        navigate(dsPath);
    });

    return null;
};

export default Topic;
