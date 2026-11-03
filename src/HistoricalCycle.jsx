import React,{useEffect,useState} from 'react';
import {History,RefreshCcw,Search,ChevronLeft,ChevronRight} from 'lucide-react';
import {Empty,Field,Loading,Modal} from './components';
import {dtBR} from './helpers';

const labels={NAO_INICIADO:'Não iniciado',EM_ANDAMENTO:'Em andamento',CONCLUIDO:'Concluído',ATRASADO:'Atrasado',NAO_INFORMADO:'Não informado',OUTRO:'Outro'};
const statusPill=value=><span className={`pill ${value==='CONCLUIDO'?'ok':value==='ATRASADO'?'danger':'neutral'}`}>{labels[value]||value}</span>;

export default function HistoricalCycle({api,notify}) {
  const [catalog,setCatalog]=useState(null),[sources,setSources]=useState([]),[source,setSource]=useState('');
  const [open,setOpen]=useState(false),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  const [reload,setReload]=useState(0),[importing,setImporting]=useState(false);
  useEffect(()=>{let alive=true;setLoading(true);setError('');
    Promise.all([api('/admin/history/catalog'),api('/admin/history/sources')]).then(([c,s])=>{
      if(!alive)return;setCatalog(c);setSources(s);setSource(old=>s.some(x=>x.source_id===old)?old:(s[0]?.source_id||''));
    }).catch(e=>{if(alive)setError(e.message)}).finally(()=>{if(alive)setLoading(false)});
    return()=>{alive=false};
  },[api,reload]);
  async function importData(){setImporting(true);try{const result=await api('/admin/history/import',{method:'POST'});notify(`Histórico disponível: ${result.imported+result.existing} registros; ${result.sectorsAdded} setores adicionados.`);setReload(n=>n+1)}catch(e){setError(e.message)}finally{setImporting(false)}}
  return <section className="panel historical-cycle">
    <div className="panel-heading"><div><h2><History size={19}/> Histórico da planilha 5S</h2><p>Consulte as sinalizações, visitas e planos de ação anteriores na área de ciclos.</p></div>
      <button className="btn secondary" onClick={()=>setReload(n=>n+1)} disabled={loading}><RefreshCcw size={16}/> Atualizar</button></div>
    {loading?<Loading/>:error?<div className="history-message"><p role="alert">{error}</p><p>O backend precisa estar atualizado e com as migrações aplicadas para consultar o histórico.</p></div>:<>
      {!sources.length?<div className="history-message"><p>O histórico ainda não foi carregado neste banco.</p><button className="btn primary" onClick={importData} disabled={importing}>{importing?'Importando...':'Importar histórico e setores'}</button></div>:<>
        <div className="history-source-bar"><div><strong>{sources.reduce((n,s)=>n+s.record_count,0).toLocaleString('pt-BR')} pendências preservadas</strong><p className="small-muted">As notas dos ciclos atuais permanecem separadas dos registros antigos.</p></div><button className="btn primary" onClick={()=>setOpen(v=>!v)}><History size={16}/>{open?'Recolher histórico':'Consultar histórico'}</button></div>
        {catalog?.issues?.length>0&&<details className="history-issues"><summary>{catalog.issues.length} referência de responsável precisa de conferência</summary>{catalog.issues.map(i=><p key={`${i.source_id}:${i.source_row}`}>Linha {i.source_row}: “{i.original_row[2]}” — responsável registrado: {i.original_row[4]||'não informado'}. O vínculo com o setor não foi confirmado.</p>)}</details>}
        {open&&<><div className="history-source-picker"><Field label="Origem do histórico"><select value={source} onChange={e=>setSource(e.target.value)}>{sources.map(s=><option key={s.source_id} value={s.source_id}>Planilha 5S • captura {dtBR(s.captured_at)} • {s.record_count} registros</option>)}</select></Field></div><HistoryRecords key={source} api={api} notify={notify} source={source} catalog={catalog}/></>}
      </>}
    </>}
  </section>;
}

