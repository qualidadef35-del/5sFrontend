import React,{useState} from 'react';
import {Trash2} from 'lucide-react';
import {Modal} from './components';

export default function DeleteAudit({api,notify,auditId,sectorName,periodName,onDeleted,className='table-link'}) {
  const [open,setOpen]=useState(false),[working,setWorking]=useState(false),[error,setError]=useState('');
  async function remove(){
    if(working)return;
    setWorking(true);setError('');
    try {
      await api(`/audits/${auditId}`,{method:'DELETE',body:{confirm:true}});
      setOpen(false);notify('Auditoria excluída definitivamente');
    }catch(e){setError(e.message);setWorking(false);return;}
    try{await onDeleted?.(auditId);}catch(e){notify('Auditoria excluída. Atualize a lista para consultar os dados atuais.','error');}
    finally{setWorking(false);}
  }
  return <><button type="button" className={className} onClick={()=>{setError('');setOpen(true)}} aria-label={`Excluir auditoria de ${sectorName}`}><Trash2 size={14}/> Excluir</button>
    {open&&<Modal title="Excluir auditoria definitivamente" onClose={()=>{if(!working)setOpen(false)}}>
      <p><strong>Setor:</strong> {sectorName}<br/><strong>Período:</strong> {periodName||'Período selecionado'}<br/><strong>Auditoria:</strong> #{auditId}</p>
      <p>Esta ação apagará a auditoria, o relatório, os critérios preenchidos, os apontamentos, os acompanhamentos e todas as fotos vinculadas. A exclusão não pode ser desfeita.</p>
      {error&&<p className="alert-error" role="alert">{error}</p>}
      <div className="modal-actions"><button type="button" className="btn secondary" disabled={working} onClick={()=>setOpen(false)}>Cancelar</button><button type="button" className="btn danger" disabled={working} onClick={remove}>{working?'Excluindo...':'Excluir definitivamente'}</button></div>
    </Modal>}
  </>;
}
