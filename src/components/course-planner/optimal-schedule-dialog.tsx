import { createSignal, createMemo, For, Show, splitProps } from "solid-js";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput, TextFieldLabel } from "@/components/ui/text-field";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sparkles, Wand2, Check, ChevronsUpDown, X } from "lucide-solid";
import { ICourse } from "@/services/course-scraper/types";

interface OptimalScheduleDialogProps {
    onScheduleGenerated: (courses: ICourse[]) => void;
    availableCourses: ICourse[];
}

export function OptimalScheduleDialog(props: OptimalScheduleDialogProps) {
    const [open, setOpen] = createSignal(false);
    const [subjectCourseOpen, setSubjectCourseOpen] = createSignal(false);
    const [subjectOpen, setSubjectOpen] = createSignal(false);
    const [preferences, setPreferences] = createSignal({
        selectedSubjectCourses: [] as string[],
        selectedSubjects: [] as string[],
        minCredits: 0,
        maxCredits: 3,
        preferredGapLength: 30,
        avoidEarlyMorning: true,
        avoidLateEvening: true,
        earlyMorningTime: 9,
        lateEveningTime: 18,
        preferCompactSchedule: true,
    });

    // Get unique subject courses and subjects
    const subjectCourses = createMemo(() => {
        const subjectCourseSet = new Set(
            props.availableCourses.map((course) => course.subjectCourse)
        );
        return Array.from(subjectCourseSet).sort();
    });

    const subjects = createMemo(() => {
        const subjectSet = new Set(props.availableCourses.map((course) => course.subject));
        return Array.from(subjectSet).sort();
    });

    const generateOptimalSchedule = () => {
        const currentPrefs = preferences();

        // Filter courses based on preferences
        const filteredCourses = props.availableCourses.filter((course) => {
            if (course.seatsAvailable === 0) return false;

            // Check subject course selection
            if (
                currentPrefs.selectedSubjectCourses.length > 0 &&
                !currentPrefs.selectedSubjectCourses.includes(course.subjectCourse)
            ) {
                return false;
            }

            // Check subject selection (if no specific subject courses selected)
            if (
                currentPrefs.selectedSubjectCourses.length === 0 &&
                currentPrefs.selectedSubjects.length > 0 &&
                !currentPrefs.selectedSubjects.includes(course.subject)
            ) {
                return false;
            }

            // Check time preferences
            const meetingTime = course.meetingsFaculty[0]?.meetingTime;
            if (meetingTime && meetingTime.beginTime) {
                const startHour = Number.parseInt(meetingTime.beginTime.slice(0, 2));
                if (currentPrefs.avoidEarlyMorning && startHour < currentPrefs.earlyMorningTime)
                    return false;
                if (currentPrefs.avoidLateEvening && startHour >= currentPrefs.lateEveningTime)
                    return false;
            }

            return true;
        });

        // Sort by preference (higher credit courses first, then by availability)
        filteredCourses.sort((a, b) => {
            return b.creditHours - a.creditHours || b.seatsAvailable - a.seatsAvailable;
        });

        // Select courses to meet credit requirements
        const selectedCourses: ICourse[] = [];
        let totalCredits = 0;

        for (const course of filteredCourses) {
            if (totalCredits + course.creditHours <= currentPrefs.maxCredits) {
                // Check for time conflicts
                const hasConflict = selectedCourses.some((selectedCourse) => {
                    return checkTimeConflict(course, selectedCourse);
                });

                if (!hasConflict) {
                    selectedCourses.push(course);
                    totalCredits += course.creditHours;

                    if (totalCredits >= currentPrefs.minCredits) break;
                }
            }
        }

        props.onScheduleGenerated(selectedCourses);
        setOpen(false);
    };

    const checkTimeConflict = (course1: ICourse, course2: ICourse): boolean => {
        const meeting1 = course1.meetingsFaculty[0]?.meetingTime;
        const meeting2 = course2.meetingsFaculty[0]?.meetingTime;

        if (!meeting1 || !meeting2 || !meeting1.beginTime || !meeting2.beginTime) return false;

        // Check if they share any days
        const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];
        const sharedDays = days.some(
            (day) =>
                meeting1[day as keyof typeof meeting1] && meeting2[day as keyof typeof meeting2]
        );

        if (!sharedDays) return false;

        // Check time overlap
        const start1 = Number.parseInt(meeting1.beginTime.slice(0, 2));
        const end1 = Number.parseInt(meeting1.endTime?.slice(0, 2) || "0");
        const start2 = Number.parseInt(meeting2.beginTime.slice(0, 2));
        const end2 = Number.parseInt(meeting2.endTime?.slice(0, 2) || "0");

        return !(end1 <= start2 || end2 <= start1);
    };

    const toggleSubjectCourse = (subjectCourse: string) => {
        setPreferences((prev) => ({
            ...prev,
            selectedSubjectCourses: prev.selectedSubjectCourses.includes(subjectCourse)
                ? prev.selectedSubjectCourses.filter((s) => s !== subjectCourse)
                : [...prev.selectedSubjectCourses, subjectCourse],
        }));
    };

    const toggleSubject = (subject: string) => {
        setPreferences((prev) => ({
            ...prev,
            selectedSubjects: prev.selectedSubjects.includes(subject)
                ? prev.selectedSubjects.filter((s) => s !== subject)
                : [...prev.selectedSubjects, subject],
        }));
    };

    const removeSubjectCourse = (subjectCourse: string) => {
        setPreferences((prev) => ({
            ...prev,
            selectedSubjectCourses: prev.selectedSubjectCourses.filter((s) => s !== subjectCourse),
        }));
    };

    const removeSubject = (subject: string) => {
        setPreferences((prev) => ({
            ...prev,
            selectedSubjects: prev.selectedSubjects.filter((s) => s !== subject),
        }));
    };

    const updatePreference = (key: any, value: any) => {
        // const updatePreference = <K extends keyof typeof preferences>(key: K, value: any) => {
        setPreferences((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <Dialog open={open()} onOpenChange={setOpen}>
            <DialogTrigger
                as={Button}
                class="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-foreground"
            >
                <Sparkles class="h-4 w-4 mr-2" />
                Generate Optimal Schedule
            </DialogTrigger>
            <DialogContent class="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle class="flex items-center gap-2">
                        <Wand2 class="h-5 w-5" />
                        Generate Optimal Schedule
                    </DialogTitle>
                </DialogHeader>

                <div class="space-y-6">
                    {/* Subject Course Selection */}
                    <div class="space-y-3">
                        <Label>Specific Courses (Subject + Course Number)</Label>
                        <Popover open={subjectCourseOpen()} onOpenChange={setSubjectCourseOpen}>
                            <PopoverTrigger
                                as={Button}
                                variant="outline"
                                role="combobox"
                                aria-expanded={subjectCourseOpen()}
                                class="w-full justify-between bg-transparent"
                            >
                                Select specific courses...
                                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </PopoverTrigger>
                            <PopoverContent class="w-full p-0">
                                <Command>
                                    <CommandInput placeholder="Search courses..." />
                                    <CommandList>
                                        <CommandEmpty>No courses found.</CommandEmpty>
                                        <CommandGroup>
                                            <For each={subjectCourses()}>
                                                {(subjectCourse) => (
                                                    <CommandItem
                                                        value={subjectCourse}
                                                        onSelect={() =>
                                                            toggleSubjectCourse(subjectCourse)
                                                        }
                                                    >
                                                        <Check
                                                            class={`mr-2 h-4 w-4 ${
                                                                preferences().selectedSubjectCourses.includes(
                                                                    subjectCourse
                                                                )
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            }`}
                                                        />
                                                        {subjectCourse}
                                                    </CommandItem>
                                                )}
                                            </For>
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        {/* Selected Subject Courses */}
                        <Show when={preferences().selectedSubjectCourses.length > 0}>
                            <div class="flex flex-wrap gap-2">
                                <For each={preferences().selectedSubjectCourses}>
                                    {(subjectCourse) => (
                                        <Badge variant="secondary" class="flex items-center gap-1">
                                            {subjectCourse}
                                            <X
                                                class="h-3 w-3 cursor-pointer"
                                                onClick={() => removeSubjectCourse(subjectCourse)}
                                            />
                                        </Badge>
                                    )}
                                </For>
                            </div>
                        </Show>
                    </div>

                    {/* Subject Selection (fallback) */}
                    <div class="space-y-3">
                        <Label>Or Select by Subject Area</Label>
                        <Popover open={subjectOpen()} onOpenChange={setSubjectOpen}>
                            <PopoverTrigger
                                as={Button}
                                variant="outline"
                                role="combobox"
                                aria-expanded={subjectOpen()}
                                class="w-full justify-between bg-transparent"
                            >
                                Select subjects...
                                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </PopoverTrigger>
                            <PopoverContent class="w-full p-0">
                                <Command>
                                    <CommandInput placeholder="Search subjects..." />
                                    <CommandList>
                                        <CommandEmpty>No subjects found.</CommandEmpty>
                                        <CommandGroup>
                                            <For each={subjects()}>
                                                {(subject) => (
                                                    <CommandItem
                                                        value={subject}
                                                        onSelect={() => toggleSubject(subject)}
                                                    >
                                                        <Check
                                                            class={`mr-2 h-4 w-4 ${
                                                                preferences().selectedSubjects.includes(
                                                                    subject
                                                                )
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            }`}
                                                        />
                                                        {subject}
                                                    </CommandItem>
                                                )}
                                            </For>
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        {/* Selected Subjects */}
                        <Show when={preferences().selectedSubjects.length > 0}>
                            <div class="flex flex-wrap gap-2">
                                <For each={preferences().selectedSubjects}>
                                    {(subject) => (
                                        <Badge variant="secondary" class="flex items-center gap-1">
                                            {subject}
                                            <X
                                                class="h-3 w-3 cursor-pointer"
                                                onClick={() => removeSubject(subject)}
                                            />
                                        </Badge>
                                    )}
                                </For>
                            </div>
                        </Show>
                    </div>

                    {/* Credit Requirements */}
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <TextField>
                                <TextFieldLabel>Min Credits</TextFieldLabel>
                                <TextFieldInput
                                    type="number"
                                    value={preferences().minCredits}
                                    onInput={(e) =>
                                        updatePreference(
                                            "minCredits",
                                            Number.parseInt(e.currentTarget.value) || 0
                                        )
                                    }
                                />
                            </TextField>
                        </div>
                        <div class="space-y-2">
                            <TextField>
                                <TextFieldLabel>Max Credits</TextFieldLabel>
                                <TextFieldInput
                                    type="number"
                                    value={preferences().maxCredits}
                                    onInput={(e) =>
                                        updatePreference(
                                            "maxCredits",
                                            Number.parseInt(e.currentTarget.value) || 0
                                        )
                                    }
                                />
                            </TextField>
                        </div>
                    </div>

                    {/* Time Preferences */}
                    <div class="space-y-4">
                        <div class="flex items-center space-x-2">
                            <Checkbox
                                id="earlyMorning"
                                checked={preferences().avoidEarlyMorning}
                                onChange={(checked) =>
                                    updatePreference("avoidEarlyMorning", !!checked)
                                }
                            />
                            <Label for="earlyMorning" class="text-sm flex-1">
                                Avoid early morning classes (before 9:00AM)
                                {/* TODO: make this configurable */}
                            </Label>
                        </div>

                        <div class="flex items-center space-x-2">
                            <Checkbox
                                id="lateEvening"
                                checked={preferences().avoidLateEvening}
                                onChange={(checked) =>
                                    updatePreference("avoidLateEvening", !!checked)
                                }
                            />
                            <Label for="lateEvening" class="text-sm flex-1">
                                Avoid late evening classes (after 6:00PM)
                                {/* TODO: make this configurable */}
                            </Label>
                        </div>

                        <div class="flex items-center space-x-2">
                            <Checkbox
                                id="compact"
                                checked={preferences().preferCompactSchedule}
                                onChange={(checked) =>
                                    updatePreference("preferCompactSchedule", !!checked)
                                }
                            />
                            <label for="compact" class="text-sm">
                                Prefer compact schedule
                            </label>
                        </div>
                    </div>

                    <Button onClick={generateOptimalSchedule} class="w-full">
                        <Sparkles class="h-4 w-4 mr-2" />
                        Generate Schedule
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
