import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiCliente from '../services/apiCliente';
import Logo from '../components/Logo';

function Admin() {
  const { usuario } = useAuth();
  const navegar = useNavigate();
  const [seccion, setSeccion] = useState('categorias');

  const [categorias,  setCategorias]  = useState([]);
  const [nuevaCat,    setNuevaCat]    = useState('');
  const [msgCat,      setMsgCat]      = useState({ texto:'', tipo:'' });

  const [etiquetas,   setEtiquetas]   = useState([]);
  const [nuevaEtiq,   setNuevaEtiq]   = useState('');
  const [msgEtiq,     setMsgEtiq]     = useState({ texto:'', tipo:'' });

  const [usuarios,    setUsuarios]    = useState([]);
  const [msgUsuario,  setMsgUsuario]  = useState({ texto:'', tipo:'' });

  const [historial,   setHistorial]   = useState([]);
  const [usuarioHist, setUsuarioHist] = useState('todos');

  const [documentos,  setDocumentos]  = useState([]);
  const [docSelec,    setDocSelec]    = useState('');
  const [permisos,    setPermisos]    = useState([]);
  const [msgPerm,     setMsgPerm]     = useState({ texto:'', tipo:'' });

  useEffect(() => {
    if (usuario?.rol !== 'admin') navegar('/');
  }, [usuario, navegar]);

  useEffect(() => {
    cargarCategorias();
    cargarEtiquetas();
    cargarUsuarios();
    cargarHistorial('todos');
    cargarDocumentos();
  }, []);

  const cargarCategorias = () =>
    apiCliente.get('/categorias').then(r => setCategorias(r.data.datos || [])).catch(() => {});

  const crearCategoria = async (e) => {
    e.preventDefault();
    if (!nuevaCat.trim()) { setMsgCat({ texto:'Escribe un nombre.', tipo:'error' }); return; }
    try {
      await apiCliente.post('/categorias', { nombre: nuevaCat.trim() });
      setMsgCat({ texto:`Categoría "${nuevaCat}" creada.`, tipo:'exito' });
      setNuevaCat(''); cargarCategorias();
    } catch (err) {
      setMsgCat({ texto: err.response?.data?.mensaje || 'Error al crear.', tipo:'error' });
    }
  };

  const eliminarCategoria = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar "${nombre}"?`)) return;
    try {
      await apiCliente.delete(`/categorias/${id}`);
      setMsgCat({ texto:`"${nombre}" eliminada.`, tipo:'exito' });
      cargarCategorias();
    } catch { setMsgCat({ texto:'Error al eliminar.', tipo:'error' }); }
  };

  const cargarEtiquetas = () =>
    apiCliente.get('/etiquetas').then(r => setEtiquetas(r.data.datos || [])).catch(() => {});

  const crearEtiqueta = async (e) => {
    e.preventDefault();
    if (!nuevaEtiq.trim()) { setMsgEtiq({ texto:'Escribe un nombre.', tipo:'error' }); return; }
    try {
      await apiCliente.post('/etiquetas', { nombre: nuevaEtiq.trim() });
      setMsgEtiq({ texto:`Etiqueta "${nuevaEtiq}" creada.`, tipo:'exito' });
      setNuevaEtiq(''); cargarEtiquetas();
    } catch (err) {
      setMsgEtiq({ texto: err.response?.data?.mensaje || 'Error al crear.', tipo:'error' });
    }
  };

  const eliminarEtiqueta = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar "${nombre}"?`)) return;
    try {
      await apiCliente.delete(`/etiquetas/${id}`);
      setMsgEtiq({ texto:`"${nombre}" eliminada.`, tipo:'exito' });
      cargarEtiquetas();
    } catch { setMsgEtiq({ texto:'Error al eliminar.', tipo:'error' }); }
  };

  const cargarUsuarios = () =>
    apiCliente.get('/usuarios').then(r => setUsuarios(r.data.datos || [])).catch(() => {});

  const cambiarRol = async (id, rol, nombre) => {
    try {
      await apiCliente.put(`/usuarios/${id}/rol`, { rol });
      setMsgUsuario({ texto:`Rol de "${nombre}" actualizado a ${rol}.`, tipo:'exito' });
      cargarUsuarios();
    } catch (err) {
      setMsgUsuario({ texto: err.response?.data?.mensaje || 'Error.', tipo:'error' });
    }
  };

  const cargarHistorial = (uid) => {
    const url = uid === 'todos'
      ? '/usuarios/historial/todos'
      : `/usuarios/${uid}/historial`;
    apiCliente.get(url).then(r => setHistorial(r.data.datos || [])).catch(() => {});
  };

  const cargarDocumentos = () =>
    apiCliente.get('/documentos').then(r => setDocumentos(r.data.datos || [])).catch(() => {});

  const cargarPermisos = (docId) => {
    setDocSelec(docId);
    if (!docId) { setPermisos([]); return; }
    apiCliente.get(`/usuarios/permisos/${docId}`)
      .then(r => setPermisos(r.data.datos || [])).catch(() => {});
  };

  const asignarPermiso = async (usuarioId, puedeVer, puedeEditar) => {
    if (!docSelec) return;
    try {
      await apiCliente.post('/usuarios/permisos', {
        documento_id: parseInt(docSelec),
        usuario_id:   usuarioId,
        puede_ver:    puedeVer,
        puede_editar: puedeEditar
      });
      setMsgPerm({ texto:'Permiso actualizado.', tipo:'exito' });
      cargarPermisos(docSelec);
    } catch { setMsgPerm({ texto:'Error al asignar.', tipo:'error' }); }
  };

  const eliminarPermiso = async (docId, usuarioId) => {
    try {
      await apiCliente.delete(`/usuarios/permisos/${docId}/${usuarioId}`);
      setMsgPerm({ texto:'Permiso eliminado.', tipo:'exito' });
      cargarPermisos(docSelec);
    } catch { setMsgPerm({ texto:'Error.', tipo:'error' }); }
  };

  const iconoAccion = (a) =>
    a === 'SUBIDA' ? '⬆️' : a === 'ELIMINACION' ? '🗑️' : '📋';

  const menu = [
    { id:'categorias', icon:'📁', label:'Categorías'          },
    { id:'etiquetas',  icon:'🏷️', label:'Etiquetas'           },
    { id:'usuarios',   icon:'👥', label:'Usuarios y Roles'    },
    { id:'permisos',   icon:'🔐', label:'Permisos Documentos' },
    { id:'historial',  icon:'📋', label:'Historial'           },
  ];

  return (
    <div style={s.pagina}>
      <header style={s.header}>
        <Logo size={32} showText={true} />
        <div style={s.headerDer}>
          <span style={s.badgeAdmin}>⚙ Administración</span>
          <button style={s.btnVolver} onClick={() => navegar('/')}>
            ← Panel principal
          </button>
        </div>
      </header>

      <div style={s.layout}>

        {/* Menú lateral */}
        <aside style={s.sidebar}>
          {menu.map(m => (
            <button key={m.id}
              style={seccion === m.id ? s.menuActivo : s.menuItem}
              onClick={() => setSeccion(m.id)}>
              <span style={s.menuIcono}>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </aside>

        {/* Contenido */}
        <main style={s.main}>

          {/* ── CATEGORÍAS ── */}
          {seccion === 'categorias' && (
            <div>
              <h2 style={s.titulo}>📁 Gestión de Categorías</h2>
              <p style={s.subtitulo}>
                Crea las categorías para que los usuarios clasifiquen sus documentos.
              </p>
              {msgCat.texto && (
                <div style={msgCat.tipo==='exito' ? s.exitoBox : s.errorBox}>
                  {msgCat.texto}
                </div>
              )}
              <form onSubmit={crearCategoria} style={s.form}>
                <input style={s.input} type="text"
                  placeholder="Nombre de la nueva categoría..."
                  value={nuevaCat}
                  onChange={e => { setNuevaCat(e.target.value); setMsgCat({texto:'',tipo:''}); }} />
                <button style={s.btnCrear} type="submit">+ Crear</button>
              </form>
              <div style={s.lista}>
                {categorias.length === 0 && (
                  <p style={s.vacio}>No hay categorías. Crea la primera.</p>
                )}
                {categorias.map(c => (
                  <div key={c.id} style={s.item}>
                    <span style={{ fontSize:'20px' }}>📁</span>
                    <span style={s.itemNombre}>{c.nombre}</span>
                    <button style={s.btnElim}
                      onClick={() => eliminarCategoria(c.id, c.nombre)}>
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ETIQUETAS ── */}
          {seccion === 'etiquetas' && (
            <div>
              <h2 style={s.titulo}>🏷️ Gestión de Etiquetas</h2>
              <p style={s.subtitulo}>
                Las etiquetas son palabras clave que los usuarios asignan a los documentos.
              </p>
              {msgEtiq.texto && (
                <div style={msgEtiq.tipo==='exito' ? s.exitoBox : s.errorBox}>
                  {msgEtiq.texto}
                </div>
              )}
              <form onSubmit={crearEtiqueta} style={s.form}>
                <input style={s.input} type="text"
                  placeholder="Nombre de la nueva etiqueta..."
                  value={nuevaEtiq}
                  onChange={e => { setNuevaEtiq(e.target.value); setMsgEtiq({texto:'',tipo:''}); }} />
                <button style={s.btnCrear} type="submit">+ Crear</button>
              </form>
              <div style={s.lista}>
                {etiquetas.length === 0 && (
                  <p style={s.vacio}>No hay etiquetas. Crea la primera.</p>
                )}
                {etiquetas.map(e => (
                  <div key={e.id} style={s.item}>
                    <span style={{ fontSize:'20px' }}>🏷️</span>
                    <span style={s.itemNombre}>{e.nombre}</span>
                    <button style={s.btnElim}
                      onClick={() => eliminarEtiqueta(e.id, e.nombre)}>
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── USUARIOS Y ROLES ── */}
          {seccion === 'usuarios' && (
            <div>
              <h2 style={s.titulo}>👥 Usuarios y Roles</h2>
              <p style={s.subtitulo}>
                Cambia el rol de cada usuario para controlar sus permisos.
              </p>
              {msgUsuario.texto && (
                <div style={msgUsuario.tipo==='exito' ? s.exitoBox : s.errorBox}>
                  {msgUsuario.texto}
                </div>
              )}
              <div style={s.tablaWrap}>
                <table style={s.tabla}>
                  <thead>
                    <tr style={s.tablaHead}>
                      <th style={s.th}>Nombre</th>
                      <th style={s.th}>Correo</th>
                      <th style={s.th}>Rol actual</th>
                      <th style={s.th}>Cambiar rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map(u => (
                      <tr key={u.id} style={s.tr}>
                        <td style={s.td}>{u.nombre}</td>
                        <td style={s.td}>{u.email}</td>
                        <td style={s.td}>
                          <span style={
                            u.rol==='admin'       ? s.badgeAdmin :
                            u.rol==='colaborador' ? s.badgeCol   : s.badgeLec
                          }>{u.rol}</span>
                        </td>
                        <td style={s.td}>
                          {u.id === usuario?.id
                            ? <span style={{ color:'#9CA3AF', fontSize:'12px' }}>Tu cuenta</span>
                            : (
                              <select style={s.selectRol} value={u.rol}
                                onChange={e => cambiarRol(u.id, e.target.value, u.nombre)}>
                                <option value="admin">admin</option>
                                <option value="colaborador">colaborador</option>
                                <option value="lector">lector</option>
                              </select>
                            )
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={s.rolesInfo}>
                <p style={{ fontWeight:'bold', color:'#1A3557', marginBottom:'10px', fontSize:'14px' }}>
                  ¿Qué puede hacer cada rol?
                </p>
                {[
                  { badge: s.badgeAdmin, rol:'admin',       desc:'Acceso total: gestiona usuarios, categorías, etiquetas y todos los documentos.' },
                  { badge: s.badgeCol,   rol:'colaborador', desc:'Puede subir documentos y gestionar los suyos propios.' },
                  { badge: s.badgeLec,   rol:'lector',      desc:'Solo puede ver y descargar. No puede subir ni eliminar.' },
                ].map((r, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                    <span style={r.badge}>{r.rol}</span>
                    <span style={{ fontSize:'13px', color:'#6B7280' }}>{r.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PERMISOS ── */}
          {seccion === 'permisos' && (
            <div>
              <h2 style={s.titulo}>🔐 Permisos por Documento</h2>
              <p style={s.subtitulo}>
                Controla qué usuarios pueden ver o editar cada documento.
              </p>
              {msgPerm.texto && (
                <div style={msgPerm.tipo==='exito' ? s.exitoBox : s.errorBox}>
                  {msgPerm.texto}
                </div>
              )}
              <div style={{ marginBottom:'20px' }}>
                <label style={s.labelCampo}>Selecciona un documento</label>
                <select style={s.selectDoc} value={docSelec}
                  onChange={e => cargarPermisos(e.target.value)}>
                  <option value="">-- Selecciona un documento --</option>
                  {documentos.map(d => (
                    <option key={d.id} value={d.id}>{d.nombre}</option>
                  ))}
                </select>
              </div>
              {docSelec && (
                <>
                  <h3 style={{ color:'#1A3557', fontSize:'15px', marginBottom:'12px' }}>
                    Permisos asignados
                  </h3>
                  {permisos.length === 0 && (
                    <p style={s.vacio}>Sin permisos específicos asignados.</p>
                  )}
                  <div style={s.lista}>
                    {permisos.map(p => (
                      <div key={p.usuario_id} style={s.item}>
                        <span style={{ fontSize:'20px' }}>👤</span>
                        <div style={{ flexGrow:1 }}>
                          <p style={{ margin:0, fontWeight:'bold', fontSize:'14px' }}>{p.nombre}</p>
                          <p style={{ margin:0, fontSize:'12px', color:'#9CA3AF' }}>{p.email}</p>
                        </div>
                        <span style={p.puede_ver ? s.permSi : s.permNo}>
                          {p.puede_ver ? '✓ Ver' : '✗ Ver'}
                        </span>
                        <span style={p.puede_editar ? s.permSi : s.permNo}>
                          {p.puede_editar ? '✓ Editar' : '✗ Editar'}
                        </span>
                        <button style={s.btnElim}
                          onClick={() => eliminarPermiso(docSelec, p.usuario_id)}>
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>
                  <h3 style={{ color:'#1A3557', fontSize:'15px', margin:'20px 0 12px' }}>
                    Asignar permiso
                  </h3>
                  <div style={s.lista}>
                    {usuarios
                      .filter(u => !permisos.find(p => p.usuario_id === u.id))
                      .map(u => (
                        <div key={u.id} style={s.item}>
                          <span style={{ fontSize:'20px' }}>👤</span>
                          <div style={{ flexGrow:1 }}>
                            <p style={{ margin:0, fontWeight:'bold', fontSize:'14px' }}>{u.nombre}</p>
                            <p style={{ margin:0, fontSize:'12px', color:'#9CA3AF' }}>{u.email}</p>
                          </div>
                          <button style={s.btnPermVer}
                            onClick={() => asignarPermiso(u.id, true, false)}>
                            Solo ver
                          </button>
                          <button style={s.btnPermEditar}
                            onClick={() => asignarPermiso(u.id, true, true)}>
                            Ver y editar
                          </button>
                        </div>
                      ))
                    }
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── HISTORIAL ── */}
          {seccion === 'historial' && (
            <div>
              <h2 style={s.titulo}>📋 Historial de Actividad</h2>
              <p style={s.subtitulo}>
                Registro de todas las acciones realizadas en el sistema.
              </p>
              <div style={{ marginBottom:'20px' }}>
                <label style={s.labelCampo}>Filtrar por usuario</label>
                <select style={s.selectDoc} value={usuarioHist}
                  onChange={e => { setUsuarioHist(e.target.value); cargarHistorial(e.target.value); }}>
                  <option value="todos">Todos los usuarios</option>
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
              </div>
              <div style={s.lista}>
                {historial.length === 0 && (
                  <p style={s.vacio}>No hay actividad registrada.</p>
                )}
                {historial.map(h => (
                  <div key={h.id} style={s.item}>
                    <span style={{ fontSize:'24px' }}>{iconoAccion(h.accion)}</span>
                    <div style={{ flexGrow:1 }}>
                      <p style={{ margin:0, fontWeight:'bold', fontSize:'14px', color:'#1A3557' }}>
                        {h.usuario_nombre}
                        <span style={s.accionBadge}>{h.accion}</span>
                      </p>
                      <p style={{ margin:'2px 0 0', fontSize:'13px', color:'#6B7280' }}>
                        {h.detalle || h.documento_nombre || '—'}
                      </p>
                    </div>
                    <span style={{ fontSize:'12px', color:'#9CA3AF', flexShrink:0 }}>
                      {new Date(h.realizado_en).toLocaleString('es-CO', {
                        day:'2-digit', month:'short', year:'numeric',
                        hour:'2-digit', minute:'2-digit'
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

const s = {
  pagina:      { fontFamily:'sans-serif', minHeight:'100vh', background:'#F5F3FF' },
  header:      { background:'white', padding:'0 32px', height:'64px',
                 display:'flex', alignItems:'center', justifyContent:'space-between',
                 boxShadow:'0 2px 8px rgba(124,58,237,0.1)',
                 borderBottom:'2px solid #EDE9FE' },
  headerDer:   { display:'flex', alignItems:'center', gap:'12px' },
  badgeAdmin:  { background:'linear-gradient(135deg,#7C3AED,#F59E0B)',
                 color:'white', padding:'4px 14px', borderRadius:'12px', fontSize:'13px' },
  btnVolver:   { background:'transparent', color:'#7C3AED',
                 border:'1px solid #EDE9FE', padding:'8px 16px',
                 borderRadius:'8px', cursor:'pointer', fontSize:'13px' },
  layout:      { display:'flex', minHeight:'calc(100vh - 64px)' },
  sidebar:     { width:'220px', background:'white', padding:'16px',
                 display:'flex', flexDirection:'column', gap:'4px',
                 boxShadow:'2px 0 8px rgba(124,58,237,0.06)', flexShrink:0 },
  menuItem:    { display:'flex', alignItems:'center', gap:'10px',
                 padding:'12px 14px', background:'transparent', border:'none',
                 borderRadius:'8px', cursor:'pointer', fontSize:'14px',
                 color:'#6B7280', textAlign:'left' },
  menuActivo:  { display:'flex', alignItems:'center', gap:'10px',
                 padding:'12px 14px', background:'#EDE9FE', border:'none',
                 borderRadius:'8px', cursor:'pointer', fontSize:'14px',
                 color:'#7C3AED', fontWeight:'bold', textAlign:'left' },
  menuIcono:   { fontSize:'18px', flexShrink:0 },
  main:        { flex:1, padding:'32px', overflow:'auto' },
  titulo:      { color:'#1A3557', marginBottom:'6px', fontSize:'22px' },
  subtitulo:   { color:'#9CA3AF', fontSize:'14px', marginBottom:'20px' },
  form:        { display:'flex', gap:'8px', marginBottom:'20px' },
  input:       { flex:1, padding:'10px 14px', borderRadius:'8px',
                 border:'1px solid #EDE9FE', fontSize:'14px' },
  btnCrear:    { padding:'10px 20px',
                 background:'linear-gradient(135deg,#7C3AED,#2E6DA4)',
                 color:'white', border:'none', borderRadius:'8px',
                 cursor:'pointer', fontSize:'14px', fontWeight:'bold',
                 whiteSpace:'nowrap' },
  lista:       { display:'flex', flexDirection:'column', gap:'8px' },
  item:        { display:'flex', alignItems:'center', gap:'12px',
                 padding:'12px 16px', background:'white', borderRadius:'8px',
                 border:'1px solid #EDE9FE',
                 boxShadow:'0 1px 4px rgba(124,58,237,0.04)' },
  itemNombre:  { flexGrow:1, fontSize:'14px', fontWeight:'500', color:'#333' },
  btnElim:     { background:'white', color:'#EF4444', border:'1px solid #FECACA',
                 padding:'5px 12px', borderRadius:'6px',
                 cursor:'pointer', fontSize:'12px', flexShrink:0 },
  btnPermVer:  { background:'#EDE9FE', color:'#7C3AED', border:'none',
                 padding:'5px 12px', borderRadius:'6px',
                 cursor:'pointer', fontSize:'12px', flexShrink:0 },
  btnPermEditar:{ background:'#7C3AED', color:'white', border:'none',
                  padding:'5px 12px', borderRadius:'6px',
                  cursor:'pointer', fontSize:'12px', flexShrink:0 },
  vacio:       { color:'#9CA3AF', fontSize:'13px', textAlign:'center', padding:'20px 0' },
  exitoBox:    { background:'#ECFDF5', color:'#065F46', padding:'10px 14px',
                 borderRadius:'8px', marginBottom:'14px', fontSize:'13px',
                 border:'1px solid #A7F3D0' },
  errorBox:    { background:'#FEF2F2', color:'#991B1B', padding:'10px 14px',
                 borderRadius:'8px', marginBottom:'14px', fontSize:'13px',
                 border:'1px solid #FECACA' },
  tablaWrap:   { overflowX:'auto', marginBottom:'20px' },
  tabla:       { width:'100%', borderCollapse:'collapse' },
  tablaHead:   { background:'#F5F3FF' },
  th:          { padding:'12px 16px', textAlign:'left', fontSize:'13px',
                 fontWeight:'bold', color:'#7C3AED', borderBottom:'2px solid #EDE9FE' },
  tr:          { borderBottom:'1px solid #F3F4F6' },
  td:          { padding:'12px 16px', fontSize:'14px', color:'#333' },
  selectRol:   { padding:'6px 10px', borderRadius:'6px',
                 border:'1px solid #EDE9FE', fontSize:'13px', cursor:'pointer' },
  selectDoc:   { width:'100%', padding:'10px', borderRadius:'8px',
                 border:'1px solid #EDE9FE', fontSize:'14px', marginTop:'4px' },
  labelCampo:  { fontSize:'13px', fontWeight:'bold', color:'#7C3AED' },
  rolesInfo:   { background:'#F5F3FF', borderRadius:'10px', padding:'16px', marginTop:'16px' },
  badgeAdmin:  { background:'linear-gradient(135deg,#7C3AED,#2E6DA4)',
                 color:'white', padding:'3px 10px', borderRadius:'10px', fontSize:'12px' },
  badgeCol:    { background:'#2E6DA4', color:'white',
                 padding:'3px 10px', borderRadius:'10px', fontSize:'12px' },
  badgeLec:    { background:'#6B7280', color:'white',
                 padding:'3px 10px', borderRadius:'10px', fontSize:'12px' },
  permSi:      { background:'#ECFDF5', color:'#065F46', padding:'3px 10px',
                 borderRadius:'10px', fontSize:'12px', flexShrink:0 },
  permNo:      { background:'#FEF2F2', color:'#991B1B', padding:'3px 10px',
                 borderRadius:'10px', fontSize:'12px', flexShrink:0 },
  accionBadge: { background:'#EDE9FE', color:'#7C3AED', padding:'2px 8px',
                 borderRadius:'8px', fontSize:'11px', marginLeft:'8px' },
};

export default Admin;