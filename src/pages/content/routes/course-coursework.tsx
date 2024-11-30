import AssignmentItem from "@/components/assignment-item";
import ControlledSuspense from "@/components/controlled-suspense";
import CourseTabs from "@/components/course-tabs";
import PageWrapper from "@/components/page-wrapper";
import QuizItem, { QuizItemSkeleton } from "@/components/quiz-item";
import { createAsyncCached } from "@/hooks/async-cached";
import { useCourseName } from "@/hooks/use-course-name";
import { getAssignments } from "@/services/BS/scraper/assignment";
import { getQuizzes } from "@/services/BS/scraper/quizzes";
import { useParams } from "@solidjs/router";
import { AlertCircle } from "lucide-solid";
import { For, Show } from "solid-js";

const CourseCoursework = () => {
    const params = useParams<{ courseId: string }>();
    const quizzes = createAsyncCached(() => getQuizzes(params.courseId), {
        keys: () => ["quizzes", params.courseId],
    });

    const assignments = createAsyncCached(() => getAssignments(params.courseId), {
        keys: () => ["assignments", params.courseId],
    });

    const courseWorkItems = () => {
        const items = [
            assignments()?.map((assignment) => ({
                dueDate: new Date(assignment.dueDate ?? ""),
                eln: <AssignmentItem assignment={assignment} courseId={params.courseId} />,
            })),
            quizzes()?.map((quiz) => ({
                dueDate: new Date(quiz.dueDate ?? ""),
                eln: <QuizItem quiz={quiz} courseId={params.courseId} />,
            })),
        ].flat();

        return items.toSorted((a, b) => (a?.dueDate.getTime() ?? 0) - (b?.dueDate.getTime() ?? 0));
    };

    const courseName = useCourseName(params.courseId, true);


    return (
        <>
            <Show
                when={params.courseId}
                fallback={
                    <div class="text-center text-muted-foreground py-8 flex flex-col items-center">
                        <AlertCircle class="w-12 h-12 mb-4 text-muted-foreground" />
                        <p>Invalid course ID; cannot find course.</p>
                    </div>
                }
            >
                <PageWrapper
                    title={courseName()}
                    allowBack={true}
                    centerElement={<CourseTabs courseId={params.courseId} value="coursework" />}
                >
                    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <ControlledSuspense
                            hasContent={!!quizzes() && !!assignments()}
                            fallback={<QuizListSkeleton />}
                        >
                            <For
                                each={courseWorkItems()}
                                fallback={
                                    <div class="text-center text-muted-foreground py-8 flex flex-col items-center col-span-2">
                                        <AlertCircle class="w-12 h-12 mb-4 text-muted-foreground" />
                                        <p>No coursework available</p>
                                    </div>
                                }
                            >
                                {(item, index) => item?.eln}
                            </For>
                        </ControlledSuspense>
                    </div>
                </PageWrapper>
            </Show>
        </>
    );
};

const QuizListSkeleton = () => (
    <div class="space-y-4">
        <QuizItemSkeleton />
        <QuizItemSkeleton />
        <QuizItemSkeleton />
    </div>
);

export default CourseCoursework;
