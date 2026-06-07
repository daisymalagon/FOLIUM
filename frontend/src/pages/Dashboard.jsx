import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import apiCliente from '../services/apiCliente';
import Logo from '../components/Logo';

const COLORES = ['#7C3AED','#2E6DA4','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4'];

function Dashboard() {
  const { usuario } = useAuth();
  const navegar = useNavigate();
  const [stats,    setStats]    = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const [docs, cats, users, hist] = await Promise.all([
          apiCliente.get('/documentos'),
          apiCliente.get('/categorias'),
          apiCliente.get('/usuarios').catch(() => ({ data:{ datos:[] } })),
          apiCliente.get('/usuarios/historial/todos').catch(() => ({ data:{ datos:[] } })),
        ]);

        const documentos = docs.data.datos  || [];
        const categorias = cats.data.datos  || [];
        const usuarios   = users.data.datos || [];
        const historial  = hist.data.datos  || [];

        // Documentos por categoría
        const porCategoria = categorias.map(c => ({
          nombre: c.nombre,
          total:  documentos.filter(d => d.categoria_id === c.id).length
        })).filter(c => c.total > 0);

        // Documentos por tipo
        const tipos = {};
        documentos.forEach(d => {
          const tipo =
            d.tipo_mime?.includes('pdf')   ? 'PDF'   :
            d.tipo_mime?.includes('image') ? 'Imagen':
            d.tipo_mime?.includes('word')  ? 'Word'  :
            d.tipo_mime?.includes('sheet') ? 'Excel' : 'Otro';
          tipos[tipo] = (tipos[tipo] || 0) + 1;
        });
        const porTipo = Object.entries(tipos).map(([nombre, total]) => ({ nombre, total }));

        // Actividad últimos 7 días
        const hoy = new Date();
        const actividad = Array.from({ length: 7 }, (_, i) => {
          const fecha = new Date(hoy);
          fecha.setDate(hoy.getDate() - (6 - i));
          const label = fecha.toLocaleDateString('es-CO', { day:'2-digit', month:'short' });
          const total = historial.filter(h => {
            const f = new Date(h.realizado_en);
            return f.toDateString() === fecha.toDateString();
          }).length;
          return { dia: label, acciones: total };
        });

        setStats({
          totalDocs:     documentos.length,
          totalCats:     categorias.length,
          totalUsuarios: usuarios.length,
          totalAcciones: historial.length,
          porCategoria,
          porTipo,
          actividad,
          recientes: documentos.slice(0, 5),
        });
      } catch (err) {
        console.error(err);
      } finally { setCargando(false); }
    }
    cargar();
  }, []);

  if (cargando) return (
    <div style={{ display:'flex', justifyContent:'center',
      alignItems:'center', height:'100vh', background:'#F5F3FF' }}>
      <p style={{ color:'#7C3AED', fontSize:'18px' }}>Cargando dashboard...</p>
    </div>
  );

  return (
    <div style={s.pagina}>
      <header style={s.header}>
        <Logo size={34} showText={true} />
        <div style={s.headerDer}>
          <button style={s.btnNav} onClick={() => navegar('/')}>
            ← Panel de documentos
          </button>
          <span style={s.saludo}>{usuario?.nombre}</span>
        </div>
      </header>

      <div style={s.contenido}>
        <h2 style={s.titulo}>📊 Dashboard</h2>
        <p style={s.subtitulo}>Resumen general del sistema Folium</p>

        {/* Tarjetas resumen */}
        <div style={s.tarjetasWrap}>
          {[
            { icono:'📄', num: stats?.totalDocs,     label:'Documentos',  color:'#7C3AED' },
            { icono:'📁', num: stats?.totalCats,     label:'Categorías',  color:'#2E6DA4' },
            { icono:'👥', num: stats?.totalUsuarios, label:'Usuarios',    color:'#10B981' },
            { icono:'📋', num: stats?.totalAcciones, label:'Actividades', color:'#F59E0B' },
          ].map((t, i) => (
            <div key={i} style={{ ...s.tarjeta, borderTop:`4px solid ${t.color}` }}>
              <span style={{ fontSize:'32px' }}>{t.icono}</span>
              <span style={{ ...s.tarjetaNum, color: t.color }}>{t.num ?? 0}</span>
              <span style={s.tarjetaLabel}>{t.label}</span>
            </div>
          ))}
        </div>

        {/* Gráficas */}
        <div style={s.graficasWrap}>

          {/* Documentos por categoría */}
          <div style={s.graficaCaja}>
            <h3 style={s.graficaTitulo}>Documentos por categoría</h3>
            {stats?.porCategoria?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={stats.porCategoria} dataKey="total" nameKey="nombre"
                    cx="50%" cy="50%" outerRadius={80}
                    label={({ nombre, total }) => `${nombre}: ${total}`}>
                    {stats.porCategoria.map((_, i) => (
                      <Cell key={i} fill={COLORES[i % COLORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={s.sinDatos}>
                Sin categorías con documentos aún.
              </p>
            )}
          </div>

          {/* Documentos por tipo */}
          <div style={s.graficaCaja}>
            <h3 style={s.graficaTitulo}>Documentos por tipo de archivo</h3>
            {stats?.porTipo?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.porTipo}>
                  <XAxis dataKey="nombre" tick={{ fontSize:12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" name="Documentos" radius={[6,6,0,0]}>
                    {stats.porTipo.map((_, i) => (
                      <Cell key={i} fill={COLORES[i % COLORES.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={s.sinDatos}>Sin documentos aún.</p>
            )}
          </div>

          {/* Actividad últimos 7 días */}
          <div style={{ ...s.graficaCaja, gridColumn:'1 / -1' }}>
            <h3 style={s.graficaTitulo}>Actividad de los últimos 7 días</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats?.actividad}>
                <XAxis dataKey="dia" tick={{ fontSize:12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="acciones" name="Acciones"
                  fill="#7C3AED" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* Documentos recientes */}
        <div style={s.recientesWrap}>
          <h3 style={s.graficaTitulo}>Documentos recientes</h3>
          {stats?.recientes?.length === 0 && (
            <p style={s.sinDatos}>No hay documentos aún.</p>
          )}
          <div style={s.recientesList}>
            {stats?.recientes?.map(doc => (
              <div key={doc.id} style={s.recienteItem}>
                <span style={{ fontSize:'24px' }}>
                  {doc.tipo_mime?.includes('pdf')   ? '📄' :
                   doc.tipo_mime?.includes('image') ? '🖼️' : '📝'}
                </span>
                <div style={{ flexGrow:1 }}>
                  <p style={{ margin:0, fontWeight:'bold',
                    fontSize:'14px', color:'#1A3557' }}>
                    {doc.nombre}
                  </p>
                  <p style={{ margin:0, fontSize:'12px', color:'#9CA3AF' }}>
                    {new Date(doc.fecha_carga).toLocaleDateString('es-CO', {
                      day:'2-digit', month:'short', year:'numeric'
                    })}
                  </p>
                </div>
                {doc.categoria_nombre && (
                  <span style={s.badge}>{doc.categoria_nombre}</span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

const s = {
  pagina:        { fontFamily:'sans-serif', minHeight:'100vh', background:'#F5F3FF' },
  header:        { background:'white', padding:'0 32px', height:'64px',
                   display:'flex', alignItems:'center', justifyContent:'space-between',
                   boxShadow:'0 2px 8px rgba(124,58,237,0.1)',
                   borderBottom:'2px solid #EDE9FE' },
  headerDer:     { display:'flex', alignItems:'center', gap:'12px' },
  saludo:        { color:'#7C3AED', fontSize:'14px', fontWeight:'500' },
  btnNav:        { background:'transparent', color:'#7C3AED',
                   border:'1px solid #EDE9FE', padding:'8px 16px',
                   borderRadius:'8px', cursor:'pointer', fontSize:'13px' },
  contenido:     { padding:'32px' },
  titulo:        { color:'#1A3557', marginBottom:'4px', fontSize:'24px' },
  subtitulo:     { color:'#9CA3AF', fontSize:'14px', marginBottom:'24px' },
  tarjetasWrap:  { display:'grid', gridTemplateColumns:'repeat(4,1fr)',
                   gap:'16px', marginBottom:'24px' },
  tarjeta:       { background:'white', borderRadius:'12px', padding:'20px',
                   display:'flex', flexDirection:'column', alignItems:'center',
                   boxShadow:'0 2px 12px rgba(124,58,237,0.08)', gap:'8px' },
  tarjetaNum:    { fontSize:'36px', fontWeight:'bold' },
  tarjetaLabel:  { fontSize:'13px', color:'#9CA3AF' },
  graficasWrap:  { display:'grid', gridTemplateColumns:'1fr 1fr',
                   gap:'16px', marginBottom:'24px' },
  graficaCaja:   { background:'white', borderRadius:'12px', padding:'24px',
                   boxShadow:'0 2px 12px rgba(124,58,237,0.08)' },
  graficaTitulo: { color:'#1A3557', fontSize:'16px', marginBottom:'16px',
                   fontWeight:'bold' },
  sinDatos:      { color:'#9CA3AF', textAlign:'center', padding:'40px 0',
                   fontSize:'14px' },
  recientesWrap: { background:'white', borderRadius:'12px', padding:'24px',
                   boxShadow:'0 2px 12px rgba(124,58,237,0.08)' },
  recientesList: { display:'flex', flexDirection:'column', gap:'10px' },
  recienteItem:  { display:'flex', alignItems:'center', gap:'12px',
                   padding:'10px 14px', background:'#F5F3FF', borderRadius:'8px' },
  badge:         { background:'#EDE9FE', color:'#7C3AED', padding:'3px 10px',
                   borderRadius:'10px', fontSize:'12px', fontWeight:'bold' },
};

export default Dashboard;