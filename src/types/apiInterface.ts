export interface ApiResponse <T> {
    statusCode: number;
    statusDescription: string | null;
    errorMessage: string | null;
    developerMessage: string;
    retorno: T[];
}


