import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiCliente from '../services/apiCliente';
import Logo from '../components/Logo';
import Notificaciones from '../components/Notificaciones';

function Carpetas() {
  const { usuario, cerrarSesion } = useAuth();
  const navegar = useNavigate();

  const [carpetas,      setCarpetas]      = useState([]);
  const [carpetaActual, setCarpetaActual] = useState(null);
  const [documentos,    setDocumentos]    = useState([]);
  const [usuarios,      setUsuarios]      = useState([]);
  const [cargando,      setCargando]      = useState(true);
  const [mostrarForm,   setMostrarForm]   = useState(false);
  const [mostrarMover,  setMostrarMover]  = useState(null);
  const [mostrarPerms,  setMostrarPerms]  = useState(null);
  const [nuevaCarpeta,  setNuevaCarpeta]  = useState({ nombre:'', descripcion:'', tipo:'compartida' });
  const [msg,           setMsg]           = useState({ texto:'', tipo:'' });

  const esAdmin = usuario?.rol === 'admin';

  useEffect(() => {
    cargarCarpetas();
    if (esAdmin) cargarUsuarios();
  }, []);

  const cargarCarpetas = async () => {
    try {
      setCargando(true);
      const r = await apiCliente.get('/carpetas');
      setCarpetas(r.data.datos || []);
    } catch { setMsg({ texto:'Error al cargar carpetas.', tipo:'error' }); }
    finally { setCargando(false); }
  };

  const cargarUsuarios = async () => {
    try {
      const r = await apiCliente.get('/usuarios');
      setUsuarios(r.data.datos || []);
    } catch {}
  };

  const abrirCarpeta = async (carpeta) => {
    try {
      setCarpetaActual(carpeta);
      const r = await apiCliente.get(`/carpetas/${carpeta.id}/documentos`);
      setDocumentos(r.data.datos || []);
    } catch (err) {
      setMsg({ texto: err.response?.data?.mensaje || 'Error al abrir la carpeta.', tipo:'error' });
    }
  };

  const crearCarpeta = async (e) => {
    e.preventDefault();
    if (!nuevaCarpeta.nombre.trim()) { setMsg({ texto:'Escribe un nombre.', tipo:'error' }); return; }
    try {
      await apiCliente.post('/carpetas', nuevaCarpeta);
      setMsg({ texto:`Carpeta "${nuevaCarpeta.nombre}" creada.`, tipo:'exito' });
      setNuevaCarpeta({ nombre:'', descripcion:'', tipo:'compartida' });
      setMostrarForm(false);
      cargarCarpetas();
    } catch (err) {
      setMsg({ texto: err.response?.data?.mensaje || 'Error al crear.', tipo:'error' });
    }
  };

  const eliminarCarpeta = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar "${nombre}"? Los documentos quedarán disponibles en el panel principal.`)) return;
    try {
      await apiCliente.delete(`/carpetas/${id}`);
      setMsg({ texto:`"${nombre}" eliminada.`, tipo:'exito' });
      if (carpetaActual?.id === id) { setCarpetaActual(null); setDocumentos([]); }
      cargarCarpetas();
    } catch { setMsg({ texto:'Error al eliminar.', tipo:'error' }); }
  };

  const moverDocumento = async (documentoId, carpetaId) => {
    try {
      await apiCliente.put(`/carpetas/mover/${documentoId}`, { carpeta_id: carpetaId });
      setMsg({ texto:'Documento movido correctamente.', tipo:'exito' });
      setMostrarMover(null);
      if (carpetaActual) abrirCarpeta(carpetaActual);
    } catch { setMsg({ texto:'Error al mover.', tipo:'error' }); }
  };

  const asignarPermiso = async (carpetaId, usuarioId, puedeVer, puedeEditar) => {
    try {
      await apiCliente.post(`/carpetas/${carpetaId}/permisos`, {
        usuario_id: usuarioId, puede_ver: puedeVer, puede_editar: puedeEditar
      });
      setMsg({ texto:'Permiso actualizado.', tipo:'exito' });
    } catch { setMsg({ texto:'Error al actualizar permiso.', tipo:'error' }); }
  };

  const iconoPorTipo = (mime) => {
    if (mime?.includes('pdf'))   return '📄';
    if (mime?.includes('image')) return '🖼️';
    if (mime?.includes('word'))  return '📝';
    if (mime?.includes('sheet')) return '📊';
    return '📁';
  };

  return (
    <div style={s.pagina}>
      {/* Header */}
      <header style={s.header}>
        <Logo size={32} showText={true} />
        <div style={s.headerDer}>
          <button style={s.btnNav} onClick={() => navegar('/')}>📄 Documentos</button>
          <button style={s.btnNav} onClick={() => navegar('/dashboard')}>📊 Dashboard</button>
          {esAdmin && <button style={s.btnNav} onClick={() => navegar('/admin')}>⚙ Admin</button>}
          <Notificaciones />
          <span style={s.saludo}>{usuario?.nombre}</span>
          <button style={s.btnSalir} onClick={cerrarSesion}>Salir</button>
        </div>
      </header>

      <div style={s.layout}>

        {/* Panel izquierdo — lista de carpetas */}
        <aside style={s.sidebar}>
          <div style={s.sidebarHeader}>
            <span style={s.sidebarTitulo}>📁 Mis Carpetas</span>
            <button style={s.btnNueva} onClick={() => setMostrarForm(!mostrarForm)}>+</button>
          </div>

          {/* Formulario nueva carpeta */}
          {mostrarForm && (
            <div style={s.formCarpeta}>
              <form onSubmit={crearCarpeta}>
                <input style={s.input} type="text" placeholder="Nombre de la carpeta"
                  value={nuevaCarpeta.nombre}
                  onChange={e => setNuevaCarpeta({ ...nuevaCarpeta, nombre: e.target.value })} />
                <textarea style={s.textarea} placeholder="Descripción (opcional)" rows={2}
                  value={nuevaCarpeta.descripcion}
                  onChange={e => setNuevaCarpeta({ ...nuevaCarpeta, descripcion: e.target.value })} />
                {esAdmin && (
                  <select style={s.select}
                    value={nuevaCarpeta.tipo}
                    onChange={e => setNuevaCarpeta({ ...nuevaCarpeta, tipo: e.target.value })}>
                    <option value="compartida">🌐 Compartida (todos pueden ver)</option>
                    <option value="privada">🔒 Privada (solo por invitación)</option>
                  </select>
                )}
                <div style={{ display:'flex', gap:'8px', marginTop:'8px' }}>
                  <button type="button" style={s.btnCancelar}
                    onClick={() => setMostrarForm(false)}>Cancelar</button>
                  <button type="submit" style={s.btnCrear}>Crear</button>
                </div>
              </form>
            </div>
          )}

          {msg.texto && (
            <div style={msg.tipo==='exito' ? s.exitoBox : s.errorBox}>{msg.texto}</div>
          )}

          {/* Lista de carpetas */}
          {cargando && <p style={s.sinDatos}>Cargando...</p>}
          {!cargando && carpetas.length === 0 && (
            <p style={s.sinDatos}>No tienes carpetas aún.<br/>Crea la primera con el botón +</p>
          )}
          {carpetas.map(c => (
            <div key={c.id}
              style={carpetaActual?.id === c.id ? s.carpetaItemActivo : s.carpetaItem}
              onClick={() => abrirCarpeta(c)}>
              <div style={s.carpetaIcono}>
                {c.tipo === 'privada' ? '🔒' : '📁'}
              </div>
              <div style={s.carpetaInfo}>
                <p style={s.carpetaNombre}>{c.nombre}</p>
                <p style={s.carpetaMeta}>
                  {c.total_docs} doc{c.total_docs !== 1 ? 's' : ''} ·{' '}
                  <span style={c.tipo==='privada' ? s.badgePriv : s.badgeComp}>
                    {c.tipo}
                  </span>
                </p>
              </div>
              <div style={s.carpetaAcciones}>
                {esAdmin && (
                  <button style={s.btnIcono} title="Gestionar permisos"
                    onClick={e => { e.stopPropagation(); setMostrarPerms(c); }}>
                    🔐
                  </button>
                )}
                {(esAdmin || c.creado_por === usuario?.id) && (
                  <button style={s.btnIconoRed} title="Eliminar carpeta"
                    onClick={e => { e.stopPropagation(); eliminarCarpeta(c.id, c.nombre); }}>
                    🗑
                  </button>
                )}
              </div>
            </div>
          ))}
        </aside>

        {/* Panel derecho — contenido de la carpeta */}
        <main style={s.main}>
          {!carpetaActual ? (
            <div style={s.placeholder}>
              <div style={{ fontSize:'80px' }}>📁</div>
              <h3 style={{ color:'#7C3AED', marginBottom:'8px' }}>Selecciona una carpeta</h3>
              <p style={{ color:'#888', fontSize:'14px' }}>
                Elige una carpeta del panel izquierdo para ver sus documentos
              </p>
            </div>
          ) : (
            <div>
              {/* Cabecera de la carpeta */}
              <div style={s.carpetaHeader}>
                <div>
                  <h2 style={s.carpetaTitulo}>
                    {carpetaActual.tipo === 'privada' ? '🔒' : '📁'} {carpetaActual.nombre}
                  </h2>
                  {carpetaActual.descripcion && (
                    <p style={s.carpetaDescripcion}>{carpetaActual.descripcion}</p>
                  )}
                  <p style={s.carpetaSubtitulo}>
                    {documentos.length} documento{documentos.length !== 1 ? 's' : ''} ·
                    Creada por {carpetaActual.creador_nombre} ·
                    <span style={carpetaActual.tipo==='privada' ? s.badgePriv : s.badgeComp}>
                      {' '}{carpetaActual.tipo}
                    </span>
                  </p>
                </div>
              </div>

              {/* Lista de documentos */}
              {documentos.length === 0 ? (
                <div style={s.placeholder}>
                  <div style={{ fontSize:'56px' }}>📂</div>
                  <p style={{ color:'#888', fontSize:'14px', marginTop:'12px' }}>
                    Esta carpeta está vacía. Mueve documentos aquí desde el panel principal.
                  </p>
                  <button style={s.btnIr} onClick={() => navegar('/')}>
                    Ir al panel de documentos
                  </button>
                </div>
              ) : (
                <div style={s.docLista}>
                  {documentos.map(doc => (
                    <div key={doc.id} style={s.docItem}>
                      <span style={{ fontSize:'32px' }}>{iconoPorTipo(doc.tipo_mime)}</span>
                      <div style={s.docInfo}>
                        <p style={s.docNombre}>{doc.nombre}</p>
                        <p style={s.docMeta}>
                          {doc.categoria_nombre && (
                            <span style={s.badge}>{doc.categoria_nombre}</span>
                          )}
                          {' '}{doc.autor_nombre} ·{' '}
                          {new Date(doc.fecha_carga).toLocaleDateString('es-CO',{
                            day:'2-digit', month:'short', year:'numeric'
                          })}
                        </p>
                      </div>
                      <div style={{ display:'flex', gap:'6px' }}>
                        <button style={s.btnVer}
                          onClick={() => window.open(`http://localhost:4000/archivos/${doc.ruta}`, '_blank')}>
                          👁 Ver
                        </button>
                        <button style={s.btnMover}
                          onClick={() => setMostrarMover(doc)}>
                          📂 Mover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modal mover documento */}
      {mostrarMover && (
        <div style={s.overlay} onClick={() => setMostrarMover(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitulo}>📂 Mover documento</span>
              <button style={s.modalCerrar} onClick={() => setMostrarMover(null)}>✕</button>
            </div>
            <div style={s.modalBody}>
              <p style={{ color:'#555', marginBottom:'16px', fontSize:'14px' }}>
                Mover: <strong>{mostrarMover.nombre}</strong>
              </p>
              <div style={s.docLista}>
                <div style={s.opcionMover} onClick={() => moverDocumento(mostrarMover.id, null)}>
                  <span style={{ fontSize:'24px' }}>📄</span>
                  <span style={{ fontSize:'14px', color:'#555' }}>Sin carpeta (panel principal)</span>
                </div>
                {carpetas.map(c => (
                  <div key={c.id} style={s.opcionMover}
                    onClick={() => moverDocumento(mostrarMover.id, c.id)}>
                    <span style={{ fontSize:'24px' }}>
                      {c.tipo === 'privada' ? '🔒' : '📁'}
                    </span>
                    <div>
                      <p style={{ margin:0, fontWeight:'bold', fontSize:'14px' }}>{c.nombre}</p>
                      <p style={{ margin:0, fontSize:'12px', color:'#888' }}>{c.total_docs} documentos</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal permisos de carpeta */}
      {mostrarPerms && (
        <div style={s.overlay} onClick={() => setMostrarPerms(null)}>
          <div style={{ ...s.modal, maxWidth:'500px' }} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitulo}>🔐 Permisos: {mostrarPerms.nombre}</span>
              <button style={s.modalCerrar} onClick={() => setMostrarPerms(null)}>✕</button>
            </div>
            <div style={s.modalBody}>
              <p style={{ color:'#888', fontSize:'13px', marginBottom:'16px' }}>
                Define qué puede hacer cada usuario en esta carpeta.
              </p>
              <div style={s.docLista}>
                {usuarios.filter(u => u.id !== usuario?.id).map(u => (
                  <div key={u.id} style={s.permItem}>
                    <div style={{ flexGrow:1 }}>
                      <p style={{ margin:0, fontWeight:'bold', fontSize:'14px' }}>{u.nombre}</p>
                      <p style={{ margin:0, fontSize:'12px', color:'#888' }}>{u.email}</p>
                    </div>
                    <button style={s.btnPermVer}
                      onClick={() => asignarPermiso(mostrarPerms.id, u.id, true, false)}>
                      Solo ver
                    </button>
                    <button style={s.btnPermEditar}
                      onClick={() => asignarPermiso(mostrarPerms.id, u.id, true, true)}>
                      Ver y editar
                    </button>
                    <button style={s.btnPermQuitar}
                      onClick={() => asignarPermiso(mostrarPerms.id, u.id, false, false)}>
                      Sin acceso
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  pagina:           { fontFamily:'sans-serif', minHeight:'100vh', background:'#f5f3ff' },
  header:           { background:'white', padding:'0 24px', height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 8px rgba(124,58,237,0.1)', borderBottom:'2px solid #EDE9FE' },
  headerDer:        { display:'flex', alignItems:'center', gap:'10px' },
  saludo:           { color:'#7C3AED', fontSize:'14px', fontWeight:'500' },
  btnNav:           { background:'transparent', color:'#7C3AED', border:'1px solid #EDE9FE', padding:'6px 14px', borderRadius:'8px', cursor:'pointer', fontSize:'13px' },
  btnSalir:         { background:'transparent', color:'#aaa', border:'1px solid #ddd', padding:'6px 14px', borderRadius:'8px', cursor:'pointer', fontSize:'13px' },
  layout:           { display:'flex', height:'calc(100vh - 64px)' },
  sidebar:          { width:'300px', background:'white', borderRight:'1px solid #EDE9FE', display:'flex', flexDirection:'column', overflow:'hidden' },
  sidebarHeader:    { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 16px 12px', borderBottom:'1px solid #EDE9FE' },
  sidebarTitulo:    { fontWeight:'bold', color:'#1A3557', fontSize:'16px' },
  btnNueva:         { background:'linear-gradient(135deg,#7C3AED,#2E6DA4)', color:'white', border:'none', width:'32px', height:'32px', borderRadius:'8px', cursor:'pointer', fontSize:'20px', display:'flex', alignItems:'center', justifyContent:'center' },
  formCarpeta:      { padding:'12px 16px', background:'#f5f3ff', borderBottom:'1px solid #EDE9FE' },
  input:            { width:'100%', padding:'8px', borderRadius:'6px', border:'1px solid #EDE9FE', fontSize:'13px', marginBottom:'8px', boxSizing:'border-box' },
  textarea:         { width:'100%', padding:'8px', borderRadius:'6px', border:'1px solid #EDE9FE', fontSize:'13px', marginBottom:'8px', boxSizing:'border-box', resize:'none', fontFamily:'sans-serif' },
  select:           { width:'100%', padding:'8px', borderRadius:'6px', border:'1px solid #EDE9FE', fontSize:'13px', marginBottom:'8px' },
  btnCancelar:      { flex:1, padding:'8px', background:'#EDE9FE', color:'#7C3AED', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'13px' },
  btnCrear:         { flex:1, padding:'8px', background:'linear-gradient(135deg,#7C3AED,#2E6DA4)', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'13px', fontWeight:'bold' },
  carpetaItem:      { display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', cursor:'pointer', borderBottom:'1px solid #f5f3ff', transition:'background 0.15s' },
  carpetaItemActivo:{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', cursor:'pointer', borderBottom:'1px solid #EDE9FE', background:'#f5f3ff', borderLeft:'3px solid #7C3AED' },
  carpetaIcono:     { fontSize:'24px', flexShrink:0 },
  carpetaInfo:      { flexGrow:1, overflow:'hidden' },
  carpetaNombre:    { margin:0, fontWeight:'bold', fontSize:'14px', color:'#1A3557', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  carpetaMeta:      { margin:'2px 0 0', fontSize:'11px', color:'#888' },
  carpetaAcciones:  { display:'flex', gap:'4px', flexShrink:0 },
  btnIcono:         { background:'none', border:'none', cursor:'pointer', fontSize:'14px', padding:'2px 4px' },
  btnIconoRed:      { background:'none', border:'none', cursor:'pointer', fontSize:'14px', padding:'2px 4px' },
  badgePriv:        { background:'#FEE2E2', color:'#991B1B', padding:'1px 6px', borderRadius:'6px', fontSize:'10px' },
  badgeComp:        { background:'#D1FAE5', color:'#065F46', padding:'1px 6px', borderRadius:'6px', fontSize:'10px' },
  main:             { flex:1, overflow:'auto', padding:'24px 32px' },
  placeholder:      { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', textAlign:'center' },
  carpetaHeader:    { marginBottom:'20px', paddingBottom:'16px', borderBottom:'1px solid #EDE9FE' },
  carpetaTitulo:    { color:'#1A3557', margin:'0 0 4px', fontSize:'22px' },
  carpetaDescripcion:{ color:'#666', fontSize:'14px', margin:'4px 0' },
  carpetaSubtitulo: { color:'#888', fontSize:'13px', margin:0 },
  docLista:         { display:'flex', flexDirection:'column', gap:'10px' },
  docItem:          { background:'white', borderRadius:'10px', padding:'14px 18px', display:'flex', alignItems:'center', gap:'14px', boxShadow:'0 2px 8px rgba(124,58,237,0.06)' },
  docInfo:          { flexGrow:1, overflow:'hidden' },
  docNombre:        { margin:'0 0 4px', fontWeight:'bold', color:'#1A3557', fontSize:'14px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  docMeta:          { margin:0, fontSize:'12px', color:'#888' },
  badge:            { background:'#EDE9FE', color:'#7C3AED', padding:'2px 8px', borderRadius:'8px', fontSize:'11px', fontWeight:'bold' },
  btnVer:           { background:'linear-gradient(135deg,#7C3AED,#2E6DA4)', color:'white', border:'none', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', fontSize:'12px', flexShrink:0 },
  btnMover:         { background:'white', color:'#7C3AED', border:'1px solid #7C3AED', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', fontSize:'12px', flexShrink:0 },
  btnIr:            { marginTop:'16px', padding:'10px 20px', background:'linear-gradient(135deg,#7C3AED,#2E6DA4)', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'14px' },
  overlay:          { position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000 },
  modal:            { background:'white', borderRadius:'16px', width:'90%', maxWidth:'600px', maxHeight:'80vh', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' },
  modalHeader:      { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 24px', background:'linear-gradient(135deg,#7C3AED,#2E6DA4)' },
  modalTitulo:      { fontWeight:'bold', fontSize:'15px', color:'white' },
  modalCerrar:      { background:'transparent', border:'none', color:'white', cursor:'pointer', fontSize:'20px' },
  modalBody:        { padding:'24px', overflowY:'auto', maxHeight:'calc(80vh - 60px)' },
  opcionMover:      { display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', background:'#f5f3ff', borderRadius:'8px', cursor:'pointer', border:'1px solid #EDE9FE' },
  permItem:         { display:'flex', alignItems:'center', gap:'8px', padding:'10px', background:'#f5f3ff', borderRadius:'8px' },
  btnPermVer:       { background:'#EDE9FE', color:'#7C3AED', border:'none', padding:'5px 10px', borderRadius:'6px', cursor:'pointer', fontSize:'11px', flexShrink:0 },
  btnPermEditar:    { background:'#7C3AED', color:'white', border:'none', padding:'5px 10px', borderRadius:'6px', cursor:'pointer', fontSize:'11px', flexShrink:0 },
  btnPermQuitar:    { background:'#FEE2E2', color:'#991B1B', border:'none', padding:'5px 10px', borderRadius:'6px', cursor:'pointer', fontSize:'11px', flexShrink:0 },
  sinDatos:         { color:'#aaa', textAlign:'center', padding:'24px 16px', fontSize:'13px' },
  exitoBox:         { background:'#eafaf1', color:'#1e7a4a', padding:'8px 12px', margin:'8px 16px', borderRadius:'6px', fontSize:'12px' },
  errorBox:         { background:'#fdecea', color:'#c0392b', padding:'8px 12px', margin:'8px 16px', borderRadius:'6px', fontSize:'12px' },
};

export default Carpetas;