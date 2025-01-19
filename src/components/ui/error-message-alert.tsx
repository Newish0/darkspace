import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { A } from "@solidjs/router";
import { XCircle } from "lucide-solid";
import { Show } from "solid-js";

type ErrorMessageProps = {
    onRetry?: () => void;
    message?: string;
    title?: string;
};

const ErrorMessageAlert = ({
    title = "Error",
    message = "Something went terribly wrong.",
    onRetry: handleRetry,
}: ErrorMessageProps) => {
    return (
        <Alert variant="destructive" class="w-full mx-auto">
            <XCircle class="h-4 w-4" />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription class="mt-2 flex flex-col items-start gap-3">
                <p>{message}</p>

                <div class="flex gap-2">
                    <Show when={handleRetry}>
                        <Button onClick={handleRetry} variant="destructive" size="sm">
                            Retry
                        </Button>
                    </Show>
                    <A href="/" class={buttonVariants({ variant: "link", size: "sm" })}>
                        Return Home
                    </A>
                </div>
            </AlertDescription>
        </Alert>
    );
};

export default ErrorMessageAlert;
