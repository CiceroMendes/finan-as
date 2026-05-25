import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Trash2, CheckCircle2 } from 'lucide-react';

const K = {
  bg0: '#F5F5F5', bg1: '#FFFFFF', bg2: '#FFFFFF', bg3: '#F8F9FA', bg4: '#E8E8E8',
  border: '#E0E0E0', border2: '#D0D0D0',
  t0: '#1A2332', t1: '#2C3E50', t2: '#5A6C7D',
  blue: '#5FB5B5', blueD: '#E8F4F4',
  green: '#7EC8A3', greenD: '#E8F5F0',
  red: '#D88080', redD: '#F8E8E8',
  amber: '#E8B563', amberD: '#F8F3E8',
  purple: '#9B8FC7', purpleD: '#F0EEF8',
  teal: '#5FB5B5',
  font: "'Inter', sans-serif",
};

const CAPACIDADE_DIA = 220;
const PECAS_POR_PRODUTO = 40;

const PROCESSOS = [
  { etapa: 'Pré costura', seq: 1, setor: 'PCP', lt: 2 },
  { etapa: 'Pré costura', seq: 2, setor: 'Tecelagem', lt: 13 },
  { etapa: 'Pré costura', seq: 3, setor: 'Tinturaria', lt: 13 },
  { etapa: 'Em processo', seq: 4, setor: 'Aguardando corte', lt: 1 },
  { etapa: 'Em processo', seq: 5, setor: 'Corte', lt: 2 },
  { etapa: 'Em processo', seq: 6, setor: 'Silk carimbo', lt: 2 },
  { etapa: 'Em processo', seq: 7, setor: 'Estamparia', lt: 3 },
  { etapa: 'Em processo', seq: 8, setor: 'CD costura', lt: 1 },
  { etapa: 'Em processo', seq: 9, setor: 'Costura', lt: 5 },
  { etapa: 'Em processo', seq: 10, setor: 'Caseado e Botão', lt: 2 },
  { etapa: 'Em processo', seq: 11, setor: 'Embalagem', lt: 3 },
  { etapa: 'Pós costura', seq: 12, setor: 'Inspeção qualidade', lt: 2 },
  { etapa: 'Pós costura', seq: 13, setor: 'Expedição', lt: 1 },
];

const LEAD_TIME_TOTAL = PROCESSOS.reduce((acc, p) => acc + p.lt, 0);

const formatarData = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
};

const parseData = (str) => {
  if (!str) return null;
  const [dia, mes, ano] = str.split('/');
  return new Date(ano, mes - 1, dia);
};

