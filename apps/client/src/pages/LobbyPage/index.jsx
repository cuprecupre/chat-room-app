import { Lobby } from "../../components/Lobby";

export function LobbyPage({ user, onCreateGame }) {
    return <Lobby user={user} onCreateGame={onCreateGame} />;
}
