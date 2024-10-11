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
import QuizItem from "@/components/ui/quiz-item";

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
                <Suspense fallback={<div>Loading quizzes...</div>}>
                    <QuizList quizzes={quizzes()} />
                </Suspense>
            </PageWrapper>
        </Show>
    );
};

const QuizList = (props: { quizzes?: IQuizInfo[] }) => (
    <For each={props.quizzes}>{(quiz) => <QuizInfoItem quiz={quiz} />}</For>
);

const QuizInfoItem = (props: { quiz: IQuizInfo }) => {
    const submissions = createAsync(() => {
        if (props.quiz.submissionsUrl) {
            return getQuizSubmissionsFromUrl(props.quiz.submissionsUrl);
        }
        return Promise.resolve([] as IQuizSubmission[]);
    });

    return (
        <Suspense fallback={<div>Loading quiz info...</div>}>
            <QuizItem quiz={props.quiz} submissions={submissions()} />
        </Suspense>
    );
};

export default CourseCoursework;
