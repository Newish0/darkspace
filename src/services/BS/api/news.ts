// NewsService.ts

import { NewsItem } from "./dtos/news";
import { ApiError } from "./dtos/api";
import { Result, ok, err } from "neverthrow";
import { D2lApiService } from "./d2l-api-service";

export class NewsService extends D2lApiService {
    /**
     * Fetch all news items for a given org unit.
     */
    public async getNewsItems(orgUnitId: string): Promise<Result<NewsItem[], ApiError>> {
        try {
            const url = this.urlBuilder.buildNewsUrl(orgUnitId);
            const res = await fetch(url);

            if (!res.ok) {
                return err({
                    status: res.status,
                    statusText: res.statusText,
                    message: "Failed to fetch news items",
                });
            }

            const data: NewsItem[] = await res.json();
            return ok(data);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            return err({
                message: `Failed to fetch news items: ${errorMessage}`,
            });
        }
    }

    /**
     * Fetch a single news item by ID.
     */
    public async getNewsItem(
        orgUnitId: string,
        newsId: string
    ): Promise<Result<NewsItem, ApiError>> {
        try {
            const url = this.urlBuilder.buildNewsItemUrl(orgUnitId, newsId);
            const res = await fetch(url);

            if (!res.ok) {
                return err({
                    status: res.status,
                    statusText: res.statusText,
                    message: `Failed to fetch news item with ID ${newsId}`,
                });
            }

            const data: NewsItem = await res.json();
            return ok(data);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            return err({
                message: `Failed to fetch news item ${newsId}: ${errorMessage}`,
            });
        }
    }

    /**
     * Fetch a news attachment by ID.
     */
    public async getNewsAttachment(
        orgUnitId: string,
        newsId: string,
        attachmentId: string
    ): Promise<Result<Blob, ApiError>> {
        try {
            const url = this.urlBuilder.buildNewsItemAttachmentUrl(orgUnitId, newsId, attachmentId);
            const res = await fetch(url);

            if (!res.ok) {
                return err({
                    status: res.status,
                    statusText: res.statusText,
                    message: `Failed to fetch news attachment for news item with ID ${newsId}`,
                });
            }

            const data: Blob = await res.blob();
            return ok(data);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            return err({
                message: `Failed to fetch news attachment for news item ${newsId}: ${errorMessage}`,
            });
        }
    }
}

export const newsService = new NewsService();
