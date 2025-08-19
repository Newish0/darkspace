
export interface IFaculty {
    bannerId: string;
    category: string | null;
    class: string;
    courseReferenceNumber: string;
    displayName: string;
    emailAddress: string;
    primaryIndicator: boolean;
    term: string;
}

export interface IMeetingTime {
    beginTime: string;
    building: string;
    buildingDescription: string | null;
    campus: string | null;
    campusDescription: string | null;
    category: string;
    class: string;
    courseReferenceNumber: string;
    creditHourSession: number;
    endDate: string;
    endTime: string;
    friday: boolean;
    hoursWeek: number;
    meetingScheduleType: string;
    meetingType: string;
    meetingTypeDescription: string;
    monday: boolean;
    room: string;
    saturday: boolean;
    startDate: string;
    sunday: boolean;
    term: string;
    thursday: boolean;
    tuesday: boolean;
    wednesday: boolean;
}

export interface IMeetingFaculty {
    category: string;
    class: string;
    courseReferenceNumber: string;
    faculty: IFaculty[];
    meetingTime: IMeetingTime;
    term: string;
}

export interface ICourse {
    id: number;
    term: string;
    termDesc: string;
    courseReferenceNumber: string;
    partOfTerm: string;
    courseNumber: string;
    subject: string;
    subjectDescription: string;
    sequenceNumber: string;
    campusDescription: string;
    scheduleTypeDescription: string;
    courseTitle: string;
    creditHours: number;
    maximumEnrollment: number;
    enrollment: number;
    seatsAvailable: number;
    waitCapacity: number;
    waitCount: number;
    waitAvailable: number;
    crossList: string | null;
    crossListCapacity: number | null;
    crossListCount: number | null;
    crossListAvailable: number | null;
    creditHourHigh: number | null;
    creditHourLow: number;
    creditHourIndicator: string | null;
    openSection: boolean;
    linkIdentifier: string | null;
    isSectionLinked: boolean;
    subjectCourse: string;
    faculty: IFaculty[];
    meetingsFaculty: IMeetingFaculty[];
    reservedSeatSummary: unknown;
    sectionAttributes: unknown;
    instructionalMethod: string;
    instructionalMethodDescription: string;
}

export interface BannerAPIResponse {
    success: boolean;
    totalCount: number;
    data: ICourse[];
    pageOffset: number;
    pageMaxSize: number;
    sectionsFetchedCount: number;
    pathMode: string | null;
    searchResultsConfigs: unknown;
    ztcEncodedImage: string | null;
    allowHoldRegistration: boolean | null;
}

/**
 * The query result of catalog search 
 */
export interface CalendarCatalogCourse {
    __catalogCourseId: string;
    __passedCatalogQuery: boolean;
    dateStart: string;
    pid: string;
    id: string;
    title: string;
    subjectCode: {
        name: string;
        description: string;
        id: string;
        linkedGroup: string;
    };
    catalogActivationDate: string;
    _score: number;
}

/**
 * The full detail of the course when viewing them individually
 */
export interface CalendarCourseDetail {
    __passedCatalogQuery: boolean;
    formerlyNotesText?: string;
    groupFilter1?: {
        name: string;
        id: string;
        customFields?: unknown;
    };
    description?: string;
    pid: string;
    title?: string;
    supplementalNotes?: string;
    __catalogCourseId?: string;
    proForma?: string;
    dateStart?: string;
    credits?: {
        credits?: {
            min: string;
            max: string;
        };
        value: string;
        chosen: string;
    };
    preAndCorequisites?: string;
    preOrCorequisites?: string;
    id?: string;
    subjectCode?: {
        name: string;
        description: string;
        id: string;
        linkedGroup: string;
    };
    catalogActivationDate?: string;
    hoursCatalogText?: string;
    _score?: number;
}



