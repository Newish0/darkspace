import { ColorModeProvider, ColorModeScript, createLocalStorageManager } from "@kobalte/core";
import { Separator } from "@/components/ui/separator";
import icon from "@/../public/icon/128.png";
import browser from "webextension-polyfill";
import { buttonVariants } from "@/components/ui/button";

const VERSION = __APP_ENV__.VERSION || "unknown";

const coursePlannerUrl = browser.runtime.getURL("src/pages/planner/index.html");

export default function Popup() {
    const storageManager = createLocalStorageManager("darkspace-ui-theme");
    return (
        <>
            <ColorModeScript storageType={storageManager.type} />
            <ColorModeProvider storageManager={storageManager}>
                <div class="bg-background text-foreground p-4 w-72 rounded-lg shadow-lg">
                    <div class="flex flex-col items-center text-center">
                        <div class="flex items-center gap-2 mb-2">
                            <img src="/icon/128.png" alt="Darkspace Logo" class="w-10 h-10" />
                            <h1 class="font-bold text-2xl">Darkspace</h1>
                        </div>

                        <p class="text-sm">
                            Brightspace reimagined; an alternative frontend built with sanity in
                            mind.
                        </p>
                    </div>

                    <div class="space-y-2 w-full my-4">
                        <a
                            href={coursePlannerUrl}
                            target="_blank"
                            class="block p-2 w-full rounded-md bg-background text-foreground hover:bg-accent"
                        >
                            Course Planner
                        </a>
                    </div>

                    <div class="flex items-center justify-between mt-4 pt-2 border-t border-border">
                        <div class="text-xs">Version: {VERSION}</div>
                        <a
                            href="https://github.com/Newish0/darkspace"
                            target="_blank"
                            rel="noopener noreferrer"
                            class={buttonVariants({
                                variant: "link",
                                size: "sm",
                                class: "text-xs",
                            })}
                        >
                            GitHub
                        </a>
                    </div>
                </div>
            </ColorModeProvider>
        </>
    );
}
