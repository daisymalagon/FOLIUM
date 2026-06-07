import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiCliente from '../services/apiCliente';

function Login() {
  const [modo,     setModo]     = useState('login');
  const [nombre,   setNombre]   = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [exito,    setExito]    = useState('');
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
      setExito('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.');
      setModo('login');
      setNombre(''); setPassword('');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al crear la cuenta.');
    } finally { setCargando(false); }
  };

  const cambiarModo = (nuevoModo) => {
    setModo(nuevoModo);
    setError(''); setExito('');
    setNombre(''); setEmail(''); setPassword('');
  };

  return (
    <div style={s.pagina}>
      <div style={s.caja}>

        {/* Logo */}
        <div style={s.logoWrap}>
          <svg width="48" height="48" viewBox="0 0 100 100" fill="none">
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#7C3AED"/>
                <stop offset="50%"  stopColor="#2E6DA4"/>
                <stop offset="100%" stopColor="#10B981"/>
              </linearGradient>
            </defs>
            <path d="M15 85 L85 15 L55 50 L65 80 Z" fill="url(#grad)" opacity="0.9"/>
            <path d="M15 85 L55 50 L40 45 Z"        fill="url(#grad)" opacity="0.6"/>
            <path d="M55 50 L85 15 L70 60 Z"        fill="url(#grad)" opacity="0.4"/>
            <line x1="15" y1="85" x2="55" y2="50" stroke="white" strokeWidth="1.5" opacity="0.6"/>
            <line x1="55" y1="50" x2="85" y2="15" stroke="white" strokeWidth="1.5" opacity="0.6"/>
          </svg>
          <span style={s.logoTexto}>Folium</span>
        </div>
        <p style={s.subtitulo}>Sistema de Gestión Documental</p>

        {/* Tabs */}
        <div style={s.tabs}>
          <button
            style={modo === 'login' ? s.tabActivo : s.tab}
            onClick={() => cambiarModo('login')}>
            Iniciar sesión
          </button>
          <button
            style={modo === 'registro' ? s.tabActivo : s.tab}
            onClick={() => cambiarModo('registro')}>
            Crear cuenta
          </button>
        </div>

        {/* Mensajes */}
        {error && <div style={s.errorBox}>{error}</div>}
        {exito && <div style={s.exitoBox}>{exito}</div>}

        {/* Formulario login */}
        {modo === 'login' && (
          <form onSubmit={manejarLogin}>
            <input style={s.input} type="email" placeholder="Correo electrónico"
              value={email} onChange={e => setEmail(e.target.value)} required />
            <input style={s.input} type="password" placeholder="Contraseña"
              value={password} onChange={e => setPassword(e.target.value)} required />
            <button style={cargando ? s.botonDis : s.boton}
              type="submit" disabled={cargando}>
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        )}

        {/* Formulario registro */}
        {modo === 'registro' && (
          <form onSubmit={manejarRegistro}>
            <input style={s.input} type="text" placeholder="Nombre completo"
              value={nombre} onChange={e => setNombre(e.target.value)} required />
            <input style={s.input} type="email" placeholder="Correo electrónico"
              value={email} onChange={e => setEmail(e.target.value)} required />
            <input style={s.input} type="password"
              placeholder="Contraseña (mínimo 6 caracteres)"
              value={password} onChange={e => setPassword(e.target.value)} required />
            <button style={cargando ? s.botonDis : s.boton}
              type="submit" disabled={cargando}>
              {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        )}

        <p style={s.nota}>
          {modo === 'login'
            ? '¿No tienes cuenta? Crea una desde la pestaña superior.'
            : 'El administrador asignará tu rol una vez registrado.'}
        </p>
      </div>
    </div>
  );
}

const s = {
  pagina:   { display:'flex', justifyContent:'center', alignItems:'center',
              minHeight:'100vh',
              background:'linear-gradient(135deg, #1A3557 0%, #7C3AED 50%, #10B981 100%)' },
  caja:     { background:'white', padding:'40px', borderRadius:'20px',
              boxShadow:'0 20px 60px rgba(0,0,0,0.25)', width:'380px',
              maxWidth:'95vw' },
  logoWrap: { display:'flex', alignItems:'center', justifyContent:'center',
              gap:'10px', marginBottom:'6px' },
  logoTexto:{ fontSize:'32px', fontWeight:'bold', fontFamily:'sans-serif',
              background:'linear-gradient(135deg, #7C3AED, #2E6DA4, #10B981)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' },
  subtitulo:{ textAlign:'center', color:'#888', fontSize:'13px',
              marginBottom:'24px', fontFamily:'sans-serif' },
  tabs:     { display:'flex', marginBottom:'20px', borderRadius:'10px',
              overflow:'hidden', border:'1px solid #EDE9FE' },
  tab:      { flex:1, padding:'11px', background:'#F5F3FF', border:'none',
              cursor:'pointer', fontSize:'14px', color:'#7C3AED',
              fontFamily:'sans-serif', transition:'all 0.2s' },
  tabActivo:{ flex:1, padding:'11px',
              background:'linear-gradient(135deg, #7C3AED, #2E6DA4)',
              border:'none', cursor:'pointer', fontSize:'14px',
              color:'white', fontWeight:'bold', fontFamily:'sans-serif' },
  input:    { width:'100%', padding:'12px 14px', marginBottom:'12px',
              borderRadius:'10px', border:'1px solid #EDE9FE',
              fontSize:'14px', boxSizing:'border-box',
              fontFamily:'sans-serif', outline:'none',
              transition:'border-color 0.2s' },
  boton:    { width:'100%', padding:'13px',
              background:'linear-gradient(135deg, #7C3AED, #2E6DA4)',
              color:'white', border:'none', borderRadius:'10px',
              fontSize:'15px', cursor:'pointer', fontFamily:'sans-serif',
              fontWeight:'bold', marginTop:'4px',
              boxShadow:'0 4px 12px rgba(124,58,237,0.3)' },
  botonDis: { width:'100%', padding:'13px', background:'#D1D5DB',
              color:'white', border:'none', borderRadius:'10px',
              fontSize:'15px', cursor:'not-allowed',
              fontFamily:'sans-serif', marginTop:'4px' },
  errorBox: { background:'#FEF2F2', color:'#991B1B', padding:'10px 14px',
              borderRadius:'8px', marginBottom:'14px', fontSize:'13px',
              fontFamily:'sans-serif', border:'1px solid #FECACA' },
  exitoBox: { background:'#ECFDF5', color:'#065F46', padding:'10px 14px',
              borderRadius:'8px', marginBottom:'14px', fontSize:'13px',
              fontFamily:'sans-serif', border:'1px solid #A7F3D0' },
  nota:     { textAlign:'center', color:'#9CA3AF', fontSize:'12px',
              marginTop:'16px', fontFamily:'sans-serif' },
};

export default Login;