import { Navigate } from 'react-router-dom';
import useAuthCheck from '../hooks/useAuthCheck';

import Spinner from '../components/Spinner';

export default function PrivateRoute({ children }) {
    const { isAuthenticated, loading } = useAuthCheck();

    if (loading) {
        return <Spinner center label="Загрузка…" size={30} />;
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
}