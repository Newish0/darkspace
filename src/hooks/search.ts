import { createSignal, createResource, createEffect } from "solid-js";
import { debounce } from "@solid-primitives/scheduled";
import MiniSearch, { SearchResult } from "minisearch";
import { Doc4Index, getDocsFromCachedContent } from "@/services/index-service";
import { getCachedContent } from "@/services/content-service";

export function useCommandSearch(minScore = 0.5) {
    const [query, setQuery] = createSignal("");
    const [results, setResults] = createSignal<Doc4Index[]>([]);

    // Create a resource for the search index
    const [searchIndex] = createResource(async () => {
        const miniSearch = new MiniSearch({
            fields: ["name", "description"],
            storeFields: ["name", "description", "dsUrl", "date", "contentUrl", "type"],
            searchOptions: {
                fuzzy: 0.2,

                boost: {
                    name: 2,
                },
                boostDocument(documentId, term, storedFields) {
                    const doc4Index = storedFields as Doc4Index;

                    if (doc4Index.type === "announcement") return 0.1;

                    return 1;
                },
            },
        });

        const cachedContent = await getCachedContent();
        const docs = await getDocsFromCachedContent(cachedContent);
        miniSearch.addAll(docs);
        return miniSearch;
    });

    // Debounced search function
    const performSearch = debounce((searchQuery: string) => {
        const index = searchIndex();
        if (!index) return;

        const searchResults = searchQuery.trim() ? index.search(searchQuery) : [];

        searchResults.filter((result) => result.score > minScore);

        setResults(searchResults as (SearchResult & Doc4Index)[]);
    }, 50);

    // Effect to trigger search when query changes
    createEffect(() => {
        const currentQuery = query();
        performSearch(currentQuery);
    });

    return {
        query,
        setQuery,
        results,
    } as const;
}
