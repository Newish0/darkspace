import AppSidebar from "@/components/course-planner/app-sidebar";
import { ParentProps } from "solid-js";

export default function RootLayout(props: ParentProps) {
    return (
        <div class="flex w-full">
            <AppSidebar />
            <main class="w-full flex-1 h-screen">{props.children}</main>
        </div>
    );
}
