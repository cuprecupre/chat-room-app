import { AppRouter } from "./routes/AppRouter";
import { CookieConsent } from "./components/CookieConsent";

export default function App() {
    return (
        <>
            <AppRouter />
            <CookieConsent />
        </>
    );
}
