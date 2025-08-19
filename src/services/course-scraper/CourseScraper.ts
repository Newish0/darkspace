import { type IHttpClient, ResponseType } from "./IHttpClient";
import { type BannerAPIResponse, type ICourse } from "./types";
import { decodeHtmlEntities } from "./utils";

type ProgressCallback = (progress: number, elapse: number) => void;

export class CourseScraper {
    private apiUrl: string;
    private pageMaxSize: number;
    private client: IHttpClient;
    private defaultHeaders: Record<string, string | undefined> = {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36",
    };

    constructor(
        client: IHttpClient,
        { apiUrl = "https://banner.uvic.ca/StudentRegistrationSsb/ssb", pageMaxSize = 250 } = {}
    ) {
        this.client = client;
        this.apiUrl = apiUrl;
        this.pageMaxSize = pageMaxSize;
    }

    private async getAndSetCookies(term: string) {
        const apiRoute = `${this.apiUrl}/classSearch/classSearch?term=${term}&txt_subject=ATWP&txt_courseNumber=135`;

        const response = await this.client.get(apiRoute, {
            headers: this.defaultHeaders,
            timeout: 30,
            responseType: ResponseType.Text,
        });

        if (!response.rawHeaders || !response.rawHeaders["set-cookie"]) {
            throw new Error("Failed to obtain cookies");
        }

        if (Array.isArray(response.rawHeaders["set-cookie"])) {
            this.defaultHeaders.cookie = response.rawHeaders["set-cookie"].join(";");
        } else {
            this.defaultHeaders.cookie = response.rawHeaders["set-cookie"];
        }
    }

    private validateTerm(term: string) {
        const regex = /^\d{4}(05|09|01)$/;

        if (!regex.test(term)) {
            throw new Error(
                `Invalid term: '${term}'. Must be in the format 'YYYY05' or 'YYYY09' or 'YYYY01'`
            );
        }
    }

    async scrapeCourses(term: string, progressCallback?: ProgressCallback): Promise<ICourse[]> {
        let courses: ICourse[] = [];
        let currentPage = 0;
        let totalPages = 1; // Start with 1, will be updated after fetching the first page

        this.validateTerm(term);

        await this.getAndSetCookies(term);

        const startTime = performance.now();

        const response = await this.fetchPage(term, currentPage);
        const data = response.data as BannerAPIResponse;

        if (data.success && data.data) {
            courses = courses.concat(data.data);
            totalPages = data.totalCount;
        }

        currentPage += data.data?.length ?? 0;

        // call callback function if provided to give progress.
        if (progressCallback)
            progressCallback(currentPage / totalPages, performance.now() - startTime);

        // NOTE: I'm not sure if this is the best way to do this.
        //       But if data is null, count that as an error and quit since that ain't a valid response.
        if (!data.data) {
            throw new Error(`Failed to fetch courses. Data is null while fetching courses`);
        }

        const conCurFetches: Promise<void>[] = [];
        for (let cp = currentPage; cp < totalPages; cp += data.data.length) {
            conCurFetches.push(
                this.fetchPage(term, cp).then((response) => {
                    const data = response.data as BannerAPIResponse;

                    if (data.success && data.data) {
                        courses = courses.concat(data.data);
                        totalPages = data.totalCount;
                    }

                    currentPage += data.data.length;

                    // call callback function if provided to give progress.
                    if (progressCallback)
                        progressCallback(currentPage / totalPages, performance.now() - startTime);
                })
            );
        }

        await Promise.all(conCurFetches);

        // Ensure all string fields are parsed from html entities to strings recursively
        courses.forEach((course: any) => {
            const parseObj = (obj: any) => {
                Object.keys(obj).forEach((key) => {
                    if (typeof obj[key] === "string") {
                        obj[key] = decodeHtmlEntities(obj[key]);
                    } else if (typeof obj[key] === "object") {
                        if (obj[key] !== null) parseObj(obj[key]);
                    } else if (Array.isArray(obj[key])) {
                        obj[key].forEach((item: any) => {
                            if (typeof item === "object") {
                                if (item !== null) parseObj(item);
                            }
                        });
                    }
                });
            };

            parseObj(course);
        });

        return courses;
    }

    private async fetchPage(term: string, pageOffset: number) {
        const url = `${this.apiUrl}/searchResults/searchResults?txt_term=${term}&pageOffset=${pageOffset}&pageMaxSize=${this.pageMaxSize}`;

        // console.log("FETCH", url);
        return await this.client.get(url, {
            timeout: 30,
            responseType: ResponseType.JSON,
            headers: {
                ...this.defaultHeaders,
                host: "banner.uvic.ca",
                referer:
                    "https://banner.uvic.ca/StudentRegistrationSsb/ssb/classSearch/classSearch",
            },
        });
    }
}