export default function App() {
  const [colecoes, setColecoes] = useState([]);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [abaAtiva, setAbaAtiva] = useState('colecoes');
  const [capacidadeMostruarios, setCapacidadeMostruarios] = useState(5);
  const [setores, setSetores] = useState([
    { nome: 'PCP', cor: K.purple, dias: 2, capacidade: 999 },
    { nome: 'TECELAGEM', cor: K.purple, dias: 13, capacidade: 999 },
    { nome: 'TINTURARIA', cor: K.purple, dias: 13, capacidade: 999 },
    { nome: 'AGUARDANDO CORTE', cor: K.amber, dias: 1, capacidade: 999 },
    { nome: 'CORTE', cor: K.blue, dias: 2, capacidade: 5 },
    { nome: 'SILK CARIMBO', cor: K.blue, dias: 2, capacidade: 999 },
    { nome: 'ESTAMPARIA', cor: K.blue, dias: 3, capacidade: 5 },
    { nome: 'CD COSTURA', cor: K.blue, dias: 1, capacidade: 999 },
    { nome: 'COSTURA', cor: K.blue, dias: 5, capacidade: 5 },
    { nome: 'CASEADO E BOTÃO', cor: K.blue, dias: 2, capacidade: 999 },
    { nome: 'EMBALAGEM', cor: K.blue, dias: 3, capacidade: 5 },
    { nome: 'INSPEÇÃO QUALIDADE', cor: K.green, dias: 2, capacidade: 999 },
    { nome: 'EXPEDIÇÃO', cor: K.green, dias: 1, capacidade: 999 }
  ]);

  useEffect(() => {
    const setoresIniciais = [
      { nome: 'PCP', cor: K.purple, dias: 2, usaPipeline: false },
      { nome: 'TECELAGEM', cor: K.purple, dias: 13, usaPipeline: false },
      { nome: 'TINTURARIA', cor: K.purple, dias: 13, usaPipeline: false },
      { nome: 'AGUARDANDO CORTE', cor: K.amber, dias: 1, usaPipeline: false },
      { nome: 'CORTE', cor: K.blue, dias: 2, usaPipeline: true },
      { nome: 'SILK CARIMBO', cor: K.blue, dias: 2, usaPipeline: false },
      { nome: 'ESTAMPARIA', cor: K.blue, dias: 3, usaPipeline: true },
      { nome: 'CD COSTURA', cor: K.blue, dias: 1, usaPipeline: false },
      { nome: 'COSTURA', cor: K.blue, dias: 5, usaPipeline: true },
      { nome: 'CASEADO E BOTÃO', cor: K.blue, dias: 2, usaPipeline: false },
      { nome: 'EMBALAGEM', cor: K.blue, dias: 3, usaPipeline: true },
      { nome: 'INSPEÇÃO QUALIDADE', cor: K.green, dias: 2, usaPipeline: false },
      { nome: 'EXPEDIÇÃO', cor: K.green, dias: 1, usaPipeline: false }
    ];

    const carregar = async () => {
      if (window.storage?.get) {
        try {
          const result = await window.storage.get('planejamento-colecoes');
          if (result?.value) {
            const parsed = JSON.parse(result.value);
            setColecoes(parsed.data || []);
          }

          const resultSetores = await window.storage.get('planejamento-setores');
          if (resultSetores?.value) {
            const parsedSetores = JSON.parse(resultSetores.value);
            setSetores(parsedSetores.data || setoresIniciais);
          }

          const resultCapacidade = await window.storage.get('planejamento-capacidade');
          if (resultCapacidade?.value) {
            const parsedCapacidade = JSON.parse(resultCapacidade.value);
            setCapacidadeMostruarios(parsedCapacidade.data || 5);
          }
        } catch (e) {
          console.log('Erro ao carregar:', e);
        }
      }
    };
    carregar();
  }, []);

  const persist = useCallback((data) => {
    setSaveStatus('saving');
    const payload = JSON.stringify({ data, ts: Date.now() });
    let done = false;
    const fallback = setTimeout(() => {
      if (!done) { done = true; setSaveStatus('saved'); }
    }, 1500);

    if (window.storage?.set) {
      window.storage.set('planejamento-colecoes', payload)
        .then(() => { if (!done) { done = true; clearTimeout(fallback); setSaveStatus('saved'); } })
        .catch(() => { if (!done) { done = true; clearTimeout(fallback); setSaveStatus('saved'); } });
    } else {
      clearTimeout(fallback);
      setSaveStatus('saved');
    }
  }, []);

  useEffect(() => {
    if (colecoes.length > 0) {
      persist(colecoes);
    }
  }, [colecoes, persist]);

  const persistSetores = useCallback((data) => {
    const payload = JSON.stringify({ data, ts: Date.now() });
    if (window.storage?.set) {
      window.storage.set('planejamento-setores', payload).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (setores.length > 0) {
      persistSetores(setores);
    }
  }, [setores, persistSetores]);

  useEffect(() => {
    const payload = JSON.stringify({ data: capacidadeMostruarios, ts: Date.now() });
    if (window.storage?.set) {
      window.storage.set('planejamento-capacidade', payload).catch(() => {});
    }
  }, [capacidadeMostruarios]);

  const adicionarColecao = () => {
    const nova = {
      id: Date.now(),
      nome: `Coleção ${colecoes.length + 1}`,
      qtdProdutos: 0,
      dataEntrega: '',
      dataInicio: '',
    };
    setColecoes([...colecoes, nova]);
  };

  const removerColecao = (id) => {
    setColecoes(colecoes.filter(c => c.id !== id));
  };

  const atualizarColecao = (id, campo, valor) => {
    setColecoes(colecoes.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, [campo]: valor };

      if ((campo === 'dataInicio' || campo === 'qtdProdutos') && updated.dataInicio && updated.qtdProdutos > 0) {
        const qtd = parseInt(updated.qtdProdutos) || 0;

        let leadTimeBase = 0;
        setores.forEach(setor => {
          leadTimeBase += setor.dias;
        });

        let diasAdicionaisMaximo = 0;
        setores.forEach(setor => {
          const numeroLotes = Math.ceil(qtd / setor.capacidade);
          const diasAdicionaisSetor = numeroLotes - 1;
          if (diasAdicionaisSetor > diasAdicionaisMaximo) {
            diasAdicionaisMaximo = diasAdicionaisSetor;
          }
        });

        const diasTotais = leadTimeBase + diasAdicionaisMaximo;

        const dataInicioParsed = parseData(updated.dataInicio);
        if (dataInicioParsed) {
          let dataCalc = new Date(dataInicioParsed);
          let diasAdicionados = 0;
          while (diasAdicionados < diasTotais) {
            dataCalc.setDate(dataCalc.getDate() + 1);
            if (dataCalc.getDay() !== 0 && dataCalc.getDay() !== 6) {
              diasAdicionados++;
            }
          }
          updated.dataEntrega = formatarData(dataCalc);
        }
      }

      return updated;
    }));
  };

  const totalProdutos = colecoes.reduce((acc, c) => acc + (parseInt(c.qtdProdutos) || 0), 0);
  const totalPecas = totalProdutos * PECAS_POR_PRODUTO;

  const atualizarSetor = (index, campo, valor) => {
    setSetores(setores.map((s, i) => {
      if (i !== index) return s;
      if (campo === 'dias' || campo === 'capacidade') {
        return { ...s, [campo]: parseInt(valor) || 0 };
      }
      return { ...s, [campo]: valor };
    }));
  };

  const colecoesComDatas = colecoes.filter(c => c.dataInicio && c.dataEntrega);

  let dataMin = null;
  let dataMax = null;

  colecoesComDatas.forEach(c => {
    const inicio = parseData(c.dataInicio);
    const fim = parseData(c.dataEntrega);
    if (!dataMin || inicio < dataMin) dataMin = inicio;
    if (!dataMax || fim > dataMax) dataMax = fim;
  });

  if (dataMin && dataMax) {
    const margemDias = 5;
    dataMin = new Date(dataMin);
    dataMin.setDate(dataMin.getDate() - margemDias);
    dataMax = new Date(dataMax);
    dataMax.setDate(dataMax.getDate() + margemDias);
  }

  const totalDias = dataMin && dataMax ? Math.ceil((dataMax - dataMin) / (1000 * 60 * 60 * 24)) : 1;

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: K.bg0, fontFamily: K.font }}>
      {/* SIDEBAR */}
      <div style={{ width: 280, background: K.bg1, borderRight: `1px solid ${K.border}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px 18px', borderBottom: `1px solid ${K.border}` }}>
          <svg width="140" height="32" viewBox="0 0 140 32">
            <text x="0" y="24" fill={K.t1} fontSize="22" fontWeight="200" fontFamily={K.font}>seeder</text>
          </svg>
        </div>

        <div style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto' }}>
          <div
            onClick={() => setAbaAtiva('colecoes')}
            style={{
              background: abaAtiva === 'colecoes' ? `${K.blue}20` : 'transparent',
              color: abaAtiva === 'colecoes' ? K.blue : K.t1,
              borderLeft: abaAtiva === 'colecoes' ? `3px solid ${K.blue}` : '3px solid transparent',
              fontSize: 14,
              fontWeight: 700,
              textTransform: 'uppercase',
              padding: '10px 14px',
              borderRadius: 9,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer'
            }}
          >
            <Calendar size={18} color={abaAtiva === 'colecoes' ? K.blue : K.t1} />
            Coleções
          </div>

          <div
            onClick={() => setAbaAtiva('setores')}
            style={{
              background: abaAtiva === 'setores' ? `${K.blue}20` : 'transparent',
              color: abaAtiva === 'setores' ? K.blue : K.t1,
              borderLeft: abaAtiva === 'setores' ? `3px solid ${K.blue}` : '3px solid transparent',
              fontSize: 14,
              fontWeight: 700,
              textTransform: 'uppercase',
              padding: '10px 14px',
              borderRadius: 9,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer'
            }}
          >
            <CheckCircle2 size={18} color={abaAtiva === 'setores' ? K.blue : K.t1} />
            Setores
          </div>

          {abaAtiva === 'colecoes' && (
            <>
              <button
                onClick={adicionarColecao}
                style={{
                  background: K.blue,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 9,
                  padding: '10px 14px',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 8
                }}
              >
                <Plus size={18} />
                Nova Coleção
              </button>

              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {colecoes.map((col) => (
                  <div
                    key={col.id}
                    style={{
                      background: K.bg2,
                      border: `1px solid ${K.border}`,
                      borderRadius: 9,
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <input
                        type="text"
                        value={col.nome}
                        onChange={(e) => atualizarColecao(col.id, 'nome', e.target.value)}
                        style={{
                          background: K.bg3,
                          border: `1px solid ${K.border2}`,
                          borderRadius: 6,
                          padding: '6px 10px',
                          color: K.t0,
                          fontSize: 14,
                          fontFamily: K.font,
                          fontWeight: 600,
                          outline: 'none',
                          flex: 1
                        }}
                      />
                      <button
                        onClick={() => removerColecao(col.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: K.red,
                          cursor: 'pointer',
                          padding: 6,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, color: K.t2, marginBottom: 4 }}>Produtos</div>
                        <input
                          type="number"
                          value={col.qtdProdutos}
                          onChange={(e) => atualizarColecao(col.id, 'qtdProdutos', e.target.value)}
                          placeholder="0"
                          style={{
                            background: K.bg3,
                            border: `1px solid ${K.border2}`,
                            borderRadius: 6,
                            padding: '6px 8px',
                            color: K.t0,
                            fontSize: 14,
                            fontFamily: K.font,
                            outline: 'none',
                            width: '100%',
                            fontWeight: 700,
                            textAlign: 'center'
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, color: K.t2, marginBottom: 4 }}>Peças</div>
                        <div style={{
                          background: K.bg3,
                          borderRadius: 6,
                          padding: '6px 8px',
                          fontSize: 14,
                          fontWeight: 700,
                          color: K.t1,
                          textAlign: 'center'
                        }}>
                          {((parseInt(col.qtdProdutos) || 0) * PECAS_POR_PRODUTO).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 14, color: K.t2, marginBottom: 4 }}>Data Início</div>
                      <input
                        type="text"
                        value={col.dataInicio}
                        onChange={(e) => atualizarColecao(col.id, 'dataInicio', e.target.value)}
                        placeholder="dd/mm/aaaa"
                        style={{
                          background: K.bg3,
                          border: `1px solid ${K.border2}`,
                          borderRadius: 6,
                          padding: '6px 10px',
                          color: K.t0,
                          fontSize: 14,
                          fontFamily: K.font,
                          outline: 'none',
                          width: '100%',
                          textAlign: 'center'
                        }}
                      />
                    </div>

                    {col.dataEntrega && (
                      <div style={{
                        background: `${K.green}15`,
                        border: `1px solid ${K.green}`,
                        borderRadius: 6,
                        padding: '8px 10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: 14, color: K.green, fontWeight: 600 }}>Entrega em:</span>
                        <span style={{ fontSize: 14, color: K.green, fontWeight: 700 }}>{col.dataEntrega}</span>
                      </div>
                    )}

                    {col.dataInicio && col.dataEntrega && (
                      <div style={{
                        background: K.bg3,
                        borderRadius: 6,
                        padding: '8px 10px',
                        textAlign: 'center'
                      }}>
                        <span style={{ fontSize: 14, color: K.t1, fontWeight: 600 }}>
                          {(() => {
                            const inicio = parseData(col.dataInicio);
                            const fim = parseData(col.dataEntrega);
                            if (inicio && fim) {
                              const diff = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24));
                              return `${diff} dias corridos`;
                            }
                            return '';
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ padding: '16px', borderTop: `1px solid ${K.border}`, fontSize: 14, color: K.t2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {saveStatus === 'saving' ? (
              <>
                <div style={{ width: 14, height: 14, border: `2px solid ${K.blue}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} color={K.green} />
                <span>Salvo</span>
              </>
            )}
          </div>
          <div style={{ fontSize: 14, color: K.t2 }}>Cícero Ricardo Mendes - Gerente de operações</div>
          <div style={{ fontSize: 14, color: K.t2, marginTop: 4 }}>
            {new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* TOPBAR */}
        <div style={{ height: 52, background: K.bg1, borderBottom: `1px solid ${K.border}`, display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, color: K.t1, fontWeight: 600 }}>
            PLANEJAMENTO DE COLEÇÕES · MOSTRUÁRIO
          </div>
          <div style={{ fontSize: 14, color: K.t2 }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* CONTEÚDO */}
        <div style={{ flex: 1, overflow: 'hidden', padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {abaAtiva === 'colecoes' && (
            <>
              {/* KPI CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <div style={{
              background: K.bg2,
              border: `1px solid ${K.border}`,
              borderTop: `2px solid ${K.purple}`,
              borderRadius: 12,
              padding: '14px 18px'
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: K.t2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Produtos
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: K.t0, letterSpacing: '-0.03em', marginTop: 8 }}>
                {totalProdutos}
              </div>
              <div style={{ fontSize: 14, color: K.t2, marginTop: 4 }}>
                {totalPecas.toLocaleString('pt-BR')} peças
              </div>
            </div>

            <div style={{
              background: K.bg2,
              border: `1px solid ${K.border}`,
              borderTop: `2px solid ${K.green}`,
              borderRadius: 12,
              padding: '14px 18px'
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: K.t2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Dias corridos
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: K.t0, letterSpacing: '-0.03em', marginTop: 8 }}>
                {(() => {
                  if (colecoesComDatas.length === 0) return 0;
                  let totalDiasCorridos = 0;
                  colecoesComDatas.forEach(c => {
                    const inicio = parseData(c.dataInicio);
                    const fim = parseData(c.dataEntrega);
                    if (inicio && fim) {
                      totalDiasCorridos += Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24));
                    }
                  });
                  return totalDiasCorridos;
                })()}
              </div>
              <div style={{ fontSize: 14, color: K.t2, marginTop: 4 }}>
                total
              </div>
            </div>

            <div style={{
              background: K.bg2,
              border: `1px solid ${K.border}`,
              borderTop: `2px solid ${K.amber}`,
              borderRadius: 12,
              padding: '14px 18px'
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: K.t2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Lead time base
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: K.t0, letterSpacing: '-0.03em', marginTop: 8 }}>
                {setores.reduce((acc, s) => acc + s.dias, 0)}
              </div>
              <div style={{ fontSize: 14, color: K.t2, marginTop: 4 }}>
                dias úteis
              </div>
            </div>
          </div>

          {/* GRÁFICO DE GANTT */}
          <div style={{
            flex: 1,
            background: K.bg2,
            border: `1px solid ${K.border}`,
            borderRadius: 12,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0
          }}>
            <div style={{
              background: K.bg3,
              borderBottom: `1px solid ${K.border}`,
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 700,
              color: K.t2,
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}>
              Fluxo Industrial (Gantt)
            </div>

            <div style={{ flex: 1, padding: '16px 24px', overflow: 'auto', minHeight: 0 }}>
              {colecoesComDatas.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: K.t2, fontSize: 14 }}>
                  Adicione coleções na barra lateral para visualizar o cronograma.
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  {/* Grade de fundo */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 180,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    pointerEvents: 'none'
                  }}>
                    {Array.from({ length: 10 }).map((_, idx) => (
                      <div key={idx} style={{
                        flex: 1,
                        borderRight: `1px dashed ${K.border}`,
                        opacity: 0.3
                      }} />
                    ))}
                  </div>

                  {/* Eixo de datas */}
                  <div style={{ display: 'flex', marginBottom: 16, paddingLeft: 180 }}>
                    <div style={{ flex: 1, display: 'flex', paddingBottom: 8, borderBottom: `1px solid ${K.border}` }}>
                      {Array.from({ length: 10 }).map((_, idx) => {
                        const data = new Date(dataMin);
                        data.setDate(data.getDate() + Math.floor((idx * totalDias) / 10));
                        return (
                          <div key={idx} style={{
                            flex: 1,
                            textAlign: 'left',
                            fontSize: 14,
                            color: K.t2,
                            fontWeight: 600,
                            paddingLeft: 4
                          }}>
                            {formatarData(data)}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Linhas de setores */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {setores.map((setor, setorIdx) => (
                      <div key={setorIdx} style={{ display: 'flex', alignItems: 'center', minHeight: 32 }}>
                        <div style={{
                          width: 170,
                          fontSize: 14,
                          fontWeight: 600,
                          color: K.t1,
                          textAlign: 'right',
                          paddingRight: 10
                        }}>
                          {setor.nome}
                        </div>

                        <div style={{
                          flex: 1,
                          position: 'relative',
                          height: 32,
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          {colecoesComDatas.map((col, colIdx) => {
                            const inicio = parseData(col.dataInicio);
                            const totalProdutos = parseInt(col.qtdProdutos) || 0;
                            const numeroLotesSetor = Math.ceil(totalProdutos / setor.capacidade);

                            let dataInicioSetor = new Date(inicio);

                            for (let i = 0; i < setorIdx; i++) {
                              const s = setores[i];
                              let diasAdicionados = 0;
                              while (diasAdicionados < s.dias) {
                                dataInicioSetor.setDate(dataInicioSetor.getDate() + 1);
                                if (dataInicioSetor.getDay() !== 0 && dataInicioSetor.getDay() !== 6) {
                                  diasAdicionados++;
                                }
                              }
                            }

                            const diasSetor = setor.dias + (numeroLotesSetor - 1);
                            const dataFimSetor = new Date(dataInicioSetor);
                            let diasAdicionados = 0;
                            while (diasAdicionados < diasSetor) {
                              dataFimSetor.setDate(dataFimSetor.getDate() + 1);
                              if (dataFimSetor.getDay() !== 0 && dataFimSetor.getDay() !== 6) {
                                diasAdicionados++;
                              }
                            }

                            const offsetDias = Math.ceil((dataInicioSetor - dataMin) / (1000 * 60 * 60 * 24));
                            const duracaoDiasTotal = Math.ceil((dataFimSetor - dataInicioSetor) / (1000 * 60 * 60 * 24));

                            const offsetPercent = (offsetDias / totalDias) * 100;
                            const widthPercent = (duracaoDiasTotal / totalDias) * 100;

                            return (
                              <div
                                key={colIdx}
                                style={{
                                  position: 'absolute',
                                  left: `${offsetPercent}%`,
                                  width: `${widthPercent}%`,
                                  height: 26,
                                  background: setor.cor,
                                  borderRadius: 4,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                  paddingRight: 6,
                                  fontSize: 14,
                                  fontWeight: 700,
                                  color: '#fff',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                }}
                                title={`${col.nome} - ${diasSetor} DU`}
                              >
                                {widthPercent > 5 && `${diasSetor} DU`}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Legenda */}
                  {colecoesComDatas.length > 0 && (
                    <div style={{
                      marginTop: 16,
                      paddingTop: 12,
                      borderTop: `1px solid ${K.border}`,
                      display: 'flex',
                      gap: 16,
                      flexWrap: 'wrap',
                      paddingLeft: 180
                    }}>
                      {colecoesComDatas.map((col, idx) => (
                        <div key={col.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{
                            width: 24,
                            height: 14,
                            background: idx === 0 ? K.purple : idx === 1 ? K.blue : idx === 2 ? K.green : K.amber,
                            borderRadius: 3,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                          }} />
                          <span style={{ fontSize: 14, color: K.t1, fontWeight: 600 }}>
                            {col.nome}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
            </>
          )}

          {abaAtiva === 'setores' && (
            <div style={{
              flex: 1,
              background: K.bg2,
              border: `1px solid ${K.border}`,
              borderRadius: 12,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                background: K.bg3,
                borderBottom: `1px solid ${K.border}`,
                padding: '10px 18px',
                fontSize: 14,
                fontWeight: 700,
                color: K.t2,
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                Configuração de Setores e Lead Time
              </div>

              <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, height: '100%' }}>
                  {setores.map((setor, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: K.bg3,
                        border: `1px solid ${K.border}`,
                        borderRadius: 9,
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 20
                      }}
                    >
                      <div style={{ flex: 2 }}>
                        <div style={{ fontSize: 14, color: K.t2, marginBottom: 6 }}>Setor</div>
                        <input
                          type="text"
                          value={setor.nome}
                          onChange={(e) => atualizarSetor(idx, 'nome', e.target.value)}
                          style={{
                            background: K.bg2,
                            border: `1px solid ${K.border2}`,
                            borderRadius: 7,
                            padding: '8px 12px',
                            color: K.t0,
                            fontSize: 14,
                            fontFamily: K.font,
                            fontWeight: 600,
                            outline: 'none',
                            width: '100%'
                          }}
                        />
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, color: K.t2, marginBottom: 6 }}>Lead Time (dias)</div>
                        <input
                          type="number"
                          value={setor.dias}
                          onChange={(e) => atualizarSetor(idx, 'dias', e.target.value)}
                          style={{
                            background: K.bg2,
                            border: `1px solid ${K.border2}`,
                            borderRadius: 7,
                            padding: '8px 12px',
                            color: K.t0,
                            fontSize: 14,
                            fontFamily: K.font,
                            fontWeight: 700,
                            outline: 'none',
                            width: '100%',
                            textAlign: 'center'
                          }}
                        />
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, color: K.t2, marginBottom: 6 }}>Capacidade/dia</div>
                        <input
                          type="number"
                          value={setor.capacidade}
                          onChange={(e) => atualizarSetor(idx, 'capacidade', e.target.value)}
                          min="1"
                          style={{
                            background: K.bg2,
                            border: `1px solid ${K.border2}`,
                            borderRadius: 7,
                            padding: '8px 12px',
                            color: K.t0,
                            fontSize: 14,
                            fontFamily: K.font,
                            fontWeight: 700,
                            outline: 'none',
                            width: '100%',
                            textAlign: 'center'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
