import { useUVicCoursePlannerTerms } from "@/hooks/course-planner/use-course-planner-terms";
import { useNavigate, useParams } from "@solidjs/router";
import { createEffect } from "solid-js";

export default function TermRedirect() {
    const navigate = useNavigate();
    const params = useParams();
    const { activeTerm } = useUVicCoursePlannerTerms(new Date(), 3, 12);

    createEffect(() => {
        if (activeTerm()?.id === params.term) return;
        navigate(`/${activeTerm()?.id}/`);
    });

    return null;
}
