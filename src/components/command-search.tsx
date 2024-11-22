import { Doc4Index } from "@/services/index-service";
import { createSignal, For, Match, Show, Switch } from "solid-js";
import { Button } from "~/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "~/components/ui/command";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";

import { useCommandSearch } from "@/hooks/search";
import { A, useNavigate } from "@solidjs/router";
import {
    BookOpenIcon,
    FileIcon,
    FolderIcon,
    GraduationCapIcon,
    RssIcon,
    SearchIcon,
    TimerIcon
} from "lucide-solid";
import Kbd from "./ui/kbd";

function DocIcon(props: { type: Doc4Index["type"]; class?: string }) {
    return (
        <Switch>
            <Match when={props.type === "module"}>
                <FolderIcon class={props.class} />
            </Match>
            <Match when={props.type === "topic"}>
                <FileIcon class={props.class} />
            </Match>
            <Match when={props.type === "assignment"}>
                <BookOpenIcon class={props.class} />
            </Match>
            <Match when={props.type === "quiz"}>
                <TimerIcon class={props.class} />
            </Match>
            <Match when={props.type === "grade"}>
                <GraduationCapIcon class={props.class} />
            </Match>
            <Match when={props.type === "announcement"}>
                <RssIcon class={props.class} />
            </Match>
        </Switch>
    );
}

export function CommandSearch() {
    const [open, setOpen] = createSignal(false);

    const { query, setQuery, results } = useCommandSearch();
    const navigate = useNavigate();

    const handleSelect = (item: Doc4Index) => {
        setOpen(false);
        navigate(item.dsUrl);
    };

    return (
        <Dialog open={open()} onOpenChange={setOpen}>
            <DialogTrigger
                as={Button<"button">}
                variant={"outline"}
                class="gap-8 text-muted-foreground hover:text-foreground"
            >
                <div class="flex items-center gap-2">
                    <SearchIcon size={16} />
                    <span>Search...</span>
                </div>
                <div class="space-x-2 h-min hidden xl:block">
                    <Kbd>Ctrl</Kbd>
                    <Kbd>P</Kbd>
                </div>
            </DialogTrigger>
            <DialogContent class="p-0">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={"Search items..."}
                        value={query()}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        <Show when={results().length === 0}>
                            <CommandEmpty>
                                <div>No results found.</div>
                                <div class="text-xs">Make sure you have preloaded all content.</div>
                            </CommandEmpty>
                        </Show>
                        <CommandGroup>
                            <For each={results().slice(0, 20)}>
                                {(item) => (
                                    <CommandItem
                                        value={item.name}
                                        onSelect={() => handleSelect(item)}
                                    >
                                        <A
                                            class="flex items-center gap-2 overflow-hidden"
                                            href={item.dsUrl}
                                        >
                                            <DocIcon type={item.type} class="flex-shrink-0" />
                                            <div class="overflow-hidden">
                                                <p class="truncate">{item.name}</p>
                                                <p class="text-xs text-muted-foreground truncate">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </A>
                                    </CommandItem>
                                )}
                            </For>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </DialogContent>
        </Dialog>
    );
}
