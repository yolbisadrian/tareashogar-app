export const _escapeHTML = (str) => {
  const p = document.createElement('p');
  p.appendChild(document.createTextNode(str));
  return p.innerHTML;
};

export const formatTimestamp = (ts) => {
  return new Date(ts).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};