import React, { useState, useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listarDocumentos, eliminarDocumento } from '../services/documentoService';
import apiCliente from '../services/apiCliente';

const estadoInicial = { documentos: [], cargando: true, error: null };

function reductor(estado, accion) {
  switch (accion.type) {
    case 'CARGAR_INICIO': return { ...estado, cargando: true, error: null };
    case 'CARGAR_EXITO':  return { ...estado, cargando: false, documentos: accion.payload };
    case 'CARGAR_ERROR':  return { ...estado, cargando: false, error: accion.payload };
    case 'ELIMINAR':      return { ...estado, documentos: estado.documentos.filter(d => d.id !== accion.payload) };
    default: return estado;
  }
}

function Panel() {
  const { usuario, cerrarSesion } = useAuth();
  const navegar = useNavigate();
  const [estado, despachar]     = useReducer(reductor, estadoInicial);
  const [filtro, setFiltro]     = useState('');
  const [autor, setAutor]       = useState('');
  const [catFiltro, setCatFiltro]     = useState('');
  const [fechaDesde, setFechaDesde]   = useState('');
  const [fechaHasta, setFechaHasta]   = useState('');
  const [categorias, setCategorias]   = useState([]);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

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
    setFiltro(''); setCatFiltro(''); setAutor('');
    setFechaDesde(''); setFechaHasta('');
  };

  const manejarEliminar = async (id) => {
    if (!window.confirm('¿Estás segura de que deseas eliminar este documento?')) return;
    try {
      await eliminarDocumento(id);
      despachar({ type: 'ELIMINAR', payload: id });
    } catch {
      alert('No se pudo eliminar el documento.');
    }
  };

  const iconoPorTipo = (mime) => {
    if (mime?.includes('pdf'))   return '📄';
    if (mime?.includes('image')) return '🖼️';
    if (mime?.includes('word'))  return '📝';
    if (mime?.includes('sheet')) return '📊';
    return '📁';
  };

  const { documentos, cargando, error } = estado;
  const esAdmin = usuario?.rol === 'admin';
  const esLector = usuario?.rol === 'lector';

  return (
    <div style={s.pagina}>
      <header style={s.header}>
        <span style={s.logo}>🍃 Folium</span>
        <div style={s.headerDer}>
          <span style={s.saludo}>Hola, {usuario?.nombre}</span>
          <span style={s.rol}>{usuario?.rol}</span>
          {!esLector && (
            <button style={s.btnSubir} onClick={() => navegar('/subir')}>
              + Subir documento
            </button>
          )}
          {esAdmin && (
            <button style={s.btnAdmin} onClick={() => navegar('/admin')}>
              ⚙ Admin
            </button>
          )}
          <button style={s.btnSalir} onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </header>

      <div style={s.contenido}>
        {/* Barra de búsqueda principal */}
        <div style={s.busquedaWrap}>
          <div style={s.inputWrap}>
            <span style={s.inputIcono}>🔍</span>
            <input style={s.buscador} type="text"
              placeholder="Buscar por nombre del documento..."
              value={filtro} onChange={e => setFiltro(e.target.value)} />
            {filtro && <button style={s.limpiarBtn} onClick={() => setFiltro('')}>✕</button>}
          </div>
          <button style={s.btnFiltros} onClick={() => setMostrarFiltros(!mostrarFiltros)}>
            🔧 {mostrarFiltros ? 'Ocultar filtros' : 'Más filtros'}
          </button>
        </div>

        {/* Filtros avanzados */}
        {mostrarFiltros && (
          <div style={s.filtrosAvanzados}>
            <div style={s.filtroCampo}>
              <label style={s.filtroLabel}>Categoría</label>
              <select style={s.filtroSelect} value={catFiltro}
                onChange={e => setCatFiltro(e.target.value)}>
                <option value="">Todas</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
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

        {/* Estadísticas */}
        <div style={s.stats}>
          <div style={s.statCard}>
            <span style={s.statNum}>{documentos.length}</span>
            <span style={s.statLabel}>Documentos</span>
          </div>
          <div style={s.statCard}>
            <span style={s.statNum}>{categorias.length}</span>
            <span style={s.statLabel}>Categorías</span>
          </div>
          <div style={s.statCard}>
            <span style={s.statNum}>
              {documentos.filter(d =>
                new Date() - new Date(d.fecha_carga) < 7*24*60*60*1000
              ).length}
            </span>
            <span style={s.statLabel}>Esta semana</span>
          </div>
        </div>

        {/* Estados */}
        {cargando && <div style={s.centrado}><p style={{color:'#888'}}>Cargando documentos...</p></div>}
        {error    && <div style={s.errorBox}>{error}</div>}
        {!cargando && !error && documentos.length === 0 && (
          <div style={s.vacio}>
            <div style={{fontSize:'64px',marginBottom:'16px'}}>📂</div>
            <p style={{color:'#888',fontSize:'16px'}}>
              {filtro||catFiltro||autor||fechaDesde
                ? 'No se encontraron documentos con esos filtros.'
                : 'Aún no hay documentos. ¡Sube el primero!'}
            </p>
          </div>
        )}

        {/* Lista de documentos */}
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
                  {' · '}{doc.autor_nombre || doc.autor || 'Sin autor'}
                  {' · '}{new Date(doc.fecha_carga).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'})}
                </p>
                {doc.etiquetas && doc.etiquetas.length > 0 && (
                  <div style={s.etiqWrap}>
                    {doc.etiquetas.map((e,i) => (
                      <span key={i} style={s.etiq}>{e}</span>
                    ))}
                  </div>
                )}
                {doc.descripcion && <p style={s.tarjetaDesc}>{doc.descripcion}</p>}
              </div>
              <div style={s.tarjetaAcciones}>
                <button style={s.btnVer}
                  onClick={() => window.open(`http://localhost:4000/archivos/${doc.ruta}`,'_blank')}>
                  Ver
                </button>
                {!esLector && (
                  <button style={s.btnEliminar} onClick={() => manejarEliminar(doc.id)}>
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  pagina:           { fontFamily:'sans-serif', minHeight:'100vh', background:'#f0f4f8' },
  header:           { background:'#1A3557', padding:'0 32px', height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 8px rgba(0,0,0,0.2)' },
  headerDer:        { display:'flex', alignItems:'center', gap:'12px' },
  logo:             { color:'white', fontSize:'22px', fontWeight:'bold' },
  saludo:           { color:'#cce', fontSize:'14px' },
  rol:              { background:'#2E6DA4', color:'white', padding:'2px 10px', borderRadius:'12px', fontSize:'12px' },
  btnSubir:         { background:'#2E6DA4', color:'white', border:'none', padding:'8px 16px', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:'bold' },
  btnAdmin:         { background:'#E67E22', color:'white', border:'none', padding:'8px 16px', borderRadius:'8px', cursor:'pointer', fontSize:'13px' },
  btnSalir:         { background:'transparent', color:'#aaa', border:'1px solid #aaa', padding:'8px 16px', borderRadius:'8px', cursor:'pointer', fontSize:'13px' },
  contenido:        { padding:'28px 32px' },
  busquedaWrap:     { display:'flex', gap:'12px', marginBottom:'12px' },
  inputWrap:        { flex:1, position:'relative' },
  inputIcono:       { position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'16px' },
  buscador:         { width:'100%', padding:'12px 36px 12px 38px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'14px', boxSizing:'border-box', background:'white' },
  limpiarBtn:       { position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#aaa', fontSize:'16px' },
  btnFiltros:       { padding:'12px 20px', background:'white', border:'1px solid #ddd', borderRadius:'8px', cursor:'pointer', fontSize:'13px', color:'#555', whiteSpace:'nowrap' },
  filtrosAvanzados: { background:'white', borderRadius:'10px', padding:'20px', marginBottom:'16px', display:'flex', flexWrap:'wrap', gap:'16px', alignItems:'flex-end', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  filtroCampo:      { display:'flex', flexDirection:'column', gap:'4px', minWidth:'160px' },
  filtroLabel:      { fontSize:'12px', fontWeight:'bold', color:'#555' },
  filtroSelect:     { padding:'8px', borderRadius:'6px', border:'1px solid #ddd', fontSize:'13px' },
  filtroInput:      { padding:'8px', borderRadius:'6px', border:'1px solid #ddd', fontSize:'13px' },
  btnLimpiar:       { padding:'8px 16px', background:'#f0f0f0', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'13px', alignSelf:'flex-end' },
  stats:            { display:'flex', gap:'16px', marginBottom:'20px' },
  statCard:         { background:'white', borderRadius:'10px', padding:'16px 24px', display:'flex', flexDirection:'column', alignItems:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', minWidth:'100px' },
  statNum:          { fontSize:'28px', fontWeight:'bold', color:'#1A3557' },
  statLabel:        { fontSize:'12px', color:'#888', marginTop:'4px' },
  grilla:           { display:'flex', flexDirection:'column', gap:'10px' },
  tarjeta:          { background:'white', borderRadius:'10px', padding:'16px 20px', display:'flex', alignItems:'center', gap:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  tarjetaIcono:     { fontSize:'36px', flexShrink:0 },
  tarjetaInfo:      { flexGrow:1, overflow:'hidden' },
  tarjetaNombre:    { margin:'0 0 4px 0', fontWeight:'bold', color:'#1A3557', fontSize:'15px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  tarjetaMeta:      { margin:'0 0 4px 0', fontSize:'12px', color:'#888' },
  tarjetaDesc:      { margin:'4px 0 0 0', fontSize:'12px', color:'#aaa', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  badge:            { background:'#EAF2FB', color:'#2E6DA4', padding:'2px 8px', borderRadius:'10px', fontSize:'11px', fontWeight:'bold' },
  badgeGris:        { background:'#f0f0f0', color:'#aaa', padding:'2px 8px', borderRadius:'10px', fontSize:'11px' },
  etiqWrap:         { display:'flex', flexWrap:'wrap', gap:'4px', margin:'4px 0' },
  etiq:             { background:'#FFF4E5', color:'#C75B00', padding:'2px 8px', borderRadius:'10px', fontSize:'11px' },
  tarjetaAcciones:  { display:'flex', gap:'8px', flexShrink:0 },
  btnVer:           { background:'#2E6DA4', color:'white', border:'none', padding:'7px 14px', borderRadius:'6px', cursor:'pointer', fontSize:'13px' },
  btnEliminar:      { background:'white', color:'#e74c3c', border:'1px solid #e74c3c', padding:'7px 14px', borderRadius:'6px', cursor:'pointer', fontSize:'13px' },
  centrado:         { textAlign:'center', padding:'60px 0' },
  vacio:            { textAlign:'center', padding:'60px 0' },
  errorBox:         { background:'#fdecea', color:'#c0392b', padding:'14px', borderRadius:'8px', marginBottom:'16px', fontSize:'14px' },
};

export default Panel;