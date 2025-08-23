import { ComponentProps, createMemo, For, Show, splitProps } from "solid-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-solid";
import { ICourse, IMeetingTime } from "@/services/course-scraper/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface SchedulePreviewProps extends ComponentProps<typeof Card> {
    courses: ICourse[];
}

export function SchedulePreview(props: SchedulePreviewProps) {
    const [local, others] = splitProps(props, ["courses"]);
    const timeSlots = [
        "08:00",
        "09:00",
        "10:00",
        "11:00",
        "12:00",
        "13:00",
        "14:00",
        "15:00",
        "16:00",
        "17:00",
        "18:00",
    ];
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri"];

    // Create schedule grid
    const scheduleGrid = createMemo(() => {
        console.log("Recomputing schedule grid");
        const grid: { [key: string]: ICourse[] } = {};

        local.courses.forEach((course) => {
            course.meetingsFaculty.forEach((meeting) => {
                const meetingTime = meeting.meetingTime;
                if (!meetingTime || !meetingTime.beginTime || !meetingTime.endTime) return;

                const startHour = Number.parseInt(meetingTime.beginTime.slice(0, 2));
                const endHour = Number.parseInt(meetingTime.endTime.slice(0, 2));

                days.forEach((day) => {
                    if (meetingTime[day as keyof IMeetingTime]) {
                        for (let hour = startHour; hour <= endHour; hour++) {
                            const key = `${day}-${hour}`;
                            if (!grid[key]) grid[key] = [];
                            grid[key].push(course);
                        }
                    }
                });
            });
        });

        console.log("Schedule grid computed", grid);

        return grid;
    });

    // Check for conflicts
    const hasConflicts = createMemo(() =>
        Object.values(scheduleGrid()).some((courses) => courses.length > 1)
    );

    const formatTime = (time: string) => {
        return `${time.slice(0, 2)}:${time.slice(2)}`;
    };

    const getCoursesInSlot = (day: string, hour: number) => {
        const key = `${day}-${hour}`;
        return scheduleGrid()[key] || [];
    };

    return (
        <Card {...others}>
            <CardHeader>
                <CardTitle class="flex items-center gap-2">
                    <Calendar class="h-5 w-5" />
                    Schedule Preview
                </CardTitle>
                <Show when={hasConflicts()}>
                    <div class="text-sm text-destructive">⚠️ Schedule conflicts detected</div>
                </Show>
            </CardHeader>
            <CardContent>
                <div class="grid grid-cols-6 gap-1 text-xs">
                    {/* Header */}
                    <div class="font-medium text-center py-2">Time</div>
                    <For each={dayLabels}>
                        {(day) => <div class="font-medium text-center py-2">{day}</div>}
                    </For>

                    {/* Time slots */}
                    <Show when={scheduleGrid()} keyed>
                        {
                            <For each={timeSlots}>
                                {(time) => {
                                    const hour = Number.parseInt(time.split(":")[0]);
                                    return (
                                        <>
                                            <div class="text-center py-2 text-muted-foreground">
                                                {time}
                                            </div>
                                            <For each={days}>
                                                {(day) => {
                                                    const coursesInSlot = getCoursesInSlot(
                                                        day,
                                                        hour
                                                    );
                                                    return (
                                                        <div class="min-h-[40px] border border-border rounded p-1">
                                                            <For each={coursesInSlot}>
                                                                {(course, index) => {
                                                                    const meetingTime =
                                                                        course.meetingsFaculty[0]
                                                                            ?.meetingTime;

                                                                    // TODO: If slot for course is last, use minutes to get % height as style to scale it to size
                                                                    return (
                                                                        <Tooltip>
                                                                            <TooltipTrigger
                                                                                as={"div"}
                                                                                class={`text-center text-xs p-1 rounded mb-1 ${
                                                                                    coursesInSlot.length >
                                                                                    1
                                                                                        ? "bg-destructive text-destructive-foreground"
                                                                                        : "bg-primary text-primary-foreground"
                                                                                }`}
                                                                            >
                                                                                <div>
                                                                                    {`${course.subject} ${course.courseNumber}`}
                                                                                </div>
                                                                                <div>
                                                                                    {
                                                                                        course.sequenceNumber
                                                                                    }
                                                                                </div>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                <div>
                                                                                    {course.subject}{" "}
                                                                                    {
                                                                                        course.courseNumber
                                                                                    }{" "}
                                                                                    -{" "}
                                                                                    {
                                                                                        course.sequenceNumber
                                                                                    }
                                                                                </div>
                                                                                <div>
                                                                                    {
                                                                                        course.courseTitle
                                                                                    }
                                                                                </div>
                                                                                <div>
                                                                                    {meetingTime?.beginTime
                                                                                        ? formatTime(
                                                                                              meetingTime.beginTime
                                                                                          )
                                                                                        : ""}{" "}
                                                                                    -{" "}
                                                                                    {meetingTime?.endTime
                                                                                        ? formatTime(
                                                                                              meetingTime.endTime
                                                                                          )
                                                                                        : ""}
                                                                                </div>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    );
                                                                }}
                                                            </For>
                                                        </div>
                                                    );
                                                }}
                                            </For>
                                        </>
                                    );
                                }}
                            </For>
                        }
                    </Show>
                </div>
            </CardContent>
        </Card>
    );
}
