import { createSignal, createMemo, For, Show, Switch, Match } from "solid-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Filter, Calendar, Clock, Users, MapPin, Plus, Minus, Info } from "lucide-solid";
import { SchedulePreview } from "@/components/course-planner/schedule-preview";
import { OptimalScheduleDialog } from "@/components/course-planner/optimal-schedule-dialog";
import { CourseDetailsModal } from "@/components/course-planner/course-details-modal";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { ICourse, IMeetingTime } from "@/services/course-scraper/types";
import { Label } from "../ui/label";
import { cn } from "@/lib/utils";

export function CourseScheduler(props: { courses: ICourse[] }) {
    const [searchTerm, setSearchTerm] = createSignal("");
    const [selectedSubject, setSelectedSubject] = createSignal<string>("all");
    const [selectedCreditHours, setSelectedCreditHours] = createSignal<string>("all");
    const [selectedInstructionMethod, setSelectedInstructionMethod] = createSignal<string>("all");
    const [sortBy, setSortBy] = createSignal<string>("courseTitle");
    const [selectedCourses, setSelectedCourses] = createSignal<ICourse[]>([]);
    const [showOnlyAvailable, setShowOnlyAvailable] = createSignal(false);
    const [selectedCourseForDetails, setSelectedCourseForDetails] = createSignal<ICourse | null>(
        null
    );

    // Get unique subjects for filter
    const subjects = createMemo(() => {
        const subjectSet = new Set(props.courses.map((course) => course.subject));
        return Array.from(subjectSet).sort();
    });

    // Get unique instruction methods for filter
    const instructionMethods = createMemo(() => {
        const methodSet = new Set(
            props.courses.map((course) => course.instructionalMethodDescription)
        );
        return Array.from(methodSet).sort();
    });

    // Filter and sort courses
    const filteredCourses = createMemo(() => {
        const filtered = props.courses.filter((course) => {
            const search = searchTerm().toLowerCase();
            const matchesSearch =
                course.courseTitle.toLowerCase().includes(search) ||
                course.subject.toLowerCase().includes(search) ||
                course.courseNumber.toLowerCase().includes(search) ||
                course.subjectCourse.toLowerCase().includes(search);

            const matchesSubject =
                selectedSubject() === "all" || course.subject === selectedSubject();
            const matchesCreditHours =
                selectedCreditHours() === "all" ||
                course.creditHours.toString() === selectedCreditHours();
            const matchesInstructionMethod =
                selectedInstructionMethod() === "all" ||
                course.instructionalMethodDescription === selectedInstructionMethod();
            const matchesAvailability = !showOnlyAvailable() || course.seatsAvailable > 0;

            return (
                matchesSearch &&
                matchesSubject &&
                matchesCreditHours &&
                matchesInstructionMethod &&
                matchesAvailability
            );
        });

        filtered.sort((a, b) => {
            switch (sortBy()) {
                case "courseTitle":
                    return a.courseTitle.localeCompare(b.courseTitle);
                case "subject":
                    return a.subject.localeCompare(b.subject);
                case "creditHours":
                    return b.creditHours - a.creditHours;
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

    const totalCredits = createMemo(() =>
        selectedCourses().reduce((sum, course) => sum + course.creditHours, 0)
    );

    return (
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search and Filter Panel */}
            <div class="lg:col-span-2 space-y-6">
                <Card>
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
                                <SelectContent />
                            </Select>

                            <Select
                                value={selectedCreditHours()}
                                onChange={setSelectedCreditHours}
                                placeholder="Credit Hours"
                                options={["all", "0", "0.75", "1.5", "3", "4"]}
                                itemComponent={(props) => (
                                    <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
                                )}
                            >
                                <SelectTrigger>
                                    <SelectValue<string>>
                                        {(state) => state.selectedOption()}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent />
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
                                <SelectContent />
                            </Select>

                            <Select
                                value={sortBy()}
                                onChange={setSortBy}
                                placeholder="Sort by"
                                options={[
                                    "courseTitle",
                                    "subject",
                                    "creditHours",
                                    "seatsAvailable",
                                ]}
                                itemComponent={(props) => (
                                    <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
                                )}
                            >
                                <SelectTrigger>
                                    <SelectValue<string>>
                                        {(state) => state.selectedOption()}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent />
                            </Select>

                            <div class="flex items-center space-x-2">
                                <Checkbox
                                    id="available"
                                    checked={showOnlyAvailable()}
                                    onChange={setShowOnlyAvailable}
                                />
                                <Label for="available">Available only</Label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Course List */}
                <Card>
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
                    <CardContent>
                        <ScrollArea class="h-[600px]">
                            <div class="space-y-3">
                                <For each={filteredCourses()}>
                                    {(course) => (
                                        <CourseCard
                                            course={course}
                                            isSelected={selectedCourses().some(
                                                (c) =>
                                                    c.courseReferenceNumber ===
                                                    course.courseReferenceNumber
                                            )}
                                            onAdd={() => addCourse(course)}
                                            onRemove={() =>
                                                removeCourse(course.courseReferenceNumber)
                                            }
                                            onShowDetails={() =>
                                                setSelectedCourseForDetails(course)
                                            }
                                        />
                                    )}
                                </For>
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Schedule Preview Panel */}
            <div class="space-y-6">
                <Card>
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
                                                            removeCourse(
                                                                course.courseReferenceNumber
                                                            )
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

                <SchedulePreview courses={selectedCourses()} />
            </div>

            {/* Course Details Modal */}
            <CourseDetailsModal
                course={selectedCourseForDetails()}
                open={!!selectedCourseForDetails()}
                onOpenChange={(open) => !open && setSelectedCourseForDetails(null)}
            />
        </div>
    );
}

interface CourseCardProps {
    course: ICourse;
    isSelected: boolean;
    onAdd: () => void;
    onRemove: () => void;
    onShowDetails: () => void;
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
                props.isSelected ? "ring-2 ring-primary" : ""
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
                            <Show when={props.course.isSectionLinked}>
                                <Badge variant="outline">Linked</Badge>
                            </Show>
                        </div>

                        <h3
                            class="font-semibold text-lg leading-tight cursor-pointer hover:text-primary"
                            onClick={props.onShowDetails}
                        >
                            {props.course.courseTitle}
                        </h3>

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
                                <Users class="h-3 w-3" />
                                {props.course.seatsAvailable}/{props.course.maximumEnrollment} seats
                                <Show when={props.course.waitCapacity > 0}>
                                    <span class="ml-1">
                                        | Waitlist: {props.course.waitAvailable}/
                                        {props.course.waitCapacity}
                                    </span>
                                </Show>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col gap-2">
                        <Button size="sm" variant="ghost" onClick={props.onShowDetails}>
                            <Info class="h-4 w-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant={props.isSelected ? "destructive" : "default"}
                            onClick={props.isSelected ? props.onRemove : props.onAdd}
                            disabled={!props.isSelected && props.course.seatsAvailable === 0}
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
