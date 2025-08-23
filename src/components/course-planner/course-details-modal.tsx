import { ComponentProps, Show, createMemo, splitProps } from "solid-js";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, MapPin, Users, BookOpen, GraduationCap } from "lucide-solid";
import { ICourse } from "@/services/course-scraper/types";

interface CourseDetailsModalProps {
    course: ICourse;
    triggerProps: ComponentProps<typeof DialogTrigger>;
}

export function CourseDetailsModal(props: CourseDetailsModalProps) {
    const [local, others] = splitProps(props, ["course", "triggerProps"]);

    const meetingTime = createMemo(() => local.course?.meetingsFaculty[0]?.meetingTime);
    const faculty = createMemo(() => local.course?.faculty[0]);

    const formatTime = (time: string | null) => {
        if (!time) return "TBA";
        return `${time.slice(0, 2)}:${time.slice(2)}`;
    };

    const getDays = createMemo(() => {
        const meeting = meetingTime();
        if (!meeting) return "TBA";
        const days = [];
        if (meeting.monday) days.push("Mon");
        if (meeting.tuesday) days.push("Tue");
        if (meeting.wednesday) days.push("Wed");
        if (meeting.thursday) days.push("Thu");
        if (meeting.friday) days.push("Fri");
        return days.join(", ") || "TBA";
    });

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

    return (
        <Dialog>
            <DialogTrigger {...props.triggerProps} />
            <DialogContent class="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle class="flex items-center gap-2">
                        <BookOpen class="h-5 w-5" />
                        Course Details
                    </DialogTitle>
                </DialogHeader>

                <div class="space-y-6">
                    {/* Course Header */}
                    <div class="space-y-3">
                        <div class="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" class="text-lg px-3 py-1">
                                {local.course.subject} {local.course.courseNumber}
                            </Badge>
                            <Badge variant="secondary">Section {local.course.sequenceNumber}</Badge>
                            <Badge
                                variant={getScheduleTypeBadgeVariant(
                                    local.course.scheduleTypeDescription
                                )}
                            >
                                {local.course.scheduleTypeDescription}
                            </Badge>
                            <Show when={local.course.isSectionLinked}>
                                <Badge variant="outline">Linked Section</Badge>
                            </Show>
                        </div>
                        <h2 class="text-xl font-semibold">{local.course.courseTitle}</h2>
                        <p class="text-muted-foreground">{local.course.subjectDescription}</p>
                    </div>

                    <Separator />

                    {/* Course Info Grid */}
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-3">
                            <div class="flex items-center gap-2">
                                <GraduationCap class="h-4 w-4 text-muted-foreground" />
                                <span class="font-medium">Credits:</span>
                                <span>{local.course.creditHours}</span>
                            </div>

                            <div class="flex items-center gap-2">
                                <Users class="h-4 w-4 text-muted-foreground" />
                                <span class="font-medium">Enrollment:</span>
                                <span>
                                    {local.course.enrollment}/{local.course.maximumEnrollment}
                                </span>
                            </div>

                            <div class="flex items-center gap-2">
                                <Users class="h-4 w-4 text-muted-foreground" />
                                <span class="font-medium">Seats Available:</span>
                                <span
                                    class={
                                        local.course.seatsAvailable > 0
                                            ? "text-success-foreground"
                                            : "text-destructive-foreground"
                                    }
                                >
                                    {local.course.seatsAvailable}
                                </span>
                            </div>

                            <Show when={local.course.waitCapacity > 0}>
                                <div class="flex items-center gap-2">
                                    <Clock class="h-4 w-4 text-muted-foreground" />
                                    <span class="font-medium">Waitlist:</span>
                                    <span>
                                        {local.course.waitCount}/{local.course.waitCapacity} (
                                        {local.course.waitAvailable} available)
                                    </span>
                                </div>
                            </Show>
                        </div>

                        <div class="space-y-3">
                            <div class="flex items-center gap-2">
                                <MapPin class="h-4 w-4 text-muted-foreground" />
                                <span class="font-medium">Campus:</span>
                                <span>{local.course.campusDescription}</span>
                            </div>

                            <div class="flex items-center gap-2">
                                <BookOpen class="h-4 w-4 text-muted-foreground" />
                                <span class="font-medium">Method:</span>
                                <span>{local.course.instructionalMethodDescription}</span>
                            </div>

                            <div class="flex items-center gap-2">
                                <Calendar class="h-4 w-4 text-muted-foreground" />
                                <span class="font-medium">Term:</span>
                                <span>{local.course.termDesc}</span>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Schedule Information */}
                    <div class="space-y-3">
                        <h3 class="font-semibold flex items-center gap-2">
                            <Clock class="h-4 w-4" />
                            Schedule
                        </h3>

                        <Show
                            when={meetingTime()}
                            fallback={
                                <p class="text-muted-foreground">
                                    Schedule information not available
                                </p>
                            }
                        >
                            {(meeting) => (
                                <div class="bg-muted p-4 rounded-lg space-y-2">
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <span class="font-medium">Time:</span>
                                            <p>
                                                {formatTime(meeting().beginTime)} -{" "}
                                                {formatTime(meeting().endTime)}
                                            </p>
                                        </div>
                                        <div>
                                            <span class="font-medium">Days:</span>
                                            <p>{getDays()}</p>
                                        </div>
                                        <div>
                                            <span class="font-medium">Location:</span>
                                            <p>
                                                {meeting().buildingDescription ||
                                                    meeting().building ||
                                                    "TBA"}
                                                <Show when={meeting().room}>
                                                    {(room) => ` - ${room()}`}
                                                </Show>
                                            </p>
                                        </div>
                                        <div>
                                            <span class="font-medium">Duration:</span>
                                            <p>
                                                {meeting().startDate} - {meeting().endDate}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Show>
                    </div>

                    {/* Faculty Information */}
                    <Show when={faculty()}>
                        {(facultyMember) => (
                            <>
                                <Separator />
                                <div class="space-y-3">
                                    <h3 class="font-semibold flex items-center gap-2">
                                        <Users class="h-4 w-4" />
                                        Instructor
                                    </h3>
                                    <div class="bg-muted p-4 rounded-lg">
                                        <p class="font-medium">{facultyMember().displayName}</p>
                                        <p class="text-sm text-muted-foreground">
                                            {facultyMember().emailAddress}
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </Show>
                </div>
            </DialogContent>
        </Dialog>
    );
}
