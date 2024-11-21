import { createSignal, Show } from "solid-js";
import { Loader2 } from "lucide-solid";
import { Button } from "~/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";
import { getEnrollments } from "@/services/BS/api/enrollment";
import { setAsyncCached } from "@/hooks/async-cached";
import { getCourseAnnouncements, getCourseModules, getQuizzes } from "@/services/BS/scraper";
import { getAssignments } from "@/services/BS/scraper/assignment";
import { getGrades } from "@/services/BS/scraper/grade";
import { Progress } from "./ui/progress";

const preloadContent = async (progressCallback?: (progress: number) => void) => {
    let progress = 0;

    const enrollments = await getEnrollments();
    setAsyncCached(["enrollments"], enrollments);

    progress += 0.05;
    progressCallback?.(progress);

    const promises = enrollments.map(async (course) => {
        const modules = await getCourseModules(course.id);
        setAsyncCached(["course-modules", course.id], modules);
        const announcements = await getCourseAnnouncements(course.id);
        setAsyncCached(["announcements", course.id], announcements);

        const assignments = await getAssignments(course.id);
        setAsyncCached(["assignments", course.id], assignments);
        const quizzes = await getQuizzes(course.id);
        setAsyncCached(["quizzes", course.id], quizzes);

        const grades = await getGrades(course.id);
        setAsyncCached(["grades", course.id], grades);

        progress += 0.95 / enrollments.length;
        progressCallback?.(progress);
    });

    await Promise.allSettled(promises);
};

interface GreetingModalProps {
    onClose: () => void;
}

export function GreetingModal(props: GreetingModalProps) {
    const [isOpen, setIsOpen] = createSignal(true);
    const [isLoading, setIsLoading] = createSignal(false);
    const [progress, setProgress] = createSignal(0);

    const handlePreload = async () => {
        setIsLoading(true);

        try {
            await preloadContent((p) => setProgress(p));
        } finally {
            setIsLoading(false);
            handleOpenChange(false);
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        setIsOpen(isOpen);
        if (!isOpen) props.onClose();
    };

    return (
        <Dialog open={isOpen()} onOpenChange={handleOpenChange}>
            <DialogContent class="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Welcome Darkspace!</DialogTitle>
                    <DialogDescription>
                        Would you like to preload all content? This will take a couple of minutes
                        but will improve your browsing experience.
                        <Show when={isLoading()}>
                            <Progress class="mt-4" value={progress()} maxValue={1} />
                        </Show>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>
                        No, thanks
                    </Button>
                    <Button onClick={handlePreload} disabled={isLoading()}>
                        <Show when={isLoading()} fallback="Yes, preload content">
                            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                            Preloading...
                        </Show>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
