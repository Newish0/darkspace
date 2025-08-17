import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BookOpenIcon, CalendarIcon } from "lucide-solid";

import { getBannerImageUrl } from "@/services/BS/api/image";
import { createResource, Show } from "solid-js";
import UnsafeHtml from "./unsafe-html";
import { A } from "@solidjs/router";
import { IClass, isClassActuallyActive } from "@/services/BS/api/enrollment";
import { remapHtmlUrls } from "@/utils/html";
import { remapD2LUrl } from "@/services/BS/url";
import NormalizedTextContrast from "./normalized-text-contrast";

export default function CourseCard({ course }: { course: IClass }) {
    const [bannerImg] = createResource(() => getBannerImageUrl(course.id, course.imgId));

    const formatDate = (date: string | null) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const disabled = () => (course.id ? false : true);

    const darkSpaceCourseLink = () => `/courses/${course.id}`;

    return (
        <Card class={cn("overflow-hidden", disabled() ? "cursor-not-allowed opacity-70" : "")}>
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
                    <Badge variant={isClassActuallyActive(course) ? "default" : "secondary"}>
                        {isClassActuallyActive(course) ? "Active" : "Inactive"}
                    </Badge>
                </div>

                <p class="text-sm text-muted-foreground">{course.code}</p>
            </CardHeader>
            <CardContent>
                <p class="text-sm mb-4">
                    <NormalizedTextContrast>
                        <UnsafeHtml
                            unsafeHtml={remapHtmlUrls(course.description, remapD2LUrl)}
                            config={{
                                ADD_ATTR: ["target"],
                            }}
                        />
                    </NormalizedTextContrast>
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

            <Show when={!disabled()}>
                <CardFooter>
                    <A
                        href={darkSpaceCourseLink()}
                        class={cn(buttonVariants({ variant: "link" }), "w-full")}
                    >
                        Go to Course
                    </A>
                </CardFooter>
            </Show>
        </Card>
    );
}
