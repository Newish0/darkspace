import { getBaseDocument } from "../base-doc";

const SELECTORS = {
    USER_PROFILE: "d2l-profile-image-base",
};

export async function getUserProfile() {
    const doc = await getBaseDocument();
    const profileEln = doc.querySelector(SELECTORS.USER_PROFILE);

    return {
        first: profileEln?.getAttribute("first-name") || undefined,
        last: profileEln?.getAttribute("last-name") || undefined,
        profilePic: profileEln?.getAttribute("href") || undefined,
    };
}
