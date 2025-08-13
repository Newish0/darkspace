import { buildApiSupportedVersionsUrl } from "./versions-url-builder";

type ProductVersionInfo = {
    ProductCode: string;
    LatestVersion: string;
    SupportedVersions: string[];
};

export class ProductVersionChecker {
    private supportedVersions: ProductVersionInfo[] = [];

    private constructor() {}

    /**
     *
     * @param apiSupportedVersionsUrl - Don't care about the version because supported version URL does not need ti
     * @returns
     */
    public static async create(
        apiSupportedVersionsUrl = buildApiSupportedVersionsUrl(window.location.origin)
    ) {
        const instance = new ProductVersionChecker();
        instance.supportedVersions = await instance.getSupportedVersions(apiSupportedVersionsUrl);
        return instance;
    }

    private async getSupportedVersions(apiSupportedVersionsUrl: string) {
        if (this.supportedVersions.length > 0) {
            return this.supportedVersions;
        }

        const res = await fetch(apiSupportedVersionsUrl);
        if (!res.ok) {
            throw new Error(`Failed to fetch supported versions: ${res.statusText}`);
        }
        const data: ProductVersionInfo[] = await res.json();

        return data;
    }

    public async getLatestLeVersion() {
        return (
            this.supportedVersions.find((v) => v.ProductCode === "le")?.LatestVersion ||
            this.getUnstableLeVersion()
        );
    }

    public async getLatestLpVersion() {
        return (
            this.supportedVersions.find((v) => v.ProductCode === "lp")?.LatestVersion ||
            this.getUnstableLeVersion()
        );
    }

    public async getUnstableLeVersion() {
        return "unstable" as const;
    }
}

export const productVersionChecker = await ProductVersionChecker.create();
