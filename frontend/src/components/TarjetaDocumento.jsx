import React from 'react';

function TarjetaDocumento({ documento, onDescargar, onEliminar }) {
  const { nombre, categoria_nombre, fecha_carga, tipo_mime, descripcion } = documento;

  const iconoPorTipo = (mime) => {
    if (mime?.includes('pdf'))   return '📄';
    if (mime?.includes('image')) return '🖼️';
    if (mime?.includes('word'))  return '📝';
    if (mime?.includes('sheet')) return '📊';
    return '📁';
  };

  return (
    <div style={s.tarjeta}>
      <div style={s.icono}>{iconoPorTipo(tipo_mime)}</div>
      <div style={s.info}>
        <p style={s.nombre}>{nombre}</p>
        <p style={s.meta}>
          {categoria_nombre
            ? <span style={s.badge}>{categoria_nombre}</span>
            : <span style={s.badgeGris}>Sin categoría</span>}
          {' · '}{new Date(fecha_carga).toLocaleDateString('es-CO', {
            day:'2-digit', month:'short', year:'numeric'
          })}
        </p>
        {descripcion && <p style={s.desc}>{descripcion}</p>}
      </div>
      <div style={s.acciones}>
        <button style={s.btnVer}      onClick={() => onDescargar(documento)}>Ver</button>
        <button style={s.btnEliminar} onClick={() => onEliminar(documento.id)}>Eliminar</button>
      </div>
    </div>
  );
}

const s = {
  tarjeta:    { background:'white', borderRadius:'10px', padding:'16px 20px',
                display:'flex', alignItems:'center', gap:'16px',
                boxShadow:'0 2px 8px rgba(0,0,0,0.06)', fontFamily:'sans-serif' },
  icono:      { fontSize:'36px', flexShrink:0 },
  info:       { flexGrow:1, overflow:'hidden' },
  nombre:     { margin:'0 0 4px 0', fontWeight:'bold', color:'#1A3557',
                fontSize:'15px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  meta:       { margin:0, fontSize:'12px', color:'#888' },
  desc:       { margin:'4px 0 0 0', fontSize:'12px', color:'#aaa',
                whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  badge:      { background:'#EAF2FB', color:'#2E6DA4', padding:'2px 8px',
                borderRadius:'10px', fontSize:'11px', fontWeight:'bold' },
  badgeGris:  { background:'#f0f0f0', color:'#aaa', padding:'2px 8px',
                borderRadius:'10px', fontSize:'11px' },
  acciones:   { display:'flex', gap:'8px', flexShrink:0 },
  btnVer:     { background:'#2E6DA4', color:'white', border:'none',
                padding:'7px 14px', borderRadius:'6px', cursor:'pointer', fontSize:'13px' },
  btnEliminar:{ background:'white', color:'#e74c3c', border:'1px solid #e74c3c',
                padding:'7px 14px', borderRadius:'6px', cursor:'pointer', fontSize:'13px' },
};

export default TarjetaDocumento;