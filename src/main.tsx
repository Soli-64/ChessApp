import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import PlayerView from './pages/Player.tsx';
import DashboardView from './pages/Dashboard.tsx';
import AnalyzerView from './pages/Analyzer.tsx';
import StaticLayout from './pages/generics/StaticLayout.tsx';
import NotFoundView from './pages/generics/NotFound.tsx';

import './index.css';

const PageManager = () => {

  return (
    <Routes>
      <Route path='/' element={<StaticLayout/>}>
        <Route path='/dash' index element={<DashboardView />}></Route>
        <Route path='/play' element={<PlayerView />}></Route>
        <Route path='/analyze' element={<AnalyzerView />}></Route>
      </Route>
      <Route path='*' element={<NotFoundView />}></Route>
    </Routes>
  )

}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PageManager />
    </BrowserRouter>
  </StrictMode>,
)
