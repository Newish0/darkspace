const ASSIGNMENT_SUBMIT_URL =
    "https://bright.uvic.ca/d2l/lms/dropbox/user/folder_submit_files.d2l?db={{ASSIGNMENT_ID}}&grpid={{GROUP_ID}}&ou={{COURSE_ID}}";

const ASSIGNMENT_FEEDBACK_URL =
    "https://bright.uvic.ca/d2l/lms/dropbox/user/folder_user_view_feedback.d2l?db={{ASSIGNMENT_ID}}&grpid={{GROUP_ID}}&ou={{COURSE_ID}}";

export function getAssignmentSubmitUrl(courseId: string, assignmentId: string, groupId?: string) {
    const url = ASSIGNMENT_SUBMIT_URL.replace("{{ASSIGNMENT_ID}}", assignmentId)
        .replace("{{COURSE_ID}}", courseId)
        .replace("{{GROUP_ID}}", groupId || "0");

    return url;
}

export function getAssignmentFeedbackUrl(courseId: string, assignmentId: string, groupId?: string) {
    const url = ASSIGNMENT_FEEDBACK_URL.replace("{{ASSIGNMENT_ID}}", assignmentId)
        .replace("{{COURSE_ID}}", courseId)
        .replace("{{GROUP_ID}}", groupId || "0");

    return url;
}

const QUIZ_SUMMARY_URL =
    "https://bright.uvic.ca/d2l/lms/quizzing/user/quiz_summary.d2l?qi={{QUIZ_ID}}&ou={{COURSE_ID}}";

export function getQuizSummaryUrl(quizId: string, courseId: string) {
    const url = QUIZ_SUMMARY_URL.replace("{{QUIZ_ID}}", quizId).replace("{{COURSE_ID}}", courseId);
    return url;
}
