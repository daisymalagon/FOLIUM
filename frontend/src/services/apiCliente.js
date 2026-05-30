import axios from 'axios';

const apiCliente = axios.create({
  baseURL: 'http://localhost:4000/api',
  timeout: 10000,
});

apiCliente.interceptors.request.use(config => {
  const usuario = JSON.parse(localStorage.getItem('folium_usuario'));
  if (usuario?.token) {
    config.headers.Authorization = `Bearer ${usuario.token}`;
  }
  return config;
});

apiCliente.interceptors.response.use(
  respuesta => respuesta,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('folium_usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiCliente;