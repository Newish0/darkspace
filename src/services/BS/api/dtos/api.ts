export type ApiResponseError = {
    status: number;
    statusText: string;
    message: string;
    data?: unknown;
};

export type UnknownError = {
    message: string;
};

export type ApiError = ApiResponseError | UnknownError;

export function isApiResponseError(error: ApiError): error is ApiResponseError {
    return "status" in error && "statusText" in error && "message" in error;
}
