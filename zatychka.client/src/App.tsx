import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Pages/Login';
import Register from './Pages/RegisterPage';
import Layout from './Pages/Layout';
import StatisticsPage from './Pages/StatisticsPage';
import BalancePage from './Pages/BalancePage';
import ReferalsPage from './Pages/ReferalProgram';
import Devices from './Pages/Devices';
import Notifications from './Pages/Notifications';
import Requisites from './Pages/Requisites';
import Disputes from './Pages/Disputes';
import Transactions from './Pages/Transactions';
import Workzone from './Pages/WorkZone';
import QuaziTrans from './Pages/QuasiPage';
import QuaziDis from './Pages/QuaziDisuptes';
import Settings from './Pages/SettingsPage';
import PrivateRoute from './components/PrivateRoute';

import { EditModeProvider } from './context/EditModeContext';
import { DataScopeProvider } from './context/DataScopeContext';

export default function App() {
    return (
        <EditModeProvider>
            <DataScopeProvider>
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register/trader" element={<Register />} />
                        <Route path="/register/merchant" element={<Register />} />
                        <Route
                            path="/"
                            element={
                                <PrivateRoute>
                                    <Layout />
                                </PrivateRoute>
                            }
                        >
                            <Route index element={<Navigate to="statistics" replace />} />
                            <Route path="statistics" element={<StatisticsPage />} />
                            <Route path="balance" element={<BalancePage />} />
                            <Route path="referrals" element={<ReferalsPage />} />
                            <Route path="payin/devices" element={<Devices />} />
                            <Route path="payin/notifications" element={<Notifications />} />
                            <Route path="payin/payment" element={<Requisites />} />
                            <Route path="payin/disputes" element={<Disputes />} />
                            <Route path="payin/transactions" element={<Transactions />} />
                            <Route path="payin/workspace" element={<Workzone />} />
                            <Route path="quasi/payment" element={<QuaziTrans />} />
                            <Route path="quasi/disuptes" element={<QuaziDis />} />
                            <Route path="settings" element={<Settings />} />
                        </Route>
                    </Routes>
                </Router>
            </DataScopeProvider>
        </EditModeProvider>
    );
}