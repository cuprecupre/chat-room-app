import { Spinner } from "./Spinner";

export function PageLoader() {
    return (
        <div className="w-full h-[100dvh] flex items-center justify-center bg-neutral-950 text-white">
            <Spinner size="lg" />
        </div>
    );
}
