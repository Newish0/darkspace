import { CourseDetailsModal } from "@/components/course-planner/course-details-modal";
import { OptimalScheduleDialog } from "@/components/course-planner/optimal-schedule-dialog";
import { SchedulePreview } from "@/components/course-planner/schedule-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { cn } from "@/lib/utils";
import { ICourse, IMeetingTime } from "@/services/course-scraper/types";
import { createVirtualizer } from "@tanstack/solid-virtual";
import { Calendar, Clock, Filter, Info, MapPin, Minus, Plus, Search, Users } from "lucide-solid";
import {
    ComponentProps,
    createEffect,
    createMemo,
    createSignal,
    For,
    Match,
    Show,
    Switch,
} from "solid-js";
import { Label } from "../ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useUVicCourseSchedule } from "@/hooks/course-planner/use-course-schedules";
import TimeSlider from "../ui/time-slider";

const sortOptions = [
    { name: "Course Title", value: "courseTitle" },
    { name: "Subject", value: "subject" },
    { name: "Credit Hours", value: "creditHours" },
    { name: "Seats Available", value: "seatsAvailable" },
] as const;

export function CourseScheduler(props: { courses: ICourse[]; scheduleId: string }) {
    const [searchTerm, setSearchTerm] = createSignal("");
    const [selectedSubject, setSelectedSubject] = createSignal<string>("all");
    const [selectedScheduleType, setSelectedScheduleType] = createSignal<string>("all");
    const [selectedCreditHours, setSelectedCreditHours] = createSignal<"all" | number>("all");
    const [selectedInstructionMethod, setSelectedInstructionMethod] = createSignal<string>("all");
    const [sortBy, setSortBy] = createSignal<(typeof sortOptions)[number]["value"]>("courseTitle");
    const [selectedTimeRange, setSelectedTimeRange] = createSignal<[number, number]>([510, 1080]); // default range: 8:30 - 18:00
    const { schedule, setSchedule } = useUVicCourseSchedule(props.scheduleId);
    const [previewCourses, setPreviewCourses] = createSignal<ICourse[]>([]);
    const [showOnlyAvailable, setShowOnlyAvailable] = createSignal(false);

    const selectedCourses = createMemo(() => (schedule() ? [...schedule()!.courses] : []));
    const setSelectedCourses = (courses: ICourse[]) => {
        const s = schedule();
        if (!s) return;
        setSchedule({ ...s, courses });
    };

    // Get unique subjects for filter
    const subjects = createMemo(() => {
        const subjectSet = new Set(props.courses.map((course) => course.subject));
        return Array.from(subjectSet).sort();
    });

    // Get unique schedule type for filter
    const scheduleTypes = createMemo(() => {
        const typeSet = new Set(props.courses.map((course) => course.scheduleTypeDescription));
        return Array.from(typeSet).sort();
    });

    // Get unique instruction methods for filter
    const instructionMethods = createMemo(() => {
        const methodSet = new Set(
            props.courses.map((course) => course.instructionalMethodDescription)
        );
        return Array.from(methodSet).sort();
    });

    const courseCredits = createMemo(() => {
        const creditSet = new Set(props.courses.map((course) => course.creditHours));
        return Array.from(creditSet).sort();
    });

    // Filter and sort courses
    const filteredCourses = createMemo(() => {
        const courses = [...props.courses];

        const filtered = courses
            .filter((course) => {
                const search = searchTerm().toLowerCase();
                const matchesSearch =
                    course.courseTitle.toLowerCase().includes(search) ||
                    course.subject.toLowerCase().includes(search) ||
                    course.courseNumber.toLowerCase().includes(search) ||
                    course.subjectCourse.toLowerCase().includes(search);

                const matchesSubject =
                    selectedSubject() === "all" || course.subject === selectedSubject();
                const matchScheduleType =
                    selectedScheduleType() === "all" ||
                    course.scheduleTypeDescription === selectedScheduleType();
                const matchesCreditHours =
                    selectedCreditHours() === "all" ||
                    course.creditHours?.toString() == selectedCreditHours();
                const matchesInstructionMethod =
                    selectedInstructionMethod() === "all" ||
                    course.instructionalMethodDescription === selectedInstructionMethod();
                const matchesAvailability = !showOnlyAvailable() || course.seatsAvailable > 0;

                const matchesTimeRange = course.meetingsFaculty.some((meeting) => {
                    const startTimeHour = Number.parseInt(
                        meeting.meetingTime.beginTime?.slice(0, 2)
                    );
                    const endTimeHour = Number.parseInt(meeting.meetingTime.endTime?.slice(0, 2));
                    const startTimeMinutes = Number.parseInt(
                        meeting.meetingTime.beginTime?.slice(3, 5)
                    );
                    const endTimeMinutes = Number.parseInt(
                        meeting.meetingTime.endTime?.slice(3, 5)
                    );
                    return (
                        startTimeHour * 60 + startTimeMinutes >= selectedTimeRange()[0] &&
                        endTimeHour * 60 + endTimeMinutes <= selectedTimeRange()[1]
                    );
                });

                return (
                    matchesSearch &&
                    matchScheduleType &&
                    matchesSubject &&
                    matchesCreditHours &&
                    matchesInstructionMethod &&
                    matchesAvailability &&
                    matchesTimeRange
                );
            })
            .toSorted((a, b) => {
                switch (sortBy()) {
                    case "courseTitle":
                        return a.courseTitle.localeCompare(b.courseTitle);
                    case "subject":
                        return a.subject.localeCompare(b.subject);
                    case "creditHours":
                        return (b.creditHours ?? 0) - (a.creditHours ?? 0);
                    case "seatsAvailable":
                        return b.seatsAvailable - a.seatsAvailable;
                    default:
                        return 0;
                }
            });

        return filtered;
    });

    const addCourse = (course: ICourse) => {
        if (
            !selectedCourses().find((c) => c.courseReferenceNumber === course.courseReferenceNumber)
        ) {
            setSelectedCourses([...selectedCourses(), course]);
        }
    };

    const removeCourse = (courseReferenceNumber: string) => {
        setSelectedCourses(
            selectedCourses().filter((c) => c.courseReferenceNumber !== courseReferenceNumber)
        );
    };

    const addPreviewCourse = (course: ICourse) => {
        if (
            !previewCourses().find((c) => c.courseReferenceNumber === course.courseReferenceNumber)
        ) {
            setPreviewCourses([...previewCourses(), course]);
        }
    };

    const removePreviewCourse = (courseReferenceNumber: string) => {
        setPreviewCourses(
            previewCourses().filter((c) => c.courseReferenceNumber !== courseReferenceNumber)
        );
    };

    const totalCredits = createMemo(() =>
        selectedCourses().reduce((sum, course) => sum + (course.creditHours ?? 0), 0)
    );

    return (
        <div class="grid grid-cols-1 lg:grid-cols-3 grid-rows-4 gap-6 h-full">
            {/* Search and Filter Panel */}
            <Card class="lg:col-span-2 row-span-1">
                <CardHeader>
                    <CardTitle class="flex items-center gap-2">
                        <Search class="h-5 w-5" />
                        Search & Filter Courses
                    </CardTitle>
                </CardHeader>
                <CardContent class="space-y-4">
                    {/* Search Input */}
                    <div class="relative">
                        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <TextField>
                            <TextFieldInput
                                type="text"
                                placeholder="Search by course title, subject, or number..."
                                value={searchTerm()}
                                onInput={(e) => setSearchTerm(e.currentTarget.value)}
                                class="pl-10"
                            />
                        </TextField>
                    </div>

                    {/* Filters Row */}
                    <div class="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        <Select
                            multiple={false}
                            value={selectedSubject()}
                            onChange={setSelectedSubject}
                            options={["all", ...subjects()]}
                            itemComponent={(props) => (
                                <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
                            )}
                            placeholder="Subject"
                        >
                            <SelectTrigger>
                                <SelectValue<string>>
                                    {(state) => state.selectedOption()}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent class="max-h-64 overflow-auto" />
                        </Select>

                        <Select
                            multiple={false}
                            value={selectedScheduleType()}
                            onChange={setSelectedScheduleType}
                            options={["all", ...scheduleTypes()]}
                            itemComponent={(props) => (
                                <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
                            )}
                            placeholder="Schedule Type"
                        >
                            <SelectTrigger>
                                <SelectValue<string>>
                                    {(state) => state.selectedOption()}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent class="max-h-64 overflow-auto" />
                        </Select>

                        <Select
                            value={selectedCreditHours()}
                            onChange={setSelectedCreditHours}
                            placeholder="Credit Hours"
                            options={["all", ...courseCredits()]}
                            itemComponent={(props) => (
                                <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
                            )}
                        >
                            <SelectTrigger>
                                <SelectValue<string>>
                                    {(state) => state.selectedOption()}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent class="max-h-64 overflow-auto" />
                        </Select>

                        <Select
                            value={selectedInstructionMethod()}
                            onChange={setSelectedInstructionMethod}
                            placeholder="Instruction Method"
                            options={["all", ...instructionMethods()]}
                            itemComponent={(props) => (
                                <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
                            )}
                        >
                            <SelectTrigger>
                                <SelectValue<string>>
                                    {(state) => state.selectedOption()}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent class="max-h-64 overflow-auto" />
                        </Select>

                        <Select
                            value={sortBy()}
                            onChange={setSortBy}
                            placeholder="Sort by"
                            options={sortOptions.map((option) => option.value)}
                            itemComponent={(props) => (
                                <SelectItem item={props.item}>
                                    {sortOptions.find((o) => o.value === props.item.rawValue)?.name}
                                </SelectItem>
                            )}
                        >
                            <SelectTrigger>
                                <SelectValue<string>>
                                    {(state) =>
                                        sortOptions.find((o) => o.value === state.selectedOption())
                                            ?.name
                                    }
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent class="max-h-64 overflow-auto" />
                        </Select>

                        <div class="flex items-center space-x-2">
                            <Checkbox
                                id="available"
                                checked={showOnlyAvailable()}
                                onChange={setShowOnlyAvailable}
                            />
                            <Label for="available">Available only</Label>
                        </div>

                        <TimeSlider
                            timeRange={selectedTimeRange()}
                            onChange={setSelectedTimeRange}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Selected Courses in Schedule */}
            <Card class="lg:col-span-1 row-span-2">
                <CardHeader>
                    <CardTitle class="flex items-center gap-2">
                        <Calendar class="h-5 w-5" />
                        Selected Courses ({selectedCourses().length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between text-sm">
                            <span>Total Credits:</span>
                            <Badge variant="secondary">{totalCredits()}</Badge>
                        </div>
                        <Separator />
                        <ScrollArea class="h-32">
                            <Show
                                when={selectedCourses().length > 0}
                                fallback={
                                    <p class="text-sm text-muted-foreground text-center py-4">
                                        No courses selected
                                    </p>
                                }
                            >
                                <div class="space-y-2">
                                    <For each={selectedCourses()}>
                                        {(course) => (
                                            <div class="flex items-center justify-between p-2 bg-muted rounded-md">
                                                <div>
                                                    <p class="text-sm font-medium">
                                                        {course.subject} {course.courseNumber} -{" "}
                                                        {course.sequenceNumber}
                                                    </p>
                                                    <p class="text-xs text-muted-foreground">
                                                        {course.creditHours} credits
                                                    </p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        removeCourse(course.courseReferenceNumber)
                                                    }
                                                >
                                                    <Minus class="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )}
                                    </For>
                                </div>
                            </Show>
                        </ScrollArea>
                    </div>
                </CardContent>
            </Card>

            {/* Course List */}
            <Card class="lg:col-span-2 row-span-3 flex flex-col h-full">
                <CardHeader>
                    <CardTitle class="flex items-center justify-between">
                        <span class="flex items-center gap-2">
                            <Filter class="h-5 w-5" />
                            Courses ({filteredCourses().length})
                        </span>
                        <OptimalScheduleDialog
                            onScheduleGenerated={setSelectedCourses}
                            availableCourses={props.courses}
                        />
                    </CardTitle>
                </CardHeader>
                <CardContent class="flex-1 min-h-0">
                    <Show when={filteredCourses()} keyed>
                        <CourseScrollArea
                            courses={filteredCourses()}
                            onAdd={addCourse}
                            onRemove={(course) => removeCourse(course.courseReferenceNumber)}
                            selectedCourses={selectedCourses()}
                            onAddPreview={addPreviewCourse}
                            onRemovePreview={(course) =>
                                removePreviewCourse(course.courseReferenceNumber)
                            }
                        />
                    </Show>
                </CardContent>
            </Card>

            {/* Schedule Preview */}
            <SchedulePreview
                courses={[
                    ...selectedCourses(),
                    ...previewCourses().map((c) => ({ ...c, isPreview: true })),
                ]}
                class="row-span-2 overflow-auto"
            />
        </div>
    );
}

interface CourseScrollAreaProps {
    courses: ICourse[];
    selectedCourses: ICourse[];
    onAdd: (course: ICourse) => void;
    onRemove: (course: ICourse) => void;
    onAddPreview: (course: ICourse) => void;
    onRemovePreview: (course: ICourse) => void;
}

function CourseScrollArea(props: CourseScrollAreaProps) {
    let scrollContainer!: HTMLDivElement;
    const virtualizer = createVirtualizer({
        count: props.courses.length,
        estimateSize: () => 172,
        overscan: 5,
        getScrollElement: () => scrollContainer,
    });

    const items = virtualizer.getVirtualItems();

    return (
        <div
            ref={scrollContainer}
            style={{
                height: scrollContainer.parentElement
                    ? `${
                          scrollContainer.parentElement.offsetHeight -
                          parseFloat(getComputedStyle(scrollContainer.parentElement).paddingTop) -
                          parseFloat(getComputedStyle(scrollContainer.parentElement).paddingBottom)
                      }px`
                    : "400px",
                "overflow-y": "auto",
            }}
        >
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${items[0]?.start}px)`,
                    }}
                >
                    <For each={items}>
                        {(virtualRow) => {
                            return (
                                <div
                                    data-index={virtualRow.index}
                                    ref={(el) =>
                                        queueMicrotask(() => virtualizer.measureElement(el))
                                    }
                                >
                                    <Show when={props.courses[virtualRow.index]}>
                                        {(course) => (
                                            <CourseCard
                                                course={course()}
                                                isSelected={props.selectedCourses.some(
                                                    (c) =>
                                                        c.courseReferenceNumber ===
                                                        course().courseReferenceNumber
                                                )}
                                                onAdd={() => props.onAdd(course())}
                                                onRemove={() => props.onRemove(course())}
                                                withSpacing={true}
                                                onAddPreview={() => props.onAddPreview(course())}
                                                onRemovePreview={() =>
                                                    props.onRemovePreview(course())
                                                }
                                            />
                                        )}
                                    </Show>
                                </div>
                            );
                        }}
                    </For>
                </div>
            </div>
        </div>
    );
}

interface CourseCardProps extends ComponentProps<typeof Card> {
    course: ICourse;
    isSelected: boolean;
    onAdd: () => void;
    onRemove: () => void;
    withSpacing?: boolean;
    onAddPreview?: () => void;
    onRemovePreview?: () => void;
}

function CourseCard(props: CourseCardProps) {
    const faculty = props.course.faculty[0];

    const formatTime = (time: string | null) => {
        if (!time) return "TBA";
        return `${time.slice(0, 2)}:${time.slice(2)}`;
    };

    const getScheduleTypeBadgeVariant = (type: string) => {
        switch (type.toLowerCase()) {
            case "lecture":
                return "default";
            case "lab":
                return "secondary";
            case "tutorial":
                return "outline";
            default:
                return "secondary";
        }
    };

    const getInstructionMethodBadgeVariant = (method: string) => {
        switch (method.toLowerCase()) {
            case "face to face instruction":
                return "default";
            case "online instruction":
                return "secondary";
            case "hybrid instruction":
                return "outline";
            default:
                return "secondary";
        }
    };

    return (
        <Card
            class={cn(
                "transition-all duration-200 hover:shadow-md",
                props.isSelected ? "bg-muted/50" : "",
                props.withSpacing ? "mb-2" : ""
            )}
        >
            <CardContent class="p-4">
                <div class="flex items-start justify-between">
                    <div class="flex-1 space-y-2">
                        <div class="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline">
                                {props.course.subject} {props.course.courseNumber}
                            </Badge>
                            <Badge variant="secondary">Section {props.course.sequenceNumber}</Badge>
                            <Badge
                                variant={getScheduleTypeBadgeVariant(
                                    props.course.scheduleTypeDescription
                                )}
                            >
                                {props.course.scheduleTypeDescription}
                            </Badge>
                            <Badge
                                variant={getInstructionMethodBadgeVariant(
                                    props.course.instructionalMethodDescription
                                )}
                            >
                                {props.course.instructionalMethodDescription}
                            </Badge>
                            <Badge variant="secondary">{props.course.creditHours} credits</Badge>
                            <Show when={props.course.seatsAvailable === 0}>
                                <Badge variant="destructive">Full</Badge>
                            </Show>
                        </div>

                        <CourseDetailsModal
                            course={props.course}
                            triggerProps={{
                                as: "h3",
                                class: "font-semibold text-lg leading-tight cursor-pointer hover:text-primary",
                                children: props.course.courseTitle,
                            }}
                        />

                        <div class="space-y-2">
                            <For each={props.course.meetingsFaculty}>
                                {(meetingFaculty, index) => {
                                    const meetingTime = meetingFaculty.meetingTime;
                                    return (
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                                            <Show
                                                when={meetingTime.beginTime && meetingTime.endTime}
                                            >
                                                <>
                                                    <div class="flex items-center gap-1">
                                                        <Clock class="h-3 w-3" />
                                                        {formatTime(meetingTime.beginTime)} -{" "}
                                                        {formatTime(meetingTime.endTime)}
                                                    </div>
                                                    <div class="flex items-center gap-1">
                                                        <MapPin class="h-3 w-3" />
                                                        {meetingTime.buildingDescription ||
                                                            meetingTime.building ||
                                                            "TBA"}
                                                        <Show when={meetingTime.room}>
                                                            {" "}
                                                            - {meetingTime.room}
                                                        </Show>
                                                    </div>
                                                </>
                                            </Show>
                                            <div class="flex gap-1 md:col-span-2">
                                                <For
                                                    each={[
                                                        "monday",
                                                        "tuesday",
                                                        "wednesday",
                                                        "thursday",
                                                        "friday",
                                                    ]}
                                                >
                                                    {(day) => (
                                                        <Badge
                                                            variant={
                                                                meetingTime[
                                                                    day as keyof IMeetingTime
                                                                ]
                                                                    ? "default"
                                                                    : "outline"
                                                            }
                                                            class="text-xs px-1"
                                                        >
                                                            {day.charAt(0).toUpperCase()}
                                                        </Badge>
                                                    )}
                                                </For>
                                            </div>
                                        </div>
                                    );
                                }}
                            </For>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <Show when={faculty}>
                                <div class="flex items-center gap-1">
                                    <Users class="h-3 w-3" />
                                    {faculty.displayName}
                                </div>
                            </Show>
                            <div class="flex items-center gap-1">
                                <Tooltip>
                                    <TooltipTrigger class="flex items-center gap-1">
                                        <Users class="h-3 w-3" />
                                        {props.course.enrollment}/{props.course.maximumEnrollment}{" "}
                                        seats
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {props.course.seatsAvailable} seats available
                                    </TooltipContent>
                                </Tooltip>
                                <Show when={props.course.waitCapacity > 0}>
                                    <>
                                        <Separator orientation="vertical" class="mx-2" />
                                        <Tooltip>
                                            <TooltipTrigger class="flex items-center gap-1">
                                                <Clock class="h-3 w-3" />
                                                Waitlist {props.course.waitCount}/
                                                {props.course.waitCapacity}
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                {props.course.waitAvailable} waitlist seats
                                                available
                                            </TooltipContent>
                                        </Tooltip>
                                    </>
                                </Show>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col gap-2">
                        <CourseDetailsModal
                            course={props.course}
                            triggerProps={{
                                as: Button,
                                size: "sm",
                                variant: "ghost",
                                children: <Info class="h-4 w-4" />,
                            }}
                        />
                        <Button
                            size="sm"
                            variant={props.isSelected ? "destructive" : "default"}
                            onClick={() => {
                                props.isSelected ? props.onRemove() : props.onAdd();
                                props.onRemovePreview?.();
                            }}
                            onMouseEnter={() => !props.isSelected && props.onAddPreview?.()}
                            onMouseLeave={props.onRemovePreview}
                        >
                            <Switch>
                                <Match when={props.isSelected}>
                                    <Minus class="h-4 w-4" />
                                </Match>
                                <Match when={!props.isSelected}>
                                    <Plus class="h-4 w-4" />
                                </Match>
                            </Switch>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
