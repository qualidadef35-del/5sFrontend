import React, { useEffect, useState } from 'react';
import { Field } from './components';
import { downloadBlob } from './helpers';

const blankCycle = () => ({ points: {}, performed: '', leadersPercent: '', direction: '', incidences: { rp1: '', rp2: '', rp3: '' }, equivalence: {} });
const format = value => Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function TopQuality({ api }) {
  const [schema, setSchema] = useState(null);
  const [cycles, setCycles] = useState([blankCycle(), blankCycle()]);
  const [bonuses, setBonuses] = useState({ stars45Percent: '', stars123Percent: '', strikeBonus: '', strikeApproved: false });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setError('');
    api('/manual/top-quality').then(data => { if (active) setSchema(data); })
      .catch(() => { if (active) setError('O cálculo Top Quality ainda não está disponível. Tente novamente após a atualização do servidor.'); });
    return () => { active = false; };
  }, [api, attempt]);

  function updateCycle(index, group, key, value) {
    setResult(null);
    setCycles(current => current.map((cycle, i) => i !== index ? cycle : group
      ? { ...cycle, [group]: { ...cycle[group], [key]: value } }
      : { ...cycle, [key]: value }));
  }
  function updateBonus(key, value) {
    setResult(null);
    setBonuses(current => ({ ...current, [key]: value }));
  }
  async function calculate(event) {
    event.preventDefault(); setBusy(true); setError(''); setResult(null);
    const numeric = object => Object.fromEntries(Object.entries(object).map(([key, value]) => [key, value === '' ? null : Number(value)]));
    try {
      const input = {
        cycles: cycles.map(c => ({ ...c, points: numeric(c.points), performed: c.performed === 'SIM', leadersPercent: Number(c.leadersPercent), incidences: numeric(c.incidences), equivalence: numeric(c.equivalence) })),
        ...numeric({ stars45Percent: bonuses.stars45Percent, stars123Percent: bonuses.stars123Percent, strikeBonus: bonuses.strikeBonus }), strikeApproved: bonuses.strikeApproved
      };
      const data = await api('/manual/top-quality/calcular', { method: 'POST', body: input });
      setResult({ ...data, inputs: input });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  function exportResult() {
    const lines = ['Consolidação Top Quality — Manual edição 28', '', ...result.cycles.flatMap(c => [
      `${c.cycle}º ciclo`, ...Object.entries(c.points).map(([id, value]) => `${id}: ${format(value)} pontos`),
      `Compromisso estratégico: ${format(c.ce)}`, `Equivalência: ${format(c.eqv)}`, `Redutor RAC: ${format(c.tr)}`, `Base: ${format(c.base)} / ${c.available}`, ''
    ]), `Base anual: ${format(result.base)} / 1280`, `Bônus estrelas: ${format(result.starBonus)}`, `Bônus Strike: ${format(result.strikeBonus)}`, `Total com bônus: ${format(result.total)}`, '', result.note, '', 'Dados informados:', JSON.stringify(result.inputs, null, 2)];
    downloadBlob(new Blob(['\ufeff' + lines.join('\n')], { type: 'text/plain;charset=utf-8' }), 'Consolidacao-Top-Quality.txt');
  }
  return <section className="panel top-quality-panel">
    <div className="panel-heading"><div><h2>Consolidação do Prêmio Top Quality</h2><p>Dois ciclos anuais · Manual edição 28, itens 7.9 a 7.14.</p></div></div>
    <div className="top-quality-body">
      <p>Informe os pontos apurados nos relatórios da MFC. O sistema soma os componentes e calcula compromisso estratégico, equivalência, redutores RAC e bônus. Preencha zero quando não houver pontuação.</p>
      <p className="small-muted">Esta conferência não é salva no banco e não altera os resultados das auditorias. Baixe a memória do cálculo para guardá-la. A concessão da categoria depende também dos requisitos e da validação da MFC.</p>
      {error && <p className="alert-error" role="alert">{error}</p>}
      {!schema ? <button className="btn secondary" onClick={() => setAttempt(value => value + 1)}>Carregar cálculo</button> : <form onSubmit={calculate}>
        <fieldset disabled={busy} className="top-quality-fields">
          <div className="top-quality-cycles">{cycles.map((cycle, index) => <section className="top-quality-cycle" key={index}>
            <h3>{index + 1}º ciclo · {index === 0 ? '610' : '670'} pontos básicos</h3>
            <div className="top-quality-grid">{schema.components.map(c => <Field key={c.id} label={`${c.id} — ${c.label} (pontos)`} help={`De ${c.min} a ${c.max} pontos do relatório.`}>
              <input required type="number" step="any" min={c.min} max={c.max} value={cycle.points[c.id] ?? ''} onChange={e => updateCycle(index, 'points', c.id, e.target.value)} />
            </Field>)}</div>
            <h4>Compromisso estratégico</h4>
            <Field label="Ciclo de auditoria realizado"><select required value={cycle.performed} onChange={e => updateCycle(index, null, 'performed', e.target.value)}><option value="">Selecione</option><option value="SIM">Sim · 18 pontos</option><option value="NAO">Não · 0 ponto</option></select></Field>
            <Field label="Líderes presentes nas reuniões de abertura/fechamento (%)"><input required type="number" min="0" max="100" step="any" value={cycle.leadersPercent} onChange={e => updateCycle(index, null, 'leadersPercent', e.target.value)} /></Field>
            <Field label="Diretoria na divulgação / fechamento" help="A presença somente na abertura não pontua. Representante exige comunicado registrado.">
              <select required value={cycle.direction} onChange={e => updateCycle(index, null, 'direction', e.target.value)}><option value="">Selecione</option><option value="DIRETORIA">Membro da Diretoria · 36 pontos</option><option value="REPRESENTANTE">Representante com comunicado · 15 pontos</option><option value="AUSENTE">Ausente · 0 ponto</option></select>
            </Field>
            <h4>Tratamento às incidências — RAC</h4>
            <p className="small-muted">Conte cada RAC uma vez, na sua etapa atual. Estas quantidades são de RACs, não de todas as pendências reprogramadas.</p>
            <div className="top-quality-grid">{[['rp1','RP1 · perde 10 por RAC'],['rp2','RP2 · perde 100 por RAC'],['rp3','RP3 ou superior · perde 500 por RAC']].map(([key, label]) => <Field key={key} label={label}><input required type="number" min="0" max="100000" step="1" value={cycle.incidences[key]} onChange={e => updateCycle(index, 'incidences', key, e.target.value)} /></Field>)}</div>
            {index === 1 && <><h4>Equivalência — percentuais dos relatórios</h4><p className="small-muted">Cada item com pelo menos 90% concede 10 pontos. Em Gp e A5, informe a média harmônica; não converta os pontos ponderados.</p><div className="top-quality-grid">{schema.equivalenceItems.map(id => <Field key={id} label={`${id} (%)`}><input required type="number" min="0" max="100" step="any" value={cycle.equivalence[id] ?? ''} onChange={e => updateCycle(index, 'equivalence', id, e.target.value)} /></Field>)}</div></>}
          </section>)}</div>
          <h3>Bônus adicionais à base anual</h3>
          <div className="top-quality-grid">{[['stars45Percent','Setores com 4 ou 5 estrelas (%)',100],['stars123Percent','Setores com 1, 2 ou 3 estrelas (%)',100],['strikeBonus','Pontuação extra Strike concedida pela MFC',80]].map(([id,label,max]) => <Field key={id} label={label}><input required type="number" min="0" max={max} step="any" value={bonuses[id]} onChange={e => updateBonus(id,e.target.value)} /></Field>)}</div>
          <p className="small-muted">Use o total de setores da tabela setorial como denominador dos percentuais. Os grupos de estrelas não se sobrepõem. Strike: informe os pontos concedidos, de 0 a 80.</p>
          {Number(bonuses.strikeBonus) > 0 && <Field label="Concessão do desafio Strike"><select required value={bonuses.strikeApproved ? 'SIM' : ''} onChange={e => updateBonus('strikeApproved',e.target.value === 'SIM')}><option value="">Confirme</option><option value="SIM">A MFC concedeu a auditoria e esta pontuação</option></select></Field>}
          <button className="btn primary" type="submit">{busy ? 'Calculando…' : 'Calcular consolidação'}</button>
        </fieldset>
      </form>}
      {result && <div className="top-quality-result" role="status"><h3>Total com bônus: {format(result.total)} pontos</h3><p>Base anual: {format(result.base)} / 1.280 · Estrelas: +{format(result.starBonus)} · Strike: +{format(result.strikeBonus)}</p><div className="table-wrap"><table className="data-table"><thead><tr><th>Ciclo</th><th>Compromisso</th><th>Equivalência</th><th>Redutor RAC</th><th>Base</th></tr></thead><tbody>{result.cycles.map(c => <tr key={c.cycle}><td>{c.cycle}º</td><td>{format(c.ce)}</td><td>{format(c.eqv)}</td><td>−{format(c.tr)}</td><td>{format(c.base)} / {c.available}</td></tr>)}</tbody></table></div><p>{result.note}</p><button type="button" className="btn secondary" onClick={exportResult}>Baixar memória do cálculo</button></div>}
    </div>
  </section>;
}
