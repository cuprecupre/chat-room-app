import { Button } from "./ui/Button";
import { InvitationCard } from "./InvitationCard";

export function GameNotFoundCard({ roomId, onCancel, onCreate }) {
    return (
        <InvitationCard
            roomId={roomId}
            title="La sala ya no existe"
            subtitle="Crea una nueva sala para invitar a tus amigos a jugar otra partida."
            isError={true}
        >
            {onCreate && (
                <Button onClick={onCreate} variant="primary" className="w-full mb-3">
                    Crear nueva sala
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


