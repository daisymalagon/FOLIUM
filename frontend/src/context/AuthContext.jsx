import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(
    () => JSON.parse(localStorage.getItem('folium_usuario')) || null
  );

  const iniciarSesion = (datos) => {
    localStorage.setItem('folium_usuario', JSON.stringify(datos));
    setUsuario(datos);
  };

  const cerrarSesion = () => {
    localStorage.removeItem('folium_usuario');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}