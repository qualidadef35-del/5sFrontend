import {API} from './helpers.js';
export async function request(path, token, options={}) {
  const {method='GET',body,headers={},responseType='json'}=options;
  const init={method,headers:{...headers}};
  if(token)init.headers.Authorization=`Bearer ${token}`;
  if(body instanceof FormData)init.body=body;
  else if(body!==undefined){init.body=JSON.stringify(body);init.headers['Content-Type']='application/json';}
  let response;
  try {response=await fetch(`${API}/api${path}`,init);} catch {throw new Error('Não foi possível conectar à API. Verifique se backend e banco estão ativos.');}
  if(!response.ok){const err=await response.json().catch(()=>({error:`Erro HTTP ${response.status}`}));const e=new Error(err.error||'Erro na solicitação');e.status=response.status;throw e;}
  if(responseType==='blob')return response.blob();
  if(response.status===204)return null;
  return response.json();
}
