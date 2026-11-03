export const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/,'');
export const percent = v => v===null||v===undefined ? '—' : `${Number(v).toFixed(2).replace('.',',')}%`;
export const dateBR = d => {if(!d)return '—';const date = String(d).slice(0,10);const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);return m?`${m[3]}/${m[2]}/${m[1]}`:new Date(d).toLocaleDateString('pt-BR');};
export const dtBR = d => d ? new Date(d).toLocaleString('pt-BR') : '—';
export const scoreLabel = score => score===null||score===undefined?'Pendente':score===100?'Destaque':score>=90?'Excelente':score>=80?'Regular':score>50?'Ruim':'Péssima';
export const scoreClass = s => s===null||s===undefined?'muted':s>=90?'good':s>=80?'warn':'bad';
export const labelStatus = s => ({RASCUNHO:'Em preenchimento',CONCLUIDA:'Concluída',PENDENTE:'Pendente',CONFORME:'Conforme',NAO_CONFORME:'Não conforme',NAO_APLICAVEL:'Não se aplica',EM_ANDAMENTO:'Em andamento',CONCLUIDA_ACAO:'Concluída',ABERTO:'Aberto',FECHADO:'Fechado',EDITOR:'Editor',OBSERVADOR:'Observador',ADMIN:'Administração',USUARIO:'Usuário'})[s]||s;
export const phaseColors = {'Seletividade':'#1595d2','Sistematização':'#776ad4','Sem Sujeira':'#f1a145','Saúde':'#e76f75','Socialização':'#20a185'};
export function downloadBlob(blob, name) {const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
