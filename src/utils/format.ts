export const formatFileSize = (bytes: number) => {
    const formatter = new Intl.NumberFormat("en", {
        notation: "compact",
        style: "unit",
        unit: "byte",
        unitDisplay: "narrow",
    });

    return formatter.format(bytes);
};
