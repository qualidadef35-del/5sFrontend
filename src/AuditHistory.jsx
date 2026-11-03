import React from 'react';
import {AlertTriangle,History} from 'lucide-react';
import {dateBR,percent} from './helpers';

export function PriorCriterion({findings=[]}) {
  if(!findings.length)return null;
  return <details className="prior-criterion"><summary><AlertTriangle size={15}/> Este critério já teve {findings.length} apontamento(s) em auditorias anteriores</summary>
    {findings.map(f=><div className="prior-finding" key={f.occurrence_id}><strong>{f.period_name} • {dateBR(f.audited_at)} • {f.strike} STRIKE(S)</strong><p>{f.description}</p>{f.location&&<p>Local: {f.location}</p>}<p>Plano anterior: {f.action||'Não informado'}</p></div>)}
  </details>;
}
export default function AuditHistory({data,error}) {
  if(error)return <div className="warning-banner"><AlertTriangle size={17}/> Não foi possível consultar os apontamentos anteriores: {error}</div>;
  if(!data)return null;
  return <section className="panel prior-history"><div className="panel-heading"><div><h2><History size={18}/> Histórico do setor e notas por ciclo</h2><p>As notas oficiais de cada ciclo são preservadas. Registros antigos da planilha aparecem sem nota.</p></div></div>
    <div className="table-wrap"><table className="data-table"><thead><tr><th>Ciclo</th><th>Data</th><th>Nota oficial</th><th>Situação</th></tr></thead><tbody>{data.scores.map(s=><tr key={s.audit_id}><td>{s.period_name}</td><td>{dateBR(s.audited_at)}</td><td>{s.status==='CONCLUIDA'?percent(s.official_score):'Ainda não concluída'}</td><td>{s.status==='CONCLUIDA'?'Encerrada • somente consulta':'Em preenchimento'}</td></tr>)}</tbody></table></div>
    {data.previous.length>0&&<p className="history-message"><strong>{data.previous.length} apontamento(s) anterior(es)</strong> do mesmo setor. Os critérios correspondentes estão sinalizados no checklist.</p>}
    {data.legacy.length>0&&<details className="prior-legacy"><summary>Consultar {data.legacy.length} pendência(s) anteriores da planilha</summary><p className="small-muted">A planilha não informa o código do checklist. Confira a descrição antes de considerar uma reincidência.</p>{data.legacy.map(r=><article className="prior-finding" key={r.id}><strong>{r.stage||'Etapa não informada'} • {r.status}</strong>{r.related_sector&&<p className="small-muted">Área relacionada: {r.related_sector_name}. Confirme se o apontamento se refere ao mesmo ambiente.</p>}<p>{r.description}</p><p>Plano: {r.action||'Não informado'}</p>{r.evidence&&<p>Evidência: {r.evidence}</p>}</article>)}</details>}
  </section>;
}

const words=value=>new Set(String(value||'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>3&&!['para','pela','pelo','como','esta','este','estao','foram','setor','area','realizar','necessita'].includes(w)));
export function possibleRecurrences(description,history) {
  const current=words(description);if(current.size<3)return [];
  return [...(history?.previous||[]),...(history?.legacy||[])].filter(r=>{
    const prior=words(r.description),shared=[...current].filter(w=>prior.has(w)).length;
    return shared>=3&&shared/Math.max(1,current.size+prior.size-shared)>=0.35;
  }).slice(0,5);
}
export function RecurrenceHint({description,history}) {
  const matches=possibleRecurrences(description,history);if(!matches.length)return null;
  return <div className="warning-banner"><div><strong>Possível reincidência: confira os registros anteriores</strong>{matches.map((r,i)=><p key={r.occurrence_id||`legacy-${r.id||i}`}><b>{r.period_name||r.stage}:</b> {r.description}</p>)}<small>A semelhança de texto é um alerta para conferência; não aplica STRIKE automaticamente.</small></div></div>;
}
