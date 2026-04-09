import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './AppContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DashboardHome from './pages/DashboardHome';
import Budget from './pages/Budget';
import AmountToPay from './pages/AmountToPay';
import AmountToReceive from './pages/AmountToReceive';
import Friends from './pages/Friends';
import Profile from './pages/Profile';
import AddExpense from './pages/AddExpense';
import PersonalExpenses from './pages/PersonalExpenses';
import SharedExpenses from './pages/SharedExpenses';

function App() {
  const { isLoggedIn, isBootstrapping } = useApp();

  if (isBootstrapping) {
    return (
      <div className="auth-page">
        <div className="glass-panel rounded-[32px] px-8 py-10 text-center text-white">
          Loading your expense workspace...
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />}
      >
        <Route index element={<DashboardHome />} />
        <Route path="add-expense" element={<AddExpense />} />
        <Route path="budget" element={<Budget />} />
        <Route path="pay" element={<AmountToPay />} />
        <Route path="receive" element={<AmountToReceive />} />
        <Route path="friends" element={<Friends />} />
        <Route path="personal-expenses" element={<PersonalExpenses />} />
        <Route path="shared-expenses" element={<SharedExpenses />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;
