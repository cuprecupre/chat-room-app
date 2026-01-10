import { useTranslation } from "react-i18next";
import { Button } from "./ui/Button";
import { InvitationCard } from "./InvitationCard";

export function GameNotFoundCard({ roomId, onCancel, onCreate }) {
    const { t } = useTranslation('common');

    return (
        <InvitationCard
            roomId={roomId}
            title={t('invite.errors.roomNotFound.title')}
            subtitle={t('invite.errors.roomNotFound.subtitle')}
            isError={true}
        >
            {onCreate && (
                <Button onClick={onCreate} variant="primary" className="w-full mb-3">
                    {t('invite.buttons.createNewRoom')}
                </Button>
            )}
            <Button
                onClick={onCancel}
                variant={onCreate ? "ghost" : "primary"}
                className={onCreate ? "w-full text-neutral-500" : "w-full"}
            >
                {t('invite.buttons.backToHome')}
            </Button>
        </InvitationCard>
    );
}


