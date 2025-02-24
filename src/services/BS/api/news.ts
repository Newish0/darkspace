import { buildNewsUrl } from "../url";

// Type for D2L ID
type D2LID = number;

// Type for File attachment
export interface FileAttachment {
    FileId: D2LID;
    FileName: string;
    Size: number; // Changed from FileSize to Size based on actual response
}

// Type for Rich Text
interface RichText {
    Text: string;
    Html: string;
}

// Main News Item interface
export interface NewsItem {
    Id: D2LID;
    IsHidden: boolean;
    Attachments: FileAttachment[];
    Title: string;
    Body: RichText;
    StartDate: string | null; // UTCDateTime
    EndDate: string | null; // UTCDateTime
    IsGlobal: boolean;
    IsPublished: boolean;
    ShowOnlyInCourseOfferings: boolean;
}

export async function getNewsItems(orgUnitId: string, leVersion = "1.9"): Promise<NewsItem[]> {
    const url = buildNewsUrl(orgUnitId, leVersion);

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch news: ${res.statusText}`);
    }
    const data = await res.json();

    return data;
}
