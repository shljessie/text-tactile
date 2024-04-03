import { Route, BrowserRouter as Router, Routes, Switch } from "react-router-dom"
import { useLocation } from 'react-router-dom';
import AssetGenerator from './components/AssetGenerator';
import Canvas from './components/CanvasEditor';
import CanvasDemo from './components/DemoEditor';
import { ImageGenerator } from "./components/ImageGenerator";
import Instructions from "./components/Instructions";
import { InteractionLab } from './components/InteractionLab';
import { RenderCanvas } from './components/RenderCanvas';
import { InteractionLabFive } from './components/InteractionLabFive';
import { InteractionLabFour } from './components/InteractionLabFour';
import { InteractionLabThree } from './components/InteractionLabThree';
import { InteractionLabTwo } from './components/InteractionLabTwo';
import Nav from './components/Nav';
import { Navigate } from "react-router-dom";
import { PixelTable } from './components/PixelTable';
import { PixelTile } from './components/PixelTile';
import { PixelTileNew } from './components/PixelTileNew';
import React from "react";
import { SelectedAssetsProvider } from './components/SelectedAssetContext';
import { SonicTiles } from './components/SonicTiles';

function App() {
  // const location = useLocation();
  return (
    <Router>
    <SelectedAssetsProvider>
      <Routes>
        <Route path="/instructions" element={<Instructions />} />
        <Route path="/table" element={<PixelTable />} />
        <Route path="/tiles" element={<PixelTile />} />
        <Route path="/tilesnew" element={<PixelTileNew />} />
        <Route path="/" element={<SonicTiles />} />
        <Route path="/lab" element={<InteractionLab />} />
        <Route path="/lab2" element={<InteractionLabTwo />} />
        <Route path="/lab3" element={<InteractionLabThree />} />
        <Route path="/lab4" element={<InteractionLabFour />} />
        <Route path="/lab5" element={<InteractionLabFive />} />
        <Route path="/render" element={<RenderCanvas />} />
      </Routes>
     </SelectedAssetsProvider>
    </Router>
  );
}

export default App;
