


Demo usage:

```ts
const scraper = new CourseScraper(new AxiosHttpClient());

scraper.scrapeCourses("202409");

const calendarScraper = new CalendarScraper(new AxiosHttpClient());

const calendar = await calendarScraper.fetchCourses("202409", "undergrad");

console.log(await calendarScraper.fetchCourseDetail("202409", "undergrad", calendar[0].pid));

```