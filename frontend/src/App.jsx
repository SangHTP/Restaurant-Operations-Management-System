import { AuthProvider } from './context/AuthContext';
import { ConfirmProvider } from './context/ConfirmContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
    return (
        <AuthProvider>
            <ConfirmProvider>
                <AppRoutes />
            </ConfirmProvider>
        </AuthProvider>
    );
}