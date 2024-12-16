export const BASE_URL = "https://bright.uvic.ca";

// Assignment URLs
const ASSIGNMENT_SUBMIT_URL = `${BASE_URL}/d2l/lms/dropbox/user/folder_submit_files.d2l?db={{ASSIGNMENT_ID}}&grpid={{GROUP_ID}}&ou={{COURSE_ID}}`;
const ASSIGNMENT_FEEDBACK_URL = `${BASE_URL}/d2l/lms/dropbox/user/folder_user_view_feedback.d2l?db={{ASSIGNMENT_ID}}&grpid={{GROUP_ID}}&ou={{COURSE_ID}}`;

// Quiz URLs
const QUIZ_SUMMARY_URL = `${BASE_URL}/d2l/lms/quizzing/user/quiz_summary.d2l?qi={{QUIZ_ID}}&ou={{COURSE_ID}}`;
const QUIZ_LIST_URL = `${BASE_URL}/d2l/lms/quizzing/user/quizzes_list.d2l?ou={{COURSE_ID}}`;

// Grade URLs
const RUBRIC_URL = `${BASE_URL}/d2l/lms/grades/my_grades/activities_dialog.d2l?ou={{COURSE_ID}}&objectId={{OBJECT_ID}}&userId={{USER_ID}}&rubricId={{RUBRIC_ID}}`;
const STATISTICS_URL = `${BASE_URL}/d2l/lms/grades/my_grades/statistics_dialog.d2l?ou={{COURSE_ID}}&objectId={{OBJECT_ID}}`;
const GRADES_LIST_URL = `${BASE_URL}/d2l/lms/grades/my_grades/main.d2l?ou={{COURSE_ID}}`;

// Course Content URLs
const COURSE_MODULE_URL = `${BASE_URL}/d2l/le/content/{{COURSE_ID}}/Home`;
const MODULE_CONTENT_URL = `${BASE_URL}/d2l/le/content/{{COURSE_ID}}/PartialMainView?identifier={{MODULE_ID}}&_d2l_prc`;
const CONTENT_SERVICE_URL = `${BASE_URL}/d2l/le/contentservice/topic/{{TOPIC_ID}}/launch`;
const CONTENT_VIEW_URL = `${BASE_URL}/d2l/le/content/{{COURSE_ID}}/viewContent/{{TOPIC_ID}}/View`;

// Calendar URLs
const CALENDAR_SUB_URL = `${BASE_URL}/d2l/le/calendar/6606/subscribe/subscribeDialogLaunch?subscriptionOptionId=-1`;
const CALENDAR_FEED_URL = `${BASE_URL}/d2l/le/calendar/feed/user/feed.ics?token={{TOKEN}}`;

/**
 * Builds the URL for subscribing to the calendar
 */
export function buildCalendarSubUrl(): string {
    return CALENDAR_SUB_URL;
}

/**
 * Builds the URL for the calendar feed
 * @param token - The calendar feed token
 * @param courseId - Optional course ID to filter the feed
 */
export function buildCalendarFeedUrl(token: string, courseId?: string): string {
    let url = CALENDAR_FEED_URL.replace("{{TOKEN}}", token);
    if (courseId) {
        url += `&feedOU=${courseId}`;
    }
    return url;
}

// Activity Feed URLs
const ACTIVITY_FEED_CHECK_URL = `${BASE_URL}/d2l/activityFeed/checkForNewAlerts`;
const ACTIVITY_FEED_URL = `${BASE_URL}/d2l/NavigationArea/{{COURSE_ID}}/ActivityFeed/{{ENDPOINT}}`;

/**
 * Helper function to build a full URL from a relative path
 * @param path - The relative path to append to BASE_URL
 * @returns The complete URL
 */
export function buildFullUrl(path: string): string {
    return new URL(path, BASE_URL).href;
}

/**
 * Builds the URL for submitting an assignment
 * @param courseId - The course ID
 * @param assignmentId - The assignment ID
 * @param groupId - Optional group ID, defaults to "0" for individual assignments
 */
export function buildAssignmentSubmitUrl(courseId: string, assignmentId: string, groupId?: string): string {
    return ASSIGNMENT_SUBMIT_URL.replace("{{ASSIGNMENT_ID}}", assignmentId)
        .replace("{{COURSE_ID}}", courseId)
        .replace("{{GROUP_ID}}", groupId || "0");
}

/**
 * Builds the URL for viewing assignment feedback
 * @param courseId - The course ID
 * @param assignmentId - The assignment ID
 * @param groupId - Optional group ID, defaults to "0" for individual assignments
 */
