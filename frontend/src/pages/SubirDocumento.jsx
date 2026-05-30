import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subirDocumento } from '../services/documentoService';
import apiCliente from '../services/apiCliente';

function SubirDocumento() {
  const [archivo,      setArchivo]      = useState(null);
  const [descripcion,  setDescripcion]  = useState('');
  const [categoriaId,  setCategoriaId]  = useState('');
  const [categorias,   setCategorias]   = useState([]);
  const [etiquetas,    setEtiquetas]    = useState([]);
  const [etiqDisp,     setEtiqDisp]     = useState([]);
  const [nuevaEtiq,    setNuevaEtiq]    = useState('');
  const [cargando,     setCargando]     = useState(false);
  const [progreso,     setProgreso]     = useState(0);
  const [error,        setError]        = useState('');
  const [exito,        setExito]        = useState('');
  const navegar = useNavigate();

  useEffect(() => {
    apiCliente.get('/categorias').then(r => setCategorias(r.data.datos || [])).catch(() => {});
    apiCliente.get('/etiquetas').then(r => setEtiqDisp(r.data.datos || [])).catch(() => {});
  }, []);

  const validarArchivo = (file) => {
    const permitidos = ['application/pdf','application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg','image/png'];
    if (!permitidos.includes(file.type)) return 'Tipo no permitido. Solo PDF, Word, Excel, JPG o PNG.';
    if (file.size > 50 * 1024 * 1024)   return 'El archivo supera el límite de 50 MB.';
    return null;
  };

  const manejarArchivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const err = validarArchivo(file);
    if (err) { setError(err); setArchivo(null); return; }
    setError(''); setArchivo(file);
  };

  const agregarEtiqueta = (nombre) => {
    const n = nombre.trim();
    if (!n || etiquetas.includes(n)) return;
    setEtiquetas([...etiquetas, n]);
    setNuevaEtiq('');
  };

  const quitarEtiqueta = (nombre) => {
    setEtiquetas(etiquetas.filter(e => e !== nombre));
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setError(''); setExito('');
    if (!archivo) { setError('Selecciona un archivo antes de continuar.'); return; }
    const formData = new FormData();
    formData.append('archivo',     archivo);
    formData.append('descripcion', descripcion);
    formData.append('etiquetas',   JSON.stringify(etiquetas));
    if (categoriaId) formData.append('categoriaId', categoriaId);
    try {
      setCargando(true);
      const iv = setInterval(() => setProgreso(p => p < 85 ? p + 10 : p), 150);
      await subirDocumento(formData);
      clearInterval(iv); setProgreso(100);
      setExito('¡Documento subido exitosamente!');
      setTimeout(() => navegar('/'), 1500);
    } catch (err) {
      setProgreso(0);
      setError(err.response?.data?.mensaje || 'Error al subir el documento.');
    } finally { setCargando(false); }
  };

  const tam = (b) => b < 1024 ? `${b} B` : b < 1024*1024 ? `${(b/1024).toFixed(1)} KB` : `${(b/(1024*1024)).toFixed(1)} MB`;

  return (
    <div style={s.pagina}>
      <header style={s.header}>
        <span style={s.logo}>🍃 Folium</span>
        <button style={s.btnVolver} onClick={() => navegar('/')}>← Volver al panel</button>
      </header>
      <div style={s.contenido}>
        <div style={s.caja}>
          <h2 style={s.titulo}>📤 Subir documento</h2>
          <p style={s.subtitulo}>PDF, Word, Excel, JPG, PNG · Máximo 50 MB</p>
          {error && <div style={s.errorBox}>{error}</div>}
          {exito && <div style={s.exitoBox}>{exito}</div>}
          <form onSubmit={manejarEnvio}>
            {/* Zona de carga */}
            <label style={s.dropZone}>
              <input type="file" style={{display:'none'}}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                onChange={manejarArchivo} />
              {archivo ? (
                <div style={s.archivoInfo}>
                  <span style={{fontSize:'40px'}}>📄</span>
                  <p style={s.archivoNombre}>{archivo.name}</p>
                  <p style={{color:'#888',fontSize:'12px',margin:'2px 0'}}>{tam(archivo.size)}</p>
                  <p style={{color:'#2E6DA4',fontSize:'12px',margin:0}}>Clic para cambiar</p>
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
                  <span style={{fontSize:'48px'}}>☁️</span>
                  <p style={{margin:'8px 0 4px',fontWeight:'bold',color:'#1A3557'}}>Haz clic para seleccionar</p>
                  <p style={{margin:0,fontSize:'13px',color:'#aaa'}}>PDF, Word, Excel, JPG, PNG</p>
                </div>
              )}
            </label>

            {/* Categoría */}
            <div style={s.campo}>
              <label style={s.label}>Categoría</label>
              <select style={s.select} value={categoriaId} onChange={e => setCategoriaId(e.target.value)}>
                <option value="">Sin categoría</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>

            {/* Etiquetas */}
            <div style={s.campo}>
              <label style={s.label}>Etiquetas</label>
              <div style={s.etiqWrap}>
                {etiquetas.map(e => (
                  <span key={e} style={s.etiq}>
                    {e}
                    <button type="button" style={s.etiqX} onClick={() => quitarEtiqueta(e)}>✕</button>
                  </span>
                ))}
              </div>
              <div style={s.etiqInputWrap}>
                <input style={s.etiqInput} type="text" placeholder="Agregar etiqueta..."
                  value={nuevaEtiq} onChange={e => setNuevaEtiq(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarEtiqueta(nuevaEtiq); }}} />
                <button type="button" style={s.etiqBtn} onClick={() => agregarEtiqueta(nuevaEtiq)}>
                  + Agregar
                </button>
              </div>
              {etiqDisp.length > 0 && (
                <div style={s.etiqSugerencias}>
                  <span style={{fontSize:'11px',color:'#aaa'}}>Sugerencias: </span>
                  {etiqDisp.filter(e => !etiquetas.includes(e.nombre)).map(e => (
                    <button key={e.id} type="button" style={s.etiqSug}
                      onClick={() => agregarEtiqueta(e.nombre)}>
                      {e.nombre}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Descripción */}
            <div style={s.campo}>
              <label style={s.label}>Descripción (opcional)</label>
              <textarea style={s.textarea} rows={3} placeholder="Agrega una descripción..."
                value={descripcion} onChange={e => setDescripcion(e.target.value)} />
            </div>

            {/* Progreso */}
            {cargando && (
              <div style={s.progresoWrap}>
                <div style={{...s.progresoBar, width:`${progreso}%`}}></div>
              </div>
            )}

            <div style={s.botones}>
              <button style={s.btnCancelar} type="button" onClick={() => navegar('/')} disabled={cargando}>
                Cancelar
              </button>
              <button style={cargando ? s.btnDisabled : s.btnSubir} type="submit" disabled={cargando}>
                {cargando ? `Subiendo... ${progreso}%` : '⬆ Subir archivo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const s = {
  pagina:       { fontFamily:'sans-serif', minHeight:'100vh', background:'#f0f4f8' },
  header:       { background:'#1A3557', padding:'0 32px', height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  logo:         { color:'white', fontSize:'22px', fontWeight:'bold' },
  btnVolver:    { background:'transparent', color:'#aaa', border:'1px solid #aaa', padding:'8px 16px', borderRadius:'8px', cursor:'pointer', fontSize:'13px' },
  contenido:    { display:'flex', justifyContent:'center', padding:'40px 20px' },
  caja:         { background:'white', padding:'40px', borderRadius:'16px', boxShadow:'0 4px 20px rgba(0,0,0,0.08)', width:'520px', maxWidth:'100%' },
  titulo:       { color:'#1A3557', marginBottom:'4px' },
  subtitulo:    { color:'#aaa', fontSize:'13px', marginBottom:'24px' },
  dropZone:     { display:'block', border:'2px dashed #cce', borderRadius:'12px', padding:'32px', textAlign:'center', cursor:'pointer', marginBottom:'20px', background:'#f8fbff' },
  archivoInfo:  { display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' },
  archivoNombre:{ fontWeight:'bold', color:'#1A3557', margin:'8px 0 0', wordBreak:'break-all', fontSize:'14px' },
  campo:        { marginBottom:'16px' },
  label:        { display:'block', fontSize:'13px', fontWeight:'bold', color:'#555', marginBottom:'6px' },
  select:       { width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'14px', boxSizing:'border-box' },
  etiqWrap:     { display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'8px' },
  etiq:         { background:'#EAF2FB', color:'#2E6DA4', padding:'4px 10px', borderRadius:'12px', fontSize:'13px', display:'flex', alignItems:'center', gap:'6px' },
  etiqX:        { background:'none', border:'none', color:'#2E6DA4', cursor:'pointer', padding:0, fontSize:'12px' },
  etiqInputWrap:{ display:'flex', gap:'8px' },
  etiqInput:    { flex:1, padding:'8px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'13px' },
  etiqBtn:      { padding:'8px 14px', background:'#2E6DA4', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'13px' },
  etiqSugerencias:{ marginTop:'8px', display:'flex', flexWrap:'wrap', gap:'6px', alignItems:'center' },
  etiqSug:      { background:'#f0f0f0', color:'#666', border:'none', padding:'3px 10px', borderRadius:'10px', cursor:'pointer', fontSize:'12px' },
  textarea:     { width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'14px', boxSizing:'border-box', resize:'vertical', fontFamily:'sans-serif' },
  progresoWrap: { background:'#eee', borderRadius:'8px', height:'8px', marginBottom:'16px', overflow:'hidden' },
  progresoBar:  { background:'#2E6DA4', height:'100%', borderRadius:'8px', transition:'width 0.2s' },
  botones:      { display:'flex', gap:'12px', marginTop:'8px' },
  btnCancelar:  { flex:1, padding:'12px', background:'#f0f0f0', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'14px' },
  btnSubir:     { flex:2, padding:'12px', background:'#2E6DA4', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'14px', fontWeight:'bold' },
  btnDisabled:  { flex:2, padding:'12px', background:'#aaa', color:'white', border:'none', borderRadius:'8px', cursor:'not-allowed', fontSize:'14px' },
  errorBox:     { background:'#fdecea', color:'#c0392b', padding:'12px 14px', borderRadius:'8px', marginBottom:'16px', fontSize:'13px' },
  exitoBox:     { background:'#eafaf1', color:'#1e7a4a', padding:'12px 14px', borderRadius:'8px', marginBottom:'16px', fontSize:'13px', fontWeight:'bold' },
};

export default SubirDocumento;