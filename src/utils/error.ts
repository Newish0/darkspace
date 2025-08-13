import { Result } from "neverthrow";

/**
 * Makes a Neverthrow result a throwable error.
 * For making error boundaries work.
 * @param r 
 * @returns
 */
export const asThrowable = async <T, E>(r: Result<T, E> | Promise<Result<T, E>>) => {
    const result = await r;
    return result.match(
        (v) => v,
        (e) => {
            throw e;
        }
    );
};