function HistoryRecords({api,notify,source,catalog}) {
  const [sector,setSector]=useState(''),[stage,setStage]=useState(''),[status,setStatus]=useState(''),[search,setSearch]=useState('');
  const [query,setQuery]=useState(''),[offset,setOffset]=useState(0),[data,setData]=useState({total:0,records:[]}),[busy,setBusy]=useState(true),[error,setError]=useState(''),[selected,setSelected]=useState(null),[reload,setReload]=useState(0);
  useEffect(()=>{const timer=setTimeout(()=>{setQuery(search);setOffset(0)},300);return()=>clearTimeout(timer)},[search]);
  useEffect(()=>{let alive=true;setBusy(true);setError('');
    const params=new URLSearchParams({sourceId:source,limit:'25',offset:String(offset)});
    if(sector)params.set('sectorId',sector);if(stage)params.set('stageGroup',stage);if(status)params.set('status',status);if(query)params.set('search',query);
    api('/admin/history?'+params).then(r=>{if(alive)setData(r)}).catch(e=>{if(alive)setError(e.message)}).finally(()=>{if(alive)setBusy(false)});
    return()=>{alive=false};
  },[api,source,sector,stage,status,query,offset,reload]);
  function filter(set,value){set(value);setOffset(0)}
  return <>
    <div className="history-filters">
      <Field label="Setor"><select value={sector} onChange={e=>filter(setSector,e.target.value)}><option value="">Todos os setores</option>{catalog.sectors.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
      <Field label="Etapa histórica"><select value={stage} onChange={e=>filter(setStage,e.target.value)}><option value="">Todas as etapas</option>{catalog.stages.map(s=><option key={s.stage_group} value={s.stage_group}>{s.label}</option>)}</select></Field>
      <Field label="Status"><select value={status} onChange={e=>filter(setStatus,e.target.value)}><option value="">Todos os status</option>{Object.entries(labels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field>
      <Field label="Buscar pendência, ação ou evidência"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Digite para buscar"/></Field>
    </div>
    {busy?<Loading/>:error?<p className="history-message" role="alert">{error}</p>:!data.records.length?<Empty title="Nenhuma pendência encontrada"/>:<>
      <div className="table-wrap"><table className="data-table history-table"><thead><tr><th>Setor e responsável</th><th>Etapa / pendência</th><th>Plano de ação</th><th>Status</th><th></th></tr></thead><tbody>{data.records.map(r=><tr key={r.id}>
        <td><strong>{r.registered_sector_name||r.sector_name}</strong><div>{r.responsible_name||'Responsável não confirmado'}</div>{r.responsible_source==='PLANILHA_5S'&&<small className="small-muted">Referência da planilha</small>}</td>
        <td><div className="small-muted">{r.stage||'Etapa não informada'}</div><div className="history-clamp">{r.description}</div></td><td><div className="history-clamp">{r.action||'Não informado'}</div></td><td>{statusPill(r.status)}</td><td><button className="table-link" onClick={()=>setSelected(r.id)}>Ver histórico</button></td>
      </tr>)}</tbody></table></div>
      <div className="history-pagination"><span>{offset+1}–{Math.min(offset+25,data.total)} de {data.total.toLocaleString('pt-BR')} registros</span><div className="actions"><button className="btn secondary" disabled={offset===0} onClick={()=>setOffset(n=>Math.max(0,n-25))}><ChevronLeft size={15}/> Anterior</button><button className="btn secondary" disabled={offset+25>=data.total} onClick={()=>setOffset(n=>n+25)}>Próxima <ChevronRight size={15}/></button></div></div>
    </>}
    {selected&&<HistoryDetail id={selected} api={api} notify={notify} onClose={()=>setSelected(null)} onSaved={()=>setReload(n=>n+1)}/>}
  </>;
}

function HistoryDetail({id,api,notify,onClose,onSaved}) {
  const [record,setRecord]=useState(null),[error,setError]=useState(''),[form,setForm]=useState({}),[saving,setSaving]=useState(false);
  useEffect(()=>{let alive=true;api(`/admin/history/${id}`).then(r=>{if(alive){setRecord(r);setForm({action:r.action,status:r.status,evidence:r.evidence,note:''})}}).catch(e=>{if(alive)setError(e.message)});return()=>{alive=false}},[id,api]);
  async function save(e){e.preventDefault();setSaving(true);try{const r=await api(`/admin/history/${id}`,{method:'PATCH',body:{...form,version:record.version}});const detail=await api(`/admin/history/${id}`);setRecord(detail);setForm({action:r.action,status:r.status,evidence:r.evidence,note:''});notify('Acompanhamento salvo no histórico');onSaved()}catch(e){notify(e.message,'error')}finally{setSaving(false)}}
  return <Modal title="Histórico da pendência" width="920px" onClose={onClose}>
    {error?<p role="alert">{error}</p>:!record?<Loading/>:<>
      <h3>{record.registered_sector_name||record.sector_name}</h3><p>{record.responsible_name||'Responsável não confirmado'} • {record.stage||'Etapa não informada'}</p>
      <div className="history-description">{record.description}</div>
      <div className="history-dates"><span><strong>Início original:</strong> {record.starts_on_original||'Não informado'}</span><span><strong>Término original:</strong> {record.due_on_original||'Não informado'}</span></div>
      <p className="small-muted">Origem: aba {record.sheet_name}, linha {record.source_row}. As datas são exibidas como foram preenchidas.</p>
      <form className="stack" onSubmit={save}>
        <Field label="Plano de ação"><textarea rows={4} maxLength={20000} value={form.action} onChange={e=>setForm({...form,action:e.target.value})}/></Field>
        <Field label="Status"><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{Object.entries(labels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field>
        <Field label="Evidência de implantação"><textarea rows={3} maxLength={20000} value={form.evidence} onChange={e=>setForm({...form,evidence:e.target.value})}/></Field>
        <Field label="Nota deste acompanhamento"><textarea rows={2} maxLength={20000} value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></Field>
        <div className="modal-actions"><button type="button" className="btn secondary" onClick={onClose}>Fechar</button><button className="btn primary" disabled={saving}>{saving?'Salvando...':'Salvar acompanhamento'}</button></div>
      </form>
      <details className="history-original"><summary>Consultar registro original da planilha</summary><p><strong>Plano original:</strong> {record.original_row[4]||'Não informado'}</p><p><strong>Status original:</strong> {record.status_original||'Não informado'}</p><p><strong>Evidência original:</strong> {record.original_row[8]||'Não informada'}</p></details>
      <h3 className="history-followups">Acompanhamentos registrados ({record.updates.length})</h3>
      {!record.updates.length?<p className="small-muted">Ainda não há acompanhamentos após a importação.</p>:record.updates.map(u=><article className="history-update" key={u.id}><strong>{u.user_name} • {dtBR(u.created_at)}</strong><p>{labels[u.previous.status]} → {labels[u.current.status]}</p>{u.note&&<p>{u.note}</p>}<details><summary>Ver alterações</summary><p><strong>Plano anterior:</strong> {u.previous.action||'Não informado'}</p><p><strong>Plano registrado:</strong> {u.current.action||'Não informado'}</p><p><strong>Evidência anterior:</strong> {u.previous.evidence||'Não informada'}</p><p><strong>Evidência registrada:</strong> {u.current.evidence||'Não informada'}</p></details></article>)}
    </>}
  </Modal>;
}
