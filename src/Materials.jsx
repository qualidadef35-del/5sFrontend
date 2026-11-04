import React, { useEffect, useRef, useState } from 'react';
import { Download, FileText, FolderOpen, Image as ImageIcon, Upload, History, Search } from 'lucide-react';
import { Heading, Loading, Empty, Field, Modal } from './components';
import { downloadBlob, dtBR } from './helpers';

const bytesLabel = value => value >= 1048576 ? `${(value/1048576).toFixed(1)} MB` : `${Math.ceil(value/1024)} KB`;
const kinds = ['Fotos','Relatórios','Modelos editáveis','Planilhas','Apresentações'];
const fileUrl = (id,version) => `/materials/${id}/versions/${version}/download`;

function Thumbnail({ file,api }) {
  const ref=useRef(null);const [visible,setVisible]=useState(false);const [url,setUrl]=useState('');
  useEffect(()=>{
    if(!ref.current)return;
    const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:'100px'});
    observer.observe(ref.current);return()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    if(!visible || !file.available || file.size===0)return;
    let active=true,objectUrl;
    api(fileUrl(file.id,file.version),{responseType:'blob'}).then(blob=>{if(active){objectUrl=URL.createObjectURL(blob);setUrl(objectUrl);}}).catch(()=>{});
    return()=>{active=false;if(objectUrl)URL.revokeObjectURL(objectUrl);};
  },[api,file.id,file.version,file.available,visible]);
  return <div className="material-thumb" ref={ref}>{url?<img src={url} alt={file.name} loading="lazy"/>:<ImageIcon size={32}/>}</div>;
}

