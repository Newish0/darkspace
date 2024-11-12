import { createEffect, For, Show, Suspense } from "solid-js";
import { useParams, createAsync } from "@solidjs/router";
import {
    getQuizzes,
    getQuizSubmissionsFromUrl,
    IQuizInfo,
    IQuizSubmission,
} from "@/services/BS/scraper";
import PageWrapper from "@/components/ui/page-wrapper";
import CourseTabs from "@/components/course-tabs";
import QuizItem from "@/components/quiz-item";
import { QuizItemSkeleton } from "@/components/quiz-item";
import ControlledSuspense from "@/components/controlled-suspense";
import { createAsyncCached } from "@/hooks/async-cached";
import { getAssignments } from "@/services/BS/scraper/assignment";
import AssignmentItem from "@/components/assignment-item";

const CourseCoursework = () => {
    const params = useParams<{ courseId: string }>();
    const quizzes = createAsyncCached(() => getQuizzes(params.courseId), {
        keys: () => ["quizzes", params.courseId],
    });

    const assignments = createAsyncCached(() => getAssignments(params.courseId), {
        keys: () => ["assignments", params.courseId],
    });

    createEffect(() => {
        console.log("assignments", assignments());
    });

    const courseWorkItems = () => {
        const items = [
            assignments()?.map((assignment) => ({
                dueDate: assignment.dueDate,
                eln: <AssignmentItem assignment={assignment} />,
            })),
            quizzes()?.map((quiz) => ({
                dueDate: quiz.dueDate,
                eln: <QuizListItem quiz={quiz} />,
            })),
        ].flat();

        return items.toSorted((a, b) => `${b?.dueDate}`.localeCompare(`${a?.dueDate}`));
    };

    return (
        <Show when={params.courseId} fallback={<div>Course ID not found</div>}>
            <PageWrapper
                title="Coursework"
                allowBack={true}
                centerElement={<CourseTabs courseId={params.courseId} value="coursework" />}
            >
                <div class="space-y-4">
                    <ControlledSuspense
                        hasContent={!!quizzes() && !!assignments()}
                        fallback={<QuizListSkeleton />}
                    >
                        <For each={courseWorkItems()}>{(item) => item?.eln}</For>
                    </ControlledSuspense>
                </div>
            </PageWrapper>
        </Show>
    );
};

const QuizListItem = (props: { quiz: IQuizInfo }) => {
    const submissions = createAsync(() => {
        if (props.quiz.submissionsUrl) {
            return getQuizSubmissionsFromUrl(props.quiz.submissionsUrl);
        }
        return Promise.resolve([] as IQuizSubmission[]);
    }); // don't cache

    return (
        <ControlledSuspense hasContent={!!submissions()} fallback={<QuizItemSkeleton />}>
            <QuizItem quiz={props.quiz} submissions={submissions()} />
        </ControlledSuspense>
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
