import { getApiToken } from "./token";

export async function createApiHeader(): Promise<{ headers: { authorization: string } }> {
    const token = await getApiToken();
    return {
        headers: {
            authorization: `Bearer ${token}`,
        },
    };
}
