import { createSignal, For, onMount } from "solid-js";
import { cn } from "~/lib/utils";
import { Button, buttonVariants } from "~/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Plus, Book, Github } from "lucide-solid";
import { useUVicCoursePlannerTerms } from "@/hooks/course-planner/use-course-planner-terms";
import { useUVicCourseSchedules } from "@/hooks/course-planner/use-course-schedules";
import { ulid } from "ulid";
import { A, useNavigate, useParams } from "@solidjs/router";
import { ICalendarTerm } from "@/services/calendar-term/calendar-terms-service";

export default function AppSidebar() {
    const params = useParams();
    const navigate = useNavigate();
    const { terms, activeTerm, setActiveTerm } = useUVicCoursePlannerTerms(new Date(), 3, 12);

    const { courseSchedules, setCourseSchedules, activeSchedule, setActiveSchedule } =
        useUVicCourseSchedules();

    const addSchedule = () => {
        const newSchedule = {
            name: `${activeTerm()?.name} Schedule`,
            id: ulid(),
            createdAt: new Date().toISOString(),
            courses: [],
        };
        setCourseSchedules([...courseSchedules(), newSchedule]);
    };

    onMount(() => {
        if (params.term) setActiveTerm(terms().find((t) => t.id === params.term));
    });

    const setActiveTermAndUrl = (term: ICalendarTerm | undefined) => {
        if (!term) return;

        setActiveTerm(terms().find((t) => t.id === term.id));
        navigate(`/${term.id}/`);
    };

    return (
        <aside
            class={cn(
                "flex h-screen w-64 flex-col border-r border-border bg-background p-4 space-y-4 text-foreground"
            )}
        >
            {/* App header with term selection */}
            <div>
                <h1 class="text-xl font-bold">Course Planner</h1>
                <Select
                    value={activeTerm()?.id}
                    onChange={(id) => setActiveTermAndUrl(terms().find((t) => t.id === id))}
                    options={terms().map((t) => t.id)}
                    placeholder="Select Term"
                    itemComponent={(props) => (
                        <SelectItem item={props.item}>
                            {terms().find((t) => t.id === props.item.rawValue)?.name}
                        </SelectItem>
                    )}
                >
                    <SelectTrigger aria-label="Term" class="mt-2 w-full">
                        <SelectValue<string>>
                            {(state) => terms().find((t) => t.id === state.selectedOption())?.name}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent />
                </Select>
            </div>

            {/* Schedules Section */}
            <div class="flex-1">
                <div class="flex items-center justify-between mb-2">
                    <h2 class="text-sm font-medium text-muted-foreground uppercase">Schedules</h2>
                    <Button size="icon" variant="ghost" onClick={addSchedule}>
                        <Plus class="h-4 w-4" />
                    </Button>
                </div>
                <ul class="space-y-1">
                    <For each={courseSchedules()}>
                        {(schedule) => (
                            <li>
                                <A
                                    onClick={() => setActiveSchedule(schedule.id)}
                                    class={buttonVariants({
                                        variant: "ghost",
                                        class: cn(
                                            "w-full justify-start text-left hover:bg-accent hover:text-accent-foreground"
                                        ),
                                    })}
                                    activeClass="bg-muted text-muted-foreground"
                                    href={`/${activeTerm()?.id}/${schedule.id}`}
                                >
                                    {schedule.name}
                                </A>
                            </li>
                        )}
                    </For>
                </ul>
            </div>

            {/* Course info pages */}
            <div>
                <h2 class="text-sm font-medium text-muted-foreground uppercase mb-2">
                    Course Data
                </h2>
                <Button
                    variant="ghost"
                    class="w-full justify-start hover:bg-accent hover:text-accent-foreground"
                >
                    <Book class="mr-2 h-4 w-4" /> Cached Courses
                </Button>
            </div>

            {/* Footer */}
            <div class="mt-auto pt-4 border-t border-border">
                <a
                    href="https://github.com/yourrepo"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <Github class="h-4 w-4" />
                    <span>v1.0.0</span>
                </a>
            </div>
        </aside>
    );
}
