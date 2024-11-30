import ControlledSuspense from "@/components/controlled-suspense";
import CourseHome from "@/components/course-home";
import ModuleContentList from "@/components/module-content-list";
import UnsafeHtml from "@/components/unsafe-html";
import { createAsyncCached } from "@/hooks/async-cached";
import { getModuleContent } from "@/services/BS/scraper/module-content";
import { useParams, useSearchParams } from "@solidjs/router";
import { createEffect, Match, Show, Switch } from "solid-js";

const Module = () => {
    const params = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const moduleContent = createAsyncCached(
        () => getModuleContent(params.courseId, params.moduleId),
        {
            keys: () => ["moduleContent", params.courseId, params.moduleId],
        }
    );

    return (
        <Show when={params.courseId} keyed fallback={<div>Course ID not found</div>}>
            <CourseHome courseId={params.courseId}>
                <ControlledSuspense hasContent={!!moduleContent()} fallback={<div>Loading...</div>}>
                    <h2 class="text-xl font-bold border-b px-4 py-2 flex justify-between items-center">
                        {moduleContent()?.name}

                        {/* <Show when={moduleContent()?.content.length}>
                            <Badge variant={"default"}>{moduleContent()?.content.length} Topics</Badge>
                        </Show> */}
                    </h2>

                    <div class="overflow-auto px-4 py-2 space-y-4">
                        <div class="markdown">
                            <Switch>
                                <Match when={moduleContent()?.description?.html}>
                                    <UnsafeHtml
                                        unsafeHtml={moduleContent()!.description!.html!}
                                        config={{
                                            ADD_TAGS: ["iframe"],
                                            ADD_ATTR: [
                                                "allow",
                                                "allowfullscreen",
                                                "frameborder",
                                                "scrolling",
                                            ],
                                        }}
                                    />
                                </Match>
                                <Match when={moduleContent()?.description?.text}>
                                    <p>{moduleContent()!.description!.text!}</p>
                                </Match>
                            </Switch>
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
                            />
                        </div>
                    </div>
                </ControlledSuspense>
            </CourseHome>
        </Show>
    );
};

export default Module;
