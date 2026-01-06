import { useEffect } from "react";

/**
 * Admin Index Page - Main hub for admin tools.
 * This is a simple placeholder page for now.
 */
export function AdminIndex() {
    // Add noindex meta tag to prevent search engine indexing
    useEffect(() => {
        const meta = document.createElement("meta");
        meta.name = "robots";
        meta.content = "noindex, nofollow";
        document.head.appendChild(meta);

        return () => {
            document.head.removeChild(meta);
        };
    }, []);

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">🔐 Admin Panel</h1>
                <p className="text-neutral-400 text-lg">
                    Esto es el admin
                </p>
            </div>
        </div>
    );
}

export default AdminIndex;
