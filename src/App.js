import { Route, BrowserRouter as Router, Routes } from "react-router-dom"
import Onboarding from './components/Onboarding';
import React from "react";
import { RenderCanvas } from './components/RenderCanvas';
import { SelectedAssetsProvider } from './components/SelectedAssetContext';
import { SonicTiles } from './components/SonicTiles';

function App() {
  return (
    <Router>
    <SelectedAssetsProvider>
      <Routes>
        <Route path="/sonic" element={<SonicTiles />} />
        <Route path="/" element={<Onboarding />} />
        <Route path="/render" element={<RenderCanvas />} />
      </Routes>
     </SelectedAssetsProvider>
    </Router>
  );
}

export default App;
