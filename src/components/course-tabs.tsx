import { A } from "@solidjs/router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CourseTabsProps {
    courseId: string;
    value: "home" | "coursework" | "grades" | "others";
}

export default function CourseTabs({ courseId, value }: CourseTabsProps) {
    return (
        <Tabs value={value}>
            <TabsList class="">
                <TabsTrigger value="home">
                    <A href={`/courses/${courseId}/`}>Home</A>
                </TabsTrigger>
                <TabsTrigger value="coursework">
                    <A href={`/courses/${courseId}/coursework`}>Coursework</A>
                </TabsTrigger>
                <TabsTrigger value="grades">
                    <A href={`/courses/${courseId}/grades`}>Grades</A>
                </TabsTrigger>
                <TabsTrigger value="others">
                    <A href={`/courses/${courseId}/others`}>Others</A>
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
