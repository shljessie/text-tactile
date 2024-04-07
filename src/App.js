import { Route, BrowserRouter as Router, Routes, Switch } from "react-router-dom"

import Instructions from "./components/Instructions";
import Nav from './components/Nav';
import { Navigate } from "react-router-dom";
import React from "react";
import { SelectedAssetsProvider } from './components/SelectedAssetContext';
import { SonicTiles } from './components/SonicTiles';

function App() {
  return (
    <Router>
    <SelectedAssetsProvider>
      <Routes>
        <Route path="/" element={<SonicTiles />} />
      </Routes>
     </SelectedAssetsProvider>
    </Router>
  );
}

export default App;
