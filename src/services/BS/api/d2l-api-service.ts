import { urlBuilder as defaultUrlBuilder } from "./url-builder";

export abstract class D2lApiService {
    protected urlBuilder = defaultUrlBuilder;

    public constructor(urlBuilder = defaultUrlBuilder) {
        this.urlBuilder = urlBuilder;
    }
}
