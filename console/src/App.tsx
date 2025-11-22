import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TaskDetail from './pages/TaskDetail';
import NewTask from './pages/NewTask';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="container">
            <h1>
              <Link to="/" className="logo">Morgus Agent</Link>
            </h1>
            <nav>
              <Link to="/" className="nav-link">Dashboard</Link>
              <Link to="/new" className="nav-link btn-primary">New Task</Link>
            </nav>
          </div>
        </header>
        
        <main className="app-main">
          <div className="container">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/task/:id" element={<TaskDetail />} />
              <Route path="/new" element={<NewTask />} />
            </Routes>
          </div>
        </main>
        
        <footer className="app-footer">
          <div className="container">
            <p>&copy; 2025 Morgus Autonomous Agent System | Powered by OpenAI, Supabase & Cloudflare</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
