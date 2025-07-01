// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import TeamWorkload from './components/TeamWorkload';
import ActivityFeed from './components/ActivityFeed';
import Navigation from './components/Navigation';
import './App.css';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <div className="App">
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/team" element={<TeamWorkload />} />
            <Route path="/activity/:channel" element={<ActivityFeed />} />
            <Route path="/activity" element={<ActivityFeed />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;