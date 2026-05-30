import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiCliente from '../services/apiCliente';

function Login() {
  const [modo, setModo]         = useState('login');
  const [nombre, setNombre]     = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [exito, setExito]       = useState('');
  const [cargando, setCargando] = useState(false);

  const { iniciarSesion } = useAuth();
  const navegar = useNavigate();

  const manejarLogin = async (e) => {
    e.preventDefault();
    setError(''); setExito('');
    if (!email || !password) { setError('Completa todos los campos.'); return; }
    try {
      setCargando(true);
      const { data } = await apiCliente.post('/auth/login', { email, password });
      iniciarSesion({ ...data.usuario, token: data.token });
      navegar('/');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Correo o contraseña incorrectos.');
    } finally { setCargando(false); }
  };

  const manejarRegistro = async (e) => {
    e.preventDefault();
    setError(''); setExito('');
    if (!nombre || !email || !password) { setError('Completa todos los campos.'); return; }
    if (password.length < 6) { setError('La contraseña debe tener mínimo 6 caracteres.'); return; }
    try {
      setCargando(true);
      await apiCliente.post('/auth/registrar', { nombre, email, password });
      setExito('¡Cuenta creada! Ahora puedes iniciar sesión.');
      setModo('login');
      setNombre(''); setEmail(''); setPassword('');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al crear la cuenta.');
    } finally { setCargando(false); }
  };

  return (
    <div style={s.pagina}>
      <div style={s.caja}>
        <div style={s.logo}>
          <span style={s.logoIcono}>🍃</span>
          <span style={s.logoTexto}>Folium</span>
        </div>
        <p style={s.subtitulo}>Sistema de Gestión Documental</p>
        <div style={s.tabs}>
          <button style={modo==='login' ? s.tabActivo : s.tab}
            onClick={() => { setModo('login'); setError(''); setExito(''); }}>
            Iniciar sesión
          </button>
          <button style={modo==='registro' ? s.tabActivo : s.tab}
            onClick={() => { setModo('registro'); setError(''); setExito(''); }}>
            Crear cuenta
          </button>
        </div>
        {error && <div style={s.error}>{error}</div>}
        {exito && <div style={s.exito}>{exito}</div>}
        {modo === 'login' ? (
          <form onSubmit={manejarLogin}>
            <input style={s.input} type="email" placeholder="Correo electrónico"
              value={email} onChange={e => setEmail(e.target.value)} required />
            <input style={s.input} type="password" placeholder="Contraseña"
              value={password} onChange={e => setPassword(e.target.value)} required />
            <button style={cargando ? s.botonDis : s.boton} type="submit" disabled={cargando}>
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        ) : (
          <form onSubmit={manejarRegistro}>
            <input style={s.input} type="text" placeholder="Nombre completo"
              value={nombre} onChange={e => setNombre(e.target.value)} required />
            <input style={s.input} type="email" placeholder="Correo electrónico"
              value={email} onChange={e => setEmail(e.target.value)} required />
            <input style={s.input} type="password" placeholder="Contraseña (mín. 6 caracteres)"
              value={password} onChange={e => setPassword(e.target.value)} required />
            <button style={cargando ? s.botonDis : s.boton} type="submit" disabled={cargando}>
              {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const s = {
  pagina:    { display:'flex', justifyContent:'center', alignItems:'center',
               minHeight:'100vh', background:'linear-gradient(135deg, #1A3557 0%, #2E6DA4 100%)' },
  caja:      { background:'white', padding:'40px', borderRadius:'16px',
               boxShadow:'0 8px 32px rgba(0,0,0,0.2)', width:'380px' },
  logo:      { display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginBottom:'8px' },
  logoIcono: { fontSize:'36px' },
  logoTexto: { fontSize:'32px', fontWeight:'bold', color:'#1A3557', fontFamily:'sans-serif' },
  subtitulo: { textAlign:'center', color:'#888', fontSize:'14px', marginBottom:'24px', fontFamily:'sans-serif' },
  tabs:      { display:'flex', marginBottom:'20px', borderRadius:'8px', overflow:'hidden', border:'1px solid #e0e0e0' },
  tab:       { flex:1, padding:'10px', background:'#f5f5f5', border:'none', cursor:'pointer', fontSize:'14px', color:'#666', fontFamily:'sans-serif' },
  tabActivo: { flex:1, padding:'10px', background:'#1A3557', border:'none', cursor:'pointer', fontSize:'14px', color:'white', fontWeight:'bold', fontFamily:'sans-serif' },
  input:     { width:'100%', padding:'12px', marginBottom:'12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'14px', boxSizing:'border-box', fontFamily:'sans-serif' },
  boton:     { width:'100%', padding:'13px', background:'#2E6DA4', color:'white', border:'none', borderRadius:'8px', fontSize:'15px', cursor:'pointer', fontFamily:'sans-serif', fontWeight:'bold' },
  botonDis:  { width:'100%', padding:'13px', background:'#aaa', color:'white', border:'none', borderRadius:'8px', fontSize:'15px', cursor:'not-allowed', fontFamily:'sans-serif' },
  error:     { background:'#fdecea', color:'#c0392b', padding:'10px 14px', borderRadius:'8px', marginBottom:'14px', fontSize:'13px', fontFamily:'sans-serif' },
  exito:     { background:'#eafaf1', color:'#1e7a4a', padding:'10px 14px', borderRadius:'8px', marginBottom:'14px', fontSize:'13px', fontFamily:'sans-serif' },
};

export default Login;