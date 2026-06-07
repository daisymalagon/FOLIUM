import React, { useState, useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listarDocumentos, eliminarDocumento } from '../services/documentoService';
import apiCliente from '../services/apiCliente';
import Logo from '../components/Logo';
import Notificaciones from '../components/Notificaciones';

const estadoInicial = { documentos: [], cargando: true, error: null };

function reductor(estado, accion) {
  switch (accion.type) {
    case 'CARGAR_INICIO': return { ...estado, cargando: true,  error: null };
    case 'CARGAR_EXITO':  return { ...estado, cargando: false, documentos: accion.payload };
    case 'CARGAR_ERROR':  return { ...estado, cargando: false, error: accion.payload };
    case 'ELIMINAR':      return { ...estado, documentos: estado.documentos.filter(d => d.id !== accion.payload) };
    default: return estado;
  }
}

function Panel() {
  const { usuario, cerrarSesion } = useAuth();
  const navegar = useNavigate();

  const [estado, despachar]         = useReducer(reductor, estadoInicial);
  const [filtro,     setFiltro]     = useState('');
  const [autor,      setAutor]      = useState('');
  const [catFiltro,  setCatFiltro]  = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [docPreview, setDocPreview] = useState(null);

  const esAdmin  = usuario?.rol === 'admin';
  const esLector = usuario?.rol === 'lector';

  useEffect(() => {
    apiCliente.get('/categorias')
      .then(r => setCategorias(r.data.datos || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function cargar() {
      despachar({ type: 'CARGAR_INICIO' });
      try {
        const params = {};
        if (filtro)     params.q          = filtro;
        if (catFiltro)  params.categoria  = catFiltro;
        if (autor)      params.autor      = autor;
        if (fechaDesde) params.fechaDesde = fechaDesde;
        if (fechaHasta) params.fechaHasta = fechaHasta;
        const datos = await listarDocumentos(params);
        despachar({ type: 'CARGAR_EXITO', payload: datos.datos });
      } catch {
        despachar({ type: 'CARGAR_ERROR', payload: 'No se pudieron cargar los documentos.' });
      }
    }
    const t = setTimeout(cargar, 300);
    return () => clearTimeout(t);
  }, [filtro, catFiltro, autor, fechaDesde, fechaHasta]);

  const limpiarFiltros = () => {
    setFiltro(''); setCatFiltro('');
    setAutor(''); setFechaDesde(''); setFechaHasta('');
  };

  const manejarEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este documento?')) return;
    try {
      await eliminarDocumento(id);
      despachar({ type: 'ELIMINAR', payload: id });
    } catch { alert('No se pudo eliminar el documento.'); }
  };

  const iconoPorTipo = (mime) => {
    if (mime?.includes('pdf'))   return '📄';
    if (mime?.includes('image')) return '🖼️';
    if (mime?.includes('word'))  return '📝';
    if (mime?.includes('sheet')) return '📊';
    return '📁';
  };

  const urlArchivo = (ruta) => `http://localhost:4000/archivos/${ruta}`;
  const { documentos, cargando, error } = estado;

  return (
    <div style={s.pagina}>

      {/* ── Header ── */}
      <header style={s.header}>
        <Logo size={34} showText={true} />
        <div style={s.headerDer}>
          <button style={s.btnNav} onClick={() => navegar('/carpetas')}>📁 Carpetas</button>
          <button style={s.btnNav} onClick={() => navegar('/dashboard')}>📊 Dashboard</button>
          {esAdmin && <button style={s.btnAdmin} onClick={() => navegar('/admin')}>⚙ Admin</button>}
          <Notificaciones />
          <span style={s.saludo}>{usuario?.nombre}</span>
          <span style={esAdmin ? s.rolAdmin : esLector ? s.rolLector : s.rolCol}>
            {usuario?.rol}
          </span>
          {!esLector && (
            <button style={s.btnSubir} onClick={() => navegar('/subir')}>
              + Subir
            </button>
          )}
          <button style={s.btnSalir} onClick={cerrarSesion}>Salir</button>
        </div>
      </header>

      {/* ── Barra de módulos ── */}
      <div style={s.modulos}>
        {[
          { icono:'📄', label:'Mis documentos', ruta:'/',          activo: true  },
          { icono:'📁', label:'Carpetas',        ruta:'/carpetas',  activo: false },
          { icono:'📊', label:'Dashboard',       ruta:'/dashboard', activo: false },
        ].map((m, i) => (
          <button key={i}
            style={m.activo ? s.moduloActivo : s.modulo}
            onClick={() => navegar(m.ruta)}>
            {m.icono} {m.label}
          </button>
        ))}
      </div>

      <div style={s.contenido}>

        {/* ── Buscador ── */}
        <div style={s.busquedaWrap}>
          <div style={s.inputWrap}>
            <span style={s.inputIcono}>🔍</span>
            <input style={s.buscador} type="text"
              placeholder="Buscar documento por nombre..."
              value={filtro} onChange={e => setFiltro(e.target.value)} />
            {filtro && (
              <button style={s.limpiarBtn} onClick={() => setFiltro('')}>✕</button>
            )}
          </div>
          <button style={s.btnFiltros}
            onClick={() => setMostrarFiltros(!mostrarFiltros)}>
            🔧 {mostrarFiltros ? 'Ocultar' : 'Más filtros'}
          </button>
        </div>

        {/* ── Filtros avanzados ── */}
        {mostrarFiltros && (
          <div style={s.filtrosWrap}>
            <div style={s.filtroCampo}>
              <label style={s.filtroLabel}>Categoría</label>
              <select style={s.filtroInput} value={catFiltro}
                onChange={e => setCatFiltro(e.target.value)}>
                <option value="">Todas</option>
                {categorias.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div style={s.filtroCampo}>
              <label style={s.filtroLabel}>Autor</label>
              <input style={s.filtroInput} type="text" placeholder="Nombre del autor..."
                value={autor} onChange={e => setAutor(e.target.value)} />
            </div>
            <div style={s.filtroCampo}>
              <label style={s.filtroLabel}>Desde</label>
              <input style={s.filtroInput} type="date"
                value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
            </div>
            <div style={s.filtroCampo}>
              <label style={s.filtroLabel}>Hasta</label>
              <input style={s.filtroInput} type="date"
                value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
            </div>
            <button style={s.btnLimpiar} onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          </div>
        )}

        {/* ── Estadísticas ── */}
        <div style={s.stats}>
          {[
            { num: documentos.length, label:'Documentos', color:'#7C3AED' },
            { num: categorias.length, label:'Categorías',  color:'#2E6DA4' },
            { num: documentos.filter(d =>
                new Date() - new Date(d.fecha_carga) < 7*24*60*60*1000
              ).length, label:'Esta semana', color:'#10B981' },
          ].map((st, i) => (
            <div key={i} style={{ ...s.statCard, borderLeft:`4px solid ${st.color}` }}>
              <span style={{ ...s.statNum, color: st.color }}>{st.num}</span>
              <span style={s.statLabel}>{st.label}</span>
            </div>
          ))}
        </div>

        {/* ── Estados de carga ── */}
        {cargando && (
          <div style={s.centrado}>
            <p style={{ color:'#7C3AED' }}>Cargando documentos...</p>
          </div>
        )}
        {error && <div style={s.errorBox}>{error}</div>}
        {!cargando && !error && documentos.length === 0 && (
          <div style={s.vacio}>
            <div style={{ fontSize:'64px' }}>📂</div>
            <p style={{ color:'#888', fontSize:'16px' }}>
              {filtro || catFiltro || autor || fechaDesde
                ? 'No se encontraron documentos con esos filtros.'
                : '¡Sube el primer documento!'}
            </p>
          </div>
        )}

        {/* ── Lista de documentos ── */}
        <div style={s.grilla}>
          {documentos.map(doc => (
            <div key={doc.id} style={s.tarjeta}>
              <div style={s.tarjetaIcono}>{iconoPorTipo(doc.tipo_mime)}</div>
              <div style={s.tarjetaInfo}>
                <p style={s.tarjetaNombre}>{doc.nombre}</p>
                <p style={s.tarjetaMeta}>
                  {doc.categoria_nombre
                    ? <span style={s.badge}>{doc.categoria_nombre}</span>
                    : <span style={s.badgeGris}>Sin categoría</span>}
                  {' · '}{doc.autor_nombre || 'Sin autor'}
                  {' · '}{new Date(doc.fecha_carga).toLocaleDateString('es-CO', {
                    day:'2-digit', month:'short', year:'numeric'
                  })}
                </p>
                {doc.etiquetas?.length > 0 && (
                  <div style={s.etiqWrap}>
                    {doc.etiquetas.map((e, i) => (
                      <span key={i} style={s.etiq}>{e}</span>
                    ))}
                  </div>
                )}
                {doc.descripcion && (
                  <p style={s.tarjetaDesc}>{doc.descripcion}</p>
                )}
              </div>
              <div style={s.tarjetaAcciones}>
                <button style={s.btnVer} onClick={() => setDocPreview(doc)}>
                  👁 Ver
                </button>
                {!esLector && (
                  <button style={s.btnEliminar}
                    onClick={() => manejarEliminar(doc.id)}>
                    🗑
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modal vista previa ── */}
      {docPreview && (
        <div style={s.modalOverlay} onClick={() => setDocPreview(null)}>
          <div style={s.modalWrap} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitulo}>👁 {docPreview.nombre}</span>
              <button style={s.modalCerrar} onClick={() => setDocPreview(null)}>✕</button>
            </div>
            <div style={s.modalBody}>
              {docPreview.tipo_mime?.includes('image') ? (
                <img src={urlArchivo(docPreview.ruta)} alt={docPreview.nombre}
                  style={{ maxWidth:'100%', maxHeight:'70vh', borderRadius:'8px' }} />
              ) : docPreview.tipo_mime?.includes('pdf') ? (
                <iframe src={urlArchivo(docPreview.ruta)} title={docPreview.nombre}
                  style={{ width:'100%', height:'70vh', border:'none', borderRadius:'8px' }} />
              ) : (
                <div style={s.previewNoDisp}>
                  <p style={{ fontSize:'56px' }}>📝</p>
                  <p style={{ color:'#888', marginBottom:'20px' }}>
                    Vista previa no disponible para este tipo de archivo.
                  </p>
                  <a href={urlArchivo(docPreview.ruta)} target="_blank" rel="noreferrer"
                    style={s.btnDescargar}>
                    ⬇ Descargar archivo
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const s = {
  pagina:        { fontFamily:'sans-serif', minHeight:'100vh', background:'#F5F3FF' },
  header:        { background:'white', padding:'0 24px', height:'64px', display:'flex',
                   alignItems:'center', justifyContent:'space-between',
                   boxShadow:'0 2px 8px rgba(124,58,237,0.1)',
                   borderBottom:'2px solid #EDE9FE' },
  headerDer:     { display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' },
  saludo:        { color:'#7C3AED', fontSize:'14px', fontWeight:'500' },
  rolAdmin:      { background:'linear-gradient(135deg,#7C3AED,#2E6DA4)', color:'white',
                   padding:'2px 10px', borderRadius:'12px', fontSize:'12px' },
  rolCol:        { background:'#2E6DA4', color:'white',
                   padding:'2px 10px', borderRadius:'12px', fontSize:'12px' },
  rolLector:     { background:'#6B7280', color:'white',
                   padding:'2px 10px', borderRadius:'12px', fontSize:'12px' },
  btnNav:        { background:'transparent', color:'#7C3AED',
                   border:'1px solid #EDE9FE', padding:'6px 14px',
                   borderRadius:'8px', cursor:'pointer', fontSize:'13px' },
  btnAdmin:      { background:'#FEF3C7', color:'#92400E',
                   border:'1px solid #FCD34D', padding:'6px 14px',
                   borderRadius:'8px', cursor:'pointer', fontSize:'13px' },
  btnSubir:      { background:'linear-gradient(135deg,#7C3AED,#2E6DA4)',
                   color:'white', border:'none', padding:'8px 16px',
                   borderRadius:'8px', cursor:'pointer', fontSize:'13px',
                   fontWeight:'bold' },
  btnSalir:      { background:'transparent', color:'#9CA3AF',
                   border:'1px solid #E5E7EB', padding:'6px 14px',
                   borderRadius:'8px', cursor:'pointer', fontSize:'13px' },
  modulos:       { background:'white', padding:'0 24px', display:'flex',
                   gap:'4px', borderBottom:'1px solid #EDE9FE' },
  modulo:        { padding:'12px 16px', background:'transparent', border:'none',
                   borderBottom:'3px solid transparent', cursor:'pointer',
                   fontSize:'13px', color:'#9CA3AF' },
  moduloActivo:  { padding:'12px 16px', background:'transparent', border:'none',
                   borderBottom:'3px solid #7C3AED', cursor:'pointer',
                   fontSize:'13px', color:'#7C3AED', fontWeight:'bold' },
  contenido:     { padding:'24px 32px' },
  busquedaWrap:  { display:'flex', gap:'12px', marginBottom:'12px' },
  inputWrap:     { flex:1, position:'relative' },
  inputIcono:    { position:'absolute', left:'12px', top:'50%',
                   transform:'translateY(-50%)', fontSize:'16px' },
  buscador:      { width:'100%', padding:'12px 36px 12px 38px',
                   borderRadius:'10px', border:'1px solid #EDE9FE',
                   fontSize:'14px', boxSizing:'border-box',
                   background:'white', outline:'none' },
  limpiarBtn:    { position:'absolute', right:'10px', top:'50%',
                   transform:'translateY(-50%)', background:'none',
                   border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:'16px' },
  btnFiltros:    { padding:'12px 16px', background:'white',
                   border:'1px solid #EDE9FE', borderRadius:'10px',
                   cursor:'pointer', fontSize:'13px', color:'#7C3AED',
                   whiteSpace:'nowrap' },
  filtrosWrap:   { background:'white', borderRadius:'10px', padding:'20px',
                   marginBottom:'16px', display:'flex', flexWrap:'wrap',
                   gap:'16px', alignItems:'flex-end',
                   boxShadow:'0 2px 8px rgba(124,58,237,0.06)' },
  filtroCampo:   { display:'flex', flexDirection:'column', gap:'4px', minWidth:'150px' },
  filtroLabel:   { fontSize:'12px', fontWeight:'bold', color:'#7C3AED' },
  filtroInput:   { padding:'8px 10px', borderRadius:'8px',
                   border:'1px solid #EDE9FE', fontSize:'13px' },
  btnLimpiar:    { padding:'8px 16px', background:'#EDE9FE', color:'#7C3AED',
                   border:'none', borderRadius:'8px', cursor:'pointer',
                   fontSize:'13px', alignSelf:'flex-end' },
  stats:         { display:'flex', gap:'16px', marginBottom:'20px' },
  statCard:      { background:'white', borderRadius:'10px', padding:'14px 20px',
                   display:'flex', flexDirection:'column',
                   boxShadow:'0 2px 8px rgba(124,58,237,0.06)', minWidth:'120px' },
  statNum:       { fontSize:'28px', fontWeight:'bold' },
  statLabel:     { fontSize:'12px', color:'#9CA3AF', marginTop:'2px' },
  grilla:        { display:'flex', flexDirection:'column', gap:'10px' },
  tarjeta:       { background:'white', borderRadius:'10px', padding:'16px 20px',
                   display:'flex', alignItems:'center', gap:'16px',
                   boxShadow:'0 2px 8px rgba(124,58,237,0.06)' },
  tarjetaIcono:  { fontSize:'36px', flexShrink:0 },
  tarjetaInfo:   { flexGrow:1, overflow:'hidden' },
  tarjetaNombre: { margin:'0 0 4px', fontWeight:'bold', color:'#1A3557',
                   fontSize:'15px', whiteSpace:'nowrap', overflow:'hidden',
                   textOverflow:'ellipsis' },
  tarjetaMeta:   { margin:'0 0 4px', fontSize:'12px', color:'#9CA3AF' },
  tarjetaDesc:   { margin:'4px 0 0', fontSize:'12px', color:'#9CA3AF',
                   whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  badge:         { background:'#EDE9FE', color:'#7C3AED', padding:'2px 8px',
                   borderRadius:'10px', fontSize:'11px', fontWeight:'bold' },
  badgeGris:     { background:'#F3F4F6', color:'#9CA3AF', padding:'2px 8px',
                   borderRadius:'10px', fontSize:'11px' },
  etiqWrap:      { display:'flex', flexWrap:'wrap', gap:'4px', margin:'4px 0' },
  etiq:          { background:'#D1FAE5', color:'#065F46', padding:'2px 8px',
                   borderRadius:'10px', fontSize:'11px' },
  tarjetaAcciones:{ display:'flex', gap:'6px', flexShrink:0 },
  btnVer:        { background:'linear-gradient(135deg,#7C3AED,#2E6DA4)',
                   color:'white', border:'none', padding:'7px 14px',
                   borderRadius:'6px', cursor:'pointer', fontSize:'13px' },
  btnEliminar:   { background:'white', color:'#EF4444',
                   border:'1px solid #EF4444', padding:'7px 12px',
                   borderRadius:'6px', cursor:'pointer', fontSize:'14px' },
  centrado:      { textAlign:'center', padding:'60px 0' },
  vacio:         { textAlign:'center', padding:'60px 0' },
  errorBox:      { background:'#FEF2F2', color:'#991B1B', padding:'14px',
                   borderRadius:'8px', marginBottom:'16px', fontSize:'14px',
                   border:'1px solid #FECACA' },
  modalOverlay:  { position:'fixed', top:0, left:0, right:0, bottom:0,
                   background:'rgba(0,0,0,0.6)', display:'flex',
                   alignItems:'center', justifyContent:'center', zIndex:2000 },
  modalWrap:     { background:'white', borderRadius:'16px', width:'85%',
                   maxWidth:'900px', maxHeight:'90vh', overflow:'hidden',
                   boxShadow:'0 20px 60px rgba(0,0,0,0.3)' },
  modalHeader:   { display:'flex', justifyContent:'space-between', alignItems:'center',
                   padding:'16px 24px',
                   background:'linear-gradient(135deg,#7C3AED,#2E6DA4)' },
  modalTitulo:   { fontWeight:'bold', fontSize:'15px', color:'white',
                   whiteSpace:'nowrap', overflow:'hidden',
                   textOverflow:'ellipsis', maxWidth:'80%' },
  modalCerrar:   { background:'transparent', border:'none', color:'white',
                   cursor:'pointer', fontSize:'22px', lineHeight:1, flexShrink:0 },
  modalBody:     { padding:'24px', display:'flex', justifyContent:'center',
                   alignItems:'center', overflowY:'auto',
                   maxHeight:'calc(90vh - 64px)' },
  previewNoDisp: { textAlign:'center', padding:'40px' },
  btnDescargar:  { display:'inline-block', padding:'10px 24px',
                   background:'linear-gradient(135deg,#7C3AED,#2E6DA4)',
                   color:'white', borderRadius:'8px',
                   textDecoration:'none', fontSize:'14px',
                   fontFamily:'sans-serif' },
};

export default Panel;