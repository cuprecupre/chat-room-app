import { Outlet } from "react-router-dom";

export function UnauthenticatedLayout() {
    return (
        <div className="bg-neutral-950 text-white min-h-[100dvh] font-sans">
            <div className="w-full min-h-[100dvh] p-0">
                <Outlet />
            </div>
        </div>
    );
}
