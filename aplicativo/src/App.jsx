import { Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Dashboard from './Pages/Dashboard';
import Payment from './Pages/Payment';
import Transactions from './Pages/Transactions';
import Cards from './Pages/Cards';
import Profile from './Pages/Profile';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="payment" element={<Payment />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="cards" element={<Cards />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;