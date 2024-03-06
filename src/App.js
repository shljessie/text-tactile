import { Route, BrowserRouter as Router, Routes, Switch } from "react-router-dom"

import AssetGenerator from './components/AssetGenerator';
import Canvas from './components/CanvasEditor';
import CanvasDemo from './components/DemoEditor';
import { ImageGenerator } from "./components/ImageGenerator";
import Instructions from "./components/Instructions";
import Nav from './components/Nav';
import { Navigate } from "react-router-dom";
import { PixelTable } from './components/PixelTable';
import { PixelTile } from './components/PixelTile';
import React from "react";
import { SelectedAssetsProvider } from './components/SelectedAssetContext';

function App() {
  return (
    <Router>
    <SelectedAssetsProvider>
    <Nav /> 
      <Routes>
        <Route path="/instructions" element={<Instructions />} />
        <Route path="/table" element={<PixelTable />} />
        <Route path="/tiles" element={<PixelTile />} />
      </Routes>
     </SelectedAssetsProvider>
    </Router>
  );
}

export default App;
