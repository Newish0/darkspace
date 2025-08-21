import { createSignal, For } from "solid-js";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Plus, Book, Github } from "lucide-solid";

export default function AppSidebar() {
    const [terms] = createSignal(["Fall 2025", "Spring 2025", "Summer 2025"]);
    const [activeTerm, setActiveTerm] = createSignal("Fall 2025");

    const [schedules, setSchedules] = createSignal([
        { id: 1, name: "My Main Schedule" },
        { id: 2, name: "Backup Schedule" },
    ]);
    const [activeSchedule, setActiveSchedule] = createSignal(1);

    const addSchedule = () => {
        const newId = schedules().length + 1;
        setSchedules([...schedules(), { id: newId, name: `Schedule ${newId}` }]);
        setActiveSchedule(newId);
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
                    value={activeTerm()}
                    onChange={setActiveTerm}
                    options={terms()}
                    placeholder="Select Term"
                    itemComponent={(props) => (
                        <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
                    )}
                >
                    <SelectTrigger aria-label="Term" class="mt-2 w-full">
                        <SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
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
                    <For each={schedules()}>
                        {(schedule) => (
                            <li>
                                <Button
                                    variant="ghost"
                                    onClick={() => setActiveSchedule(schedule.id)}
                                    class={cn(
                                        "w-full justify-start text-left hover:bg-accent hover:text-accent-foreground",
                                        activeSchedule() === schedule.id &&
                                            "bg-accent text-accent-foreground"
                                    )}
                                >
                                    {schedule.name}
                                </Button>
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
