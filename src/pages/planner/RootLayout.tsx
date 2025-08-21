import AppSidebar from "@/components/course-planner/app-sidebar";
import { ParentProps } from "solid-js";

export default function RootLayout(props: ParentProps) {
    return (
        <div>
            <AppSidebar />
            <main>{props.children}</main>
        </div>
    );
}
