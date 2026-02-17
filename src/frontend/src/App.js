import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// --- Placeholder Components (We will move these to separate files later) ---
const Navbar = () => (
  <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
    <div className="container">
      <Link className="navbar-brand" to="/">Felicity IIIT</Link>
      <div className="collapse navbar-collapse">
        <ul className="navbar-nav ms-auto">
          <li className="nav-item"><Link className="nav-link" to="/login">Login</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/register">Register</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/dashboard">Dashboard</Link></li>
        </ul>
      </div>
    </div>
  </nav>
);

const Home = () => <div className="container text-center"><h1>Welcome to Felicity</h1></div>;
const Login = () => <div className="container"><h2>Login Page</h2></div>;
const Register = () => <div className="container"><h2>Register Page</h2></div>;
const Dashboard = () => <div className="container"><h2>Dashboard</h2></div>;

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;