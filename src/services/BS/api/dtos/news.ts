
import { D2LID, UTCDateTime, RichText, FileAttachment } from "./common";

export type NewsItem = {
    Id: D2LID;
    IsHidden: boolean;
    Attachments: FileAttachment[];
    Title: string;
    Body: RichText;
    CreatedBy: D2LID | null;
    CreatedDate: UTCDateTime | null;
    LastModifiedBy: D2LID | null;
    LastModifiedDate: UTCDateTime | null;
    StartDate: UTCDateTime | null;
    EndDate: UTCDateTime | null;
    IsGlobal: boolean;
    IsPublished: boolean;
    ShowOnlyInCourseOfferings: boolean;
    IsAuthorInfoShown: boolean;
    IsPinned: boolean;
    PinnedDate: UTCDateTime | null;   // Added with LE API v1.81
    IsStartDateShown: boolean;        // Added with LE API v1.75
    SortOrder: number;                // Added with LE API v1.75
};
