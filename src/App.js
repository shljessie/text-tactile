import { Route, BrowserRouter as Router, Routes, Switch } from "react-router-dom"

import AssetGenerator from './components/AssetGenerator';
import Canvas from './components/CanvasEditor';
import CanvasDemo from './components/DemoEditor';
import { ImageGenerator } from "./components/ImageGenerator";
import Instructions from "./components/Instructions";
import { Main } from './components/Main';
import Nav from './components/Nav';
import { Navigate } from "react-router-dom";
import React from "react";
import { SelectedAssetsProvider } from './components/SelectedAssetContext';

function App() {
  return (
    <Router>
    <SelectedAssetsProvider>
    <Nav /> {/* Include the Nav component here */}
      <Routes>
        <Route path="/" element={<ImageGenerator />} />
        <Route path="/assets" element={<AssetGenerator />} />
        <Route path="/canvas" element={<Canvas />} /> {/* New route for Canvas */}
        <Route path="/instructions" element={<Instructions />} />
        <Route path="/demo" element={<CanvasDemo />} />
        <Route path="/main" element={<Main />} />
      </Routes>
     </SelectedAssetsProvider>
    </Router>
  );
}

export default App;
