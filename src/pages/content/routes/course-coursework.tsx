import { For, Show, Suspense } from "solid-js";
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

const CourseCoursework = () => {
    const params = useParams<{ courseId: string }>();
    const quizzes = createAsync(() => getQuizzes(params.courseId));

    return (
        <Show when={params.courseId} fallback={<div>Course ID not found</div>}>
            <PageWrapper
                title="Coursework"
                allowBack={true}
                centerElement={<CourseTabs courseId={params.courseId} value="coursework" />}
            >
                <p>Course ID: {params.courseId}</p>
                <Suspense fallback={<QuizListSkeleton />}>
                    <QuizList quizzes={quizzes()} />
                </Suspense>
            </PageWrapper>
        </Show>
    );
};

const QuizList = (props: { quizzes?: IQuizInfo[] }) => (
    <div class="space-y-4">
        <For each={props.quizzes}>{(quiz) => <QuizListItem quiz={quiz} />}</For>
    </div>
);

const QuizListItem = (props: { quiz: IQuizInfo }) => {
    const submissions = createAsync(() => {
        if (props.quiz.submissionsUrl) {
            return getQuizSubmissionsFromUrl(props.quiz.submissionsUrl);
        }
        return Promise.resolve([] as IQuizSubmission[]);
    });

    return (
        <Suspense fallback={<QuizItemSkeleton />}>
            <QuizItem quiz={props.quiz} submissions={submissions()} />
        </Suspense>
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
