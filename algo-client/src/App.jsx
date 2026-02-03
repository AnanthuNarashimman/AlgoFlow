import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react"

import LearnSpace from './pages/LearnSpace/LearnSpace';
import LandingPage from './pages/LandingPage/LandingPage';

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<LandingPage />} />
          <Route path="/learn-space" element={<LearnSpace />} />
        </Routes>
      </BrowserRouter>
      <Analytics />
    </>
  )
}

export default App
