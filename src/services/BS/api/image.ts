/**
 * Construct a URL to fetch the banner image for a course.
 *
 * @param courseId The course ID.
 * @param imgId The image ID.
 * @returns The URL to fetch the image.
 */
export function getBannerImageUrl(courseId: string, imgId: string): string {
    const urlTemplate =
        "https://bright.uvic.ca/d2l/api/lp/1.9/courses/{{COURSE_ID}}/image?height=230&width=540&versionNumber={{IMAGE_UUID}}";
    const url = urlTemplate.replace("{{COURSE_ID}}", courseId).replace("{{IMAGE_UUID}}", imgId);
    return url;
}
