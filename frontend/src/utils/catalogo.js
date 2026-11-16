import { getApiBaseUrl } from "../services/api";

export const categoriaColor = (categoria = '', dark = false, incluirComedia = true) => {
  const texto = categoria.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (dark) {
    if (texto.includes('terror')) return { bg: '#1e1530', color: '#b48ce8' };
    if (texto.includes('ciencia') || texto.includes('cientifica')) return { bg: '#0f2e1a', color: '#4ade80' };
    if (texto.includes('romance')) return { bg: '#2e0d1e', color: '#f472b6' };
    if (texto.includes('fantasia')) return { bg: '#0d1a3c', color: '#818cf8' };
    if (texto.includes('historia')) return { bg: '#2a1a08', color: '#fbbf24' };
    if (texto.includes('tecnologia')) return { bg: '#0a2a2e', color: '#22d3ee' };
    if (texto.includes('juvenil')) return { bg: '#2a1e00', color: '#fcd34d' };
    if (texto.includes('infantil')) return { bg: '#0a1e30', color: '#60a5fa' };
    if (texto.includes('aventura')) return { bg: '#2a1500', color: '#fb923c' };
    if (texto.includes('arte')) return { bg: '#1e0a24', color: '#d8b4fe' };
    if (texto.includes('biografia')) return { bg: '#0d1f3c', color: '#7dd3fc' };
    if (texto.includes('educacion')) return { bg: '#0f2e18', color: '#6ee7b7' };
    if (texto.includes('ficcion')) return { bg: '#2e0d0d', color: '#f87171' };
    if (incluirComedia && texto.includes('comedia')) return { bg: '#2a2008', color: '#fcd34d' };
    return { bg: '#2a1a24', color: '#e05a7a' };
  }
  if (texto.includes('terror')) return { bg: '#eee8f7', color: '#603a92' };
  if (texto.includes('ciencia') || texto.includes('cientifica')) return { bg: '#e4f5e9', color: '#1f7a45' };
  if (texto.includes('romance')) return { bg: '#fde8ef', color: '#b4235d' };
  if (texto.includes('fantasia')) return { bg: '#e9edff', color: '#4156a6' };
  if (texto.includes('historia')) return { bg: '#f8eddb', color: '#8c5a1d' };
  if (texto.includes('tecnologia')) return { bg: '#e2f4f6', color: '#137783' };
  if (texto.includes('juvenil')) return { bg: '#fff2d7', color: '#a25d00' };
  if (texto.includes('infantil')) return { bg: '#e4f4ff', color: '#2775a7' };
  if (texto.includes('aventura')) return { bg: '#fff0df', color: '#b85f11' };
  if (texto.includes('arte')) return { bg: '#f4e6f6', color: '#86418f' };
  if (texto.includes('biografia')) return { bg: '#e8eef8', color: '#365d96' };
  if (texto.includes('educacion')) return { bg: '#e8f3e9', color: '#397542' };
  if (texto.includes('ficcion')) return { bg: '#fce4ec', color: '#8b0000' };
  if (incluirComedia && texto.includes('comedia')) return { bg: '#fff8db', color: '#a25d00' };
  return { bg: '#f4eef0', color: '#7a1e3a' };
};

export const parseTiendaInfo = (tienda) => {
  let ciudad = (tienda.ciudad_origen || '').trim();
  let direccion = (tienda.direccion || '').trim();

  if (direccion.includes(',')) {
    const parts = direccion.split(',');
    const posCiudad = parts.pop().trim();
    if ((!ciudad || ciudad.toLowerCase() === 'colombia') && posCiudad) {
      ciudad = posCiudad;
    }
    direccion = parts.join(',').trim();
  }

  const cNorm = (ciudad || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (cNorm.includes('bogot')) ciudad = 'Bogotá';
  else if (cNorm.includes('medell')) ciudad = 'Medellín';
  else if (cNorm.includes('cali')) ciudad = 'Cali';
  else if (cNorm.includes('barranqu')) ciudad = 'Barranquilla';
  else if (cNorm.includes('cartag')) ciudad = 'Cartagena';
  else if (cNorm.includes('santa mart')) ciudad = 'Santa Marta';
  else if (cNorm.includes('bucaram')) ciudad = 'Bucaramanga';
  else if (cNorm.includes('perei')) ciudad = 'Pereira';
  else if (cNorm.includes('maniz')) ciudad = 'Manizales';
  else if (cNorm.includes('armen')) ciudad = 'Armenia';
  else if (cNorm.includes('ibag')) ciudad = 'Ibagué';
  else if (cNorm.includes('neiv')) ciudad = 'Neiva';
  else if (cNorm.includes('villav')) ciudad = 'Villavicencio';
  else if (cNorm.includes('past')) ciudad = 'Pasto';
  else if (cNorm.includes('popay')) ciudad = 'Popayán';
  else if (!ciudad || ciudad.toLowerCase() === 'colombia') ciudad = 'Bogotá';

  let dirLimpia = direccion;
  if (dirLimpia.toLowerCase().endsWith(ciudad.toLowerCase())) {
    dirLimpia = dirLimpia.slice(0, -ciudad.length).replace(/,\s*$/, '').trim();
  }

  const nombreLimpio = (tienda.nombre_tienda || '')
    .replace(/Librer\?\?a/g, 'Librería')
    .replace(/Bogot\?\?/g, 'Bogotá');

  let desc = (tienda.descripcion || '').trim();
  if (!desc || desc.includes('??') || desc.toLowerCase().includes('en colombia')) {
    desc = `Librería asociada a BookyHome en ${ciudad}. Catálogo y novedades.`;
  }

  return {
    ciudad,
    direccion: dirLimpia,
    descripcion: desc,
    nombre: nombreLimpio
  };
};

export const tiempoTranscurrido = (fechaStr) => {
  if (!fechaStr) return null;
  const diff = Date.now() - new Date(fechaStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `hace ${days} día${days > 1 ? 's' : ''}`;
  const months = Math.floor(days / 30);
  return `hace ${months} mes${months > 1 ? 'es' : ''}`;
};

export const resolveImageUrl = (value) => {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) return `${getApiBaseUrl()}${trimmed}`;
  return `${getApiBaseUrl()}/${trimmed}`;
};

export const resolveLibroCandidate = (candidate) => {
  if (!candidate) return null;
  if (Array.isArray(candidate)) {
    for (const item of candidate) {
      const resolved = resolveImageUrl(item);
      if (resolved) return resolved;
    }
    return null;
  }
  if (typeof candidate === "string" && candidate.includes(",")) {
    for (const part of candidate.split(",")) {
      const resolved = resolveImageUrl(part);
      if (resolved) return resolved;
    }
    return null;
  }
  return resolveImageUrl(candidate);
};
