// Custom Error export Classes
export class ApiTokenError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ApiTokenError";
    }
}

export class EnrollmentUrlError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "EnrollmentUrlError";
    }
}

export class UserIdError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "UserIdError";
    }
}

export class ApiHeaderError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ApiHeaderError";
    }
}

export class EnrollmentFetchError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "EnrollmentFetchError";
    }
}

export class ImageFetchError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ImageFetchError";
    }
}