export default function Materials({api,notify}) {
  const [collections,setCollections]=useState([]),[collection,setCollection]=useState(''),[kind,setKind]=useState(''),[search,setSearch]=useState(''),[query,setQuery]=useState(''),[page,setPage]=useState(1),[data,setData]=useState(null),[busy,setBusy]=useState(true),[error,setError]=useState(''),[selected,setSelected]=useState(null),[refresh,setRefresh]=useState(0);
  useEffect(()=>{let active=true;api('/materials/collections').then(r=>{if(active)setCollections(r);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[api,refresh]);
  useEffect(()=>{const t=setTimeout(()=>{setQuery(search);setPage(1);},300);return()=>clearTimeout(t);},[search]);
  useEffect(()=>{
    let active=true;setBusy(true);setError('');
    const params=new URLSearchParams({collection,kind,q:query,page:String(page)});
    api(`/materials?${params}`).then(r=>{if(active)setData(r);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setBusy(false);});
    return()=>{active=false;};
  },[api,collection,kind,query,page,refresh]);
  const total=collections.reduce((s,c)=>s+c.total,0);
  async function download(file,version=file.version,name=file.latest_filename){try{const blob=await api(fileUrl(file.id,version),{responseType:'blob'});downloadBlob(blob,name);}catch(e){notify(e.message,'error');}}
  return <>
    <Heading eyebrow="ACERVO COMPARTILHADO · 5S" title="Auditorias e materiais" description="Fotos, relatórios, etiquetas e modelos das auditorias anteriores."/>
    <div className="info-banner material-intro"><FolderOpen size={22}/><div><strong>Originais preservados, versões organizadas</strong><p>Baixe o arquivo, edite no Word, Excel ou programa correspondente e envie uma nova versão. Todos os usuários logados podem colaborar. Cada envio registra autor, data e descrição da alteração.</p></div></div>
    <div className="material-collections"><button className={`material-collection ${collection===''?'selected':''}`} onClick={()=>{setCollection('');setPage(1);}}><FolderOpen size={20}/><span>Todos os materiais<small>{total} arquivos</small></span></button>{collections.map(c=><button key={c.id} className={`material-collection ${collection===c.id?'selected':''}`} onClick={()=>{setCollection(c.id);setPage(1);}}><FolderOpen size={20}/><span>{c.name}<small>{c.total} arquivos{c.available<c.total?` · ${c.available} disponíveis`:''}</small></span></button>)}</div>
    <section className="panel"><div className="panel-heading"><div><h2>{collections.find(c=>c.id===collection)?.name||'Todos os materiais'}</h2><p>Os nomes e as pastas de origem foram mantidos. Cópias idênticas na mesma pasta estão reunidas no mesmo registro.</p></div></div>
      <div className="filters material-filters"><div className="material-search"><Search size={17}/><input aria-label="Buscar arquivo ou setor" placeholder="Buscar nome do arquivo, setor ou pasta…" value={search} onChange={e=>setSearch(e.target.value)}/></div><select aria-label="Tipo de material" value={kind} onChange={e=>{setKind(e.target.value);setPage(1);}}><option value="">Todos os tipos</option>{kinds.map(k=><option key={k}>{k}</option>)}</select><button className="btn secondary" onClick={()=>setRefresh(r=>r+1)}>Atualizar</button></div>
      {error&&<p className="alert-error" role="alert">{error}</p>}
      {busy?<Loading/>:data?.documents.length?<><div className="material-grid">{data.documents.map(file=><article className="material-card" key={file.id}>
        <button className="material-preview-button" onClick={()=>setSelected(file.id)} aria-label={`Abrir ${file.name}`}>{file.mime.startsWith('image/')?<Thumbnail file={file} api={api}/>:<div className="material-thumb material-document"><FileText size={38}/><span>{file.name.split('.').pop().toUpperCase()}</span></div>}</button>
        <div className="material-card-body"><span className="small-muted">{file.kind} · {bytesLabel(file.size)} · v{file.version}</span><h3 title={file.name}>{file.name}</h3><p title={file.source_path}>{file.source_path}</p>{file.size===0&&<p role="status">Arquivo vazio no pacote original. Envie uma versão válida para completar o registro.</p>}<div className="material-card-actions"><button className="btn tiny secondary" disabled={!file.available} onClick={()=>download(file)}><Download size={14}/> Baixar</button><button className="btn tiny primary" onClick={()=>setSelected(file.id)}><History size={14}/> Abrir / editar</button></div>{!file.available&&<small>Importação em andamento</small>}</div>
      </article>)}</div><div className="material-pagination"><span>{data.total} arquivos · página {page} de {Math.max(1,Math.ceil(data.total/data.pageSize))}</span><button className="btn secondary" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Anterior</button><button className="btn secondary" disabled={page*data.pageSize>=data.total} onClick={()=>setPage(p=>p+1)}>Próxima</button></div></>:<Empty title="Nenhum arquivo encontrado" description="Altere o nome pesquisado, a pasta ou o tipo de material."/>}
    </section>
    {selected&&<MaterialDetail id={selected} api={api} notify={notify} onClose={()=>setSelected(null)} onUpdated={()=>setRefresh(r=>r+1)}/>}
  </>;
}

function MaterialDetail({id,api,notify,onClose,onUpdated}) {
  const [data,setData]=useState(null),[error,setError]=useState(''),[file,setFile]=useState(null),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[preview,setPreview]=useState(null),[loadingPreview,setLoadingPreview]=useState(false),[uploadKey,setUploadKey]=useState(0);
  useEffect(()=>{let active=true;api(`/materials/${id}`).then(r=>{if(active)setData(r);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[api,id]);
  useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview.url);},[preview]);
  async function download(version){try{downloadBlob(await api(fileUrl(id,version.version),{responseType:'blob'}),version.filename);}catch(e){notify(e.message,'error');}}
  async function show(version){setLoadingPreview(true);try{const blob=await api(fileUrl(id,version.version),{responseType:'blob'});setPreview({url:URL.createObjectURL(blob),mime:version.mime,name:version.filename});}catch(e){notify(e.message,'error');}finally{setLoadingPreview(false);}}
  async function upload(event){
    event.preventDefault();if(!file)return;
    if(file.size>25*1024*1024){setError('O limite por arquivo é 25 MB.');return;}
    setBusy(true);setError('');
    const body=new FormData();body.append('file',file);body.append('note',note);body.append('baseVersion',String(data.latestVersion));
    try{await api(`/materials/${id}/versions`,{method:'POST',body});setData(await api(`/materials/${id}`));setFile(null);setNote('');setUploadKey(k=>k+1);onUpdated();notify('Nova versão salva. O arquivo original foi preservado.');}
    catch(e){setError(e.message);}
    finally{setBusy(false);}
  }
  return <Modal title={data?.document.name||'Arquivo e versões'} onClose={busy?()=>{}:onClose} width="920px">
    {error&&<p className="alert-error" role="alert">{error}</p>}{!data?<Loading/>:<div className="material-detail"><p className="small-muted">{data.document.collection_name}</p><p className="material-path">Pasta de origem: {data.document.source_path}</p>{data.document.original_size===0&&<div className="warning-banner">O arquivo original veio vazio no pacote enviado. Ele foi preservado como recebido; envie uma imagem válida como nova versão.</div>}
      {data.document.aliases?.length>0&&<details><summary>Outras cópias idênticas no pacote ({data.document.aliases.length})</summary><ul>{data.document.aliases.map(path=><li className="material-path" key={path}>{path}</li>)}</ul></details>}
      <div className="material-detail-actions"><button className="btn primary" disabled={!data.document.available} onClick={()=>download(data.versions[0])}><Download size={16}/> Baixar versão atual (v{data.latestVersion})</button><button className="btn secondary" disabled={!data.document.available} onClick={()=>download(data.versions[data.versions.length-1])}>Baixar original</button></div>
      <h3>Versões do arquivo</h3><div className="material-version-list">{data.versions.map(version=><div className="material-version" key={version.version}><div><strong>v{version.version} {version.version===1?'· Original':'· Versão editada'}</strong><p>{version.author}{version.version>1?` · ${dtBR(version.created_at)}`:''}</p><p>{version.note}</p><small>{version.filename} · {bytesLabel(version.size)}</small></div><div className="material-version-buttons"><button className="btn tiny secondary" disabled={!data.document.available} onClick={()=>download(version)}>Baixar</button>{(version.mime.startsWith('image/')||version.mime==='application/pdf')&&<button className="btn tiny secondary" disabled={loadingPreview||!data.document.available} onClick={()=>show(version)}>Visualizar</button>}</div></div>)}</div>
      {preview&&<div className="material-full-preview"><div><strong>{preview.name}</strong><button type="button" className="text-button" onClick={()=>setPreview(null)}>Fechar visualização</button></div>{preview.mime.startsWith('image/')?<img src={preview.url} alt={preview.name}/>:<iframe title={preview.name} src={preview.url} sandbox="allow-same-origin"/>}</div>}
      <form onSubmit={upload} className="stack material-upload"><h3><Upload size={18}/> Enviar versão editada</h3><p>Edite o arquivo baixado no programa correspondente. Depois envie-o abaixo e descreva o que mudou. O envio ficará disponível para os demais usuários logados, com seu nome no histórico.</p><Field label="Arquivo editado (até 25 MB)"><input key={uploadKey} type="file" required disabled={busy||!data.document.available} accept=".pdf,.doc,.docx,.xls,.xlsx,.pptx,.jpg,.jpeg,.jfif,.png" onChange={e=>setFile(e.target.files?.[0]||null)}/></Field><Field label="O que foi alterado"><textarea required maxLength={2000} rows={3} value={note} disabled={busy} onChange={e=>setNote(e.target.value)} placeholder="Ex.: etiqueta adaptada para o setor; revisão do plano de ação…"/></Field><button className="btn primary" disabled={busy||!data.document.available} type="submit">{busy?'Enviando…':'Salvar nova versão'}</button></form>
    </div>}
  </Modal>;
}
