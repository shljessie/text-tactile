import { Route, BrowserRouter as Router, Routes } from "react-router-dom"

import { BrowserRouter } from "react-router-dom";
import { Footer } from "./components/Footer";
import { ImageGenerator } from "./components/ImageGenerator";
import React from "react";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ImageGenerator />} />
      </Routes>
    </Router>
  );
}

export default App;
