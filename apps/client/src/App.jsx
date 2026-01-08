import { AuthProvider } from "./context/AuthContext";
import { AppRouter } from "./routes/AppRouter";
// import { CookieConsent } from "./components/CookieConsent";

export default function App() {
    return (
        <AuthProvider>
            <AppRouter />
            {/* <CookieConsent /> */}
        </AuthProvider>
    );
}