export function buildAssignmentFeedbackUrl(courseId: string, assignmentId: string, groupId?: string): string {
    return ASSIGNMENT_FEEDBACK_URL.replace("{{ASSIGNMENT_ID}}", assignmentId)
        .replace("{{COURSE_ID}}", courseId)
        .replace("{{GROUP_ID}}", groupId || "0");
}

/**
 * Builds the URL for viewing a quiz summary
 * @param quizId - The quiz ID
 * @param courseId - The course ID
 */
export function buildQuizSummaryUrl(quizId: string, courseId: string): string {
    return QUIZ_SUMMARY_URL.replace("{{QUIZ_ID}}", quizId).replace("{{COURSE_ID}}", courseId);
}

/**
 * Builds the URL for viewing the quiz list
 * @param courseId - The course ID
 */
export function buildQuizListUrl(courseId: string): string {
    return QUIZ_LIST_URL.replace("{{COURSE_ID}}", courseId);
}

/**
 * Builds the URL for viewing a rubric
 * Reverse engineered from `ViewActivities()` function in D2L's my_grades.js
 * Specifically: https://bright.uvic.ca/d2l/lms/grades/static/include/my_grades.js?v=20.24.10.20758
 * @param courseId - The course ID
 * @param objectId - The object ID
 * @param userId - The user ID
 * @param rubricId - The rubric ID
 */
export function buildRubricUrl(courseId: string, objectId: string, userId: string, rubricId: string): string {
    return RUBRIC_URL.replace("{{COURSE_ID}}", courseId)
        .replace("{{OBJECT_ID}}", objectId)
        .replace("{{USER_ID}}", userId)
        .replace("{{RUBRIC_ID}}", rubricId);
}

/**
 * Builds the URL for viewing grade statistics
 * Reverse engineered from `ShowGradeObjectStatisticsDialog(objectId, userId)` function in D2L's my_grades.js
 * Specifically: https://bright.uvic.ca/d2l/lms/grades/static/include/my_grades.js?v=20.24.10.20758
 * And also from the URL in the statistics popup.
 * @param courseId - The course ID
 * @param objectId - The object ID
 */
export function buildStatisticUrl(courseId: string, objectId: string): string {
    return STATISTICS_URL.replace("{{COURSE_ID}}", courseId).replace("{{OBJECT_ID}}", objectId);
}

/**
 * Builds the URL for viewing the grades list
 * @param courseId - The course ID
 */
export function buildGradesListUrl(courseId: string): string {
    return GRADES_LIST_URL.replace("{{COURSE_ID}}", courseId);
}

/**
 * Builds the URL for viewing course modules
 * @param courseId - The course ID
 */
export function buildCourseModuleUrl(courseId: string): string {
    return COURSE_MODULE_URL.replace("{{COURSE_ID}}", courseId);
}

/**
 * Builds the URL for viewing module content
 * @param courseId - The course ID
 * @param moduleId - The module ID
 */
export function buildModuleContentUrl(courseId: string, moduleId: string): string {
    return MODULE_CONTENT_URL.replace("{{COURSE_ID}}", courseId).replace("{{MODULE_ID}}", moduleId);
}

/**
 * Builds the URL for accessing content service
 * @param topicId - The topic ID
 */
export function buildContentServiceUrl(topicId: string): string {
    return CONTENT_SERVICE_URL.replace("{{TOPIC_ID}}", topicId);
}

/**
 * Builds the URL for viewing content
 * @param courseId - The course ID
 * @param topicId - The topic ID
 */
export function buildContentViewUrl(courseId: string, topicId: string): string {
    return CONTENT_VIEW_URL.replace("{{COURSE_ID}}", courseId).replace("{{TOPIC_ID}}", topicId);
}

/**
 * Builds the URL for the activity feed
 * @param courseId - The course ID
 * @param endpoint - The endpoint name
 * @param params - URL search parameters
 */
export function buildActivityFeedUrl(courseId: string, endpoint: string, params: URLSearchParams): string {
    return `${ACTIVITY_FEED_URL.replace("{{COURSE_ID}}", courseId).replace(
        "{{ENDPOINT}}",
        endpoint
    )}?${params.toString()}`;
}

/**
 * Builds the URL for checking activity feed updates
 * @param params - URL search parameters
 */
export function buildActivityFeedCheckUrl(params: URLSearchParams): string {
    return `${ACTIVITY_FEED_CHECK_URL}?${params.toString()}`;
}
