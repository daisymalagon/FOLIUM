import React, { useState, useEffect } from 'react';
import apiCliente from '../services/apiCliente';

function Notificaciones() {
  const [abierto,        setAbierto]        = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [vistas,         setVistas]         = useState(() => {
    try {
      const g = localStorage.getItem('folium_notif_vistas');
      return g ? JSON.parse(g) : [];
    } catch { return []; }
  });

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, 30000);
    return () => clearInterval(intervalo);
  }, []);

  const cargar = async () => {
    try {
      const r = await apiCliente.get('/usuarios/historial/todos');
      setNotificaciones((r.data.datos || []).slice(0, 20));
    } catch {}
  };

  const marcarVistas = () => {
    const ids = notificaciones.map(n => n.id);
    localStorage.setItem('folium_notif_vistas', JSON.stringify(ids));
    setVistas(ids);
    setAbierto(false);
  };

  const noVistas = notificaciones.filter(n => !vistas.includes(n.id)).length;

  const iconoAccion = (accion) => {
    if (accion === 'SUBIDA')      return '⬆️';
    if (accion === 'ELIMINACION') return '🗑️';
    return '📋';
  };

  const tiempoRelativo = (fecha) => {
    const diff = new Date() - new Date(fecha);
    const min  = Math.floor(diff / 60000);
    const hrs  = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);
    if (min  < 1)  return 'Ahora mismo';
    if (min  < 60) return `Hace ${min} min`;
    if (hrs  < 24) return `Hace ${hrs} h`;
    return `Hace ${dias} día${dias !== 1 ? 's' : ''}`;
  };

  return (
    <div style={{ position:'relative' }}>
      {/* Botón campanita */}
      <button style={s.campana} onClick={() => setAbierto(!abierto)}>
        🔔
        {noVistas > 0 && (
          <span style={s.badge}>{noVistas > 9 ? '9+' : noVistas}</span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {abierto && (
        <>
          {/* Capa para cerrar al hacer clic afuera */}
          <div style={s.overlay} onClick={() => setAbierto(false)} />

          <div style={s.panel}>
            <div style={s.panelHeader}>
              <span style={s.panelTitulo}>🔔 Notificaciones</span>
              <button style={s.btnMarcar} onClick={marcarVistas}>
                Marcar leídas
              </button>
            </div>

            <div style={s.lista}>
              {notificaciones.length === 0 && (
                <p style={s.vacio}>No hay notificaciones aún.</p>
              )}
              {notificaciones.map(n => (
                <div key={n.id} style={{
                  ...s.item,
                  background: vistas.includes(n.id) ? 'white' : '#F5F3FF'
                }}>
                  <span style={{ fontSize:'20px', flexShrink:0 }}>
                    {iconoAccion(n.accion)}
                  </span>
                  <div style={{ flexGrow:1, overflow:'hidden' }}>
                    <p style={s.itemTexto}>
                      <strong>{n.usuario_nombre}</strong>{' '}
                      {n.accion === 'SUBIDA'      ? 'subió un documento'   :
                       n.accion === 'ELIMINACION' ? 'eliminó un documento' :
                       n.accion}
                    </p>
                    <p style={s.itemDoc}>
                      {n.documento_nombre || n.detalle || '—'}
                    </p>
                    <p style={s.itemTiempo}>
                      {tiempoRelativo(n.realizado_en)}
                    </p>
                  </div>
                  {!vistas.includes(n.id) && <div style={s.puntito} />}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const s = {
  campana:     { position:'relative', background:'transparent', border:'none',
                 cursor:'pointer', fontSize:'22px', padding:'4px 8px',
                 lineHeight:1 },
  badge:       { position:'absolute', top:'-2px', right:'-2px',
                 background:'#EF4444', color:'white', borderRadius:'50%',
                 width:'16px', height:'16px', display:'flex',
                 alignItems:'center', justifyContent:'center',
                 fontSize:'9px', fontWeight:'bold', lineHeight:1 },
  overlay:     { position:'fixed', top:0, left:0, right:0, bottom:0, zIndex:999 },
  panel:       { position:'absolute', right:0, top:'44px', width:'320px',
                 background:'white', borderRadius:'12px',
                 boxShadow:'0 8px 32px rgba(0,0,0,0.15)',
                 zIndex:1000, overflow:'hidden',
                 border:'1px solid #EDE9FE' },
  panelHeader: { display:'flex', justifyContent:'space-between', alignItems:'center',
                 padding:'14px 16px',
                 background:'linear-gradient(135deg, #7C3AED, #2E6DA4)' },
  panelTitulo: { fontWeight:'bold', color:'white', fontSize:'14px',
                 fontFamily:'sans-serif' },
  btnMarcar:   { background:'transparent',
                 border:'1px solid rgba(255,255,255,0.5)',
                 color:'white', padding:'4px 10px', borderRadius:'6px',
                 cursor:'pointer', fontSize:'11px', fontFamily:'sans-serif' },
  lista:       { maxHeight:'360px', overflowY:'auto' },
  item:        { display:'flex', alignItems:'flex-start', gap:'10px',
                 padding:'12px 16px', borderBottom:'1px solid #F3F4F6',
                 fontFamily:'sans-serif' },
  itemTexto:   { margin:0, fontSize:'13px', color:'#333',
                 lineHeight:'1.4' },
  itemDoc:     { margin:'2px 0 0', fontSize:'12px', color:'#7C3AED',
                 whiteSpace:'nowrap', overflow:'hidden',
                 textOverflow:'ellipsis', maxWidth:'200px' },
  itemTiempo:  { margin:'2px 0 0', fontSize:'11px', color:'#9CA3AF' },
  puntito:     { width:'8px', height:'8px', background:'#7C3AED',
                 borderRadius:'50%', flexShrink:0, marginTop:'4px' },
  vacio:       { textAlign:'center', color:'#9CA3AF', padding:'24px',
                 fontSize:'13px', fontFamily:'sans-serif' },
};

export default Notificaciones;