export interface ErrorDetail {
    message: string;
    path?: string;
}

export interface ApiErrorResponse {
    message: string;
    code?: string;
    details?: ErrorDetail[];
}
