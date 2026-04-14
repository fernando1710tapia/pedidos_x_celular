export interface GlobalServiceInterface {
    getResource: <T>(resource: string, id?: string, queryParams?: Record<string, any>) => Promise<T>;
    putResource?: <T>(resource: string, body: any, queryParams?: Record<string, any>) => Promise<T>;
}