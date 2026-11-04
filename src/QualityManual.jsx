import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Field, Heading } from './components';
import { downloadBlob } from './helpers';

const filename = 'Manual-Qualidade-Holistica-Edicao-28.pdf';

function useManualRules(api) {
  const [rules, setRules] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api('/manual/regras').then(data => {
      if (active) setRules(data);
    }).catch(err => {
      if (active) setError(err.message);
    });
    return () => { active = false; };
  }, [api]);
  return { rules, error };
}

export function StrikeFields({ api, strike, setStrike, transition, setTransition, previous }) {
  const { rules, error } = useManualRules(api);
  if (error) return <p className="alert-error" role="alert">{error}</p>;
  if (!rules) return <p role="status">Carregando escala de STRIKE…</p>;

  const minimum = rules.rescheduling.find(rule => rule.id === transition)?.minimum ?? 0;
  const showLegacy = previous !== undefined && !rules.strikeGroups.some(group => group.values.includes(previous));

  function changeTransition(event) {
    const value = event.target.value;
    const nextMinimum = rules.rescheduling.find(rule => rule.id === value)?.minimum ?? 0;
    setTransition(value);
    if (Number(strike) < nextMinimum || (value && showLegacy && Number(strike) === previous)) setStrike('');
  }

  return <>
    <Field label="Reprogramação de pendência sem solução" help="Selecione a transição somente quando ela tiver sido confirmada.">
      <select value={transition} onChange={changeTransition}>
        <option value="">Sem transição registrada</option>
        {rules.rescheduling.map(rule => <option key={rule.id} value={rule.id}>
          {rule.label} · mínimo {rule.minimum}
        </option>)}
      </select>
    </Field>
    <Field label="STRIKE aplicado" help="Escala do Manual de Qualidade Holística, edição 28, item 7.7.">
      <select required value={strike} onChange={event => setStrike(event.target.value)}>
        <option value="">Selecione o STRIKE</option>
        {showLegacy && !transition && <option value={previous}>{previous} · valor já registrado</option>}
        {rules.strikeGroups.map(group => <optgroup key={group.label} label={group.label}>
          {group.values.map(value => <option key={value} value={value} disabled={value < minimum}>{value}</option>)}
        </optgroup>)}
      </select>
    </Field>
  </>;
}

export default function QualityManual({ api, notify }) {
  const { rules, error } = useManualRules(api);
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const pdf = await api('/manual/download', { responseType: 'blob' });
      downloadBlob(pdf, filename);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return <>
    <Heading eyebrow="DOCUMENTOS DE REFERÊNCIA" title="Manual de Qualidade Holística"
      description="MFC · Edição 28"
      actions={<button className="btn primary" disabled={busy} onClick={download}>
        <Download size={17} />{busy ? 'Baixando…' : 'Baixar manual em PDF'}
      </button>} />
    <section className="panel">
      <div className="panel-heading"><h2>Regras para auditorias 5S</h2></div>
      <div className="body-text" style={{ padding: '0 20px 20px' }}>
        <p>Cada setor inicia com 100 pontos. O resultado geral considera a média harmônica quando ela atinge 90%. Abaixo desse limite, vale a menor nota setorial.</p>
        <p>Para o Prêmio Top Quality, o manual atribui até 140 pontos à auditoria 5S (A5) e 106 à auditoria sem aviso (As). Havendo mais de uma auditoria sem aviso no ciclo, o manual usa a média aritmética dos seus resultados.</p>
        <p>Os itens 8.10 e 8.11 orientam registrar a reincidência grave como RAC e documentar solicitações e insistências quando a solução depender de terceiros.</p>
        {error && <p role="alert">{error}</p>}
        {rules && <>
          <h3>Escala de STRIKE</h3>
          <table className="data-table">
            <thead><tr><th>Classificação</th><th>Valores permitidos</th></tr></thead>
            <tbody>{rules.strikeGroups.map(group => <tr key={group.label}>
              <td>{group.label}</td><td>{group.values.join(', ')}</td>
            </tr>)}</tbody>
          </table>
          <h3>Reprogramações sem solução</h3>
          <ul>{rules.rescheduling.map(rule => <li key={rule.id}>{rule.label} exige STRIKE mínimo de {rule.minimum}.</li>)}</ul>
        </>}
      </div>
    </section>
  </>;
}
