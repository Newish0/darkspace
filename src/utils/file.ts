/**
 * Downloads a file from a given URL and saves it with the specified filename.
 *
 * @param url - The URL of the file to be downloaded.
 * @param filename - The default filename to save the file as, if the URL does not provide one.
 */
export const saveFileFromUrl = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = url.split("/").pop() || filename;
    a.click();
};
