import apiCliente from './apiCliente';

export const listarDocumentos = (filtros = {}) =>
  apiCliente.get('/documentos', { params: filtros }).then(r => r.data);

export const subirDocumento = (formData) =>
  apiCliente.post('/documentos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data);

export const eliminarDocumento = (id) =>
  apiCliente.delete(`/documentos/${id}`).then(r => r.data);