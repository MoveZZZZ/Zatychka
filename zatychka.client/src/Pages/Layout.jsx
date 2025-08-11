import { Outlet } from 'react-router-dom';
import Sidebar from '../Pages/Sidebar';
import { ToastProvider } from '../context/ToastContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
export default function Layout() {
    useDocumentTitle('Sharq'); 
    return (
        <ToastProvider>
            <div className="app-layout" style={{ display: 'flex', height: '100vh' }}>
                <Sidebar />
                <main style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                    <Outlet />
                </main>
            </div>
        </ToastProvider>
    );
}
