import ErrorMessageAlert from "@/components/ui/error-message-alert";

const NotFound = () => {
    return (
        <div class="p-4">
            <ErrorMessageAlert
                title="Oops!"
                message="You ventured too far... This page doesn't exist!"
                onRetry={() => window.location.reload()}
            />
        </div>
    );
};

export default NotFound;
