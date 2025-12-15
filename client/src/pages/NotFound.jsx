/**
 * 404 Not Found Page
 */
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import bellImg from '../assets/bell.png';

export function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="w-full min-h-[100dvh] flex items-center justify-center bg-neutral-950 text-white p-6">
            <div className="w-full max-w-sm text-center space-y-6">
                <div className="flex justify-center">
                    <img
                        src={bellImg}
                        alt="No encontrado"
                        className="w-24 h-24 rounded-full object-cover grayscale opacity-50"
                    />
                </div>
                <div>
                    <h1 className="text-4xl font-serif text-neutral-50 mb-2">404</h1>
                    <p className="text-neutral-400">Página no encontrada</p>
                </div>
                <div className="pt-4">
                    <Button
                        variant="primary"
                        onClick={() => navigate('/')}
                    >
                        Volver al inicio
                    </Button>
                </div>
            </div>
        </div>
    );
}
