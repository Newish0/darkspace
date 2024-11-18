export function debounce(fn: () => void, delay: number) {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    return () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(fn, delay);
    };
}

