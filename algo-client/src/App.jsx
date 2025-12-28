import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LearnSpace from './pages/LearnSpace';
import LandingPage from './pages/LandingPage';

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<LandingPage />} />
          <Route path="/learn-space" element={<LearnSpace />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
