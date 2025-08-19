import { type IHttpClient, ResponseType } from "./IHttpClient";
import { type CalendarCatalogCourse, type CalendarCourseDetail } from "./types";

type CalendarType = "undergrad" | "grad";

export class CalendarScraper {
    private client: IHttpClient;
    private uvicCalendarArchiveUrl: string;
    private courseCatalogApiEndpoint: string;
    private courseDetailApiEndpoint: string;
    private batchSize: number;

    private termIdCacheMap = new Map<string, string>();

    private static DEFAULT_BATCH_SIZE = 100;

    /**
     * @param client - IHttpClient
     * @param {string} uvicCalendarArchiveUrl - The URL of the UVIC calendar archive i.e. https://www.uvic.ca/calendar/archives/202409/undergrad/
     * @param {string} courseCatalogApiEndpoint - i.e. https://uvic.kuali.co/api/v1/catalog/courses/65eb47906641d7001c157bc4
     * @param {string} courseDetailApiEndpoint - i.e. https://uvic.kuali.co/api/v1/catalog/course/65eb47906641d7001c157bc4/r1l21daXE
     */
    constructor(
        client: IHttpClient,
        {
            uvicCalendarArchiveUrl = "https://www.uvic.ca/calendar/archives/{term}/{type}",
            courseCatalogApiEndpoint = "https://uvic.kuali.co/api/v1/catalog/courses/{catalogId}",
            courseDetailApiEndpoint = "https://uvic.kuali.co/api/v1/catalog/course/{catalogId}/{pid}",
            batchSize = CalendarScraper.DEFAULT_BATCH_SIZE,
        } = {}
    ) {
        this.client = client;
        this.uvicCalendarArchiveUrl = uvicCalendarArchiveUrl;
        this.courseCatalogApiEndpoint = courseCatalogApiEndpoint;
        this.courseDetailApiEndpoint = courseDetailApiEndpoint;
        this.batchSize = batchSize;
    }

    private async fetchApiTermId(term: string, type: CalendarType) {
        const createCacheKey = (term: string, type: CalendarType) => {
            return `${term}-${type}`;
        };

        if (this.termIdCacheMap.has(createCacheKey(term, type))) {
            return this.termIdCacheMap.get(createCacheKey(term, type));
        }

        const url = this.uvicCalendarArchiveUrl.replace("{term}", term).replace("{type}", type);
        const pageRes = await this.client.get(url, {
            responseType: ResponseType.Text,
        });
        const pageHtml: string = await pageRes.data.toString();

        const regex = /window\.catalogId='(.+?)'/;
        const matches = pageHtml.match(regex);
        if (matches && matches.length > 1) {
            const catalogId = matches[1];
            const idRegex = /[0-9a-f]{24}/;
            if (!idRegex.test(catalogId)) {
                throw new Error(`Invalid catalogId: ${catalogId}`);
            } else {
                this.termIdCacheMap.set(createCacheKey(term, type), catalogId);
                return catalogId;
            }
        }

        return null;
    }
    

    public async fetchCourses(term: string, type: CalendarType) {
        const catalogId = await this.fetchApiTermId(term, type);

        if (!catalogId) {
            throw new Error("Could not fetch catalogId");
        }

        const url = this.courseCatalogApiEndpoint.replace("{catalogId}", catalogId);

        const coursesCalendarRes = await this.client.get(url);

        const coursesCalendar: CalendarCatalogCourse[] = coursesCalendarRes.data;

        return coursesCalendar;
    }

    public async fetchCoursesWithDetail(term: string, type: CalendarType) {
        const calendar = await this.fetchCourses(term, type);
        const calendarWithCourseDetail: (CalendarCatalogCourse & {
            courseDetail: CalendarCourseDetail;
        })[] = [];

        for (let i = 0; i < calendar.length; i += this.batchSize) {
            const sliceOfCwcd = await Promise.all(
                calendar.slice(i, i + this.batchSize).map(async (c) => {
                    return {
                        ...c,
                        courseDetail: await this.fetchCourseDetail(term, type, c.pid),
                    };
                })
            );

            calendarWithCourseDetail.push(...sliceOfCwcd);
        }

        return calendarWithCourseDetail;
    }

    public async fetchCourseDetail(term: string, type: CalendarType, pid: string) {
        const catalogId = await this.fetchApiTermId(term, type);

        if (!catalogId) {
            throw new Error("Could not fetch catalogId");
        }

        const url = this.courseDetailApiEndpoint
            .replace("{catalogId}", catalogId)
            .replace("{pid}", pid);

        const courseCalendarRes = await this.client.get(url);

        const courseCalendar: CalendarCourseDetail = courseCalendarRes.data;

        return courseCalendar;
    }
}
