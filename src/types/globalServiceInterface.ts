export interface GlobalServiceInterface {
    getResource: <T>(resource: string, id?: string, queryParams?: Record<string, any>) => Promise<T>;
}