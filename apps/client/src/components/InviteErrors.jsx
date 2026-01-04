import { Button } from "./ui/Button";
import { InvitationCard } from "./InvitationCard";

export function GameNotFoundCard({ roomId, onCancel, onCreate }) {
    return (
        <InvitationCard
            roomId={roomId}
            title="La partida ya no existe"
            subtitle="No encontramos esta partida. Es posible que el anfitrión la haya cerrado o el enlace sea incorrecto."
            isError={true}
        >
            {onCreate && (
                <Button onClick={onCreate} variant="primary" className="w-full mb-3">
                    Crear nueva partida
                </Button>
            )}
            <Button
                onClick={onCancel}
                variant={onCreate ? "ghost" : "primary"}
                className={onCreate ? "w-full text-neutral-500" : "w-full"}
            >
                Volver al inicio
            </Button>
        </InvitationCard>
    );
}


