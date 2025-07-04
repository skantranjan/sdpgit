import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CmDashboard from './pages/CmDashboard';
import CmSkuDetail from './pages/CmSkuDetail';

import './assets/css/styles.css';
import './assets/css/remix-icon.css';
import './assets/css/multi-select.css';
import './assets/css/pagination.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CmDashboard />} />
        <Route path="/cm/:cmCode" element={<CmSkuDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
