
export const BASE_URL = "https://bright.uvic.ca";

const ASSIGNMENT_SUBMIT_URL = `${BASE_URL}/d2l/lms/dropbox/user/folder_submit_files.d2l?db={{ASSIGNMENT_ID}}&grpid={{GROUP_ID}}&ou={{COURSE_ID}}`;

const ASSIGNMENT_FEEDBACK_URL = `${BASE_URL}/d2l/lms/dropbox/user/folder_user_view_feedback.d2l?db={{ASSIGNMENT_ID}}&grpid={{GROUP_ID}}&ou={{COURSE_ID}}`;

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

const QUIZ_SUMMARY_URL = `${BASE_URL}/d2l/lms/quizzing/user/quiz_summary.d2l?qi={{QUIZ_ID}}&ou={{COURSE_ID}}`;

export function getQuizSummaryUrl(quizId: string, courseId: string) {
    const url = QUIZ_SUMMARY_URL.replace("{{QUIZ_ID}}", quizId).replace("{{COURSE_ID}}", courseId);
    return url;
}

const RUBRIC_URL = `${BASE_URL}/d2l/lms/grades/my_grades/activities_dialog.d2l?ou={{COURSE_ID}}&objectId={{OBJECT_ID}}&userId={{USER_ID}}&rubricId={{RUBRIC_ID}}`;

/**
 * Reverse engineered from `ViewActivities()` function in D2L's my_grades.js
 * Specifically: https://bright.uvic.ca/d2l/lms/grades/static/include/my_grades.js?v=20.24.10.20758
 * @param courseId
 * @param userId
 * @param rubricId
 * @returns
 */
export function getRubricUrl(courseId: string, objectId: string, userId: string, rubricId: string) {
    const url = RUBRIC_URL.replace("{{COURSE_ID}}", courseId)
        .replace("{{OBJECT_ID}}", objectId)
        .replace("{{USER_ID}}", userId)
        .replace("{{RUBRIC_ID}}", rubricId);
    return url;
}




