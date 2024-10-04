import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CalendarIcon, BookOpenIcon } from "lucide-solid";
import { cn } from "@/lib/utils";

import { template } from "solid-js/web";
import UnsafeHtml from "./unsafe-html";
import { getImgFromImgRefLink, IClass } from "@/services/BS";
import { createResource } from "solid-js";

export default function CourseCard({ course }: { course: IClass }) {
    const [bannerImg] = createResource(() =>
        getImgFromImgRefLink(course.imgRefLink, "banner", "low-density", "mid", "narrow")
    );

    const formatDate = (date: string | null) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <Card class="overflow-hidden">
            <div class="relative">
                <div
                    class="h-32 bg-cover bg-center"
                    style={{
                        "background-image": `url(${bannerImg()})`,
                        "background-color": course.color,
                    }}
                />
                <div
                    class="relative h-2"
                    style={{
                        "background-color": course.color,
                    }}
                ></div>
            </div>
            <CardHeader>
                <div class="flex justify-between items-start gap-2">
                    <div>
                        <h3 class="text-2xl font-bold">{course.name}</h3>
                    </div>
                    <Badge variant={course.isActive ? "default" : "secondary"}>
                        {course.isActive ? "Active" : "Inactive"}
                    </Badge>
                </div>

                <p class="text-sm text-muted-foreground">{course.code}</p>
            </CardHeader>
            <CardContent>
                <p class="text-sm mb-4">
                    <UnsafeHtml unsafeHtml={course.description} />
                </p>
                <div class="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div class="flex items-center">
                        <CalendarIcon class="mr-1 h-4 w-4" />
                        <span>
                            {formatDate(course.startDate)} - {formatDate(course.endDate)}
                        </span>
                    </div>
                    <div class="flex items-center">
                        <BookOpenIcon class="mr-1 h-4 w-4" />
                        <span>ID: {course.id}</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <a href={course.link} class={cn(buttonVariants({ variant: "link" }), "w-full")}>
                    Go to Course
                </a>
            </CardFooter>
        </Card>
    );
}
