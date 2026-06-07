import React from 'react'; 

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'; 

import { AuthProvider, useAuth } from './context/AuthContext'; 

import Login          from './pages/Login'; 

import Panel          from './pages/Panel'; 

import SubirDocumento from './pages/SubirDocumento'; 

import Admin          from './pages/Admin'; 

import Dashboard      from './pages/Dashboard'; 

import Carpetas       from './pages/Carpetas'; 

 

function RutaPrivada({ children }) { 

  const { usuario } = useAuth(); 

  return usuario ? children : <Navigate to='/login' replace />; 

} 

 

function App() { 

  return ( 

    <AuthProvider> 

      <BrowserRouter> 

        <Routes> 

          <Route path='/login' element={<Login />} /> 

          <Route path='/' element={ 

            <RutaPrivada><Panel /></RutaPrivada>} /> 

          <Route path='/subir' element={ 

            <RutaPrivada><SubirDocumento /></RutaPrivada>} /> 

          <Route path='/admin' element={ 

            <RutaPrivada><Admin /></RutaPrivada>} /> 

          <Route path='/dashboard' element={ 

            <RutaPrivada><Dashboard /></RutaPrivada>} /> 

          <Route path='/carpetas' element={ 

            <RutaPrivada><Carpetas /></RutaPrivada>} /> 

          <Route path='*' element={<Navigate to='/' replace />} /> 

        </Routes> 

      </BrowserRouter> 

    </AuthProvider> 

  ); 

} 

 

export default App; 