import { Route, BrowserRouter as Router, Routes, Switch } from "react-router-dom"

import { InteractionLab } from './components/InteractionLab';
import { InteractionLabFive } from './components/InteractionLabFive';
import { InteractionLabFour } from './components/InteractionLabFour';
import { InteractionLabThree } from './components/InteractionLabThree';
import { InteractionLabTwo } from './components/InteractionLabTwo';
import Nav from './components/Nav';
import { Navigate } from "react-router-dom";
import Onboarding from './components/Onboarding';
import React from "react";
import { RenderCanvas } from './components/RenderCanvas';
import { SelectedAssetsProvider } from './components/SelectedAssetContext';
import { SonicTiles } from './components/SonicTiles';
import { SonicTilesVideo } from './components/SonicTiles_video';

function App() {
  return (
    <Router>
    <SelectedAssetsProvider>
      <Routes>
        <Route path="/sonic" element={<SonicTiles />} />
        <Route path="/sonicVideo" element={<SonicTilesVideo />} />
        <Route path="/" element={<Onboarding />} />
        <Route path="/render" element={<RenderCanvas />} />
        <Route path="/lab" element={<InteractionLab />} />
        <Route path="/lab2" element={<InteractionLabTwo />} />
        <Route path="/lab3" element={<InteractionLabThree />} />
        <Route path="/lab4" element={<InteractionLabFour />} />
        <Route path="/lab5" element={<InteractionLabFive />} />
      </Routes>
     </SelectedAssetsProvider>
    </Router>
  );
}

export default App;
