import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiCliente from '../services/apiCliente';

function Admin() {
  const { usuario } = useAuth();
  const navegar = useNavigate();
  const [seccion, setSeccion] = useState('categorias');

  // Categorías
  const [categorias,   setCategorias]   = useState([]);
  const [nuevaCat,     setNuevaCat]     = useState('');
  const [msgCat,       setMsgCat]       = useState({ texto:'', tipo:'' });

  // Etiquetas
  const [etiquetas,    setEtiquetas]    = useState([]);
  const [nuevaEtiq,    setNuevaEtiq]    = useState('');
  const [msgEtiq,      setMsgEtiq]      = useState({ texto:'', tipo:'' });

  // Usuarios
  const [usuarios,     setUsuarios]     = useState([]);
  const [msgUsuario,   setMsgUsuario]   = useState({ texto:'', tipo:'' });

  // Historial
  const [historial,    setHistorial]    = useState([]);
  const [usuarioHist,  setUsuarioHist]  = useState('todos');

  // Permisos
  const [documentos,   setDocumentos]   = useState([]);
  const [docSelec,     setDocSelec]     = useState('');
  const [permisos,     setPermisos]     = useState([]);
  const [msgPerm,      setMsgPerm]      = useState({ texto:'', tipo:'' });

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

  // ── Categorías ──────────────────────────────────────────────────────────
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
    if (!window.confirm(`¿Eliminar "${nombre}"? Los documentos quedarán sin categoría.`)) return;
    try {
      await apiCliente.delete(`/categorias/${id}`);
      setMsgCat({ texto:`"${nombre}" eliminada.`, tipo:'exito' });
      cargarCategorias();
    } catch { setMsgCat({ texto:'Error al eliminar.', tipo:'error' }); }
  };

  // ── Etiquetas ────────────────────────────────────────────────────────────
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
    if (!window.confirm(`¿Eliminar la etiqueta "${nombre}"?`)) return;
    try {
      await apiCliente.delete(`/etiquetas/${id}`);
      setMsgEtiq({ texto:`"${nombre}" eliminada.`, tipo:'exito' });
      cargarEtiquetas();
    } catch { setMsgEtiq({ texto:'Error al eliminar.', tipo:'error' }); }
  };

  // ── Usuarios ─────────────────────────────────────────────────────────────
  const cargarUsuarios = () =>
    apiCliente.get('/usuarios').then(r => setUsuarios(r.data.datos || [])).catch(() => {});

  const cambiarRol = async (id, rol, nombre) => {
    try {
      await apiCliente.put(`/usuarios/${id}/rol`, { rol });
      setMsgUsuario({ texto:`Rol de "${nombre}" actualizado a ${rol}.`, tipo:'exito' });
      cargarUsuarios();
    } catch (err) {
      setMsgUsuario({ texto: err.response?.data?.mensaje || 'Error al cambiar rol.', tipo:'error' });
    }
  };

  // ── Historial ─────────────────────────────────────────────────────────────
  const cargarHistorial = (uid) => {
    const url = uid === 'todos'
      ? '/usuarios/historial/todos'
      : `/usuarios/${uid}/historial`;
    apiCliente.get(url).then(r => setHistorial(r.data.datos || [])).catch(() => {});
  };

  const manejarHistorial = (uid) => {
    setUsuarioHist(uid);
    cargarHistorial(uid);
  };

  // ── Permisos ──────────────────────────────────────────────────────────────
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
    } catch { setMsgPerm({ texto:'Error al asignar permiso.', tipo:'error' }); }
  };

  const eliminarPermiso = async (docId, usuarioId) => {
    try {
      await apiCliente.delete(`/usuarios/permisos/${docId}/${usuarioId}`);
      setMsgPerm({ texto:'Permiso eliminado.', tipo:'exito' });
      cargarPermisos(docSelec);
    } catch { setMsgPerm({ texto:'Error al eliminar.', tipo:'error' }); }
  };

  const iconoAccion = (accion) => {
    if (accion === 'SUBIDA')     return '⬆️';
    if (accion === 'ELIMINACION') return '🗑️';
    if (accion === 'DESCARGA')   return '⬇️';
    return '📋';
  };

  return (
    <div style={s.pagina}>
      <header style={s.header}>
        <span style={s.logo}>🍃 Folium</span>
        <div style={s.headerDer}>
          <span style={s.badgeAdmin}>⚙ Administración</span>
          <button style={s.btnVolver} onClick={() => navegar('/')}>← Panel principal</button>
        </div>
      </header>

      <div style={s.layout}>
        {/* Menú lateral */}
        <aside style={s.sidebar}>
          {[
            { id:'categorias', icon:'📁', label:'Categorías' },
            { id:'etiquetas',  icon:'🏷️', label:'Etiquetas' },
            { id:'usuarios',   icon:'👥', label:'Usuarios y Roles' },
            { id:'permisos',   icon:'🔐', label:'Permisos de Documentos' },
            { id:'historial',  icon:'📋', label:'Historial de Actividad' },
          ].map(item => (
            <button key={item.id}
              style={seccion === item.id ? s.menuItemActivo : s.menuItem}
              onClick={() => setSeccion(item.id)}>
              <span style={s.menuIcono}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </aside>

        {/* Contenido principal */}
        <main style={s.main}>

          {/* ── CATEGORÍAS ── */}
          {seccion === 'categorias' && (
            <div>
              <h2 style={s.titulo}>📁 Gestión de Categorías</h2>
              <p style={s.subtitulo}>Crea las categorías con las que los usuarios clasificarán sus documentos.</p>
              {msgCat.texto && <div style={msgCat.tipo==='exito' ? s.exitoBox : s.errorBox}>{msgCat.texto}</div>}
              <form onSubmit={crearCategoria} style={s.form}>
                <input style={s.input} type="text" placeholder="Nombre de la nueva categoría..."
                  value={nuevaCat} onChange={e => { setNuevaCat(e.target.value); setMsgCat({texto:'',tipo:''}); }} />
                <button style={s.btnCrear} type="submit">+ Crear categoría</button>
              </form>
              <div style={s.lista}>
                {categorias.length === 0 && <p style={s.vacio}>No hay categorías aún. Crea la primera.</p>}
                {categorias.map(cat => (
                  <div key={cat.id} style={s.item}>
                    <span style={{fontSize:'20px'}}>📁</span>
                    <span style={s.itemNombre}>{cat.nombre}</span>
                    <button style={s.btnElim} onClick={() => eliminarCategoria(cat.id, cat.nombre)}>Eliminar</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ETIQUETAS ── */}
          {seccion === 'etiquetas' && (
            <div>
              <h2 style={s.titulo}>🏷️ Gestión de Etiquetas</h2>
              <p style={s.subtitulo}>Las etiquetas son palabras clave que los usuarios pueden asignar a los documentos.</p>
              {msgEtiq.texto && <div style={msgEtiq.tipo==='exito' ? s.exitoBox : s.errorBox}>{msgEtiq.texto}</div>}
              <form onSubmit={crearEtiqueta} style={s.form}>
                <input style={s.input} type="text" placeholder="Nombre de la nueva etiqueta..."
                  value={nuevaEtiq} onChange={e => { setNuevaEtiq(e.target.value); setMsgEtiq({texto:'',tipo:''}); }} />
                <button style={s.btnCrear} type="submit">+ Crear etiqueta</button>
              </form>
              <div style={s.lista}>
                {etiquetas.length === 0 && <p style={s.vacio}>No hay etiquetas aún. Crea la primera.</p>}
                {etiquetas.map(etiq => (
                  <div key={etiq.id} style={s.item}>
                    <span style={{fontSize:'20px'}}>🏷️</span>
                    <span style={s.itemNombre}>{etiq.nombre}</span>
                    <button style={s.btnElim} onClick={() => eliminarEtiqueta(etiq.id, etiq.nombre)}>Eliminar</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── USUARIOS Y ROLES ── */}
          {seccion === 'usuarios' && (
            <div>
              <h2 style={s.titulo}>👥 Gestión de Usuarios y Roles</h2>
              <p style={s.subtitulo}>Cambia el rol de cada usuario para controlar qué puede hacer en el sistema.</p>
              {msgUsuario.texto && <div style={msgUsuario.tipo==='exito' ? s.exitoBox : s.errorBox}>{msgUsuario.texto}</div>}
              <div style={s.tablaWrap}>
                <table style={s.tabla}>
                  <thead>
                    <tr style={s.tablaHead}>
                      <th style={s.th}>Usuario</th>
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
                            u.rol === 'admin'       ? s.badgeRolAdmin :
                            u.rol === 'colaborador' ? s.badgeRolCol   : s.badgeRolLec
                          }>{u.rol}</span>
                        </td>
                        <td style={s.td}>
                          {u.id === usuario?.id
                            ? <span style={{color:'#aaa',fontSize:'12px'}}>Tu cuenta</span>
                            : (
                              <select style={s.selectRol}
                                value={u.rol}
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
                <p style={s.rolesInfoTitulo}>¿Qué puede hacer cada rol?</p>
                <div style={s.rolesFila}>
                  <span style={s.badgeRolAdmin}>admin</span>
                  <span style={s.rolesDesc}>Acceso total: gestiona usuarios, categorías, etiquetas y todos los documentos.</span>
                </div>
                <div style={s.rolesFila}>
                  <span style={s.badgeRolCol}>colaborador</span>
                  <span style={s.rolesDesc}>Puede subir documentos y gestionar los suyos propios.</span>
                </div>
                <div style={s.rolesFila}>
                  <span style={s.badgeRolLec}>lector</span>
                  <span style={s.rolesDesc}>Solo puede ver y descargar documentos. No puede subir ni eliminar.</span>
                </div>
              </div>
            </div>
          )}

          {/* ── PERMISOS ── */}
          {seccion === 'permisos' && (
            <div>
              <h2 style={s.titulo}>🔐 Permisos por Documento</h2>
              <p style={s.subtitulo}>Controla qué usuarios pueden ver o editar cada documento específico.</p>
              {msgPerm.texto && <div style={msgPerm.tipo==='exito' ? s.exitoBox : s.errorBox}>{msgPerm.texto}</div>}

              <div style={s.campo}>
                <label style={s.label}>Selecciona un documento</label>
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
                  <h3 style={s.subtitulo2}>Permisos asignados</h3>
                  {permisos.length === 0 && <p style={s.vacio}>Sin permisos específicos. Todos los colaboradores tienen acceso por defecto.</p>}
                  <div style={s.lista}>
                    {permisos.map(p => (
                      <div key={p.usuario_id} style={s.item}>
                        <span style={{fontSize:'20px'}}>👤</span>
                        <div style={{flexGrow:1}}>
                          <p style={{margin:0,fontWeight:'bold',fontSize:'14px'}}>{p.nombre}</p>
                          <p style={{margin:0,fontSize:'12px',color:'#888'}}>{p.email}</p>
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

                  <h3 style={{...s.subtitulo2, marginTop:'24px'}}>Asignar permiso a usuario</h3>
                  <div style={s.lista}>
                    {usuarios.filter(u => !permisos.find(p => p.usuario_id === u.id)).map(u => (
                      <div key={u.id} style={s.item}>
                        <span style={{fontSize:'20px'}}>👤</span>
                        <div style={{flexGrow:1}}>
                          <p style={{margin:0,fontWeight:'bold',fontSize:'14px'}}>{u.nombre}</p>
                          <p style={{margin:0,fontSize:'12px',color:'#888'}}>{u.email}</p>
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
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── HISTORIAL ── */}
          {seccion === 'historial' && (
            <div>
              <h2 style={s.titulo}>📋 Historial de Actividad</h2>
              <p style={s.subtitulo}>Registro de todas las acciones realizadas por los usuarios en el sistema.</p>

              <div style={s.campo}>
                <label style={s.label}>Filtrar por usuario</label>
                <select style={s.selectDoc} value={usuarioHist}
                  onChange={e => manejarHistorial(e.target.value)}>
                  <option value="todos">Todos los usuarios</option>
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
              </div>

              <div style={s.lista}>
                {historial.length === 0 && <p style={s.vacio}>No hay actividad registrada.</p>}
                {historial.map(h => (
                  <div key={h.id} style={s.itemHistorial}>
                    <span style={{fontSize:'24px'}}>{iconoAccion(h.accion)}</span>
                    <div style={{flexGrow:1}}>
                      <p style={{margin:0,fontWeight:'bold',fontSize:'14px',color:'#1A3557'}}>
                        {h.usuario_nombre}
                        <span style={s.accionBadge}>{h.accion}</span>
                      </p>
                      <p style={{margin:'2px 0 0',fontSize:'13px',color:'#666'}}>
                        {h.detalle || h.documento_nombre || 'Sin detalle'}
                      </p>
                    </div>
                    <span style={s.fecha}>
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
  pagina:         { fontFamily:'sans-serif', minHeight:'100vh', background:'#f0f4f8' },
  header:         { background:'#1A3557', padding:'0 32px', height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 8px rgba(0,0,0,0.2)' },
  headerDer:      { display:'flex', alignItems:'center', gap:'12px' },
  logo:           { color:'white', fontSize:'22px', fontWeight:'bold' },
  badgeAdmin:     { background:'#E67E22', color:'white', padding:'4px 12px', borderRadius:'12px', fontSize:'13px' },
  btnVolver:      { background:'transparent', color:'#aaa', border:'1px solid #aaa', padding:'8px 16px', borderRadius:'8px', cursor:'pointer', fontSize:'13px' },
  layout:         { display:'flex', minHeight:'calc(100vh - 64px)' },
  sidebar:        { width:'220px', background:'white', padding:'16px', display:'flex', flexDirection:'column', gap:'4px', boxShadow:'2px 0 8px rgba(0,0,0,0.06)', flexShrink:0 },
  menuItem:       { display:'flex', alignItems:'center', gap:'10px', padding:'12px 14px', background:'transparent', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'14px', color:'#555', textAlign:'left' },
  menuItemActivo: { display:'flex', alignItems:'center', gap:'10px', padding:'12px 14px', background:'#EAF2FB', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'14px', color:'#1A3557', fontWeight:'bold', textAlign:'left' },
  menuIcono:      { fontSize:'18px', flexShrink:0 },
  main:           { flex:1, padding:'32px', overflow:'auto' },
  titulo:         { color:'#1A3557', marginBottom:'6px', fontSize:'22px' },
  subtitulo:      { color:'#888', fontSize:'14px', marginBottom:'20px' },
  subtitulo2:     { color:'#1A3557', fontSize:'16px', marginBottom:'12px' },
  form:           { display:'flex', gap:'8px', marginBottom:'20px' },
  input:          { flex:1, padding:'10px 14px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'14px' },
  btnCrear:       { padding:'10px 18px', background:'#2E6DA4', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'14px', fontWeight:'bold', whiteSpace:'nowrap' },
  lista:          { display:'flex', flexDirection:'column', gap:'8px' },
  item:           { display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', background:'white', borderRadius:'8px', border:'1px solid #eee', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' },
  itemHistorial:  { display:'flex', alignItems:'center', gap:'12px', padding:'14px 16px', background:'white', borderRadius:'8px', border:'1px solid #eee', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' },
  itemNombre:     { flexGrow:1, fontSize:'14px', fontWeight:'500', color:'#333' },
  btnElim:        { background:'white', color:'#e74c3c', border:'1px solid #e74c3c', padding:'5px 12px', borderRadius:'6px', cursor:'pointer', fontSize:'12px', flexShrink:0 },
  btnPermVer:     { background:'#EAF2FB', color:'#2E6DA4', border:'1px solid #2E6DA4', padding:'5px 12px', borderRadius:'6px', cursor:'pointer', fontSize:'12px', flexShrink:0 },
  btnPermEditar:  { background:'#2E6DA4', color:'white', border:'none', padding:'5px 12px', borderRadius:'6px', cursor:'pointer', fontSize:'12px', flexShrink:0 },
  vacio:          { color:'#aaa', fontSize:'13px', textAlign:'center', padding:'20px 0' },
  exitoBox:       { background:'#eafaf1', color:'#1e7a4a', padding:'10px 14px', borderRadius:'8px', marginBottom:'14px', fontSize:'13px' },
  errorBox:       { background:'#fdecea', color:'#c0392b', padding:'10px 14px', borderRadius:'8px', marginBottom:'14px', fontSize:'13px' },
  tablaWrap:      { overflowX:'auto', marginBottom:'24px' },
  tabla:          { width:'100%', borderCollapse:'collapse' },
  tablaHead:      { background:'#f8f9fa' },
  th:             { padding:'12px 16px', textAlign:'left', fontSize:'13px', fontWeight:'bold', color:'#555', borderBottom:'2px solid #eee' },
  tr:             { borderBottom:'1px solid #f0f0f0' },
  td:             { padding:'12px 16px', fontSize:'14px', color:'#333' },
  selectRol:      { padding:'6px 10px', borderRadius:'6px', border:'1px solid #ddd', fontSize:'13px', cursor:'pointer' },
  selectDoc:      { width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'14px', marginBottom:'16px' },
  campo:          { marginBottom:'16px' },
  label:          { display:'block', fontSize:'13px', fontWeight:'bold', color:'#555', marginBottom:'6px' },
  rolesInfo:      { background:'#f8f9fa', borderRadius:'10px', padding:'16px', marginTop:'16px' },
  rolesInfoTitulo:{ fontWeight:'bold', color:'#1A3557', marginBottom:'12px', fontSize:'14px' },
  rolesFila:      { display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px' },
  rolesDesc:      { fontSize:'13px', color:'#666' },
  badgeRolAdmin:  { background:'#E67E22', color:'white', padding:'3px 10px', borderRadius:'10px', fontSize:'12px', flexShrink:0 },
  badgeRolCol:    { background:'#2E6DA4', color:'white', padding:'3px 10px', borderRadius:'10px', fontSize:'12px', flexShrink:0 },
  badgeRolLec:    { background:'#888', color:'white', padding:'3px 10px', borderRadius:'10px', fontSize:'12px', flexShrink:0 },
  permSi:         { background:'#eafaf1', color:'#1e7a4a', padding:'3px 10px', borderRadius:'10px', fontSize:'12px', flexShrink:0 },
  permNo:         { background:'#fdecea', color:'#c0392b', padding:'3px 10px', borderRadius:'10px', fontSize:'12px', flexShrink:0 },
  accionBadge:    { background:'#EAF2FB', color:'#2E6DA4', padding:'2px 8px', borderRadius:'8px', fontSize:'11px', marginLeft:'8px' },
  fecha:          { fontSize:'12px', color:'#aaa', flexShrink:0 },
};

export default Admin;