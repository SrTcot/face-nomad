import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WelcomeScreen from './screens/WelcomeScreen';
import CaptureScreen from './screens/CaptureScreen';
import ValidationScreen from './screens/ValidationScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import RegisterWorkerScreen from './screens/RegisterWorkerScreen';
import ManageWorkersScreen from './screens/ManageWorkersScreen';
import LoginScreen from './screens/LoginScreen';
import AdminPanel from './screens/AdminPanel';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <WelcomeScreen />
          </PrivateRoute>
        } />
        
        <Route path="/capture" element={
          <PrivateRoute requiredPermission="register_attendance">
            <CaptureScreen />
          </PrivateRoute>
        } />
        
        <Route path="/validation" element={
          <PrivateRoute requiredPermission="register_attendance">
            <ValidationScreen />
          </PrivateRoute>
        } />
        
        <Route path="/history" element={
          <PrivateRoute>
            <HistoryScreen />
          </PrivateRoute>
        } />
        
        <Route path="/settings" element={
          <PrivateRoute>
            <SettingsScreen />
          </PrivateRoute>
        } />
        
        <Route path="/register" element={
          <PrivateRoute requiredPermission="manage_workers">
            <RegisterWorkerScreen />
          </PrivateRoute>
        } />
        
        <Route path="/manage-workers" element={
          <PrivateRoute requiredPermission="manage_workers">
            <ManageWorkersScreen />
          </PrivateRoute>
        } />
        
        <Route path="/admin" element={
          <PrivateRoute requiredPermission="manage_users">
            <AdminPanel />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
