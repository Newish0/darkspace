import { createMemo, For, Show } from "solid-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-solid";
import { ICourse, IMeetingTime } from "@/services/course-scraper/types";

interface SchedulePreviewProps {
    courses: ICourse[];
}

export function SchedulePreview(props: SchedulePreviewProps) {
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
        const grid: { [key: string]: ICourse[] } = {};

        props.courses.forEach((course) => {
            course.meetingsFaculty.forEach((meeting) => {
                const meetingTime = meeting.meetingTime;
                if (!meetingTime || !meetingTime.beginTime || !meetingTime.endTime) return;

                const startHour = Number.parseInt(meetingTime.beginTime.slice(0, 2));
                const endHour = Number.parseInt(meetingTime.endTime.slice(0, 2));

                days.forEach((day) => {
                    if (meetingTime[day as keyof IMeetingTime]) {
                        for (let hour = startHour; hour < endHour; hour++) {
                            const key = `${day}-${hour}`;
                            if (!grid[key]) grid[key] = [];
                            grid[key].push(course);
                        }
                    }
                });
            });
        });

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
        <Card>
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
                    <For each={timeSlots}>
                        {(time) => {
                            const hour = Number.parseInt(time.split(":")[0]);
                            return (
                                <>
                                    <div class="text-center py-2 text-muted-foreground">{time}</div>
                                    <For each={days}>
                                        {(day) => {
                                            const coursesInSlot = getCoursesInSlot(day, hour);
                                            return (
                                                <div class="min-h-[40px] border border-border rounded p-1">
                                                    <For each={coursesInSlot}>
                                                        {(course, index) => {
                                                            const meetingTime =
                                                                course.meetingsFaculty[0]
                                                                    ?.meetingTime;
                                                            return (
                                                                <div
                                                                    class={`text-xs p-1 rounded mb-1 ${
                                                                        coursesInSlot.length > 1
                                                                            ? "bg-destructive text-destructive-foreground"
                                                                            : "bg-primary text-primary-foreground"
                                                                    }`}
                                                                    title={`${course.subject} ${
                                                                        course.courseNumber
                                                                    } - ${course.sequenceNumber}\n${
                                                                        course.courseTitle
                                                                    }\n${
                                                                        meetingTime?.beginTime
                                                                            ? formatTime(
                                                                                  meetingTime.beginTime
                                                                              )
                                                                            : ""
                                                                    } - ${
                                                                        meetingTime?.endTime
                                                                            ? formatTime(
                                                                                  meetingTime.endTime
                                                                              )
                                                                            : ""
                                                                    }`}
                                                                >
                                                                    {course.subject}{" "}
                                                                    {course.courseNumber}
                                                                    <br />
                                                                    {course.sequenceNumber}
                                                                </div>
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
                </div>
            </CardContent>
        </Card>
    );
}
