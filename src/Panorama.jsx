import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Cell, LabelList, LineChart, Line, Tooltip, ComposedChart, Legend
} from 'recharts';
import {
  Package, Activity, ShieldCheck, LayoutDashboard, DollarSign, Zap,
  ChevronDown, ChevronRight, Layers, Calendar, FilterX,
  ChevronLeft, FileUp, Tag, Filter, Box, TrendingUp, AlertTriangle, Target, Warehouse, GitMerge, Search, BarChart2, Briefcase, Factory, Info
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// PALETA
// ─────────────────────────────────────────────────────────────────────────────
const K = {
  bg0:     '#F2EDE4',
  bg1:     '#F8F4EE',
  bg2:     '#FDFAF5',
  bg3:     '#EDE8DF',
  bg4:     '#E4DFDA',
  border:  '#D4CFC4',
  border2: '#C4BFB4',
  t0:      '#1A1A1A',
  t1:      '#3A3A3A',
  t2:      '#7A7470',
  blue:    '#1B4F9C',
  blueD:   '#D4E2F4',
  green:   '#1A7A45',
  greenD:  '#D4EEE0',
  red:     '#C0392B',
  redD:    '#F4D4D1',
  amber:   '#B07A00',
  amberD:  '#F4EAD0',
  purple:  '#6B4FA0',
  purpleD: '#E8E0F4',
  teal:    '#0F7070',
  tealD:   '#D4E4E1',
  cat:     ['#1B4F9C','#6B4FA0','#0F7070','#B07A00','#1A7A45','#B04060','#C05820','#C0392B','#7A6BAA','#2A9A60'],
  font:    "'Inter', system-ui, sans-serif",
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES (inalteradas)
// ─────────────────────────────────────────────────────────────────────────────
const MONTHLY_TARGET_PCS     = 65000;
const DAYS_IN_MONTH          = 31;
const GOAL_SEEDER            = 1000000;
const GOAL_PRIVATE           = 820000;
const TOTAL_GOAL             = GOAL_SEEDER + GOAL_PRIVATE;
const CURRENT_WEEK_THRESHOLD = 2612;

const ALLOWED_SECTORS_PANORAMA = [
  'PPCP','TECELAGEM','TINTURARIA','CORTE','CD COSTURA',
  'COSTURA','EMBALAGEM','INSPEÇÃO DE QUALIDADE','EXPEDIÇÃO',
];
const SECTOR_ORDER_PRIORITY = [
  'PPCP','TECELAGEM','TINTURARIA','CORTE','CD COSTURA',
  'COSTURA','CASEADO E BOTAO','EMBALAGEM','INSPEÇÃO DE QUALIDADE','EXPEDIÇÃO',
];
const SECTORS_PRE_FLOW = [
  'TINTURARIA','MALHA COMPRADA','TECELAGEM',
  'AGUARDANDO RETILINEA','AGUARDANDO CORTE','CORTE','PCP','PPCP',
];
// Pré = setor exato está na lista; Pós = tudo que não estiver no pré
const isPreFlow = (sector) => SECTORS_PRE_FLOW.some(s => normalize(sector) === s);

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS (inalterados)
// ─────────────────────────────────────────────────────────────────────────────
const tc = (s='') => s.replace(/\S+/g, w => {
  const u = w.toUpperCase();
  if(['PL','WIP','S&OP'].includes(u)) return u;
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
});
const normalize = (str) => {
  if (!str) return '';
  return str.toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
};
const parseBrazilianNumber = (val) => {
  if (!val) return 0;
  const n = parseFloat(val.toString().replace(/\./g,'').replace(',','.').trim());
  return isNaN(n) ? 0 : n;
};
const isWeekend = (day, ref) => {
  if (!ref) return false;
  const [d,m,y] = ref.split('/').map(Number);
  const dt = new Date(y,m-1,day);
  return dt.getDay()===0||dt.getDay()===6;
};

// ─────────────────────────────────────────────────────────────────────────────
// MICRO COMPONENTES — novos estilos
// ─────────────────────────────────────────────────────────────────────────────

const PanelHeader = ({ children }) => (
  <div style={{
    padding:'14px 18px', borderBottom:`1px solid ${K.border}`, flexShrink:0,
    fontSize:14, fontWeight:700, color:K.t1, letterSpacing:'0.04em',
  }}>{typeof children==='string'?tc(children):children}</div>
);

const KpiCard = ({ label, value, sub, alert, accent, icon: Icon, onClick }) => {
  const color = alert ? K.red : K.teal;
  return (
    <div onClick={onClick} style={{
      background:K.bg2, border:`1px solid ${K.border}`, borderRadius:12,
      padding:'16px 20px', display:'flex', flexDirection:'column', gap:6,
      position:'relative', overflow:'hidden',
      cursor: onClick ? 'pointer' : 'default',
      boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:color }}/>
      <span style={{ fontSize:13, fontWeight:700, color:K.t2,
        textTransform:'uppercase', letterSpacing:'0.04em' }}>{label}</span>
      <span style={{ fontSize:22, fontWeight:400, color: alert ? K.red : K.t0,
        letterSpacing:'-0.02em', lineHeight:1.2 }}>{value}</span>
      {sub && <span style={{ fontSize:12, color:K.t2 }}>{sub}</span>}
    </div>
  );
};

const NavBtn = ({ id, icon: Icon, active, onClick, label }) => (
  <button onClick={() => onClick(id)} style={{
    padding:'11px 16px', display:'flex', alignItems:'center', gap:12,
    background: active ? `${K.teal}22` : 'transparent',
    border: active ? `1px solid ${K.teal}55` : '1px solid transparent',
    borderRadius:9, margin:'2px 8px', width:'calc(100% - 16px)',
    cursor:'pointer', color: active ? K.teal : K.t1,
    fontWeight: active ? 700 : 500, transition:'all 0.15s',
    fontSize:15,
  }}>
    <Icon size={18}/>
    <span style={{ fontSize:15, fontWeight: active ? 700 : 500 }}>{tc(label)}</span>
  </button>
);

const Tab = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{
    padding:'10px 18px', background:'transparent', border:'none', cursor:'pointer',
    color: active ? K.blue : K.t1,
    fontSize:14, fontWeight: active ? 700 : 500,
    borderBottom: `2px solid ${active ? K.blue : 'transparent'}`,
    transition:'all 0.12s', whiteSpace:'nowrap',
  }}>{typeof children==='string'?tc(children):children}</button>
);

const Pill = ({ active, danger, onClick, children, style: extraStyle }) => (
  <button onClick={onClick} style={{
    padding:'4px 12px', height:28, borderRadius:7,
    background: active ? (danger ? `${K.red}20` : `${K.teal}20`) : K.bg2,
    border: `1px solid ${active ? (danger ? K.red : K.teal) : K.border}`,
    cursor:'pointer',
    color: active ? (danger ? K.red : K.teal) : K.t1,
    fontSize:14, letterSpacing:'0.06em', textTransform:'uppercase', fontWeight:700,
    whiteSpace:'nowrap', transition:'all 0.12s', flexShrink:0,
    ...extraStyle,
  }}>{children}</button>
);

const Chip = ({ label, value, alert }) => (
  <span style={{
    display:'inline-flex', fontSize:14, fontWeight:800, textTransform:'uppercase',
    letterSpacing:'0.06em',
    border:`1px solid ${alert ? `${K.red}80` : K.border2}`,
    borderRadius:6, overflow:'hidden', flexShrink:0,
  }}>
    <span style={{ padding:'3px 7px',
      borderRight:`1px solid ${alert ? `${K.red}80` : K.border2}`,
      color:K.t2, background:K.bg3 }}>{label}</span>
    <span style={{ padding:'3px 7px',
      color: alert ? K.red : K.t1, background:K.bg2 }}>{value}</span>
  </span>
);

const SelectBox = ({ icon: Icon, value, onChange, children }) => (
  <div style={{ display:'flex', alignItems:'center', gap:8,
    border:`1px solid ${K.border2}`, padding:'0 12px', height:28,
    borderRadius:9, background:K.bg2 }}>
    {Icon && <Icon size={13} color={K.t2}/>}
    <select value={value} onChange={onChange} style={{
      background:'transparent', border:'none', outline:'none', cursor:'pointer',
      color:K.t0, fontSize:14, fontWeight:600, textTransform:'uppercase',
    }}>{children}</select>
  </div>
);

const ScrollBand = ({ scrollRef, label, icon: Icon, children, onLeft, onRight }) => (
  <div style={{ display:'flex', alignItems:'center', border:`1px solid ${K.border2}`,
    height:38, borderRadius:9, background:K.bg2, flex:1, overflow:'hidden', minWidth:0 }}>
    <div style={{ padding:'0 12px', borderRight:`1px solid ${K.border2}`, display:'flex',
      alignItems:'center', gap:6, height:'100%', flexShrink:0, background:K.bg3, borderRadius:'9px 0 0 9px' }}>
      {Icon && <Icon size={12} color={K.t2}/>}
      <span style={{ fontSize:14, fontWeight:700, color:K.t2, textTransform:'uppercase',
        letterSpacing:'0.08em' }}>{label}</span>
    </div>
    <button onClick={onLeft} style={{ padding:'0 8px', background:'transparent', border:'none',
      cursor:'pointer', color:K.t2, height:'100%', flexShrink:0 }}>
      <ChevronLeft size={14}/>
    </button>
    <div ref={scrollRef} style={{ display:'flex', alignItems:'center', gap:4, padding:'0 4px',
      overflowX:'hidden', whiteSpace:'nowrap', scrollBehavior:'smooth', flex:1 }}>
      {children}
    </div>
    <button onClick={onRight} style={{ padding:'0 8px', background:'transparent', border:'none',
      cursor:'pointer', color:K.t2, height:'100%', flexShrink:0 }}>
      <ChevronRight size={14}/>
    </button>
  </div>
);

const DarkTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:K.bg2, border:`1px solid ${K.border2}`, borderRadius:10,
      padding:'10px 14px', fontSize:14 }}>
      <div style={{ fontSize:14, color:K.t0, marginBottom:6, textTransform:'uppercase',
        letterSpacing:'0.08em' }}>Dia {label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:p.color,
            display:'inline-block', flexShrink:0 }}/>
          <span style={{ fontSize:14, fontWeight:700, color:K.t0 }}>
            {typeof p.value==='number' ? p.value.toLocaleString('pt-BR') : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Panel wrapper with header
const Panel = ({ title, children, style={} }) => (
  <div style={{ background:K.bg2, border:`1px solid ${K.border}`, borderRadius:14,
    display:'flex', flexDirection:'column', overflow:'hidden', ...style }}>
    {title && <PanelHeader>{title}</PanelHeader>}
    <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column' }}>
      {children}
    </div>
  </div>
);

// Multi-select dropdown para filtros WIP
const WipMultiSelect = ({ label, icon: Icon, options, value, onChange, isEntrega, entregaValues, onChangeEntrega, dangerThreshold }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayLabel = isEntrega
    ? (entregaValues[0] === 'TODOS' ? label : entregaValues.length === 1 ? entregaValues[0] : `${entregaValues.length} sel.`)
    : (value === 'TODOS' ? label : value);
  const isActive = isEntrega ? entregaValues[0] !== 'TODOS' : value !== 'TODOS';

  return (
    <div ref={ref} style={{ position:'relative', flexShrink:0 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display:'flex', alignItems:'center', gap:7, height:28, padding:'0 12px',
        borderRadius:9, cursor:'pointer', fontFamily:K.font,
        background: isActive ? `${K.blue}18` : K.bg2,
        border: `1px solid ${isActive ? K.blue : K.border2}`,
        color: isActive ? K.blue : K.t1, fontSize:14, fontWeight:600,
        textTransform:'uppercase', whiteSpace:'nowrap',
      }}>
        {Icon && <Icon size={12} color={isActive ? K.blue : K.t2}/>}
        {displayLabel}
        <ChevronDown size={12} color={isActive ? K.blue : K.t2}/>
      </button>
      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 4px)', left:0, zIndex:50,
          background:K.bg2, border:`1px solid ${K.border}`, borderRadius:12,
          boxShadow:'0 8px 32px rgba(0,0,0,0.15)', minWidth:220, maxHeight:320,
          overflowY:'auto', padding:'6px 0',
        }}>
          {/* TODOS */}
          {isEntrega ? (
            <div onClick={() => { onChangeEntrega('TODOS', false); setOpen(false); }}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px',
                cursor:'pointer', background: entregaValues[0]==='TODOS' ? `${K.blue}15` : K.bg2 }}>
              <span style={{ width:14, height:14, borderRadius:3, border:`1px solid ${K.border2}`,
                background: entregaValues[0]==='TODOS' ? K.blue : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {entregaValues[0]==='TODOS' && <span style={{color:'#fff',fontSize:14,lineHeight:1}}>✓</span>}
              </span>
              <span style={{ fontSize:14, color: entregaValues[0]==='TODOS' ? K.blue : K.t1 }}>TODOS</span>
            </div>
          ) : (
            <div onClick={() => { onChange('TODOS'); setOpen(false); }}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px',
                cursor:'pointer', background: value==='TODOS' ? `${K.blue}15` : K.bg2 }}>
              <span style={{ width:14, height:14, borderRadius:3, border:`1px solid ${K.border2}`,
                background: value==='TODOS' ? K.blue : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {value==='TODOS' && <span style={{color:'#fff',fontSize:14,lineHeight:1}}>✓</span>}
              </span>
              <span style={{ fontSize:14, color: value==='TODOS' ? K.blue : K.t1 }}>TODOS</span>
            </div>
          )}
          {options.map(opt => {
            const isOld = isEntrega && parseInt(opt) < dangerThreshold;
            const checked = isEntrega ? entregaValues.includes(opt) : value === opt;
            return (
              <div key={opt} onClick={() => isEntrega ? onChangeEntrega(opt, true) : (onChange(opt), setOpen(false))}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px',
                  cursor:'pointer', background: checked ? `${K.blue}15` : K.bg2 }}>
                <span style={{ width:14, height:14, borderRadius:3,
                  border:`1px solid ${isOld ? K.red : K.border2}`,
                  background: checked ? K.blue : 'transparent',
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {checked && <span style={{color:'#fff',fontSize:14,lineHeight:1}}>✓</span>}
                </span>
                <span style={{ fontSize:14, color: isOld ? K.red : checked ? K.blue : K.t1 }}>{opt}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Multi-select dropdown para filtros Estoque (array multi-select com Ctrl)
const EstoqueMultiSelect = ({ label, options, values, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const isActive = values.length > 0;
  const displayLabel = isActive ? (values.length === 1 ? values[0] : `${values.length} sel.`) : label;
  const toggle = (opt, ctrl) => {
    if (!ctrl) { onChange(values.includes(opt) && values.length === 1 ? [] : [opt]); return; }
    onChange(values.includes(opt) ? values.filter(v=>v!==opt) : [...values, opt]);
  };
  return (
    <div ref={ref} style={{ position:'relative', flexShrink:0 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display:'flex', alignItems:'center', gap:7, height:28, padding:'0 12px',
        borderRadius:9, cursor:'pointer', fontFamily:K.font,
        background: isActive ? `${K.blue}18` : K.bg2,
        border: `1px solid ${isActive ? K.blue : K.border2}`,
        color: isActive ? K.blue : K.t1, fontSize:14, fontWeight:600,
        textTransform:'uppercase', whiteSpace:'nowrap',
      }}>
        {displayLabel}
        <ChevronDown size={12} color={isActive ? K.blue : K.t2}/>
      </button>
      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 4px)', left:0, zIndex:50,
          background:K.bg2, border:`1px solid ${K.border}`, borderRadius:12,
          boxShadow:'0 8px 32px rgba(0,0,0,0.15)', minWidth:220, maxHeight:320,
          overflowY:'auto', padding:'6px 0',
        }}>
          <div onClick={() => { onChange([]); setOpen(false); }}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px',
              cursor:'pointer', background: !isActive ? `${K.blue}15` : K.bg2 }}>
            <span style={{ width:14, height:14, borderRadius:3, border:`1px solid ${K.border2}`,
              background: !isActive ? K.blue : 'transparent',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {!isActive && <span style={{color:'#fff',fontSize:14,lineHeight:1}}>✓</span>}
            </span>
            <span style={{ fontSize:14, color: !isActive ? K.blue : K.t1 }}>TODOS</span>
          </div>
          {options.map(opt => {
            const checked = values.includes(opt);
            return (
              <div key={opt} onClick={(e) => { toggle(opt, e.ctrlKey || e.metaKey); }}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px',
                  cursor:'pointer', background: checked ? `${K.blue}15` : K.bg2 }}>
                <span style={{ width:14, height:14, borderRadius:3, border:`1px solid ${K.border2}`,
                  background: checked ? K.blue : 'transparent',
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {checked && <span style={{color:'#fff',fontSize:14,lineHeight:1}}>✓</span>}
                </span>
                <span style={{ fontSize:14, color: checked ? K.blue : K.t1 }}>{opt}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeDash, setActiveDash]     = useState('PANORAMA');
  const [tabPanorama, setTabPanorama]   = useState('analise');
  const [tabWip, setTabWip]             = useState('DASHBOARD');
  const [tabFat, setTabFat]             = useState('DASHBOARD');
  const [tabSop, setTabSop]             = useState('PLANEJAMENTO');

  const [dataPanorama, setDataPanorama] = useState(null);
  const [dataWip, setDataWip]           = useState([]);
  const [dataFat, setDataFat]           = useState([]);
  const [loading, setLoading]           = useState(false);
  const [storageLoading, setStorageLoading] = useState(true);
  const [lastUpdated, setLastUpdated]   = useState({ panorama:null, wip:null, fat:null, estoque:null, cobertura:null, sop:null, carteiraPL:null, indatex:null });
  const [saveStatus, setSaveStatus]     = useState('');

  // ── S&OP STATE ───────────────────────────────────────────────────────────
  const [dataSop, setDataSop] = useState(null);

  // ── Metas dinâmicas do S&OP (fallback para constantes se não carregado) ──
  const effectiveMetas = useMemo(() => {
    const pm = dataSop?.paramMetas || {};
    const hoje = new Date();
    const ML = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const ml = ML[hoje.getMonth()];
    const get = (key) => pm[key]?.[ml] || 0;
    return {
      goalSeeder: get('Meta faturamento Seeder') || GOAL_SEEDER,
      goalPL:     get('Meta faturamento PL')     || GOAL_PRIVATE,
      targetPcs:  MONTHLY_TARGET_PCS,
      diasUteis:  get('Dias úteis')              || DAYS_IN_MONTH,
    };
  }, [dataSop]);
  const [execCanal, setExecCanal]   = useState('TODOS');
  const [execFiltro, setExecFiltro] = useState({tipo:null,valor:null}); // {tipo:'mes'|'status'|'cliente', valor:...}
  const [execView, setExecView]     = useState('VISAO'); // VISAO | DETALHE
  // dataSop shape:
  // { meses:[], seeder:[], petersen:[], total:[], capacidade:[], wip:[] }
  // wip: [{setor, qty}]

  // ── COBERTURA STATE ───────────────────────────────────────────────────────
  const [dataComercial, setDataComercial]   = useState([]);
  const [dataCarteiraPLTeste, setDataCarteiraPLTeste] = useState([]);
  const [dataCarteiraPL,     setDataCarteiraPL]     = useState([]);
  const [dataCarteiraNE,     setDataCarteiraNE]     = useState([]);
  const [dataIndatex, setDataIndatex]       = useState([]);
  const [canalFiltro, setCanalFiltro]       = useState('TODOS'); // TODOS | SEEDER | PL | NEXT_ELEVEN
  const [cobFilters, setCobFilters]         = useState({ busca:'', marca:[], rep:[], somenteFaturavel:false, mesEntrega:[], descStatus:[], statusFilter:'TODOS' });
  const [expCobertura, setExpCobertura]     = useState({});
  const [expCobCor, setExpCobCor]           = useState({});

  // ── STORAGE: carregar ao iniciar ──────────────────────────────────────────
  // Storage abstraction: window.storage (Claude.ai) com fallback para localStorage (arquivo exportado)
  const storageGet = async (key) => {
    if (window.storage?.get) {
      const r = await window.storage.get(key).catch(()=>null);
      return r?.value ?? null;
    }
    try { return localStorage.getItem(key); } catch(e) { return null; }
  };
  const storageSet = async (key, value) => {
    if (window.storage?.set) { await window.storage.set(key, value); return; }
    // fallback localStorage — se cheio, limpa as outras bases e tenta de novo
    try { localStorage.setItem(key, value); } catch(e) {
      try {
        ['gestao:panorama','gestao:wip','gestao:fat','gestao:estoque','gestao:cobertura']
          .filter(k=>k!==key).forEach(k=>{try{localStorage.removeItem(k);}catch(_){}});
        localStorage.setItem(key, value);
      } catch(e2) { throw e2; }
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const keys = ['gestao:panorama','gestao:wip','gestao:fat','gestao:estoque','gestao:cobertura','gestao:sop'];
        const [vPan,vWip,vFat,vEst,vCob,vSop] = await Promise.all(keys.map(k => storageGet(k)));
        if (vPan) { const {data,ts}=JSON.parse(vPan); setDataPanorama(data); setLastUpdated(p=>({...p,panorama:ts})); }
        if (vWip) { const {data,ts}=JSON.parse(vWip); setDataWip(data);      setLastUpdated(p=>({...p,wip:ts})); }
        if (vFat) { const {data,ts}=JSON.parse(vFat); setDataFat(data);      setLastUpdated(p=>({...p,fat:ts})); }
        if (vEst) { const {data,ts}=JSON.parse(vEst); setDataEstoque(data);  setLastUpdated(p=>({...p,estoque:ts})); }
        if (vSop) { const {data,ts}=JSON.parse(vSop); setDataSop(data);      setLastUpdated(p=>({...p,sop:ts})); }
        const vInd = await storageGet('gestao:indatex');
        if (vInd) { const {data,ts}=JSON.parse(vInd); setDataIndatex(data); setLastUpdated(p=>({...p,indatex:ts})); }
        const vCPLT = await storageGet('gestao:carteiraPLTeste');
        if(vCPLT){ const {data,ts}=JSON.parse(vCPLT); setDataCarteiraPLTeste(data); setLastUpdated(p=>({...p,carteiraPLTeste:ts})); }
        // Load WIP observations
        try {
          const vObs = await window.storage.get('gestao:obsWip');
          if(vObs) setObsWip(JSON.parse(vObs.value));
        } catch(e) {}
        const vCPL = await storageGet('gestao:carteiraPL');
        if (vCPL) { const {data,ts}=JSON.parse(vCPL); setDataCarteiraPL(data); setLastUpdated(p=>({...p,carteiraPL:ts})); }
        const vCNE = await storageGet('gestao:carteiraNE');
        if (vCNE) { const {data,ts}=JSON.parse(vCNE); setDataCarteiraNE(data); setLastUpdated(p=>({...p,carteiraNE:ts})); }
        if (vCob) {
          const {data,ts}=JSON.parse(vCob);
          const expandCob=r=>r.numero?r:{
            numero:r.n, codcli:r.cc, cliente:r.cl, rep:r.rp,
            codigo:r.cd, desccor:r.dc, cor:r.cr, tam:r.t,
            qtde:r.q, preco:r.p, colecao:r.co, marca:r.m,
            entrega:r.e, descricao:r.de, descStatus:r.ds,
          };
          setDataComercial(data.map(expandCob));
          setLastUpdated(p=>({...p,cobertura:ts}));
        }
      } catch(e) { console.warn('Storage load error:',e); }
      finally { setStorageLoading(false); }
    };
    load();
  }, []);

  // ── STORAGE: salvar ───────────────────────────────────────────────────────
  const setSaveStatusRef = React.useRef(null);
  const setLastUpdatedRef = React.useRef(null);
  setSaveStatusRef.current = setSaveStatus;
  setLastUpdatedRef.current = setLastUpdated;

  const persist = React.useCallback((key, data) => {
    setSaveStatusRef.current('saving');
    const ts = new Date().toLocaleString('pt-BR');
    const keyMap = {
      'gestao:panorama':'panorama','gestao:wip':'wip','gestao:fat':'fat',
      'gestao:estoque':'estoque','gestao:cobertura':'cobertura','gestao:sop':'sop','gestao:carteiraPL':'carteiraPL','gestao:carteiraNE':'carteiraNE'
    };
    const payload = JSON.stringify({data, ts});

    const markSaved = () => {
      setSaveStatusRef.current('saved');
      setLastUpdatedRef.current(p => ({...p, [keyMap[key]||'fat']: ts}));
      setTimeout(() => setSaveStatusRef.current(''), 2500);
    };

    // Fallback: se a Promise não resolver em 1.5s, assume salvo de qualquer forma
    let done = false;
    const fallback = setTimeout(() => {
      if (!done) { done = true; markSaved(); }
    }, 1500);

    try {
      let p;
      if (window.storage?.set) {
        p = window.storage.set(key, payload);
      } else {
        try { localStorage.setItem(key, payload); } catch(_) {}
        p = Promise.resolve();
      }
      if (p && typeof p.then === 'function') {
        p.then(() => {
          if (!done) { done = true; clearTimeout(fallback); markSaved(); }
        }).catch(() => {
          if (!done) { done = true; clearTimeout(fallback); markSaved(); }
        });
      }
    } catch(e) {
      console.warn('Storage sync error:', key, e);
    }
  }, []);

  const [sectorFilter, setSectorFilter] = useState('EXPEDIÇÃO');
  const [wipFilters, setWipFilters] = useState({
    cliente:'TODOS',setor:'TODOS',colecao:'TODOS',fluxo:'GERAL',
    entrega:['TODOS'],somenteAtraso:false,somenteMostruario:false,busca:'',buscaOf:'',
  });
  const [fatFilters, setFatFilters] = useState({canal:'TODOS',colecao:'TODOS'});
  const [fatViz, setFatViz] = useState('VALORES'); // 'VALORES' | 'PECAS'

  // ── ESTOQUE STATE ─────────────────────────────────────────────────────────
  const [dataEstoque, setDataEstoque]     = useState([]);
  const [tabEstoque, setTabEstoque]       = useState('DASHBOARD');
  const [expEstoque, setExpEstoque]       = useState({});
  const [estoqueFilters, setEstoqueFilters] = useState({
    busca:'', marca:[], colecao:[], grupo:[],
    qualidade:[], aging:'TODOS',
  });
  const [expSectors,  setExpSectors]  = useState({});
  const [expForn,     setExpForn]     = useState({});
  const [plInfoOpen,  setPlInfoOpen]  = useState(false);
  const [cobCsvOpen,  setCobCsvOpen]  = useState(false);
  const [cobCsvText,  setCobCsvText]  = useState('');
  const [wipLtFilter, setWipLtFilter] = useState(null);
  const [sortDet, setSortDet]         = useState({col:'diasNoSetor', dir:'desc'});
  const [obsWip,  setObsWip]          = useState({});
  const saveObs = React.useCallback((of, text) => {
    setObsWip(prev => {
      const next = {...prev};
      if(text.trim()) next[of] = text;
      else delete next[of];
      window.storage.set('gestao:obsWip', JSON.stringify(next)).catch(()=>{});
      return next;
    });
  }, []); // null | 'ATRASO' | 'CRITICO'
  const [expSuppliers,setExpSuppliers]= useState({});
  const [expPanorama, setExpPanorama] = useState({});

  const colecaoRef = useRef(null);
  const entregaRef = useRef(null);
  const scroll = (ref,dir) => { if(ref.current) ref.current.scrollBy({left:dir==='l'?-200:200,behavior:'smooth'}); };

  // ── UPLOADS (inalterados) ─────────────────────────────────────────────────
  const handleUploadPanorama = (ev) => {
    const file=ev.target.files[0]; if(!file) return; setLoading(true);
    const r=new FileReader();
    r.onload=(e)=>{
      const lines=e.target.result.split('\n');
      const result=lines.slice(1).map(line=>{
        const cols=line.split(';'); if(cols.length<41) return null;
        const c=(v)=>v?v.replace(/"/g,'').trim():'';
        const setorDesc=c(cols[6]).toUpperCase(); if(setorDesc.startsWith('AGUARDANDO')) return null;
        const refDate=c(cols[2]); let totalUtil=0; const producaoDiaria=[];
        for(let i=1;i<=31;i++){
          const qtd=parseInt(c(cols[8+i]))||0;
          if(qtd>0&&!isWeekend(i,refDate)){totalUtil+=qtd;producaoDiaria.push({dia:i,qtd});}
        }
        return {faccao:c(cols[3]),setorDesc,total:totalUtil,diario:producaoDiaria,refDate};
      }).filter(i=>i!==null&&i.total>0);
      setDataPanorama(result); setLoading(false); persist('gestao:panorama',result);
    };
    r.readAsText(file);
  };

  const handleUploadWip = (ev) => {
    const file=ev.target.files[0]; if(!file) return; setLoading(true);
    const r=new FileReader();
    r.onload=(e)=>{
      const lines=e.target.result.split(/\r?\n/);
      const headers=lines[0].split(';').map(h=>h.replace(/"/g,'').trim());
      const idx=(n)=>headers.findIndex(h=>normalize(h)===normalize(n));
      const m={ref:idx('fac_codigo'),of:idx('of_ref'),desc:idx('produto_descricao'),
        quant:idx('fac_quant_pend'),setor:idx('cadfluxo_descricao'),dias:idx('dt_setor'),
        marca:idx('desc_marca'),fornecedor:idx('cliente_nome'),colecao:idx('desccol'),
        pedido:idx('fac_pedido')||idx('ped_numero')||idx('numero_pedido')||idx('pedido'),
        entrega:idx('pedido_periodo'),facDtR:idx('fac_dt_r'),cor:idx('cor_descor'),tipo:idx('desc_tipo')};
      const result=lines.slice(1).map(line=>{
        if(!line.trim()) return null;
        const v=line.split(';'); const c=(i)=>v[i]?v[i].replace(/"/g,'').trim():'';
        const sector=c(m.setor).toUpperCase();
        const fluxo = isPreFlow(sector) ? 'PRÉ' : 'PÓS';
        return {ref:c(m.ref),of:c(m.of),descricao:c(m.desc),quantidade:parseBrazilianNumber(c(m.quant)),
          setor:sector,cliente:c(m.marca)||'N/A',fornecedor:c(m.fornecedor)||'N/A',
          diasNoSetor:parseInt(c(m.dias))||0,colecao:c(m.colecao)||'SEM COLEÇÃO',
          entrega:c(m.entrega)||'N/A',facDtR:c(m.facDtR)||'',cor:c(m.cor)||'N/A',
          pedido:c(m.pedido)||'',fluxo,tipo:c(m.tipo)};
      }).filter(i=>i&&i.ref);
      setDataWip(result); setLoading(false); persist('gestao:wip',result);
    };
    r.readAsText(file,'ISO-8859-1');
  };

  const handleUploadFat = (ev) => {
    const file=ev.target.files[0]; if(!file) return; setLoading(true);
    const r=new FileReader();
    r.onload=(e)=>{
      const lines=e.target.result.split(/\r?\n/);
      const headers=lines[0].split(';').map(h=>h.replace(/"/g,'').trim());
      const idx=(n)=>headers.findIndex(h=>normalize(h)===normalize(n));
      const result=lines.slice(1).map(line=>{
        if(!line.trim()) return null;
        const v=line.split(';'); const c=(i)=>i!==-1&&v[i]?v[i].replace(/"/g,'').trim():'';
        const col=c(idx('DESC_COLECAO'))||c(idx('DESCLINHA'))||'SEM COLEÇÃO';
        return {valorLiq:parseBrazilianNumber(c(idx('VALOR_LIQ'))),
          quantidade:parseBrazilianNumber(c(idx('QTDE'))),
          fatura:c(idx('FATURA')),data:c(idx('DT_EMISSAO')),
          cliente:c(idx('FANTASIA'))||c(idx('NOME'))||'N/A',
          colecao:col,canal:normalize(col).includes('PRIVATE LABEL')?'PRIVATE LABEL':'SEEDER',
          dia:parseInt(c(idx('DT_EMISSAO')).split('/')[0])||0};
      }).filter(i=>i&&i.fatura);
      setDataFat(result); setLoading(false); persist('gestao:fat',result);
    };
    r.readAsText(file,'ISO-8859-1');
  };

  // ── TEMPO (inalterado) ────────────────────────────────────────────────────
  const lastDay = useMemo(()=>{
    let max=1;
    if(dataPanorama) dataPanorama.forEach(i=>i.diario.forEach(d=>{if(d.qtd>0&&d.dia>max)max=d.dia;}));
    else dataFat.forEach(i=>{if(i.dia>max)max=i.dia;});
    return max;
  },[dataPanorama,dataFat]);

  const bizDays = useMemo(()=>{
    const hoje = new Date();
    const diaHoje = hoje.getDate();
    const mm = String(hoje.getMonth()+1).padStart(2,'0');
    const yyyy = hoje.getFullYear();
    const ref = `01/${mm}/${yyyy}`;
    const FERIADOS = ['01/05/2026'];
    const isFeriado = (day) => FERIADOS.includes(`${String(day).padStart(2,'0')}/${mm}/${yyyy}`);
    let count=0,countUntil=0; const days=[];
    for(let i=1;i<=DAYS_IN_MONTH;i++){
      const isBiz=!isWeekend(i,ref)&&!isFeriado(i);
      if(isBiz){count++;if(i<=diaHoje)countUntil++;}
      days.push({dia:i,isBiz});
    }
    return {total:count,countUntilToday:countUntil,days};
  },[dataPanorama,dataFat,lastDay]);

  // ── PANORAMA (inalterado) ─────────────────────────────────────────────────
  const metaProp=useMemo(()=>Math.round((effectiveMetas.targetPcs/(bizDays.total||1))*bizDays.countUntilToday),[bizDays,effectiveMetas]);

  const sectorMetrics=useMemo(()=>{
    if(!dataPanorama) return [];
    const g=dataPanorama.reduce((acc,item)=>{
      const key=item.setorDesc;
      if(!acc[key]) acc[key]={name:key,total:0,sups:{},daysSet:new Set()};
      const tot=item.diario.filter(d=>d.dia<=lastDay).reduce((s,d)=>s+d.qtd,0);
      acc[key].total+=tot;
      if(!acc[key].sups[item.faccao]) acc[key].sups[item.faccao]=0;
      acc[key].sups[item.faccao]+=tot;
      item.diario.forEach(d=>{if(d.dia<=lastDay)acc[key].daysSet.add(d.dia);});
      return acc;
    },{});
    // Garantir que todos os setores permitidos apareçam, mesmo sem dados
    // Usar normalize() para mapear nomes do CSV para os nomes canônicos
    const normalizedMap={};
    Object.values(g).forEach(s=>{
      const match=ALLOWED_SECTORS_PANORAMA.find(a=>normalize(a)===normalize(s.name));
      if(match && match!==s.name){
        // Renomear para nome canônico
        if(!g[match]) g[match]={name:match,total:0,sups:{},daysSet:new Set()};
        g[match].total+=s.total;
        Object.entries(s.sups).forEach(([k,v])=>{g[match].sups[k]=(g[match].sups[k]||0)+v;});
        delete g[s.name];
      }
    });
    ALLOWED_SECTORS_PANORAMA.forEach(s=>{
      if(!g[s]) g[s]={name:s,total:0,sups:{},daysSet:new Set()};
    });
    return Object.values(g)
      .filter(s=>ALLOWED_SECTORS_PANORAMA.includes(s.name))
      .sort((a,b)=>SECTOR_ORDER_PRIORITY.indexOf(a.name)-SECTOR_ORDER_PRIORITY.indexOf(b.name))
      .map(s=>({...s,below:s.total<metaProp,suppliers:Object.entries(s.sups).sort((a,b)=>b[1]-a[1]),
        displayName:s.name==='INSPEÇÃO DE QUALIDADE'?'INSPEÇÃO':s.name}));
  },[dataPanorama,metaProp,lastDay]);

  const panFiltered=useMemo(()=>{
    if(!dataPanorama) return [];
    return dataPanorama.filter(i=>normalize(i.setorDesc)===normalize(sectorFilter))
      .map(item=>({...item,total:item.diario.filter(d=>d.dia<=lastDay).reduce((s,d)=>s+d.qtd,0)}));
  },[dataPanorama,sectorFilter,lastDay]);

  const timelineData=useMemo(()=>{
    const dm={};
    panFiltered.forEach(item=>item.diario.forEach(d=>{if(d.dia<=lastDay)dm[d.dia]=(dm[d.dia]||0)+d.qtd;}));
    let acc=0; const md=effectiveMetas.targetPcs/(bizDays.total||1);
    return bizDays.days.filter(d=>d.isBiz&&d.dia<=lastDay)
      .map((d,i)=>{acc+=(dm[d.dia]||0);return{dia:d.dia,total:dm[d.dia]||0,acumulado:acc,meta:Math.round(md*(i+1))};});
  },[panFiltered,bizDays,lastDay]);

  const totalPan =useMemo(()=>panFiltered.reduce((s,i)=>s+i.total,0),[panFiltered]);
  const totalExpedicao=useMemo(()=>{
    if(!dataPanorama) return 0;
    return dataPanorama.filter(i=>normalize(i.setorDesc)===normalize('EXPEDIÇÃO'))
      .reduce((s,i)=>s+i.diario.filter(d=>d.dia<=lastDay).reduce((a,d)=>a+d.qtd,0),0);
  },[dataPanorama,lastDay]);
  const mediaPan =useMemo(()=>totalPan/(bizDays.countUntilToday||1),[totalPan,bizDays]);
  const potencial=useMemo(()=>Math.round(mediaPan*(bizDays.total||22)),[mediaPan,bizDays]);

  // ── WIP (inalterado) ──────────────────────────────────────────────────────
  const getLtThreshold = (setor='', fornecedor='') => {
    const s = normalize(setor);
    const f = normalize(fornecedor);
    if(s.includes('MALHA COMPRADA'))                      return f.includes('DALILLA') ? 45 : 45;
    if(s.includes('TECELAGEM'))                           return 15;
    if(s.includes('TINTURARIA'))                          return 15;
    if(s.includes('LAVANDERIA'))                          return 10;
    if(s.includes('COSTURA') && !s.includes('CD') && !s.includes('FINALIZANDO')) return 7;
    if(s.includes('AGUARDANDO PARTES'))                   return 5;
    if(s.includes('AGUARDANDO AVIAMENTO'))                return 5;
    if(s.includes('PPCP'))                                return 3;
    if(s.includes('GRADE') || s.includes('MODELAGEM'))    return 3;
    if(s.includes('AGUARDANDO CORTE'))                    return 3;
    if(s.includes('SILK'))                                return 3;
    if(s.includes('ESTAMPARIA'))                          return 3;
    if(s.includes('FINALIZANDO COSTURA'))                 return 3;
    if(s.includes('CORTE'))                               return 3;
    if(s.includes('CASEADO') || s.includes('BOTAO'))      return 3;
    if(s.includes('EMBALAGEM'))                           return 3;
    if(s.includes('CD COSTURA'))                          return 2;
    if(s.includes('PREPARACAO'))                          return 2;
    if(s.includes('AGUARDANDO RETILINEA'))                return 2;
    if(s.includes('INSPECAO'))                            return 2;
    if(s.includes('EXPEDICAO'))                           return 2;
    return 5;
  };

  const wipOptions=useMemo(()=>{
    const canalOk = (i) => {
      const col = normalize(i.colecao||'');
      if(canalFiltro==='PL') return col==='PRIVATE LABEL';
      if(canalFiltro==='NEXT_ELEVEN') return col.includes('NEXT ELEVEN');
      if(canalFiltro==='SEEDER') return col!=='PRIVATE LABEL'&&!col.includes('NEXT ELEVEN');
      return true;
    };
    const opt=(key,cf)=>[...new Set(dataWip.filter(i=>canalOk(i)&&Object.keys(cf).every(fk=>{
      if(fk===key) return true;
      if(fk==='busca') return true;
      if(fk==='buscaOf') return true;
      if(fk==='entrega') return cf.entrega[0]==='TODOS'||cf.entrega.includes(i.entrega);

      if(cf[fk]==='TODOS') return true;
      if(fk==='somenteAtraso') return !cf.somenteAtraso||i.diasNoSetor>getLtThreshold(i.setor,i.fornecedor);
      if(fk==='somenteMostruario') return !cf.somenteMostruario||normalize(i.tipo).includes('MOSTRUARIO');
      if(fk==='fluxo') return cf.fluxo==='GERAL'||i.fluxo===cf.fluxo;
      return i[fk]===cf[fk];
    })).map(i=>i[key]))].sort();
    return {clientes:opt('cliente',wipFilters),setores:opt('setor',wipFilters),
      colecoes:opt('colecao',wipFilters),entregas:opt('entrega',wipFilters)};
  },[dataWip,wipFilters,canalFiltro]);


  const wipFiltered=useMemo(()=>dataWip.filter(i=>{
    const _col=normalize(i.colecao||'');
    if(canalFiltro==='PL'&&_col!=='PRIVATE LABEL') return false;
    if(canalFiltro==='NEXT_ELEVEN'&&!_col.includes('NEXT ELEVEN')) return false;
    if(canalFiltro==='SEEDER'&&(_col==='PRIVATE LABEL'||_col.includes('NEXT ELEVEN'))) return false;
    if(wipFilters.busca){
      const b=normalize(wipFilters.busca);
      const tokens=b.split(/\s+/).filter(Boolean);
      if(tokens.length>=2){
        // 2+ tokens: primeiro é ref, segundo é cor
        if(!normalize(i.ref).includes(tokens[0])&&!normalize(i.descricao).includes(tokens[0])) return false;
        if(!normalize(i.cor).includes(tokens[1])) return false;
      } else {
        const t=tokens[0]||'';
        if(!normalize(i.ref).includes(t)&&!normalize(i.descricao).includes(t)&&
           !normalize(i.cor).includes(t)&&!normalize(i.marca||'').includes(t)&&
           !normalize(i.colecao||'').includes(t)) return false;
      }
    }
    if(wipFilters.buscaOf){
      const b=normalize(wipFilters.buscaOf);
      if(!normalize(i.of||'').includes(b)) return false;
    }
    if(wipFilters.cliente!=='TODOS'&&i.cliente!==wipFilters.cliente) return false;
    if(wipFilters.setor!=='TODOS'&&i.setor!==wipFilters.setor) return false;
    if(wipFilters.colecao!=='TODOS'&&i.colecao!==wipFilters.colecao) return false;
    if(wipFilters.fluxo!=='GERAL'&&i.fluxo!==wipFilters.fluxo) return false;
    if(wipFilters.entrega[0]!=='TODOS'&&!wipFilters.entrega.includes(i.entrega)) return false;
    if(wipFilters.somenteAtraso&&i.diasNoSetor<=getLtThreshold(i.setor,i.fornecedor)) return false;
    if(wipFilters.somenteMostruario&&!normalize(i.tipo).includes('MOSTRUARIO')) return false;
    if(wipLtFilter==='ATRASO'&&!(i.diasNoSetor>getLtThreshold(i.setor,i.fornecedor)&&i.diasNoSetor<=getLtThreshold(i.setor,i.fornecedor)*1.2)) return false;
    if(wipLtFilter==='CRITICO'&&i.diasNoSetor<=getLtThreshold(i.setor,i.fornecedor)*1.2) return false;
    if(wipLtFilter==='EMDIA'&&i.diasNoSetor>getLtThreshold(i.setor,i.fornecedor)) return false;
    return true;
  }),
  [dataWip,wipFilters,canalFiltro,wipLtFilter]);

  const handleEntrega=(val,ctrl)=>{
    setWipFilters(prev=>{
      if(!ctrl) return {...prev,entrega:[val]};
      if(val==='TODOS') return {...prev,entrega:['TODOS']};
      let ne=prev.entrega.filter(x=>x!=='TODOS');
      if(ne.includes(val)){ne=ne.filter(x=>x!==val);if(!ne.length)ne=['TODOS'];}
      else ne.push(val);
      return {...prev,entrega:ne};
    });
  };

  // LT thresholds por setor/fornecedor
  const isLtAlert = (setor, fornecedor, dias) => dias > getLtThreshold(setor, fornecedor);

  const wipTree=useMemo(()=>{
    const t={};
    wipFiltered.forEach(i=>{
      if(!t[i.setor]) t[i.setor]={name:i.setor,qty:0,maxLt:0,maxOf:'',ofs:new Set(),sups:{}};
      t[i.setor].qty+=i.quantidade;
      t[i.setor].ofs.add(i.of);
      if(i.diasNoSetor>t[i.setor].maxLt){t[i.setor].maxLt=i.diasNoSetor;t[i.setor].maxOf=i.of;}
      if(!t[i.setor].sups[i.fornecedor]) t[i.setor].sups[i.fornecedor]={name:i.fornecedor,qty:0,maxLt:0,maxOf:'',ofs:new Set(),ig:{}};
      const s=t[i.setor].sups[i.fornecedor]; s.qty+=i.quantidade;
      s.ofs.add(i.of);
      if(i.diasNoSetor>s.maxLt){s.maxLt=i.diasNoSetor;s.maxOf=i.of;}
      const k=`${i.ref}-${i.of}-${i.cor}`;
      if(!s.ig[k])s.ig[k]={...i};else s.ig[k].quantidade+=i.quantidade;
    });
    return Object.values(t).sort((a,b)=>b.qty-a.qty)
      .map(s=>({...s,nOfs:s.ofs.size,suppliers:Object.values(s.sups).sort((a,b)=>b.qty-a.qty)
        .map(sup=>({...sup,nOfs:sup.ofs.size,items:Object.values(sup.ig).sort((a,b)=>b.diasNoSetor-a.diasNoSetor)}))}));
  },[wipFiltered]);

  // ── FATURAMENTO (inalterado) ───────────────────────────────────────────────
  const fatKpis=useMemo(()=>{
    if(!dataFat.length) return {val:0,qty:0,pl:{val:0,qty:0},sd:{val:0,qty:0},ne:{val:0,qty:0},
      accGoal:0,accPL:0,accSD:0,ating:0,atingPL:0,atingSD:0,atingNE:0,ticket:0,ticketPL:0,ticketSD:0,ticketNE:0};
    const ate=dataFat.filter(i=>i.dia<=lastDay);
    const tot=ate.filter(i=>fatFilters.colecao==='TODOS'||i.colecao===fatFilters.colecao)
      .reduce((a,i)=>({val:a.val+i.valorLiq,qty:a.qty+i.quantidade}),{val:0,qty:0});
    const pl=ate.filter(i=>i.canal==='PRIVATE LABEL'&&(fatFilters.colecao==='TODOS'||i.colecao===fatFilters.colecao))
      .reduce((a,i)=>({val:a.val+i.valorLiq,qty:a.qty+i.quantidade}),{val:0,qty:0});
    const sd=ate.filter(i=>i.canal==='SEEDER'&&(fatFilters.colecao==='TODOS'||i.colecao===fatFilters.colecao))
      .reduce((a,i)=>({val:a.val+i.valorLiq,qty:a.qty+i.quantidade}),{val:0,qty:0});
    const ne=ate.filter(i=>normalize(i.canal||'').includes('NEXT ELEVEN')&&(fatFilters.colecao==='TODOS'||i.colecao===fatFilters.colecao))
      .reduce((a,i)=>({val:a.val+i.valorLiq,qty:a.qty+i.quantidade}),{val:0,qty:0});
    const bd=bizDays.countUntilToday||1,bt=bizDays.total||1;
    const accGoal=(TOTAL_GOAL/bt)*bd,accPL=(GOAL_PRIVATE/bt)*bd,accSD=(GOAL_SEEDER/bt)*bd;
    return {val:tot.val,qty:tot.qty,pl,sd,ne,accGoal,accPL,accSD,
      ating:(tot.val/(TOTAL_GOAL||1))*100,atingPL:(pl.val/(GOAL_PRIVATE||1))*100,atingSD:(sd.val/(GOAL_SEEDER||1))*100,atingNE:0,
      ticket:tot.val/(tot.qty||1),ticketPL:pl.val/(pl.qty||1),ticketSD:sd.val/(sd.qty||1),ticketNE:ne.val/(ne.qty||1)};
  },[dataFat,fatFilters,bizDays,lastDay]);

  const buildFatChart=(canal)=>{
    if(!dataFat.length) return [];
    const target=canal==='PRIVATE LABEL'?GOAL_PRIVATE:canal==='SEEDER'?GOAL_SEEDER:TOTAL_GOAL;
    let cum=0;
    return bizDays.days.filter(d=>d.isBiz&&d.dia<=lastDay).map((d,i)=>{
      const dayItems=dataFat.filter(it=>(canal==='TODOS'||normalize(it.canal||'')=== normalize(canal)||it.canal===canal)&&it.dia===d.dia);
      const dv=dayItems.reduce((s,it)=>s+it.valorLiq,0);
      const dp=dayItems.reduce((s,it)=>s+it.quantidade,0);
      cum+=dv;
      return {dia:d.dia,realDia:dv,realDiaPcs:dp,realAcc:cum,metaAcc:(target/bizDays.total)*(i+1)};
    });
  };
  const chartPL=useMemo(()=>buildFatChart('PRIVATE LABEL'),[dataFat,bizDays,lastDay]);
  const chartSD=useMemo(()=>buildFatChart('SEEDER'),[dataFat,bizDays,lastDay]);
  const chartNE=useMemo(()=>buildFatChart('NEXT ELEVEN'),[dataFat,bizDays,lastDay]);

  const ranking=useMemo(()=>{
    const cl={};
    dataFat.filter(i=>i.dia<=lastDay
      &&(fatFilters.canal==='TODOS'||i.canal===fatFilters.canal)
      &&(fatFilters.colecao==='TODOS'||i.colecao===fatFilters.colecao))
      .forEach(i=>{
        if(!cl[i.cliente]) cl[i.cliente]={name:i.cliente,valor:0,qty:0,dtFatura:''};
        cl[i.cliente].valor+=i.valorLiq; cl[i.cliente].qty+=i.quantidade;
        // keep latest date
        if(!cl[i.cliente].dtFatura||i.data>cl[i.cliente].dtFatura) cl[i.cliente].dtFatura=i.data;
      });
    // sort by dtFatura desc (DD/MM/YYYY — compare as YYYYMMDD)
    const toSort=(d)=>{ if(!d) return ''; const p=d.split('/'); return p.length===3?`${p[2]}${p[1]}${p[0]}`:''; };
    return Object.values(cl).sort((a,b)=>toSort(b.dtFatura).localeCompare(toSort(a.dtFatura)));
  },[dataFat,fatFilters,lastDay]);

  // ── ESTOQUE ANALYTICS ─────────────────────────────────────────────────────
  const estoqueOptions = useMemo(()=>({
    marcas:   [...new Set(dataEstoque.map(i=>i.descMarca).filter(Boolean))].sort(),
    colecoes: [...new Set(dataEstoque.map(i=>i.descColecao).filter(Boolean))].sort(),
    grupos:   [...new Set(dataEstoque.map(i=>i.descGrupo).filter(Boolean))].sort(),
    qualidades:[...new Set(dataEstoque.map(i=>i.qualidade).filter(Boolean))].sort(),
  }),[dataEstoque]);

  const estoqueFiltered = useMemo(()=>{
    const cf=canalFiltro;
    return dataEstoque.filter(i=>{
    const col=normalize(i.descColecao||'');
    if(cf==='PL'&&col!=='PRIVATE LABEL') return false;
    if(cf==='NEXT_ELEVEN'&&!col.includes('NEXT ELEVEN')) return false;
    if(cf==='SEEDER'&&(col==='PRIVATE LABEL'||col.includes('NEXT ELEVEN'))) return false;
    if(estoqueFilters.marca.length>0&&!estoqueFilters.marca.includes(i.descMarca)) return false;
    if(estoqueFilters.colecao.length>0&&!estoqueFilters.colecao.includes(i.descColecao)) return false;
    if(estoqueFilters.grupo.length>0&&!estoqueFilters.grupo.includes(i.descGrupo)) return false;
    if(estoqueFilters.qualidade.length>0&&!estoqueFilters.qualidade.includes(i.qualidade)) return false;
    if(estoqueFilters.aging!=='TODOS'){
      if(estoqueFilters.aging==='0-15'&&i.dias>15) return false;
      if(estoqueFilters.aging==='16-30'&&(i.dias<16||i.dias>30)) return false;
      if(estoqueFilters.aging==='31-60'&&(i.dias<31||i.dias>60)) return false;
      if(estoqueFilters.aging==='60+'&&i.dias<=60) return false;
    }
    if(estoqueFilters.busca){
      const b=normalize(estoqueFilters.busca);
      if(!normalize(i.codigo).includes(b)&&!normalize(i.descricao).includes(b)&&!normalize(i.descor).includes(b)) return false;
    }
    return true;
  })},
  [dataEstoque,estoqueFilters,canalFiltro]);

  const estoqueKpis = useMemo(()=>{
    const vol = estoqueFiltered.reduce((s,i)=>s+i.qtde,0);
    const custo = estoqueFiltered.reduce((s,i)=>s+(i.qtde*i.custo),0);
    const giroLento = estoqueFiltered.filter(i=>i.dias>60).reduce((s,i)=>s+i.qtde,0);
    return {vol,custo,giroLento};
  },[estoqueFiltered]);

  const estoqueMixColecao = useMemo(()=>{
    const m={};
    estoqueFiltered.forEach(i=>{ if(!m[i.descColecao]) m[i.descColecao]=0; m[i.descColecao]+=i.qtde; });
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([name,value])=>({name,value}));
  },[estoqueFiltered]);

  const estoqueMixMarca = useMemo(()=>{
    const m={};
    estoqueFiltered.forEach(i=>{ if(!m[i.descMarca]) m[i.descMarca]=0; m[i.descMarca]+=i.qtde; });
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,value])=>({name,value}));
  },[estoqueFiltered]);

  const estoqueAgingCurve = useMemo(()=>[
    {bucket:'0-15 d',  qtde:estoqueFiltered.filter(i=>i.dias<=15).reduce((s,i)=>s+i.qtde,0)},
    {bucket:'16-30 d', qtde:estoqueFiltered.filter(i=>i.dias>15&&i.dias<=30).reduce((s,i)=>s+i.qtde,0)},
    {bucket:'31-60 d', qtde:estoqueFiltered.filter(i=>i.dias>30&&i.dias<=60).reduce((s,i)=>s+i.qtde,0)},
    {bucket:'+60 d',   qtde:estoqueFiltered.filter(i=>i.dias>60).reduce((s,i)=>s+i.qtde,0)},
  ],[estoqueFiltered]);

  // Group for detail table: by codigo
  const estoqueTree = useMemo(()=>{
    const t={};
    estoqueFiltered.forEach(i=>{
      const key=`${i.codigo}||${i.descMarca}`;
      if(!t[key]) t[key]={codigo:i.codigo,descricao:i.descricao,descMarca:i.descMarca,qtdeTotal:0,cores:[]};
      t[key].qtdeTotal+=i.qtde;
      t[key].cores.push(i);
    });
    return Object.values(t).sort((a,b)=>b.qtdeTotal-a.qtdeTotal);
  },[estoqueFiltered]);

  // ── COBERTURA ANALYTICS ───────────────────────────────────────────────────
  // Build stock index: {codigo_cor: {TAM: qty}}
  const estoqueIdx = useMemo(()=>{
    const idx={};
    dataEstoque.forEach(sku=>{
      const key=`${sku.codigo}||${sku.cor}`;
      if(!idx[key]) idx[key]={};
      Object.entries(sku.grade).forEach(([tam,qty])=>{
        idx[key][tam]=(idx[key][tam]||0)+qty;
      });
    });
    return idx;
  },[dataEstoque]);

  // Build WIP index: {ref||COR_NORMALIZADA: qty}
  // WIP stores cor_descor (nome da cor, ex: "NOTURNO") — comercial stores desccor (mesmo nome)
  // Chave: ref + normalize(nome_da_cor) → quantidade total
  const wipIdx = useMemo(()=>{
    const idx={};
    dataWip.forEach(item=>{
      const key=`${item.ref}||${normalize(item.cor)}`;
      if(!idx[key]) idx[key]=0;
      idx[key]+=item.quantidade;
    });
    return idx;
  },[dataWip]);

  // Chave: ref + normalize(nome_da_cor) → [{of, setor, quantidade}]
  const wipOpsIdx = useMemo(()=>{
    const idx={};
    dataWip.forEach(item=>{
      const key=`${item.ref}||${normalize(item.cor)}`;
      if(!idx[key]) idx[key]=[];
      // agrupa por OF+setor para não duplicar
      const existing=idx[key].find(x=>x.of===item.of&&x.setor===item.setor);
      if(existing) existing.quantidade+=item.quantidade;
      else idx[key].push({of:item.of, setor:item.setor, quantidade:item.quantidade});
    });
    return idx;
  },[dataWip]);

  // Filter commercial data
  const cobOptions = useMemo(()=>{
    const MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const toMesKey=(dt)=>{ if(!dt) return null; const p=dt.split('/'); return p.length>=3?`${p[1]}/${p[2]}`:null; };
    const toMesLabel=(key)=>{ if(!key) return key; const [m,y]=key.split('/'); return `${MESES[parseInt(m,10)-1]||m}/${y}`; };
    const keys=[...new Set(dataComercial.map(i=>toMesKey(i.entrega)).filter(Boolean))].sort();
    return {
      marcas: [...new Set(dataComercial.map(i=>i.marca).filter(Boolean))].sort(),
      reps:   [...new Set(dataComercial.map(i=>i.rep).filter(Boolean))].sort(),
      meses:  keys.map(k=>({key:k, label:toMesLabel(k)})),
      statuses: ['EM CARTEIRA','BLOQUEADO','LIBERADO FATURAMENTO'],
    };
  },[dataComercial]);

  // Normaliza descStatus para 3 categorias
  const normStatus = (s) => {
    const u = (s||'').toUpperCase().trim();
    if(u.includes('BLOQUEADO')) return 'BLOQUEADO';
    if(u.includes('LIBERADO')) return 'LIBERADO FATURAMENTO';
    return 'EM CARTEIRA';
  };

  const cobFiltered = useMemo(()=>dataComercial.filter(i=>{
    if(cobFilters.marca.length>0&&!cobFilters.marca.includes(i.marca)) return false;
    if(cobFilters.rep.length>0&&!cobFilters.rep.includes(i.rep)) return false;
    if(cobFilters.descStatus.length>0&&!cobFilters.descStatus.includes(normStatus(i.descStatus))) return false;
    if(cobFilters.mesEntrega.length>0){
      const p=i.entrega?i.entrega.split('/'):[]; const key=p.length>=3?`${p[1]}/${p[2]}`:'';
      if(!cobFilters.mesEntrega.includes(key)) return false;
    }
    if(cobFilters.busca){
      const tokens=normalize(cobFilters.busca).trim().split(/\s+/).filter(Boolean);
      if(tokens.length>=2){
        // dois tokens: primeiro deve bater na ref, segundo na cor (ou vice-versa)
        const t0=tokens[0], t1=tokens.slice(1).join(' ');
        const matchRefCor=(ref,cor)=>(normalize(ref).includes(t0)&&normalize(cor).includes(t1))||(normalize(ref).includes(t1)&&normalize(cor).includes(t0));
        // uma linha bate se o codigo+desccor satisfaz os dois tokens
        if(!matchRefCor(i.codigo,i.desccor)) return false;
      } else {
        const b=tokens[0];
        if(!normalize(i.numero).includes(b)&&!normalize(i.cliente).includes(b)&&!normalize(i.codigo).includes(b)) return false;
      }
    }
    return true;
  }),[dataComercial,cobFilters]);

  // Group by pedido → ref → cor → tamanho, cruzando com estoque e WIP
  // CONTA CORRENTE: estoque é consumido na ordem dos pedidos
  const cobTree = useMemo(()=>{
    const pedidos={};
    cobFiltered.forEach(item=>{
      const ped=item.numero;
      if(!pedidos[ped]) pedidos[ped]={
        numero:ped, cliente:item.cliente, rep:item.rep,
        descStatus:normStatus(item.descStatus||''),
        totalPedido:0, totalValor:0, refs:{},
      };
      const p=pedidos[ped];
      p.totalPedido+=item.qtde;
      p.totalValor+=item.qtde*item.preco;
      const refKey=item.codigo;
      if(!p.refs[refKey]) p.refs[refKey]={codigo:item.codigo, descricao:item.descricao, cores:{}};
      const ref=p.refs[refKey];
      if(!ref.cores[item.cor]) ref.cores[item.cor]={cor:item.cor, desccor:item.desccor, tams:{}};
      ref.cores[item.cor].tams[item.tam]=(ref.cores[item.cor].tams[item.tam]||0)+item.qtde;
    });

    // Cópia mutável do estoque para conta corrente: {codigo||cor: {tam: qtdeDisponivel}}
    const estoqueCC={};
    Object.entries(estoqueIdx).forEach(([k,grade])=>{
      estoqueCC[k]={};
      Object.entries(grade).forEach(([tam,qty])=>{ estoqueCC[k][tam]=qty; });
    });

    // Ordenar pedidos por MAIOR VALOR antes de consumir o estoque (conta corrente)
    const pedidosOrdenados=Object.values(pedidos).sort((a,b)=>b.totalValor-a.totalValor);

    return pedidosOrdenados.map(ped=>{
      let totalEstoque=0, totalFaturavel=0, totalProducao=0;
      const refs=Object.values(ped.refs).map(ref=>{
        const cores=Object.values(ref.cores).map(corObj=>{
          const estKey=`${ref.codigo}||${corObj.cor}`;
          const estGradeCC=estoqueCC[estKey]||{};
          const wipKey=`${ref.codigo}||${normalize(corObj.desccor)}`;
          const prodCor=wipIdx[wipKey]||0;
          const prodOps=wipOpsIdx[wipKey]||[];
          let pedCor=0,estCor=0,fatCor=0;
          const totalPedCor=Object.values(corObj.tams).reduce((s,v)=>s+v,0);
          const tams=Object.entries(corObj.tams).map(([tam,qtdePed])=>{
            const qtdeDisp=estGradeCC[tam]||0;
            const fatTam=Math.min(qtdePed,qtdeDisp);
            // debitar do estoque disponível (conta corrente)
            if(!estoqueCC[estKey]) estoqueCC[estKey]={};
            estoqueCC[estKey][tam]=Math.max(0,(estoqueCC[estKey][tam]||0)-fatTam);
            const qtdeProd=totalPedCor>0?Math.round(prodCor*(qtdePed/totalPedCor)):0;
            pedCor+=qtdePed; estCor+=qtdeDisp; fatCor+=fatTam;
            return {tam,qtdePed,qtdeEst:qtdeDisp,fatTam,qtdeProd};
          });
          const status = tams.every(t=>t.qtdeEst>=t.qtdePed) ? 'ATENDE'
            : tams.every(t=>(t.qtdeEst+t.qtdeProd)>=t.qtdePed) ? 'PRODUCAO'
            : 'RUPTURA';
          return {...corObj,tams,pedCor,estCor,fatCor,prodCor,prodOps,status};
        });
        const pedRef=cores.reduce((s,c)=>s+c.pedCor,0);
        const estRef=cores.reduce((s,c)=>s+c.estCor,0);
        const fatRef=cores.reduce((s,c)=>s+c.fatCor,0);
        const prodRef=cores.reduce((s,c)=>s+c.prodCor,0);
        totalEstoque+=estRef; totalFaturavel+=fatRef; totalProducao+=prodRef;
        return {...ref,cores,pedRef,estRef,fatRef,prodRef};
      });
      const pecasFaturaveisGradeCompleta=refs.reduce((s,ref)=>
        s+ref.cores.filter(c=>c.status==='ATENDE').reduce((s2,c)=>s2+c.fatCor,0),0);
      const valorFaturavel=(pecasFaturaveisGradeCompleta/Math.max(ped.totalPedido,1))*ped.totalValor;
      const statusPed=totalFaturavel===0?'RUPTURA':totalFaturavel>=ped.totalPedido?'ATENDE':'PRODUCAO';
      return {...ped,refs,totalEstoque,totalFaturavel,totalProducao,
        pecasFaturaveisGradeCompleta,valorFaturavel,statusPed};
    })
    .filter(ped=>!cobFilters.somenteFaturavel||(ped.statusPed!=='RUPTURA'))
    .sort((a,b)=>b.totalValor-a.totalValor);
  },[cobFiltered,estoqueIdx,wipIdx,cobFilters.somenteFaturavel]);

  const cobTreeFiltered = useMemo(()=>
    cobFilters.statusFilter==='TODOS' ? cobTree
    : cobTree.filter(p=>p.statusPed===cobFilters.statusFilter),
  [cobTree, cobFilters.statusFilter]);

  const cobKpis = useMemo(()=>{
    // cobTree já tem o filtro somenteFaturavel aplicado — todos os cards refletem a seleção
    const nPedidos=cobTree.length;
    const totalPecas=cobTree.reduce((s,p)=>s+p.totalPedido,0);
    const totalValorCarteira=cobTree.reduce((s,p)=>s+p.totalValor,0);
    const totalFat=cobTree.reduce((s,p)=>s+p.totalFaturavel,0);
    const valorFat=cobTree.reduce((s,p)=>s+p.valorFaturavel,0);
    const prodComprometida=cobTree.reduce((s,p)=>s+p.totalProducao,0);
    const pedAtende=cobTree.filter(p=>p.statusPed==='ATENDE').length;
    const pedParcial=cobTree.filter(p=>p.statusPed==='PARCIAL').length;
    const pedFalta=cobTree.filter(p=>p.statusPed==='FALTA').length;
    return {nPedidos,totalPecas,totalValorCarteira,totalFat,valorFat,prodComprometida,pedAtende,pedParcial,pedFalta};
  },[cobTree]);

  // ── VISÃO EXECUTIVA ──────────────────────────────────────────────────────────
  const execData = useMemo(()=>{
    if(!dataComercial.length) return null;

    // Filtrar por canal (mesma lógica da aba Faturamento/Cobertura)
    const comercialFiltrado = execCanal==='TODOS' ? dataComercial : dataComercial.filter(item=>{
      const canal = normalize(item.colecao||'').includes('private label') ? 'PRIVATE LABEL' : 'SEEDER';
      return canal === execCanal;
    });

    const hoje = new Date();
    const mesAtual = hoje.getMonth(); // 0-based
    const anoAtual = hoje.getFullYear();

    // Parser de data dd/mm/yyyy
    const parseDate = (str) => {
      if(!str) return null;
      const [d,m,y] = str.split('/').map(Number);
      return new Date(y, m-1, d);
    };

    // ── Carteira por mês de entrega ───────────────────────────────────────
    const carteiraByMes = {}; // "MM/YYYY" → {label, valor, pecas, pedidos:Set}
    const MESES_NOMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

    comercialFiltrado.forEach(item=>{
      const dt = parseDate(item.entrega);
      if(!dt) return;
      const key = `${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
      if(!carteiraByMes[key]) carteiraByMes[key]={
        key, label:`${MESES_NOMES[dt.getMonth()]} ${dt.getFullYear()}`,
        mes:dt.getMonth(), ano:dt.getFullYear(),
        valor:0, pecas:0, pedidos:new Set(), statusCount:{},
      };
      carteiraByMes[key].valor += item.qtde * item.preco;
      carteiraByMes[key].pecas += item.qtde;
      carteiraByMes[key].pedidos.add(item.numero);
      const st = item.descStatus||'EM CARTEIRA';
      carteiraByMes[key].statusCount[st]=(carteiraByMes[key].statusCount[st]||0)+item.qtde;
    });
    const carteiraArray = Object.values(carteiraByMes)
      .sort((a,b)=> a.ano!==b.ano ? a.ano-b.ano : a.mes-b.mes)
      .map(m=>{
        const dominant=Object.entries(m.statusCount).sort((a,b)=>b[1]-a[1])[0]?.[0]||'EM CARTEIRA';
        return {...m, pedidos:m.pedidos.size, statusDominante:dominant};
      });

    // ── Atrasos: entrega < hoje e status não Liberado Expedição/Faturado ──
    const atrasados = [];
    const pedAtr = {};
    dataComercial.forEach(item=>{
      const dt = parseDate(item.entrega);
      if(!dt) return;
      const status = (item.descStatus||'').toUpperCase();
      const isAtrasado = dt < hoje && status !== 'LIBERADO EXPEDICAO' && status !== 'LIBERADO EXPEDIÇÃO';
      if(!isAtrasado) return;
      if(!pedAtr[item.numero]) pedAtr[item.numero]={
        numero:item.numero, cliente:item.cliente, entrega:item.entrega,
        diasAtraso: Math.floor((hoje-dt)/(1000*60*60*24)),
        valor:0, pecas:0, descStatus:item.descStatus,
      };
      pedAtr[item.numero].valor += item.qtde*item.preco;
      pedAtr[item.numero].pecas += item.qtde;
    });
    const atrasadosArr = Object.values(pedAtr).sort((a,b)=>b.diasAtraso-a.diasAtraso);

    // ── Carteira por status ───────────────────────────────────────────────
    const byStatus = {};
    comercialFiltrado.forEach(item=>{
      const st = item.descStatus||'Sem status';
      if(!byStatus[st]) byStatus[st]={status:st, valor:0, pecas:0, pedidos:new Set()};
      byStatus[st].valor += item.qtde*item.preco;
      byStatus[st].pecas += item.qtde;
      byStatus[st].pedidos.add(item.numero);
    });
    const byStatusArr = Object.values(byStatus)
      .sort((a,b)=>b.valor-a.valor)
      .map(s=>({...s, pedidos:s.pedidos.size}));

    // ── Top clientes por valor ────────────────────────────────────────────
    const byCli = {};
    comercialFiltrado.forEach(item=>{
      if(!byCli[item.cliente]) byCli[item.cliente]={cliente:item.cliente, valor:0, pecas:0};
      byCli[item.cliente].valor += item.qtde*item.preco;
      byCli[item.cliente].pecas += item.qtde;
    });
    const topClientes = Object.values(byCli).sort((a,b)=>b.valor-a.valor).slice(0,10);

    // ── Faturamento atual (do dataFat) ────────────────────────────────────
    const fatRealizado = dataFat.filter(i=> execCanal==='TODOS' || (execCanal==='SEEDER'?!normalize(i.colecao||'').includes('private label'):normalize(i.colecao||'').includes('private label'))).reduce((s,i)=>s+(i.valorLiq||0),0);
    const fatMeta = TOTAL_GOAL;

    // ── Totais carteira ───────────────────────────────────────────────────
    const totalCarteira = comercialFiltrado.reduce((s,i)=>s+i.qtde*i.preco,0);
    const totalPecas    = comercialFiltrado.reduce((s,i)=>s+i.qtde,0);
    const totalPedidos  = new Set(comercialFiltrado.map(i=>i.numero)).size;
    const totalAtrasado = atrasadosArr.reduce((s,p)=>s+p.valor,0);
    const totalWipVal   = dataWip.reduce((s,i)=>s+i.quantidade,0);

    return {
      carteiraArray, atrasadosArr, byStatusArr, topClientes,
      fatRealizado, fatMeta, totalCarteira, totalPecas,
      totalPedidos, totalAtrasado, totalWipVal,
    };
  }, [dataComercial, dataFat, dataWip, execCanal, effectiveMetas]);

  // ── CHART HELPERS ─────────────────────────────────────────────────────────
  const xAxis=(dataKey='dia')=>(
    <XAxis dataKey={dataKey} axisLine={false} tickLine={false}
      tick={{fill:K.t2,fontSize:14,fontFamily:K.font,fontWeight:600}}/>
  );
  const yAxisHidden=<YAxis hide/>;
  const grid=<CartesianGrid strokeDasharray="3 3" stroke={K.border} vertical={false}/>;

  const handleUploadEstoque = (ev) => {
    const file=ev.target.files[0]; if(!file) return; setLoading(true);
    const r=new FileReader();
    r.onload=(e)=>{
      const lines=e.target.result.split(/\r?\n/);
      const rawHeaders=lines[0].split(';').map(h=>h.replace(/"/g,'').trim());
      const hIdx=(n)=>rawHeaders.indexOf(n);
      // build map: qtd number → column index (Qtd1→idx, Qtd2→idx, ...)
      const qtdMap={};
      rawHeaders.forEach((h,i)=>{ const m=h.match(/^Qtd(\d+)$/); if(m) qtdMap[parseInt(m[1])]=i; });
      // build map: tam number → column index
      const tamMap={};
      rawHeaders.forEach((h,i)=>{ const m=h.match(/^Tam(\d+)$/); if(m) tamMap[parseInt(m[1])]=i; });
      const result=lines.slice(1).map(line=>{
        if(!line.trim()) return null;
        const v=line.split(';').map(s=>s.replace(/"/g,'').trim());
        const c=(i)=>i!==-1&&i<v.length?v[i]:'';
        const qtde=parseBrazilianNumber(c(hIdx('qtde')));
        if(qtde<=0) return null;
        // build grade: { 'P':10, 'M':20, ... }
        const grade={};
        Object.keys(tamMap).forEach(n=>{
          const tam=c(tamMap[n]);
          const qty=parseBrazilianNumber(c(qtdMap[n]||(-1)));
          if(tam&&qty>0) grade[tam]=(grade[tam]||0)+qty;
        });
        return {
          codigo:c(hIdx('Codigo')), descricao:c(hIdx('descricao')),
          cor:c(hIdx('cor')), descor:c(hIdx('Descor')),
          marca:c(hIdx('Marca')), descMarca:c(hIdx('DescMarca')),
          colecao:c(hIdx('Col')), descColecao:c(hIdx('DescCol')),
          grupo:c(hIdx('Grupo')), descGrupo:c(hIdx('DescGrupo')),
          qualidade:c(hIdx('Qualidade')),
          dtEntrada:c(hIdx('Dt_Entrada')),
          dias:parseInt(c(hIdx('Dias')))||0,
          qtde, custo:parseBrazilianNumber(c(hIdx('Custo'))), grade,
        };
      }).filter(i=>i!==null);
      setDataEstoque(result); setLoading(false); persist('gestao:estoque',result);
    };
    r.readAsText(file,'ISO-8859-1');
  };

  const handleUploadComercial = (ev) => {
    const file=ev.target.files[0]; if(!file) return; setLoading(true);
    const r=new FileReader();
    r.onload=(e)=>{
      // O campo obs contém quebras de linha nuas (sem aspas) que quebram parsers CSV.
      // Solução: só processar linhas onde o primeiro campo é numérico (= número do pedido).
      const lines=e.target.result.split(/\r?\n/);
      const headers=lines[0].split(';').map(h=>h.replace(/"/g,'').trim());
      const hi=(n)=>headers.indexOf(n);
      const result=[];
      for(let li=1;li<lines.length;li++){
        const line=lines[li];
        if(!line.trim()) continue;
        // verificar se primeira coluna é numérica antes de parsear
        const firstSemi=line.indexOf(';');
        const firstVal=(firstSemi>-1?line.slice(0,firstSemi):line).replace(/"/g,'').trim();
        if(!firstVal||isNaN(firstVal)) continue;
        const v=line.split(';');
        const c=(n)=>{const i=hi(n);return i!==-1&&i<v.length?v[i].replace(/"/g,'').trim():'';};
        const qtde=parseBrazilianNumber(c('qtde'));
        if(qtde<=0) continue;
        result.push({
          n:firstVal, cc:c('codcli'),
          cl:c('fantasia')||c('nome'),
          rp:c('nome_1'),
          cd:c('codigo'), dc:c('desccor'), cr:c('cor'),
          t:c('tam').toUpperCase(),
          q:qtde, p:parseBrazilianNumber(c('preco')),
          co:c('colecao_ped'),
          m:c('marca'), e:c('entrega'),
          de:c('descricao'),
          ds:c('desc_status'),
        });
      }
      // Expandir chaves curtas para nomes completos
      const expand=r=>({
        numero:r.n, codcli:r.cc, cliente:r.cl, rep:r.rp,
        codigo:r.cd, desccor:r.dc, cor:r.cr, tam:r.t,
        qtde:r.q, preco:r.p, colecao:r.co, marca:r.m,
        entrega:r.e, descricao:r.de, descStatus:r.ds,
      });
      const resultFull=result.map(expand);
      setDataComercial(resultFull);
      setLoading(false);
      // Check payload size before persisting
      const payloadSize = JSON.stringify(result).length;
      if (payloadSize > 4_500_000) {
        console.warn('Cobertura payload too large:', Math.round(payloadSize/1024)+'KB - not persisted');
        alert(`Arquivo muito grande (${Math.round(payloadSize/1024)}KB). Os dados foram carregados mas não serão salvos entre sessões.`);
      } else {
        persist('gestao:cobertura', result);
      }
    };
    r.readAsText(file,'ISO-8859-1');
  };

  const handleUploadSop = (ev) => {
    const file = ev.target.files[0]; if (!file) return; setLoading(true);
    const r = new FileReader();
    r.onload = async (e) => {
      try {
        // Carregar SheetJS dinamicamente para ler xlsx
        if (!window.XLSX) {
          await new Promise((res, rej) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            s.onload = res; s.onerror = rej;
            document.head.appendChild(s);
          });
        }
        const XLSX = window.XLSX;
        const wb = XLSX.read(e.target.result, { type: 'array' });

        // ── Aba Demanda ──────────────────────────────────────────
        const wsDem = wb.Sheets['Demanda'];
        const demRaw = XLSX.utils.sheet_to_json(wsDem, { header: 1, defval: null });
        const meses = demRaw[0].slice(3).filter(Boolean); // Mai, Jun, ...
        const demLinhas = demRaw.slice(1).filter(r => r[0] && r[1]);

        // Agrupar demanda por canal+família por mês
        const demByCanal = {};
        const demByFamilia = {};
        const demByClienteFamilia = [];
        demLinhas.forEach(row => {
          const canal = String(row[0]||'').trim();
          const cliente = String(row[1]||'').trim();
          const familia = String(row[2]||'').trim();
          const qtdes = meses.map((_,i) => Number(row[3+i])||0);
          demByClienteFamilia.push({ canal, cliente, familia, qtdes });
          if (!demByCanal[canal]) demByCanal[canal] = meses.map(()=>0);
          qtdes.forEach((q,i) => demByCanal[canal][i] += q);
          if (!demByFamilia[familia]) demByFamilia[familia] = meses.map(()=>0);
          qtdes.forEach((q,i) => demByFamilia[familia][i] += q);
        });
        const totalDemanda = meses.map((_,i) => Object.values(demByCanal).reduce((s,arr)=>s+arr[i],0));

        // ── Aba Capacidade ───────────────────────────────────────
        // Header: Costura, Familia, Operadores, TP, Eficiencia, [meses...]
        const wsCap = wb.Sheets['Capacidade'];
        const capRaw = XLSX.utils.sheet_to_json(wsCap, { header: 1, defval: null });
        const capHeaders = (capRaw[0] || []).slice(5); // meses da capacidade: Abr, Mai, ...
        const capLinhas = capRaw.slice(1).filter(r => r[0]);

        // Alinhar colunas de capacidade com os meses da demanda
        const capMesOffset = capHeaders.findIndex(h => h === meses[0]);
        const safeCapOff = capMesOffset >= 0 ? capMesOffset : 0;

        const totalCapacidade = meses.map((_,i) =>
          capLinhas.reduce((s,r) => s+(Number(r[5+safeCapOff+i])||0), 0));
        const capByFamilia = {};
        capLinhas.forEach(row => {
          const familia = String(row[1]||'').trim();
          if (!capByFamilia[familia]) capByFamilia[familia] = meses.map(()=>0);
          meses.forEach((_,i) => capByFamilia[familia][i] += Number(row[5+safeCapOff+i])||0);
        });
        const costureiros = capLinhas.map(row => ({
          nome: String(row[0]||'').trim(),
          familia: String(row[1]||'').trim(),
          operadores: Number(row[2])||0,
          tp: Number(row[3])||0,
          eficiencia: Number(row[4])||0,
          capacidade: meses.map((_,i) => Number(row[5+safeCapOff+i])||0),
        }));

        // ── Aba Parametros (TP por família) ─────────────────────
        const wsPar = wb.Sheets['Parametros'];
        const parRaw = wsPar ? XLSX.utils.sheet_to_json(wsPar, { header: 1, defval: null }) : [];
        const parametros = {};
        parRaw.slice(1).forEach(r => { if (r[0]) parametros[String(r[0]).trim()] = Number(r[1])||0; });

        const result = {
          meses,
          totalDemanda,
          totalCapacidade,
          demByCanal,
          demByFamilia,
          demByClienteFamilia,
          capByFamilia,
          costureiros,
          parametros,
          paramMetas: {},
        };
        setDataSop(result);
        setLoading(false);
        persist('gestao:sop', result);
      } catch(err) {
        console.warn('SOP parse error:', err);
        setLoading(false);
      }
    };
    r.readAsArrayBuffer(file);
  };

  // ── UPLOAD EM LOTE ───────────────────────────────────────────────────────────
  const handleUploadCarteiraPL = (ev) => {
    const file = ev.target.files[0]; if (!file) return; setLoading(true);
    const r = new FileReader();
    r.onload = (e) => {
      try {
        const txt = e.target.result;
        const rows = []; let row = []; let field = ''; let inQ = false;
        for (let i = 0; i < txt.length; i++) {
          const c = txt[i];
          if (c === '"') {
            if (inQ && txt[i+1] === '"') { field += '"'; i++; } else { inQ = !inQ; }
          } else if (c === ';' && !inQ) {
            row.push(field); field = '';
          } else if (c === '\n' && !inQ) {
            row.push(field); rows.push(row); row = []; field = '';
          } else if (c !== '\r') {
            field += c;
          }
        }
        if (field || row.length) { row.push(field); rows.push(row); }
        const hdrs = rows[0].map(h => h.toLowerCase().trim());
        const fi = (n) => hdrs.indexOf(n.toLowerCase());
        const iNum=fi('número')||fi('numero'), iCli=fi('desc_grupocli'), iNome=fi('nome');
        const iQP=fi('qtde_p'), iQF=fi('qtde_f'), iVal=fi('valor pend. ped.')||fi('valorpendente');
        const iSt=fi('desc_status'), iPer=fi('desc_periodo'), iEnt=fi('dt_entrega_orig')||fi('entrega');
        const iDtFat=fi('dt_fatura'), iValBru=fi('valor liq. ped.')||fi('valor_bruto');
        const pn = (v) => { const s = String(v||'').trim().replace(/\./g,'').replace(',','.'); return parseFloat(s)||0; };
        const result = [];
        for (let i = 1; i < rows.length; i++) {
          const v = rows[i];
          if (!v || v.length < 30) continue;
          const g = (j) => (v[j]||'').trim();
          const qtdeP = pn(g(iQP));
          if (qtdeP <= 0) continue;
          result.push({ numero:g(iNum), cliente:g(iCli)||g(iNome), qtdeP,
            qtdeF:pn(g(iQF)), valor:pn(g(iVal)), valorBruto:pn(g(iValBru)),
            dtFatura:g(iDtFat), status:g(iSt), periodo:g(iPer), entrega:g(iEnt) });
        }
        setDataCarteiraPL(result);
        setLoading(false);
        persist('gestao:carteiraPL', result);
      } catch(err) { console.warn('CarteiraPL parse error:', err); setLoading(false); }
    };
    r.readAsText(file, 'iso-8859-1');
  };
  const handleUploadCarteiraNE = (ev) => {
    const file = ev.target.files[0]; if(!file) return; setLoading(true);
    const r = new FileReader();
    r.onload = (e) => {
      try {
        const raw = e.target.result;
        const rows = raw.split(/\r?\n/);
        const headers = rows[0].split(';').map(h=>h.replace(/"/g,'').trim());
        const hi = (n) => headers.findIndex(h=>h.toLowerCase()===n.toLowerCase());
        const iNum=hi('Número'); const iNome=hi('Fantasia Cli.'); const iNome2=hi('Nome');
        const iQtd=hi('Qtde_P'); const iVal=hi('Valor Pend. Ped.'); const iPer=hi('Periodo');
        const iDtF=hi('Dt_Fatura'); const iSt=hi('Desc_Status');
        const MESES=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
        const result=[];
        for(let i=1;i<rows.length;i++){
          const row=rows[i]; if(!row.trim()) continue;
          const v=row.split(';');
          const g=(idx)=>idx>=0&&idx<v.length?v[idx].replace(/"/g,'').trim():'';
          const qtde=parseFloat(g(iQtd).replace(',','.'))||0;
          const valor=parseFloat(g(iVal).replace(',','.'))||0;
          if(qtde<=0) continue;
          const per=g(iPer)||'';
          // Convert YYWW to month: week to month approximation
          const yyww=parseInt(per)||0;
          const yy=Math.floor(yyww/100); const ww=yyww%100;
          const ano=yy<100?2000+yy:yy;
          const mes=Math.min(11,Math.floor((ww-1)*12/52));
          result.push({
            numero:g(iNum), cliente:g(iNome)||g(iNome2),
            qtde, valor, periodo:per,
            dtFatura:g(iDtF), status:g(iSt),
            ano, mes, mesLabel:MESES[mes]
          });
        }
        setDataCarteiraNE(result);
        setLoading(false);
        persist('gestao:carteiraNE', result);
      } catch(err) { console.warn('CarteiraNE parse error:', err); setLoading(false); }
    };
    r.readAsText(file, 'iso-8859-1');
  };

  const handleUploadIndatex = (ev) => {
    const file = ev.target.files[0]; if(!file) return; setLoading(true);
    const r = new FileReader();
    r.onload = async (e) => {
      try {
        if(!window.XLSX){
          await new Promise((res,rej)=>{
            const s=document.createElement('script');
            s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            s.onload=res; s.onerror=rej;
            document.head.appendChild(s);
          });
        }
        const XLSX2 = window.XLSX;
        const wb = XLSX2.read(e.target.result, {type:'array', cellDates:false});
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX2.utils.sheet_to_json(ws, {header:1, defval:null, raw:true});
        const hdrs = (rows[0]||[]).map(h=>String(h||'').trim().toLowerCase());
        const fi = n => hdrs.findIndex(h=>h.includes(n.toLowerCase()));
        const iCli=fi('cliente'), iCod=fi('código'), iDesc=fi('descrição');
        const iQtde=fi('quantidade'), iEnt=fi('entrega confirmada');
        const iFat=fi('faturamento'), iTipo=fi('tipo'), iVPeca=fi('valor peça');
        const pn = v => parseFloat(String(v||'').trim()) || 0;
        const MESES=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
        const parseDt = (v) => {
          if(!v) return null;
          // Excel serial number (e.g. 46172)
          if(typeof v === 'number'){
            const dt = new Date(Math.round((v - 25569) * 86400 * 1000));
            return isNaN(dt)?null:dt;
          }
          const s = String(v).trim();
          let dt = new Date(s);
          if(isNaN(dt)){ const p=s.split('/'); if(p.length===3) dt=new Date(parseInt(p[2]),parseInt(p[0])-1,parseInt(p[1])); }
          return isNaN(dt)?null:dt;
        };
        const result = [];
        for(let i=1;i<rows.length;i++){
          const v=rows[i]; if(!v||!v[iCli]) continue;
          const g=j=>j>=0&&j<v.length?String(v[j]||'').trim():'';
          const dt = parseDt(v[iEnt]);
          const mes    = dt ? `${MESES[dt.getMonth()]}/${String(dt.getFullYear()).slice(-2)}` : '';
          const mesSort= dt ? `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}` : '';
          result.push({
            cliente:g(iCli).trim(), codigo:g(iCod), descricao:g(iDesc),
            qtde:pn(g(iQtde)), fat:pn(g(iFat)), vPeca:pn(g(iVPeca)),
            tipo:g(iTipo).toUpperCase(), mes, mesSort,
          });
        }
        setDataIndatex(result);
        setLoading(false);
        storageSet('gestao:indatex','').then(()=>persist('gestao:indatex', result)).catch(()=>persist('gestao:indatex', result));
      } catch(err){ console.warn('Indatex parse error:',err); setLoading(false); }
    };
    r.readAsArrayBuffer(file);
  };

  const handleUploadAcompanhamento = (ev) => {
    const file = ev.target.files[0]; if(!file) return; setLoading(true);
    const r = new FileReader();
    r.onload = async (e) => {
      try {
        if(!window.XLSX){
          await new Promise((res,rej)=>{
            const s=document.createElement('script');
            s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            s.onload=res; s.onerror=rej; document.head.appendChild(s);
          });
        }
        const XLSX2=window.XLSX;
        const wb=XLSX2.read(e.target.result,{type:'array',cellDates:false});
        const wsName = wb.SheetNames.find(n=>n.toLowerCase().includes('acompanhameto')||n.toLowerCase().includes('acompanhamento entrada')) || wb.SheetNames[0];
        const ws=wb.Sheets[wsName];
        const rows=XLSX2.utils.sheet_to_json(ws,{header:1,defval:null,raw:true});
        const hdrs=(rows[0]||[]).map(h=>String(h||'').trim().toLowerCase());
        const fi=n=>hdrs.findIndex(h=>h.includes(n.toLowerCase()));
        const iVal=fi('valor total'); const iDt=fi('data cliente'); const iPcp=fi('posi');
        const MESES=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
        const parseDt = (v) => {
          if(!v) return null;
          // Serial number (Excel raw:true)
          if(typeof v==='number' && v>40000 && v<60000) {
            const d=new Date(Math.round((v-25569)*86400*1000));
            return isNaN(d)?null:d;
          }
          const s=String(v).trim();
          const p=s.split(/[\/\-\.]/);
          if(p.length===3){
            const a=parseInt(p[0]),b=parseInt(p[1]),c=parseInt(p[2]);
            // dd/mm/yy or dd/mm/yyyy (dia <= 31, mes <= 12)
            if(a<=31 && b<=12){
              const y=c<100?2000+c:c;
              const d=new Date(y,b-1,a);
              if(!isNaN(d)) return d;
            }
            // yyyy-mm-dd
            if(a>1000){
              const d=new Date(a,b-1,c);
              if(!isNaN(d)) return d;
            }
          }
          const d=new Date(s); return isNaN(d)?null:d;
        };
        const mesMap={};
        for(let i=1;i<rows.length;i++){
          const v=rows[i]; if(!v) continue;
          const pcp=String(v[iPcp]||'').trim().toUpperCase();
          if(pcp==='FATURADO') continue;
          const val=parseFloat(String(v[iVal]||'').replace(',','.')) || 0;
          const dt=parseDt(v[iDt]);
          if(!dt||!val) continue;
          const mes=`${MESES[dt.getMonth()]}/${String(dt.getFullYear()).slice(-2)}`;
          const mesSort=`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
          if(!mesMap[mesSort]) mesMap[mesSort]={mes,mesSort,valor:0};
          mesMap[mesSort].valor+=val;
        }
        const result=Object.values(mesMap).sort((a,b)=>a.mesSort.localeCompare(b.mesSort));
        console.log('Acompanhamento parsed:', result.length, 'meses', result);
        setDataCarteiraPLTeste(result);
        setLoading(false);
        persist('gestao:carteiraPLTeste', result);
      } catch(err){ console.warn('Acompanhamento parse error:',err); setLoading(false); }
    };
    r.readAsArrayBuffer(file);
  };

  const handleUploadBatch = (ev) => {
    const files = Array.from(ev.target.files);
    if (!files.length) return;

    // Detectar qual handler usar pelo nome do arquivo (case-insensitive)
    const detectHandler = (name) => {
      const n = name.toLowerCase();
      if (n.includes('wip'))                          return handleUploadWip;
      if (n.includes('fat') || n.includes('fatur'))   return handleUploadFat;
      if (n.includes('estoque') || n.includes('produto')) return handleUploadEstoque;
      if (n.includes('comercial') || n.includes('cobertura')) return handleUploadComercial;
      if (n.includes('panorama'))                     return handleUploadPanorama;
      if (n.includes('sop') || n.includes('s_op') || n.includes('s&op')) return handleUploadSop;
      if (n.includes('carteira_ne') || n.includes('carteirane'))              return handleUploadCarteiraNE;
      if (n.includes('carteira') || n.includes('carteira_pl'))                return handleUploadCarteiraPL;
      if (n.includes('pedidos_a_produzir') || n.includes('acompanhameto') || n.includes('acompanhamento')) return handleUploadAcompanhamento;
      if (n.includes('indatex') || n.includes('petersen'))              return handleUploadIndatex;
      return null;
    };

    let processed = 0;
    const total = files.filter(f => detectHandler(f.name)).length;
    if (!total) return;
    setLoading(true);
    files.forEach(file => {
      const handler = detectHandler(file.name);
      if (!handler) return;
      const syntheticEv = { target: { files: [file] } };
      setTimeout(() => {
        handler(syntheticEv);
        processed++;
        if (processed === total) setLoading(false);
      }, processed * 150);
    });
  };

  const uploadHandler=activeDash==='PANORAMA'?handleUploadPanorama
    :activeDash==='WIP'?handleUploadWip
    :activeDash==='FATURAMENTO'?handleUploadFat
    :activeDash==='COBERTURA'?handleUploadComercial
    :activeDash==='SOP'?handleUploadSop
    :activeDash==='INDATEX'?handleUploadIndatex
    :activeDash==='EXECPLTESTE'?handleUploadAcompanhamento
    :activeDash==='EXECNE'?handleUploadCarteiraNE
    :handleUploadEstoque;

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{display:'flex',height:'100vh',background:K.bg0,
      fontFamily:K.font,color:K.t0,overflow:'hidden',userSelect:'none'}}>

      {/* ── TELA DE INICIALIZAÇÃO ── */}
      {storageLoading && (
        <div style={{position:'fixed',inset:0,background:K.bg0,zIndex:200,
          display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16}}>
          <div style={{width:40,height:40,background:`${K.blue}22`,borderRadius:12,
            display:'flex',alignItems:'center',justifyContent:'center'}}>
            <ShieldCheck size={22} color={K.blue}/>
          </div>
          <div style={{width:32,height:32,border:`2px solid ${K.border2}`,
            borderTop:`2px solid ${K.teal}`,borderRadius:'50%',
            animation:'spin 0.8s linear infinite'}}/>
          <span style={{fontSize:14,color:K.t2,letterSpacing:'0.06em'}}>Restaurando sessão anterior…</span>
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <aside style={{width:214,background:K.bg0,display:'flex',flexDirection:'column',
        borderRight:`1px solid ${K.border}`,flexShrink:0,zIndex:20}}>

        {/* Brand — logo Texneo */}
        <div style={{padding:'20px 18px 15px',borderBottom:`1px solid ${K.border}`,
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg viewBox="0 0 200 44" width="156" height="38" xmlns="http://www.w3.org/2000/svg"
            style={{display:'block'}}>
            <defs>
              <style>{"@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700&display=swap');"}</style>
            </defs>
            <text
              x="100" y="36"
              textAnchor="middle"
              fontFamily="'Nunito', 'Helvetica Neue', Arial, sans-serif"
              fontSize="36"
              fontWeight="700"
              letterSpacing="-0.5"
              fill="#1B3A6B"
            >Texneo +</text>
          </svg>
        </div>

        <nav style={{flex:1,padding:'12px 0',display:'flex',flexDirection:'column',gap:2}}>
          <NavBtn id="PANORAMA"    icon={LayoutDashboard} active={activeDash==='PANORAMA'}    onClick={setActiveDash} label="Panorama"/>
          <NavBtn id="WIP"         icon={Package}         active={activeDash==='WIP'}         onClick={setActiveDash} label="WIP"/>
          <NavBtn id="FATURAMENTO" icon={DollarSign}      active={activeDash==='FATURAMENTO'} onClick={setActiveDash} label="Faturamento"/>
          <NavBtn id="ESTOQUE"     icon={Warehouse}       active={activeDash==='ESTOQUE'}     onClick={setActiveDash} label="Estoque"/>
          <NavBtn id="COBERTURA"   icon={GitMerge}        active={activeDash==='COBERTURA'}   onClick={setActiveDash} label="Cobertura"/>
          <NavBtn id="SOP"         icon={BarChart2}       active={activeDash==='SOP'}         onClick={setActiveDash} label="S&OP"/>
          <NavBtn id="EXECPLTESTE"  icon={Factory}        active={activeDash==='EXECPLTESTE'}  onClick={setActiveDash} label="PL"/>
          <NavBtn id="EXECSD"       icon={Factory}        active={activeDash==='EXECSD'}       onClick={setActiveDash} label="Seeder"/>
          <NavBtn id="EXECNE"       icon={Factory}        active={activeDash==='EXECNE'}       onClick={setActiveDash} label="Next Eleven"/>
          <NavBtn id="INDATEX"     icon={TrendingUp}     active={activeDash==='INDATEX'}     onClick={setActiveDash} label="Petersen"/>
        </nav>

        {/* Rodapé upload + status */}
        <div style={{borderTop:`1px solid ${K.border}`,padding:'16px 16px 20px',
          display:'flex',flexDirection:'column',gap:10}}>
          {/* Upload em lote */}
          <label style={{cursor:'pointer',display:'flex',alignItems:'center',gap:10,
            padding:'10px 14px',borderRadius:9,
            background:`${K.green}18`,border:`1px solid ${K.green}45`,color:K.green}}>
            <FileUp size={16}/>
            <span style={{fontSize:14,fontWeight:600}}>Carregar Tudo</span>
            <input type="file" multiple onChange={handleUploadBatch} style={{display:'none'}}/>
          </label>
          {/* Upload individual da aba ativa */}
          <label style={{cursor:'pointer',display:'flex',alignItems:'center',gap:10,
            padding:'8px 14px',borderRadius:9,
            background:`${K.blue}12`,border:`1px solid ${K.blue}30`,color:K.t2}}>
            <FileUp size={14}/>
            <span style={{fontSize:14,fontWeight:500}}>Aba atual</span>
            <input type="file" onChange={uploadHandler} style={{display:'none'}}/>
          </label>

          {/* Card gravado */}
          <div style={{background:K.bg3,border:`1px solid ${K.green}35`,borderRadius:9,
            padding:'10px 12px',display:'flex',flexDirection:'column',gap:6}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:14,color:K.t2,textTransform:'uppercase',
                letterSpacing:'0.08em',fontWeight:700}}>Bases salvas</span>
              <div style={{display:'flex',gap:5}}>
                {[{key:'panorama',label:'P'},{key:'wip',label:'W'},{key:'fat',label:'F'},{key:'estoque',label:'E'},{key:'cobertura',label:'C'},{key:'sop',label:'S'}].map(({key,label})=>(
                  <span key={key} title={`${label}: ${lastUpdated[key]||'sem dados'}`}
                    style={{width:7,height:7,borderRadius:'50%',
                      background:lastUpdated[key]?K.green:K.border2}}/>
                ))}
              </div>
            </div>
            {saveStatus==='saving' && (
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{width:6,height:6,border:`1.5px solid ${K.amber}`,borderRadius:'50%',
                  borderTopColor:'transparent',animation:'spin 0.6s linear infinite'}}/>
                <span style={{fontSize:14,color:K.amber}}>Salvando…</span>
              </div>
            )}
            {saveStatus==='saved' && (
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{width:6,height:6,background:K.green,borderRadius:'50%'}}/>
                <span style={{fontSize:14,color:K.green}}>Salvo na nuvem</span>
              </div>
            )}
            {saveStatus==='error' && (
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{width:6,height:6,background:K.red,borderRadius:'50%'}}/>
                <span style={{fontSize:14,color:K.red}}>Erro ao salvar</span>
              </div>
            )}
            {!saveStatus && (
              <span style={{fontSize:14,color:K.t2}}>
                {Object.values(lastUpdated).filter(Boolean).length} / 8 módulos
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'hidden'}}>

        {/* Topbar */}

        {/* Content */}
        <main style={{flex:1,padding:20,overflow:'hidden',display:'flex',flexDirection:'column',
          gap:16,position:'relative'}}>

          {/* Loading overlay */}
          {loading && (
            <div style={{position:'absolute',inset:0,background:'rgba(8,13,24,0.85)',
              zIndex:100,display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',gap:14}}>
              <div style={{width:32,height:32,border:`2px solid ${K.border2}`,
                borderTop:`2px solid ${K.teal}`,borderRadius:'50%',
                animation:'spin 0.8s linear infinite'}}/>
              <span style={{fontSize:14,color:K.blue,fontWeight:600,letterSpacing:'0.06em'}}>Processando…</span>
            </div>
          )}

          {/* ═══════════════════════════════ PANORAMA ═══════════════════════════════ */}
          {activeDash==='PANORAMA' && (
            <div style={{flex:1,display:'flex',flexDirection:'column',gap:16,overflow:'hidden'}}>

              {/* Tab bar */}
              <div style={{display:'flex',alignItems:'center',
                borderBottom:`1px solid ${K.border}`,flexShrink:0,gap:4}}>
                <Tab active={tabPanorama==='analise'} onClick={()=>setTabPanorama('analise')}>Dashboard</Tab>
                <Tab active={tabPanorama==='detalhes'} onClick={()=>setTabPanorama('detalhes')}>Detalhamento</Tab>
              </div>

              {!dataPanorama ? (
                <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',
                  justifyContent:'center',gap:14,color:K.t2}}>
                  <Activity size={40} color={K.t2}/>
                  <span style={{fontSize:14,color:K.t2}}>Aguardando base de dados</span>
                </div>
              ) : (
                <div style={{flex:1,display:'flex',flexDirection:'column',gap:16,overflow:'hidden'}}>

                  {/* KPIs */}
                  <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,flexShrink:0}}>
                    <KpiCard label="Realizado" icon={Activity}
                      value={totalPan.toLocaleString('pt-BR')}
                      sub={`Média: ${Math.round(mediaPan).toLocaleString()}/dia`}/>
                    <KpiCard label="Meta Proporcional" icon={TrendingUp}
                      value={metaProp.toLocaleString('pt-BR')}
                      sub={`${bizDays.countUntilToday}/${bizDays.total} dias úteis`}/>
                    <KpiCard label="Meta Mensal" icon={Target}
                      value={MONTHLY_TARGET_PCS.toLocaleString('pt-BR')}
                      sub={`Dia: ${Math.round(MONTHLY_TARGET_PCS/(bizDays.total||1)).toLocaleString()}`}
                      accent/>
                    <KpiCard label="Atingimento" icon={TrendingUp}
                      value={`${((totalExpedicao/(MONTHLY_TARGET_PCS||1))*100).toFixed(1)}%`}
                      />
                    <KpiCard label="Potencial" icon={Target}
                      value={potencial.toLocaleString('pt-BR')}
                      sub="Projeção ao final do mês"/>
                  </div>

                  {tabPanorama==='analise' ? (
                    <div style={{flex:1,minHeight:0}}>
                      <Panel title="Desempenho dos Setores" style={{height:'100%'}}>
                        <div style={{flex:1,padding:'12px 8px 8px',minHeight:0}}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sectorMetrics}
                              margin={{top:24,right:16,left:16,bottom:8}}
                              barCategoryGap="15%">
                              {grid}
                              <XAxis dataKey="displayName" axisLine={false} tickLine={false}
                                tick={{fill:K.t1,fontSize:14,fontFamily:K.font,fontWeight:600}}
                                interval={0}/>
                              <YAxis hide/>
                              <Tooltip content={<DarkTooltip cursor={false}/>} cursor={false}/>
                              <Bar dataKey="total" radius={[4,4,0,0]} barSize={72} minPointSize={4} activeBar={false}>
                                {sectorMetrics.map((e,i)=>(
                                  <Cell key={i} fill={K.tealD}
                                    stroke={K.teal} strokeWidth={1.5}/>
                                ))}
                                <LabelList dataKey="total" position="top"
                                  content={(props)=>{
                                    const {x,y,width,value}=props;
                                    return <text x={x+width/2} y={y-6} textAnchor="middle"
                                      fill={K.t0} fontSize={14} fontFamily={K.font} fontWeight={400}>
                                      {(value||0).toLocaleString('pt-BR')}
                                    </text>;
                                  }}/>
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Panel>
                    </div>

                  ) : (
                    <div style={{flex:1,display:'flex',flexDirection:'column',gap:12,overflow:'hidden'}}>
                      {/* Sector pills */}
                      <div style={{display:'flex',gap:6,flexShrink:0}}>
                        {ALLOWED_SECTORS_PANORAMA.map(s=>(
                          <Pill key={s} active={sectorFilter===s} onClick={()=>setSectorFilter(s)}
                            style={{flex:1,textAlign:'center',justifyContent:'center'}}>{s}</Pill>
                        ))}
                      </div>

                      <div style={{flex:1,display:'grid',gridTemplateColumns:'2fr 1fr',gap:14,minHeight:0}}>
                        <Panel title="Realizado Diário">
                          <div style={{flex:1,padding:'8px',minHeight:0}}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={timelineData} margin={{top:20,right:8,left:8,bottom:0}}>
                                {grid}{xAxis()}{yAxisHidden}
                                <Tooltip content={<DarkTooltip/>} cursor={false}/>
                                <Bar dataKey="total" fill={K.tealD} stroke={K.teal}
                                  strokeWidth={1.5} radius={[4,4,0,0]} >
                                  <LabelList dataKey="total" position="top"
                                    fill={K.t1} style={{fontSize:14,fontWeight:400}}
                                    formatter={v=>v>0?v.toLocaleString('pt-BR'):''}/>
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </Panel>

                        <Panel title="Curva Acumulada vs Meta">
                          <div style={{flex:1,padding:'8px',minHeight:0}}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={timelineData} margin={{top:8,right:55,left:8,bottom:0}}>
                                {grid}{xAxis()}{yAxisHidden}
                                <Tooltip content={<DarkTooltip/>} cursor={false}/>
                                <Line type="monotone" dataKey="meta" stroke="#4A7BAA"
                                  strokeDasharray="4 4" dot={false} strokeWidth={1.5}
                                  label={(props)=>{
                                    const {x,y,index,value}=props;
                                    if(index!==timelineData.length-1||!value) return null;
                                    return <text key="meta-lbl" x={x+8} y={y+4} fill="#4A7BAA" fontSize={14} fontWeight={400} fontFamily={K.font} textAnchor="start">
                                      {`${Math.round(value/1000).toLocaleString('pt-BR')}k`}
                                    </text>;
                                  }}/>
                                <Line type="monotone" dataKey="acumulado"
                                  stroke={timelineData[timelineData.length-1]?.acumulado>=timelineData[timelineData.length-1]?.meta?K.green:K.red}
                                  strokeWidth={2.5} dot={{r:3,fill:K.bg2,strokeWidth:1.5}}
                                  label={(props)=>{
                                    const {x,y,index,value}=props;
                                    if(index!==timelineData.length-1||!value) return null;
                                    const clr=timelineData[timelineData.length-1]?.acumulado>=timelineData[timelineData.length-1]?.meta?K.green:K.red;
                                    return <text key="acc-lbl" x={x+8} y={y-6} fill={clr} fontSize={14} fontWeight={400} fontFamily={K.font} textAnchor="start">
                                      {`${Math.round(value/1000).toLocaleString('pt-BR')}k`}
                                    </text>;
                                  }}/>
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </Panel>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════ WIP ═══════════════════════════════ */}
          {activeDash==='WIP' && (
            <div style={{flex:1,display:'flex',flexDirection:'column',gap:16,overflow:'hidden'}}>

              {/* Tab bar + filtros na mesma linha */}
              <div style={{display:'flex',alignItems:'center',
                borderBottom:`1px solid ${K.border}`,flexShrink:0,gap:6,paddingBottom:4}}>
                <Tab active={tabWip==='DASHBOARD'} onClick={()=>setTabWip('DASHBOARD')}>Dashboard</Tab>
                <Tab active={tabWip==='DETALHAMENTO'} onClick={()=>setTabWip('DETALHAMENTO')}>Detalhamento</Tab>
                <div style={{width:1,height:24,background:K.border,margin:'0 4px',flexShrink:0}}/>
                {/* Filtro canal */}
                {[['TODOS','Todos',K.t2],['SEEDER','Seeder',K.blue],['PL','PL',K.purple],['NEXT_ELEVEN','Next Eleven',K.teal]].map(([v,l,c])=>(
                  <button key={v} onClick={()=>setCanalFiltro(v)}
                    style={{height:28,padding:'0 10px',borderRadius:7,cursor:'pointer',
                      fontFamily:K.font,fontSize:14,fontWeight:600,flexShrink:0,
                      background:canalFiltro===v?`${c}20`:K.bg2,
                      border:`1px solid ${canalFiltro===v?c:K.border2}`,
                      color:canalFiltro===v?c:K.t1}}>
                    {l}
                  </button>
                ))}
                <div style={{width:1,height:24,background:K.border,margin:'0 4px',flexShrink:0}}/>

                {/* Busca */}
                <div style={{position:'relative',display:'flex',alignItems:'center',flex:1,minWidth:100}}>
                  <Search size={13} color={wipFilters.busca?K.teal:K.t2}
                    style={{position:'absolute',left:10,pointerEvents:'none'}}/>
                  <input value={wipFilters.busca}
                    onChange={e=>setWipFilters(p=>({...p,busca:e.target.value}))}
                    placeholder="Ref, cor, marca ou coleção..."
                    style={{width:'100%',height:28,borderRadius:9,
                      border:`1px solid ${wipFilters.busca?K.teal:K.border2}`,
                      background:wipFilters.busca?`${K.teal}15`:K.bg2,
                      color:K.t0,fontSize:14,paddingLeft:30,paddingRight:10,
                      outline:'none',fontFamily:K.font}}/>
                </div>

                {/* Busca OF */}
                <div style={{position:'relative',display:'flex',alignItems:'center',flex:1,minWidth:80}}>
                  <Search size={13} color={wipFilters.buscaOf?K.teal:K.t2}
                    style={{position:'absolute',left:10,pointerEvents:'none'}}/>
                  <input value={wipFilters.buscaOf}
                    onChange={e=>setWipFilters(p=>({...p,buscaOf:e.target.value}))}
                    placeholder="Nº OF..."
                    style={{width:'100%',height:28,borderRadius:9,
                      border:`1px solid ${wipFilters.buscaOf?K.teal:K.border2}`,
                      background:wipFilters.buscaOf?`${K.teal}10`:K.bg2,
                      color:K.t0,fontSize:14,paddingLeft:30,paddingRight:10,
                      outline:'none',fontFamily:K.font}}/>
                </div>

                <WipMultiSelect label="Coleção" icon={Layers}
                  options={wipOptions.colecoes}
                  value={wipFilters.colecao}
                  onChange={v=>setWipFilters(p=>({...p,colecao:v}))}/>

                {/* Marca */}
                <WipMultiSelect label="Marca" icon={Tag}
                  options={wipOptions.clientes}
                  value={wipFilters.cliente}
                  onChange={v=>setWipFilters(p=>({...p,cliente:v}))}/>

                {/* Período */}
                <WipMultiSelect label="Período" icon={Calendar}
                  options={wipOptions.entregas}
                  value={wipFilters.entrega[0]==='TODOS'?'TODOS':wipFilters.entrega[0]}
                  isEntrega
                  entregaValues={wipFilters.entrega}
                  onChangeEntrega={handleEntrega}
                  dangerThreshold={CURRENT_WEEK_THRESHOLD}/>

                {/* Fluxo */}
                <div style={{display:'flex',alignItems:'center',
                  border:`1px solid ${K.border2}`,height:28,borderRadius:9,
                  background:K.bg2,flexShrink:0}}>
                  <div style={{padding:'0 8px',borderRight:`1px solid ${K.border2}`,
                    display:'flex',alignItems:'center',gap:5,height:'100%',
                    background:K.bg3,borderRadius:'9px 0 0 9px'}}>
                    <Zap size={11} color={K.t2}/>
                    <span style={{fontSize:14,fontWeight:700,color:K.t2,
                      textTransform:'uppercase',letterSpacing:'0.08em'}}>Fluxo</span>
                  </div>
                  <div style={{display:'flex',padding:'0 4px',gap:3}}>
                    {['GERAL','PRÉ','PÓS'].map(f=>(
                      <Pill key={f} active={wipFilters.fluxo===f}
                        onClick={()=>setWipFilters(p=>({...p,fluxo:f}))}>{f}</Pill>
                    ))}
                  </div>
                </div>

                <Pill active={wipFilters.somenteMostruario}
                  onClick={()=>setWipFilters(p=>({...p,somenteMostruario:!p.somenteMostruario}))}>
                  Mostruário
                </Pill>
                <Pill active={wipFilters.somenteAtraso} danger={wipFilters.somenteAtraso}
                  onClick={()=>setWipFilters(p=>({...p,somenteAtraso:!p.somenteAtraso}))}>
                  Atrasado
                </Pill>
                <button onClick={()=>setWipFilters({cliente:'TODOS',setor:'TODOS',
                  colecao:'TODOS',fluxo:'GERAL',entrega:['TODOS'],
                  somenteAtraso:false,somenteMostruario:false,busca:'',buscaOf:''})}
                  style={{width:34,height:34,background:`${K.red}18`,
                    border:`1px solid ${K.red}45`,borderRadius:9,cursor:'pointer',
                    color:K.red,display:'flex',alignItems:'center',
                    justifyContent:'center',flexShrink:0}}>
                  <FilterX size={14}/>
                </button>
              </div>

              {!dataWip.length ? (
                <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',
                  justifyContent:'center',gap:14,color:K.t2}}>
                  <Package size={40} color={K.t2}/>
                  <span style={{fontSize:14,color:K.t2}}>Aguardando base WIP</span>
                </div>
              ) : (
                <div style={{flex:1,display:'flex',flexDirection:'column',gap:14,overflow:'hidden'}}>

                  {/* KPIs */}
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',
                    gap:12,flexShrink:0}}>
                    <KpiCard label="Volume Total WIP" icon={Package}
                      value={wipFiltered.reduce((s,i)=>s+i.quantidade,0).toLocaleString('pt-BR')}
                      sub={wipLtFilter?'Clique para limpar filtro':`${new Set(wipFiltered.map(i=>i.of)).size} OFs ativas`} accent
                      onClick={()=>setWipLtFilter(null)}/>
                    <KpiCard label="Em Dia" icon={Activity}
                      value={wipFiltered.filter(i=>i.diasNoSetor<=getLtThreshold(i.setor,i.fornecedor)).reduce((s,i)=>s+i.quantidade,0).toLocaleString('pt-BR')}
                      sub={wipLtFilter==='EMDIA'?'✓ Filtro ativo':'Dentro do lead time'}
                      onClick={()=>setWipLtFilter(p=>p==='EMDIA'?null:'EMDIA')}/>
                    <KpiCard label="Em Atraso" icon={AlertTriangle}
                      value={wipFiltered.filter(i=>i.diasNoSetor>getLtThreshold(i.setor,i.fornecedor)&&i.diasNoSetor<=getLtThreshold(i.setor,i.fornecedor)*1.2).reduce((s,i)=>s+i.quantidade,0).toLocaleString('pt-BR')}
                      sub={wipLtFilter==='ATRASO'?'✓ Filtro ativo':'Lead time excedido'}
                      onClick={()=>setWipLtFilter(p=>p==='ATRASO'?null:'ATRASO')}/>
                    <KpiCard label="Criticos (LT +20%)" icon={AlertTriangle}
                      value={wipFiltered.filter(i=>i.diasNoSetor>getLtThreshold(i.setor,i.fornecedor)*1.2).reduce((s,i)=>s+i.quantidade,0).toLocaleString('pt-BR')}
                      sub={wipLtFilter==='CRITICO'?'✓ Filtro ativo':'Atencao imediata'} alert
                      onClick={()=>setWipLtFilter(p=>p==='CRITICO'?null:'CRITICO')}/>
                  </div>

                  {tabWip==='DASHBOARD' ? (
                    <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,minHeight:0}}>
                      <div style={{background:K.bg2,border:`1px solid ${K.border}`,borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                        display:'flex',flexDirection:'column',overflow:'hidden'}}>
                        <div style={{padding:'10px 18px',borderBottom:`1px solid ${K.border}`,
                          display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
                          <span style={{fontSize:14,fontWeight:700,color:K.t1,letterSpacing:'0.04em'}}>Pré Corte</span>
                          {(()=>{
                            const preT=wipTree.filter(s=>isPreFlow(s.name)).reduce((s,x)=>s+x.qty,0);
                            const tot=wipTree.reduce((s,x)=>s+x.qty,0);
                            const pct=tot>0?Math.round(preT/tot*100):0;
                            return <span style={{fontSize:14,color:K.t0,fontWeight:700}}>
                              {preT.toLocaleString('pt-BR')} pçs <span style={{color:K.t2,fontWeight:400}}>({pct}%)</span>
                            </span>;
                          })()}
                        </div>
                        <div style={{flex:1,overflowY:'auto',padding:'10px 16px',display:'flex',flexDirection:'column',gap:8}}>
                          {(()=>{
                            const total = wipTree.reduce((s,x)=>s+x.qty,0);
                            const preCorteTree = wipTree.filter(s=>isPreFlow(s.name));
                            const maxQty = preCorteTree[0]?.qty||1;
                            return preCorteTree.length===0
                              ? <span style={{color:K.t2,fontSize:14}}>Sem dados pré corte</span>
                              : preCorteTree.map((s,i)=>{
                              const pct = (s.qty/maxQty)*100;
                              const ltThresh = getLtThreshold(s.name);
                              const ltC = s.maxLt>ltThresh*2?K.red:s.maxLt>ltThresh?K.amber:K.green;
                              return (
                                <div key={i} style={{cursor:'pointer'}}
                                  onClick={()=>{setWipFilters(p=>({...p,setor:p.setor===s.name?'TODOS':s.name}));setTabWip('DETALHAMENTO');}}>
                                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                                    <span style={{fontSize:14,fontWeight:600,color:K.t1}}>{s.name}</span>
                                    <span style={{fontSize:14,color:K.t1,fontWeight:700}}>
                                      {s.qty.toLocaleString('pt-BR')} <span style={{color:K.t1,fontWeight:400}}>({s.maxLt}d)</span>
                                    </span>
                                  </div>
                                  <div style={{height:6,borderRadius:3,background:K.border2}}>
                                    <div style={{height:'100%',borderRadius:3,
                                      background:K.amber,
                                      width:`${pct}%`,transition:'width 0.3s'}}/>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      <div style={{background:K.bg2,border:`1px solid ${K.border}`,borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                        display:'flex',flexDirection:'column',overflow:'hidden'}}>
                        <div style={{padding:'10px 18px',borderBottom:`1px solid ${K.border}`,
                          display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
                          <span style={{fontSize:14,fontWeight:700,color:K.t1,letterSpacing:'0.04em'}}>Pós Corte</span>
                          {(()=>{
                            const posT=wipTree.filter(s=>!isPreFlow(s.name)).reduce((s,x)=>s+x.qty,0);
                            const tot=wipTree.reduce((s,x)=>s+x.qty,0);
                            const pct=tot>0?Math.round(posT/tot*100):0;
                            return <span style={{fontSize:14,color:K.t0,fontWeight:700}}>
                              {posT.toLocaleString('pt-BR')} pçs <span style={{color:K.t2,fontWeight:400}}>({pct}%)</span>
                            </span>;
                          })()}
                        </div>
                        <div style={{flex:1,overflowY:'auto',padding:'10px 16px',display:'flex',flexDirection:'column',gap:8}}>
                          {(()=>{
                            const posCostura = wipTree.filter(s=>!isPreFlow(s.name));
                            const maxQtyPos = posCostura[0]?.qty||1;
                            return posCostura.length===0
                              ? <span style={{color:K.t2,fontSize:14}}>Sem dados pós costura</span>
                              : posCostura.map((s,i)=>{
                                  const pct = (s.qty/maxQtyPos)*100;
                                  const ltThresh = getLtThreshold(s.name);
                                  const ltC = s.maxLt>ltThresh*2?K.red:s.maxLt>ltThresh?K.amber:K.green;
                                  return (
                                    <div key={i} style={{cursor:'pointer'}}
                                      onClick={()=>{setWipFilters(p=>({...p,setor:p.setor===s.name?'TODOS':s.name}));setTabWip('DETALHAMENTO');}}>
                                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                                        <span style={{fontSize:14,fontWeight:600,color:K.t1}}>{s.name}</span>
                                        <span style={{fontSize:14,color:K.t1,fontWeight:700}}>
                                          {s.qty.toLocaleString('pt-BR')} <span style={{color:K.t1,fontWeight:400}}>({s.maxLt}d)</span>
                                        </span>
                                      </div>
                                      <div style={{height:6,borderRadius:3,background:K.border2}}>
                                        <div style={{height:'100%',borderRadius:3,background:K.amber,width:`${pct}%`}}/>
                                      </div>
                                    </div>
                                  );
                                });
                          })()}
                        </div>
                      </div>
                    </div>

                  ) : (
                    <div style={{flex:1,overflow:'auto',padding:'4px 0'}}>
                      {(()=>{
                        if(!wipFiltered.length) return <div style={{padding:20,color:K.t0,fontSize:14}}>Sem itens no filtro atual.</div>;

                        // Group by setor → fornecedor → items
                        const setorMap = {};
                        wipFiltered.forEach(i=>{
                          const sk = i.setor||'N/A';
                          const fk = i.fornecedor||'N/A';
                          if(!setorMap[sk]) setorMap[sk]={nome:sk,qty:0,forns:{}};
                          setorMap[sk].qty += i.quantidade;
                          if(!setorMap[sk].forns[fk]) setorMap[sk].forns[fk]={nome:fk,qty:0,items:{}};
                          setorMap[sk].forns[fk].qty += i.quantidade;
                          const ik = `${i.of}||${i.cor}`;
                          if(!setorMap[sk].forns[fk].items[ik]){
                            setorMap[sk].forns[fk].items[ik]={
                              ref:i.ref, of:i.of, pedido:i.pedido||'', descricao:i.descricao,
                              setor:i.setor, cor:i.cor, entrega:i.entrega, facDtR:i.facDtR||'',
                              quantidade:0, diasNoSetor:0, fornecedor:fk
                            };
                          }
                          setorMap[sk].forns[fk].items[ik].quantidade += i.quantidade;
                          setorMap[sk].forns[fk].items[ik].diasNoSetor = Math.max(setorMap[sk].forns[fk].items[ik].diasNoSetor, i.diasNoSetor);
                        });
                        const setores = Object.values(setorMap).sort((a,b)=>b.qty-a.qty);
                        setores.forEach(s=>{
                          s.fornsList = Object.values(s.forns).sort((a,b)=>b.qty-a.qty);
                          s.fornsList.forEach(f=>{
                            f.rows = Object.values(f.items).sort((a,b)=>{
                              const va=a[sortDet.col]??'', vb=b[sortDet.col]??'';
                              const cmp = typeof va==='number' ? va-vb : String(va).localeCompare(String(vb));
                              return sortDet.dir==='asc'?cmp:-cmp;
                            });
                          });
                        });
                        const totalRows = setores.reduce((s,st)=>s+st.fornsList.reduce((a,f)=>a+f.rows.length,0),0);

                        return (
                          <table style={{width:'100%',borderCollapse:'collapse',fontSize:14,fontFamily:K.font}}>
                            <thead>
                              <tr style={{background:K.bg2,borderBottom:`2px solid ${K.teal}`,position:'sticky',top:0,zIndex:2}}>
                                {[
                                  {label:'Setor / Fornecedor / Ref', col:null},
                                  {label:'OF',         col:'of'},
                                  {label:'Pedido',     col:'pedido'},
                                  {label:'Descrição',  col:'descricao'},
                                  {label:'Cor',        col:'cor'},
                                  {label:'Entrega',    col:'entrega'},
                                  {label:'Retorno',    col:'facDtR'},
                                  {label:'Pçs',        col:'quantidade'},
                                  {label:'LT (d)',     col:'diasNoSetor'},
                                  {label:'Observação', col:null},
                                ].map(({label,col},hi)=>(
                                  <th key={label}
                                    onClick={col?()=>setSortDet(p=>({col,dir:p.col===col&&p.dir==='asc'?'desc':'asc'})):undefined}
                                    style={{padding:'9px 14px',
                                      textAlign:hi>=7&&hi<=8?'right':'left',
                                      color:sortDet.col===col?K.teal:K.t0,
                                      fontWeight:700,whiteSpace:'nowrap',letterSpacing:'0.04em',
                                      cursor:col?'pointer':'default',userSelect:'none'}}>
                                    {label}{sortDet.col===col?(sortDet.dir==='asc'?' ↑':' ↓'):''}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {setores.map((setor,si)=>[
                                /* Nível 1: Setor */
                                <tr key={`s-${si}`}
                                  onClick={()=>setExpForn(p=>({...p,[`s:${setor.nome}`]:!p[`s:${setor.nome}`]}))}
                                  style={{background:K.bg4,borderBottom:`1px solid ${K.border}`,cursor:'pointer'}}>
                                  <td style={{padding:'9px 14px'}}>
                                    <span style={{marginRight:8,color:K.teal,fontSize:12}}>{expForn[`s:${setor.nome}`]?'▾':'▸'}</span>
                                    <span style={{fontSize:14,fontWeight:700,color:K.t0,textTransform:'uppercase',letterSpacing:'0.08em'}}>{tc(setor.nome.toLowerCase())}</span>
                                    <span style={{fontSize:13,color:K.t2,marginLeft:12}}>{setor.fornsList.length} fornecedor{setor.fornsList.length!==1?'es':''}</span>
                                  </td>
                                  <td/><td/><td/><td/><td/><td/>
                                  <td style={{padding:'9px 14px',textAlign:'right',fontWeight:700,color:K.t0}}>{setor.qty.toLocaleString('pt-BR')}</td>
                                  <td/><td/>
                                </tr>,
                                ...( expForn[`s:${setor.nome}`] ? setor.fornsList.map((forn,fi)=>[
                                  /* Nível 2: Fornecedor */
                                  <tr key={`f-${si}-${fi}`}
                                    onClick={()=>setExpForn(p=>({...p,[`f:${setor.nome}:${forn.nome}`]:!p[`f:${setor.nome}:${forn.nome}`]}))}
                                    style={{background:K.bg3,borderBottom:`1px solid ${K.border}`,cursor:'pointer'}}>
                                    <td style={{padding:'7px 14px 7px 28px'}}>
                                      <span style={{marginRight:8,color:K.teal,fontSize:12}}>{expForn[`f:${setor.nome}:${forn.nome}`]?'▾':'▸'}</span>
                                      <span style={{fontSize:13,fontWeight:600,color:K.teal}}>{forn.nome}</span>
                                      <span style={{fontSize:13,color:K.t2,marginLeft:10}}>{forn.rows.length} iten{forn.rows.length!==1?'s':''}</span>
                                    </td>
                                    <td/><td/><td/><td/><td/><td/>
                                    <td style={{padding:'7px 14px',textAlign:'right',fontWeight:600,color:K.t1,fontSize:13}}>{forn.qty.toLocaleString('pt-BR')}</td>
                                    <td/><td/>
                                  </tr>,
                                  ...( expForn[`f:${setor.nome}:${forn.nome}`] ? forn.rows.map((item,ii)=>{
                                    const ltThresh = getLtThreshold(item.setor, item.fornecedor);
                                    const ltC = item.diasNoSetor>ltThresh*2?K.red:item.diasNoSetor>ltThresh?K.amber:K.teal;
                                    return (
                                      <tr key={`i-${si}-${fi}-${ii}`} style={{background:ii%2===0?K.bg2:K.bg1,borderBottom:`1px solid ${K.border}`}}>
                                        <td style={{padding:'6px 14px 6px 42px',whiteSpace:'nowrap'}}>
                                          <span style={{color:K.teal,fontWeight:700,fontFamily:'monospace'}}>{item.ref}</span>
                                        </td>
                                        <td style={{padding:'6px 14px',color:K.t0,fontFamily:'monospace',whiteSpace:'nowrap'}}>{item.of||'—'}</td>
                                        <td style={{padding:'6px 14px',color:K.t0,fontFamily:'monospace',whiteSpace:'nowrap'}}>{item.pedido||'—'}</td>
                                        <td style={{padding:'6px 14px',color:K.t0,maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.descricao}</td>
                                        <td style={{padding:'6px 14px',color:K.t0,whiteSpace:'nowrap'}}>{item.cor}</td>
                                        <td style={{padding:'6px 8px',whiteSpace:'nowrap'}}>
                                          {(()=>{
                                            const e = item.entrega;
                                            if(!e||e==='N/A'||e==='—') return <span style={{color:K.t2}}>—</span>;
                                            // Parse YYWW or YYYYWW
                                            const s = String(e).replace(/\D/g,'');
                                            if(s.length<4) return <span style={{color:K.t0}}>{e}</span>;
                                            const ww = parseInt(s.slice(-2));
                                            const yy = parseInt(s.slice(0,-2)) + (s.length<=4 ? 2000 : 0);
                                            // Current week
                                            const now = new Date();
                                            const start = new Date(now.getFullYear(),0,1);
                                            const curWw = Math.ceil(((now-start)/86400000+start.getDay()+1)/7);
                                            const curYy = now.getFullYear();
                                            const entNum = yy*100+ww;
                                            const curNum = curYy*100+curWw;
                                            const diff = (yy-curYy)*52+(ww-curWw);
                                            let bg, color;
                                            if(entNum < curNum){ bg=K.redD; color=K.red; }
                                            else if(diff<=2){ bg=K.amberD; color=K.amber; }
                                            else { bg=K.greenD; color=K.green; }
                                            return <span style={{background:bg,color,borderRadius:5,
                                              padding:'2px 8px',fontSize:13,fontWeight:600,
                                              border:`1px solid ${color}40`}}>{e}</span>;
                                          })()}
                                        </td>
                                        <td style={{padding:'6px 14px',whiteSpace:'nowrap',
                                          color:(()=>{if(!item.facDtR)return K.t0;const p=item.facDtR.split('/');if(p.length<3)return K.t0;return new Date(parseInt(p[2]),parseInt(p[1])-1,parseInt(p[0]))<new Date()?K.red:K.t0;})(),
                                          fontWeight:item.facDtR&&(()=>{const p=item.facDtR.split('/');if(p.length<3)return false;return new Date(parseInt(p[2]),parseInt(p[1])-1,parseInt(p[0]))<new Date();})() ? 700:400
                                        }}>{item.facDtR||'—'}</td>
                                        <td style={{padding:'6px 14px',color:K.t0,fontWeight:700,textAlign:'right',whiteSpace:'nowrap'}}>{item.quantidade.toLocaleString('pt-BR')}</td>
                                        <td style={{padding:'6px 14px',textAlign:'right',fontWeight:700,color:ltC,whiteSpace:'nowrap'}}>{item.diasNoSetor}</td>
                                        <td style={{padding:'4px 10px',minWidth:160,position:'relative'}}>
                                          <input key={item.of} defaultValue={obsWip[item.of]||''}
                                            onBlur={e=>saveObs(item.of, e.target.value)}
                                            onKeyDown={e=>{if(e.key==='Enter'){e.target.blur();}}}
                                            onMouseEnter={e=>{if(!obsWip[item.of])return;const p=e.currentTarget.parentElement.querySelector('.obs-popup');if(p){p.style.display='block';const r=e.currentTarget.getBoundingClientRect();p.style.top=(r.bottom+6)+'px';p.style.left=Math.min(r.left,window.innerWidth-340)+'px';}}}
                                            onMouseLeave={e=>{const p=e.currentTarget.parentElement.querySelector('.obs-popup');if(p)p.style.display='none';}}
                                            placeholder="Adicionar obs..."
                                            style={{width:'100%',background:obsWip[item.of]?`${K.amber}15`:'transparent',
                                              border:`1px solid ${obsWip[item.of]?K.amber:K.border}`,
                                              borderRadius:6,padding:'4px 8px',color:obsWip[item.of]?K.t0:K.t2,
                                              fontSize:13,fontFamily:K.font,outline:'none',cursor:obsWip[item.of]?'help':'text'}}/>
                                          {obsWip[item.of] && (
                                            <div className="obs-popup" style={{display:'none',position:'fixed',zIndex:9999,
                                              background:K.bg2,border:`1px solid ${K.amber}`,borderRadius:10,padding:'10px 14px',
                                              maxWidth:320,fontSize:13,color:K.t0,lineHeight:1.6,
                                              boxShadow:'0 8px 32px rgba(0,0,0,0.5)',pointerEvents:'none',whiteSpace:'pre-wrap',wordBreak:'break-word'}}>
                                              <span style={{display:'block',fontSize:11,color:K.amber,fontWeight:700,marginBottom:4}}>OF {item.of}</span>
                                              {obsWip[item.of]}
                                            </div>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  }) : [])
                                ]).flat() : [])
                              ])}
                            </tbody>
                            <tfoot>
                              <tr style={{background:K.bg2,borderTop:`2px solid ${K.border2}`}}>
                                <td colSpan={9} style={{padding:'9px 14px',color:K.t0,fontWeight:600}}>
                                  {setores.length} setores · {totalRows} itens
                                </td>
                                <td style={{padding:'9px 14px',textAlign:'right',fontWeight:800,color:K.t0,fontSize:15}}>
                                  {wipFiltered.reduce((s,i)=>s+i.quantidade,0).toLocaleString('pt-BR')}
                                </td>
                                <td/>
                              </tr>
                            </tfoot>
                          </table>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════ FATURAMENTO ═══════════════════════════════ */}
          {activeDash==='FATURAMENTO' && (
            <div style={{flex:1,display:'flex',flexDirection:'column',gap:16,overflow:'hidden'}}>

              {/* Tab bar + filtros na mesma linha */}
              <div style={{display:'flex',alignItems:'center',
                borderBottom:`1px solid ${K.border}`,flexShrink:0,gap:6,paddingBottom:4}}>
                <Tab active={tabFat==='DASHBOARD'} onClick={()=>setTabFat('DASHBOARD')}>Dashboard</Tab>
                <Tab active={tabFat==='DETALHAMENTO'} onClick={()=>setTabFat('DETALHAMENTO')}>Ranking</Tab>
                <div style={{width:1,height:24,background:K.border,margin:'0 4px',flexShrink:0}}/>
                {/* Filtro canal */}
                {[['TODOS','Todos',K.t2],['PRIVATE LABEL','PL',K.purple],['SEEDER','Seeder',K.blue],['NEXT ELEVEN','Next Eleven',K.teal]].map(([v,l,c])=>(
                  <button key={v} onClick={()=>setFatFilters(p=>({...p,canal:v}))}
                    style={{height:28,padding:'0 10px',borderRadius:7,cursor:'pointer',
                      fontFamily:K.font,fontSize:14,fontWeight:600,flexShrink:0,
                      background:fatFilters.canal===v?`${c}20`:K.bg2,
                      border:`1px solid ${fatFilters.canal===v?c:K.border2}`,
                      color:fatFilters.canal===v?c:K.t2}}>
                    {l}
                  </button>
                ))}
                <div style={{width:1,height:24,background:K.border,margin:'0 4px',flexShrink:0}}/>
                {/* R$ / Peças */}
                {[['VALORES','R$'],['PECAS','Peças']].map(([v,l])=>(
                  <button key={v} onClick={()=>setFatViz(v)}
                    style={{height:28,padding:'0 10px',borderRadius:7,cursor:'pointer',
                      fontFamily:K.font,fontSize:14,fontWeight:600,flexShrink:0,
                      background:fatViz===v?`${K.teal}20`:K.bg2,
                      border:`1px solid ${fatViz===v?K.teal:K.border2}`,
                      color:fatViz===v?K.teal:K.t1}}>
                    {l}
                  </button>
                ))}
              </div>

              {!dataFat.length ? (
                <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',
                  justifyContent:'center',gap:14,color:K.t2}}>
                  <DollarSign size={40} color={K.t2}/>
                  <span style={{fontSize:14,color:K.t2}}>Aguardando base faturamento</span>
                </div>
              ) : (
                <div style={{flex:1,display:'flex',flexDirection:'column',gap:14,overflow:'hidden'}}>

                  {/* KPIs — sub em duas linhas PL / SD */}
                  {(() => {
                    const canal = fatFilters.canal;
                    const showPL = canal === 'TODOS' || canal === 'PRIVATE LABEL';
                    const showSD = canal === 'TODOS' || canal === 'SEEDER';
                    const showNE = canal === 'TODOS' || canal === 'NEXT ELEVEN';
                    const FatCard = ({ label, icon: Icon, mainValue, plValue, sdValue, neValue, alert, accent, amber, forceWhite, subExtra }) => {
                      const mainColor = forceWhite ? K.t0 : amber ? K.amber : alert ? K.red : K.t0;
                      return (
                        <div style={{ background:K.bg2, border:`1px solid ${K.border}`, borderRadius:12,
                          padding:'12px 16px', display:'flex', flexDirection:'column', gap:5,
                          position:'relative', overflow:'hidden',
                          boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                          borderTop:`3px solid ${alert?K.red:amber?K.amber:K.teal}` }}>
                          <span style={{ fontSize:13, fontWeight:700, color:K.t2, textTransform:'uppercase', letterSpacing:'0.04em' }}>{label}</span>
                          <span style={{ fontSize:22, fontWeight:400, color:mainColor, letterSpacing:'-0.02em', lineHeight:1.2 }}>{mainValue}</span>
                          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                            {canal==='TODOS' && showPL && <span style={{ fontSize:12, color:K.t2 }}>PL {plValue}</span>}
                            {canal==='TODOS' && showSD && <span style={{ fontSize:12, color:K.t2 }}>SD {sdValue}</span>}
                            {canal==='TODOS' && showNE && neValue && <span style={{ fontSize:12, color:K.t2 }}>NE {neValue}</span>}
                            {subExtra && <span style={{ fontSize:12, color:K.amber, fontWeight:600 }}>{subExtra}</span>}
                          </div>
                        </div>
                      );
                    };
                    const gapGoal = canal==='PRIVATE LABEL'?GOAL_PRIVATE:canal==='SEEDER'?GOAL_SEEDER:TOTAL_GOAL;
                    const gapVal  = canal==='PRIVATE LABEL'?Math.max(0,GOAL_PRIVATE-fatKpis.pl.val):canal==='SEEDER'?Math.max(0,GOAL_SEEDER-fatKpis.sd.val):canal==='NEXT ELEVEN'?0:Math.max(0,TOTAL_GOAL-fatKpis.val);
                    const gapDia  = Math.round(gapVal / Math.max(1, bizDays.total - bizDays.countUntilToday + 1));
                    const atingVal = canal==='PRIVATE LABEL'?fatKpis.atingPL:canal==='SEEDER'?fatKpis.atingSD:canal==='NEXT ELEVEN'?0:fatKpis.ating;
                    const fatVal   = canal==='PRIVATE LABEL'?fatKpis.pl.val:canal==='SEEDER'?fatKpis.sd.val:canal==='NEXT ELEVEN'?fatKpis.ne.val:fatKpis.val;
                    const metaVal  = canal==='PRIVATE LABEL'?GOAL_PRIVATE:canal==='SEEDER'?GOAL_SEEDER:canal==='NEXT ELEVEN'?0:TOTAL_GOAL;
                    const ticketVal= canal==='PRIVATE LABEL'?fatKpis.ticketPL:canal==='SEEDER'?fatKpis.ticketSD:canal==='NEXT ELEVEN'?fatKpis.ticketNE:fatKpis.ticket;
                    return (
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, flexShrink:0 }}>
                        <FatCard label="Faturado" icon={DollarSign} forceWhite
                          mainValue={`R$ ${fatVal.toLocaleString('pt-BR',{maximumFractionDigits:0})}`}
                          plValue={`R$ ${(fatKpis.pl.val/1000).toFixed(0)}k`}
                          sdValue={`R$ ${(fatKpis.sd.val/1000).toFixed(0)}k`}
                          neValue={`R$ ${(fatKpis.ne.val/1000).toFixed(0)}k`}/>
                        <FatCard label="Orçado" icon={Target}
                          mainValue={metaVal>0?`R$ ${metaVal.toLocaleString('pt-BR',{maximumFractionDigits:0})}`:'Sem meta'}
                          plValue={`R$ ${(GOAL_PRIVATE/1000).toFixed(0)}k`}
                          sdValue={`R$ ${(GOAL_SEEDER/1000).toFixed(0)}k`}
                          neValue="Sem meta"/>
                        <FatCard label="Atingimento" icon={TrendingUp} forceWhite
                          mainValue={atingVal>0?`${atingVal.toFixed(1)}%`:'—'}
                          plValue={`${fatKpis.atingPL.toFixed(1)}%`}
                          sdValue={`${fatKpis.atingSD.toFixed(1)}%`}
                          neValue="—"/>
                        <FatCard label="Preço Médio" icon={Tag}
                          mainValue={`R$ ${ticketVal.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}`}
                          plValue={`R$ ${fatKpis.ticketPL.toFixed(2)}`}
                          sdValue={`R$ ${fatKpis.ticketSD.toFixed(2)}`}
                          neValue={`R$ ${fatKpis.ticketNE.toFixed(2)}`}/>
                        <FatCard label="Gap" icon={AlertTriangle} amber
                          mainValue={gapVal>0?`R$ ${gapVal.toLocaleString('pt-BR',{maximumFractionDigits:0})}`:'—'}
                          plValue={`R$ ${Math.max(0,(GOAL_PRIVATE-fatKpis.pl.val)/1000).toFixed(0)}k`}
                          sdValue={`R$ ${Math.max(0,(GOAL_SEEDER-fatKpis.sd.val)/1000).toFixed(0)}k`}
                          neValue="—"
                          subExtra={gapDia>0?`R$ ${gapDia.toLocaleString('pt-BR')}/dia`:undefined}/>
                      </div>
                    );
                  })()}

                  {tabFat==='DASHBOARD' ? (
                    <div style={{flex:1,display:'flex',flexDirection:'column',gap:12,overflow:'hidden',minHeight:0}}>
                      {/* Se canal === TODOS: 2 linhas (PL em cima, SD embaixo). Se PL ou SD: só 1 linha expandida */}
                      {(() => {
                        const canal = fatFilters.canal;
                        const accData = canal==='PRIVATE LABEL'?chartPL:canal==='SEEDER'?chartSD:canal==='NEXT ELEVEN'?chartNE:buildFatChart('TODOS');
                        const accLabel = canal==='PRIVATE LABEL'?'Private Label':canal==='SEEDER'?'Seeder':canal==='NEXT ELEVEN'?'Next Eleven':'Geral';
                        const allData  = canal==='NEXT ELEVEN' ? [] : canal==='PRIVATE LABEL' ? chartPL : canal==='SEEDER' ? chartSD : buildFatChart('TODOS');
                        const dailyTitle = canal==='NEXT ELEVEN' ? 'Realizado Diario — Next Eleven' : canal==='PRIVATE LABEL' ? 'Realizado Diario — Private Label' : canal==='SEEDER' ? 'Realizado Diario — Seeder' : 'Realizado Diario — Todos os Canais';
                        return (
                          <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,minHeight:0}}>
                            <Panel title={dailyTitle}>
                              <div style={{flex:1,padding:'8px',minHeight:0}}>
                                {canal==='NEXT ELEVEN' ? (
                                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:K.t2,fontSize:14}}>
                                    Sem dados de faturamento para Next Eleven
                                  </div>
                                ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={allData} margin={{top:18,right:8,left:8,bottom:0}}>
                                    {grid}{xAxis()}{yAxisHidden}
                                    <Tooltip cursor={false} content={<DarkTooltip cursor={false}/>}/>
                                    <Bar dataKey={fatViz==='PECAS'?'realDiaPcs':'realDia'} fill={K.tealD} stroke={K.teal}
                                      strokeWidth={1.5} radius={[4,4,0,0]}>
                                      <LabelList dataKey={fatViz==='PECAS'?'realDiaPcs':'realDia'} position="top"
                                        fill={K.t0} style={{fontSize:14,fontWeight:400}}
                                        formatter={v=>v>0?Math.round(v/1000)+'k':''}/>
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                                )}
                              </div>
                            </Panel>
                            <Panel title={`Acumulado vs Orçamento — ${accLabel}`}>
                              <div style={{flex:1,padding:'8px',minHeight:0}}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={accData} margin={{top:8,right:110,left:8,bottom:0}}>
                                    {grid}{xAxis()}{yAxisHidden}
                                    <Tooltip cursor={false} content={<DarkTooltip cursor={false}/>}/>
                                    {canal!=='NEXT ELEVEN' && <Line type="monotone" dataKey="metaAcc" stroke="#4A7BAA"
                                      strokeDasharray="4 4" dot={false} strokeWidth={1.5}
                                      label={(props)=>{
                                        const {x,y,index,value}=props;
                                        if(index!==accData.length-1||!value) return null;
                                        return <text key="meta-lbl" x={x+8} y={y+4} fill="#4A7BAA" fontSize={14} fontWeight={400} fontFamily={K.font} textAnchor="start">
                                          {`${Math.round(value/1000).toLocaleString('pt-BR')}k`}
                                        </text>;
                                      }}/>}
                                    <Line type="monotone" dataKey="realAcc"
                                      stroke={accData[accData.length-1]?.realAcc>=accData[accData.length-1]?.metaAcc?K.green:K.red}
                                      strokeWidth={2.5} dot={(props)=>{
                                        const {cx,cy,index}=props;
                                        const clr=accData[accData.length-1]?.realAcc>=accData[accData.length-1]?.metaAcc?K.green:K.red;
                                        return <circle key={index} cx={cx} cy={cy} r={index===accData.length-1?5:3} fill={K.bg2} stroke={clr} strokeWidth={1.5}/>;
                                      }}
                                      label={(props)=>{
                                        const {x,y,index,value}=props;
                                        if(canal==='NEXT ELEVEN'||index!==accData.length-1||!value) return null;
                                        const clr=accData[accData.length-1]?.realAcc>=accData[accData.length-1]?.metaAcc?K.green:K.red;
                                        return <text key="real-lbl" x={x+8} y={y-8} fill={clr} fontSize={14} fontWeight={400} fontFamily={K.font} textAnchor="start">
                                          {`${Math.round(value/1000).toLocaleString('pt-BR')}k`}
                                        </text>;
                                      }}/>
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </Panel>
                          </div>
                        );
                      })()}
                    </div>

                  ) : (
                    <div style={{flex:1,borderRadius:12,border:`1px solid ${K.border}`,overflow:'hidden auto'}}>
                      <table style={{width:'100%',borderCollapse:'collapse'}}>
                        <thead style={{position:'sticky',top:0,background:K.bg1}}>
                          <tr style={{borderBottom:`1px solid ${K.border}`}}>
                            <th style={{padding:'11px 18px',textAlign:'left',width:48}}>
                              <span style={{fontSize:14,fontWeight:700,color:K.t2,
                                textTransform:'uppercase',letterSpacing:'0.1em'}}>#</span></th>
                            <th style={{padding:'11px 18px',textAlign:'left',width:110}}>
                              <span style={{fontSize:14,fontWeight:700,color:K.t2,
                                textTransform:'uppercase',letterSpacing:'0.1em'}}>Dt. Fatura</span></th>
                            <th style={{padding:'11px 18px',textAlign:'left'}}>
                              <span style={{fontSize:14,fontWeight:700,color:K.t2,
                                textTransform:'uppercase',letterSpacing:'0.1em'}}>Cliente</span></th>
                            <th style={{padding:'11px 18px',textAlign:'right'}}>
                              <span style={{fontSize:14,fontWeight:700,color:K.t2,
                                textTransform:'uppercase',letterSpacing:'0.1em'}}>Valor Líquido</span></th>
                          </tr>
                        </thead>
                        <tbody>
                          {ranking.map((c,i)=>(
                            <tr key={i} style={{borderBottom:`1px solid ${K.border}`,
                              background:i%2===0?K.bg2:K.bg3}}>
                              <td style={{padding:'11px 18px'}}>
                                <span style={{fontSize:14,fontWeight:700,color:K.t2,
                                  fontFamily:'monospace'}}>{(i+1).toString().padStart(2,'0')}</span>
                              </td>
                              <td style={{padding:'11px 18px'}}>
                                <span style={{fontSize:14,color:K.t2,fontFamily:'monospace'}}>{c.dtFatura||'—'}</span>
                              </td>
                              <td style={{padding:'11px 18px'}}>
                                <span style={{fontSize:14,color:K.t0}}>{c.name}</span>
                              </td>
                              <td style={{padding:'11px 18px',textAlign:'right'}}>
                                <span style={{fontSize:14,fontWeight:700,
                                  color:i===0?K.amber:K.green}}>
                                  R$ {c.valor.toLocaleString('pt-BR',{minimumFractionDigits:2})}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {/* ═══════════════════════════════ ESTOQUE ═══════════════════════════════ */}
          {activeDash==='ESTOQUE' && (
            <div style={{flex:1,display:'flex',flexDirection:'column',gap:16,overflow:'hidden'}}>

              {/* Tab bar + filtros na mesma linha */}
              <div style={{display:'flex',alignItems:'center',
                borderBottom:`1px solid ${K.border}`,flexShrink:0,gap:6,paddingBottom:4}}>
                <Tab active={tabEstoque==='DASHBOARD'} onClick={()=>setTabEstoque('DASHBOARD')}>Dashboard</Tab>
                <Tab active={tabEstoque==='DETALHAMENTO'} onClick={()=>setTabEstoque('DETALHAMENTO')}>Detalhamento</Tab>
                <div style={{width:1,height:24,background:K.border,margin:'0 4px',flexShrink:0}}/>
                {/* Filtro canal */}
                {[['TODOS','Todos',K.t2],['SEEDER','Seeder',K.blue],['PL','PL',K.purple],['NEXT_ELEVEN','Next Eleven',K.teal]].map(([v,l,c])=>(
                  <button key={v} onClick={()=>setCanalFiltro(v)}
                    style={{height:28,padding:'0 10px',borderRadius:7,cursor:'pointer',
                      fontFamily:K.font,fontSize:14,fontWeight:600,flexShrink:0,
                      background:canalFiltro===v?`${c}20`:K.bg2,
                      border:`1px solid ${canalFiltro===v?c:K.border2}`,
                      color:canalFiltro===v?c:K.t1}}>
                    {l}
                  </button>
                ))}
                <div style={{width:1,height:24,background:K.border,margin:'0 4px',flexShrink:0}}/>
                {/* Busca */}
                <div style={{position:'relative',display:'flex',alignItems:'center',flex:1,minWidth:120}}>
                  <Search size={13} color={estoqueFilters.busca?K.blue:K.t2}
                    style={{position:'absolute',left:10,pointerEvents:'none'}}/>
                  <input value={estoqueFilters.busca}
                    onChange={e=>setEstoqueFilters(p=>({...p,busca:e.target.value}))}
                    placeholder="REF / produto / cor..."
                    style={{width:'100%',height:34,borderRadius:9,
                      border:`1px solid ${estoqueFilters.busca?K.blue:K.border2}`,
                      background:estoqueFilters.busca?`${K.blue}10`:K.bg2,
                      color:K.t0,fontSize:14,paddingLeft:30,paddingRight:10,
                      outline:'none',fontFamily:K.font}}/>
                </div>
                <EstoqueMultiSelect label="Marcas" options={estoqueOptions.marcas}
                  values={estoqueFilters.marca}
                  onChange={v=>setEstoqueFilters(p=>({...p,marca:v}))}/>
                <EstoqueMultiSelect label="Coleções" options={estoqueOptions.colecoes}
                  values={estoqueFilters.colecao}
                  onChange={v=>setEstoqueFilters(p=>({...p,colecao:v}))}/>
                <EstoqueMultiSelect label="Famílias" options={estoqueOptions.grupos}
                  values={estoqueFilters.grupo}
                  onChange={v=>setEstoqueFilters(p=>({...p,grupo:v}))}/>
                <EstoqueMultiSelect label="Qualidades" options={estoqueOptions.qualidades}
                  values={estoqueFilters.qualidade}
                  onChange={v=>setEstoqueFilters(p=>({...p,qualidade:v}))}/>
                <div style={{display:'flex',alignItems:'center',gap:7,height:34,padding:'0 10px',
                  borderRadius:9,background:estoqueFilters.aging!=='TODOS'?`${K.blue}18`:K.bg2,
                  border:`1px solid ${estoqueFilters.aging!=='TODOS'?K.blue:K.border2}`,flexShrink:0}}>
                  <select value={estoqueFilters.aging}
                    onChange={e=>setEstoqueFilters(p=>({...p,aging:e.target.value}))}
                    style={{background:'transparent',border:'none',outline:'none',cursor:'pointer',
                      color:estoqueFilters.aging!=='TODOS'?K.blue:K.t1,
                      fontSize:14,fontWeight:600,textTransform:'uppercase',fontFamily:K.font}}>
                    <option value="TODOS">Aging</option>
                    <option value="0-15">0–15 dias</option>
                    <option value="16-30">16–30 dias</option>
                    <option value="31-60">31–60 dias</option>
                    <option value="60+">+60 dias</option>
                  </select>
                </div>
                <button onClick={()=>setEstoqueFilters({busca:'',marca:[],colecao:[],grupo:[],qualidade:[],aging:'TODOS'})}
                  style={{width:34,height:34,background:`${K.red}18`,border:`1px solid ${K.red}45`,
                    borderRadius:9,cursor:'pointer',color:K.red,display:'flex',alignItems:'center',
                    justifyContent:'center',flexShrink:0}}>
                  <FilterX size={14}/>
                </button>
              </div>

              {!dataEstoque.length ? (
                <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',
                  justifyContent:'center',gap:14,color:K.t2}}>
                  <Warehouse size={40} color={K.t2}/>
                  <span style={{fontSize:14,color:K.t2}}>Aguardando base de estoque</span>
                </div>
              ) : (
                <div style={{flex:1,display:'flex',flexDirection:'column',gap:14,overflow:'hidden'}}>

                  {/* KPIs */}
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,flexShrink:0}}>
                    <KpiCard label="Volume Total" icon={Warehouse}
                      value={estoqueKpis.vol.toLocaleString('pt-BR')}
                      sub={`${estoqueFiltered.length} SKUs`} accent/>
                    <KpiCard label="Custo Total" icon={DollarSign}
                      value={`R$ ${estoqueKpis.custo.toLocaleString('pt-BR',{maximumFractionDigits:0})}`}
                      sub={`Custo médio: R$ ${estoqueKpis.vol>0?(estoqueKpis.custo/estoqueKpis.vol).toLocaleString('pt-BR',{maximumFractionDigits:2}):'0'}`}/>
                    <KpiCard label="Giro Lento (+60D)" icon={AlertTriangle}
                      value={estoqueKpis.giroLento.toLocaleString('pt-BR')}
                      sub={`${estoqueKpis.vol>0?((estoqueKpis.giroLento/estoqueKpis.vol)*100).toFixed(1):0}% do estoque`}
                      alert={estoqueKpis.giroLento>0}/>
                  </div>

                  {tabEstoque==='DASHBOARD' ? (
                    <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,minHeight:0}}>

                      <Panel title="Mix Coleção (Top 10)">
                        <div style={{flex:1,padding:'8px 4px 8px 8px',minHeight:0}}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={estoqueMixColecao} layout="vertical"
                              margin={{top:4,right:70,left:8,bottom:4}}>
                              <XAxis type="number" hide/>
                              <YAxis dataKey="name" type="category" width={130}
                                axisLine={false} tickLine={false}
                                tick={{fill:K.t1,fontSize:14,fontFamily:K.font,fontWeight:400}}/>
                              <Tooltip cursor={false} content={<DarkTooltip/>}/>
                              <Bar dataKey="value" radius={[0,4,4,0]} barSize={36}
                                strokeWidth={1.5} cursor="pointer"
                                onClick={(d,_,e)=>{
                                  const col=d.name;
                                  setEstoqueFilters(p=>({...p,colecao:
                                    e.ctrlKey||e.metaKey
                                      ? p.colecao.includes(col)?p.colecao.filter(x=>x!==col):[...p.colecao,col]
                                      : p.colecao.length===1&&p.colecao[0]===col?[]:[col]
                                  }));
                                  if(!e.ctrlKey&&!e.metaKey) setTabEstoque('DETALHAMENTO');
                                }}>
                                {estoqueMixColecao.map((d,i)=>(
                                  <Cell key={i}
                                    fill={K.tealD} stroke={K.teal} strokeWidth={1.5}
                                    stroke={K.teal} strokeWidth={estoqueFilters.colecao.includes(d.name)?2:1.5}/>
                                ))}
                                <LabelList dataKey="value" position="right"
                                  content={(props)=>{
                                    const {x,y,width,height,value}=props;
                                    if(!value) return null;
                                    return <text x={x+width+6} y={y+height/2+5}
                                      fill={K.t0} fontSize={14} fontWeight={400}
                                      fontFamily={K.font}>
                                      {value.toLocaleString('pt-BR')}
                                    </text>;
                                  }}/>
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Panel>

                      <Panel title="Top Marcas">
                        <div style={{flex:1,padding:'8px',minHeight:0}}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={estoqueMixMarca} layout="vertical"
                              margin={{top:4,right:70,left:8,bottom:4}}>
                              <XAxis type="number" hide/>
                              <YAxis dataKey="name" type="category" width={110}
                                axisLine={false} tickLine={false}
                                tick={{fill:K.t0,fontSize:14,fontFamily:K.font,fontWeight:400}}/>
                              <Tooltip cursor={false} content={<DarkTooltip/>}/>
                              <Bar dataKey="value" radius={[0,4,4,0]} barSize={42}
                                strokeWidth={1.5} cursor="pointer"
                                onClick={(d,_,e)=>{
                                  const m=d.name;
                                  setEstoqueFilters(p=>({...p,marca:
                                    e.ctrlKey||e.metaKey
                                      ? p.marca.includes(m)?p.marca.filter(x=>x!==m):[...p.marca,m]
                                      : p.marca.length===1&&p.marca[0]===m?[]:[m]
                                  }));
                                  if(!e.ctrlKey&&!e.metaKey) setTabEstoque('DETALHAMENTO');
                                }}>
                                {estoqueMixMarca.map((d,i)=>(
                                  <Cell key={i}
                                    fill={K.tealD} stroke={K.teal} strokeWidth={1.5}
                                    stroke={K.teal} strokeWidth={estoqueFilters.marca.includes(d.name)?2:1.5}/>
                                ))}
                                <LabelList dataKey="value" position="right"
                                  content={(props)=>{
                                    const {x,y,width,height,value}=props;
                                    if(!value) return null;
                                    return <text x={x+width+6} y={y+height/2+5}
                                      fill={K.t0} fontSize={14} fontWeight={400}
                                      fontFamily={K.font}>
                                      {value.toLocaleString('pt-BR')}
                                    </text>;
                                  }}/>
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Panel>

                      <Panel title="Giro (Base: Dt_Entrada)">
                        <div style={{flex:1,padding:'8px',minHeight:0}}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={estoqueAgingCurve} margin={{top:18,right:8,left:8,bottom:0}}>
                              {grid}
                              <XAxis dataKey="bucket" axisLine={false} tickLine={false}
                                tick={{fill:K.t2,fontSize:14,fontFamily:K.font,fontWeight:400}}/>
                              {yAxisHidden}
                              <Tooltip cursor={false} content={<DarkTooltip/>}/>
                              <Bar dataKey="qtde" radius={[4,4,0,0]} barSize={40}
                                style={{cursor:'pointer'}}
                                onClick={(d)=>{
                                  const map={'0-15 d':'0-15','16-30 d':'16-30','31-60 d':'31-60','+60 d':'60+'};
                                  const val=map[d.bucket];
                                  if(val){ setEstoqueFilters(p=>({...p,aging:p.aging===val?'TODOS':val})); setTabEstoque('DETALHAMENTO'); }
                                }}>
                                {estoqueAgingCurve.map((d,i)=>{
                                  const agingMap={'0-15 d':'0-15','16-30 d':'16-30','31-60 d':'31-60','+60 d':'60+'};
                                  const isActive=estoqueFilters.aging===agingMap[d.bucket];
                                  const base=i===3?K.red:i===2?K.amber:i===0?K.teal:K.blue;
                                  const baseD=i===3?K.redD:i===2?K.amberD:i===0?K.tealD:K.blueD;
                                  return <Cell key={i} fill={isActive?base:baseD}
                                    stroke={base} strokeWidth={isActive?2.5:1.5}/>;
                                })}
                                <LabelList dataKey="qtde" position="top"
                                  content={(props)=>{
                                    const {x,y,width,value}=props;
                                    if(!value) return null;
                                    return <text x={x+width/2} y={y-6} textAnchor="middle"
                                      fill={K.t2} fontSize={14} fontWeight={400}
                                      fontFamily={K.font}>
                                      {value.toLocaleString('pt-BR')}
                                    </text>;
                                  }}/>
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Panel>
                    </div>

                  ) : (
                    <div style={{flex:1,borderRadius:12,border:`1px solid ${K.border}`,overflow:'hidden auto'}}>
                      <table style={{width:'100%',borderCollapse:'collapse'}}>
                        <thead style={{position:'sticky',top:0,background:K.bg1,zIndex:10}}>
                          <tr style={{borderBottom:`1px solid ${K.border}`}}>
                            <th style={{padding:'11px 18px',textAlign:'left'}}>
                              <span style={{fontSize:14,fontWeight:700,color:K.t2,textTransform:'uppercase',letterSpacing:'0.1em'}}>REF / Marca / Cor</span></th>
                            <th style={{padding:'11px 18px',textAlign:'center',width:120}}>
                              <span style={{fontSize:14,fontWeight:700,color:K.t2,textTransform:'uppercase',letterSpacing:'0.1em'}}>Data Ent.</span></th>
                            <th style={{padding:'11px 18px',textAlign:'left'}}>
                              <span style={{fontSize:14,fontWeight:700,color:K.t2,textTransform:'uppercase',letterSpacing:'0.1em'}}>Grade (Tam : Qtd)</span></th>
                            <th style={{padding:'11px 18px',textAlign:'right',width:90}}>
                              <span style={{fontSize:14,fontWeight:700,color:K.t2,textTransform:'uppercase',letterSpacing:'0.1em'}}>Saldo</span></th>
                          </tr>
                        </thead>
                        <tbody>
                          {estoqueTree.map((ref,ri)=>(
                            <React.Fragment key={ri}>
                              {/* Ref header row */}
                              <tr onClick={()=>setExpEstoque(p=>({...p,[ref.codigo]:!p[ref.codigo]}))}
                                style={{borderBottom:`1px solid ${K.border}`,cursor:'pointer',
                                  background:ri%2===0?K.bg2:K.bg3}}>
                                <td style={{padding:'10px 18px',display:'flex',alignItems:'center',gap:10}}>
                                  {expEstoque[ref.codigo]
                                    ?<ChevronDown size={14} color={K.blue}/>
                                    :<ChevronRight size={14} color={K.t2}/>}
                                  <div>
                                    <span style={{fontSize:14,fontWeight:700,color:K.blue,fontFamily:'monospace'}}>{ref.codigo}</span>
                                    <span style={{fontSize:14,color:K.t1,marginLeft:10}}>{ref.descricao}</span>
                                    <span style={{fontSize:14,color:K.t2,marginLeft:8,background:K.bg2,
                                      padding:'1px 6px',borderRadius:4}}>{ref.descMarca}</span>
                                  </div>
                                </td>
                                <td style={{padding:'10px 18px',textAlign:'center'}}>
                                  <span style={{fontSize:14,color:K.t2}}>—</span>
                                </td>
                                <td style={{padding:'10px 18px'}}/>
                                <td style={{padding:'10px 18px',textAlign:'right'}}>
                                  <span style={{fontSize:14,fontWeight:700,color:K.t0}}>
                                    {ref.qtdeTotal.toLocaleString('pt-BR')}
                                  </span>
                                </td>
                              </tr>
                              {/* Color rows */}
                              {expEstoque[ref.codigo] && ref.cores.map((sku,si)=>(
                                <tr key={si} style={{borderBottom:`1px solid ${K.border}`,background:K.bg2}}>
                                  <td style={{padding:'8px 18px 8px 46px'}}>
                                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                                      <span style={{fontSize:14,color:K.t2,fontFamily:'monospace'}}>[{sku.cor}]</span>
                                      <span style={{fontSize:14,color:K.t1,fontWeight:500}}>{sku.descor}</span>
                                      {sku.dias>60 && (
                                        <span style={{fontSize:14,fontWeight:700,padding:'1px 6px',borderRadius:4,
                                          background:K.redD,color:K.red}}>+{sku.dias}d</span>
                                      )}
                                    </div>
                                  </td>
                                  <td style={{padding:'8px 18px',textAlign:'center'}}>
                                    <span style={{fontSize:14,color:K.t2}}>{sku.dtEntrada||'—'}</span>
                                  </td>
                                  <td style={{padding:'8px 18px'}}>
                                    <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                                      {Object.entries(sku.grade).map(([tam,qty])=>(
                                        <span key={tam} style={{
                                          display:'inline-flex',alignItems:'center',gap:3,
                                          border:`1px solid ${K.border2}`,borderRadius:6,
                                          overflow:'hidden',fontSize:14,fontWeight:700}}>
                                          <span style={{padding:'2px 6px',background:K.bg3,color:K.t2,
                                            borderRight:`1px solid ${K.border2}`}}>{tam}</span>
                                          <span style={{padding:'2px 6px',color:K.green}}>{qty}</span>
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td style={{padding:'8px 18px',textAlign:'right'}}>
                                    <span style={{fontSize:14,fontWeight:700,
                                      color:sku.dias>60?K.red:K.t0}}>
                                      {sku.qtde.toLocaleString('pt-BR')}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {/* ═══════════════════════════════ COBERTURA ═══════════════════════════════ */}
          {activeDash==='COBERTURA' && (
            <div style={{flex:1,display:'flex',flexDirection:'column',gap:16,overflow:'hidden'}}>

              {!dataComercial.length||!dataEstoque.length ? (
                <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',
                  justifyContent:'center',gap:14,color:K.t2}}>
                  <GitMerge size={44} color={K.t2}/>
                  <span style={{fontSize:14,color:K.t2,textAlign:'center'}}>
                    {!dataComercial.length&&!dataEstoque.length
                      ? 'Carregue a base comercial e a base de estoque'
                      : !dataComercial.length ? 'Carregue a base comercial (arquivo 5_Comercial)'
                      : 'Carregue a base de estoque (arquivo 4_Produto_Acabado)'}
                  </span>
                  {(!dataComercial.length||!dataEstoque.length)&&(dataComercial.length||dataEstoque.length)&&(
                    <span style={{fontSize:14,color:K.t2,opacity:0.6}}>
                      {dataEstoque.length?`✓ Estoque: ${dataEstoque.length} SKUs`:''} {dataComercial.length?`✓ Comercial: ${dataComercial.length} itens`:''}
                    </span>
                  )}
                </div>
              ) : (
                <div style={{flex:1,display:'flex',flexDirection:'column',gap:14,overflow:'hidden'}}>

                  {/* Barra título + status pills + busca */}
                  <div style={{display:'flex',alignItems:'center',gap:8,
                    borderBottom:`1px solid ${K.border}`,paddingBottom:10,flexShrink:0}}>
                    <span style={{fontSize:15,fontWeight:700,color:K.t0,letterSpacing:'0.04em',textTransform:'uppercase',flexShrink:0}}>Cobertura de Carteira</span>
                    <div style={{flex:1}}/>
                    {/* Botão exportar CSV */}
                    <button onClick={()=>{
                      const headers = ['Pedido','Cliente','Rep','Status','Qtde','Valor'];
                      const rows = cobTree.map(p=>[
                        p.numero, p.cliente||'', p.rep||'',
                        p.descStatus||'', p.totalPedido, p.totalValor.toFixed(2),
                      ]);
                      const csv = [headers, ...rows]
                        .map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(';'))
                        .join('\n');
                      try {
                        navigator.clipboard.writeText(csv).then(()=>alert('CSV copiado para a área de transferência!'));
                      } catch(e) {
                        setCobCsvText(csv); setCobCsvOpen(true);
                      }
                    }} style={{height:30,padding:'0 12px',borderRadius:7,cursor:'pointer',
                      fontFamily:K.font,fontSize:14,fontWeight:600,flexShrink:0,
                      background:`${K.blue}20`,border:`1px solid ${K.blue}`,
                      color:K.blue,display:'flex',alignItems:'center',gap:6}}>
                      <FileUp size={13}/> Exportar
                    </button>
                    {(cobOptions.statuses||[]).map(st=>{
                      const active=cobFilters.descStatus.includes(st);
                      const sColor=st==='EM CARTEIRA'?K.blue:st==='BLOQUEADO'?K.red:K.green;
                      return (
                        <button key={st}
                          onClick={e=>{
                            if(e.ctrlKey||e.metaKey){
                              setCobFilters(p=>({...p,descStatus:active?p.descStatus.filter(s=>s!==st):[...p.descStatus,st]}));
                            } else {
                              setCobFilters(p=>({...p,descStatus:active&&p.descStatus.length===1?[]:[st]}));
                            }
                          }}
                          style={{height:30,padding:'0 10px',borderRadius:7,cursor:'pointer',
                            fontFamily:K.font,fontSize:14,fontWeight:600,whiteSpace:'nowrap',
                            background:active?`${sColor}25`:K.bg2,
                            border:`1px solid ${active?sColor:K.border2}`,
                            color:active?sColor:K.t1,transition:'all 0.12s',flexShrink:0}}>
                          {st}
                        </button>
                      );
                    })}
                    {/* Campo de busca */}
                    <div style={{position:'relative',display:'flex',alignItems:'center',flexShrink:0}}>
                      <Filter size={13} color={cobFilters.busca?K.blue:K.t2}
                        style={{position:'absolute',left:10,pointerEvents:'none'}}/>
                      <input
                        value={cobFilters.busca}
                        onChange={e=>setCobFilters(p=>({...p,busca:e.target.value}))}
                        placeholder="Pedido, cliente, ref ou ref+cor..."
                        style={{
                          width:240,height:34,borderRadius:9,
                          border:`1px solid ${cobFilters.busca?K.blue:K.border2}`,
                          background:cobFilters.busca?`${K.blue}10`:K.bg2,
                          color:K.t0,fontSize:14,paddingLeft:30,paddingRight:10,
                          outline:'none',fontFamily:K.font,
                        }}/>
                    </div>
                    {/* Expandir / Recolher tudo */}
                    {(() => {
                      const allOpen = cobTree.length>0 && cobTree.every(p=>expCobertura[p.numero]);
                      return (
                        <button onClick={()=>{
                          if(allOpen){
                            setExpCobertura({});
                            setExpCobCor({});
                          } else {
                            const newExp={};
                            const newCor={};
                            cobTree.forEach(p=>{
                              newExp[p.numero]=true;
                              p.refs.forEach(r=>{ newCor[`${p.numero}||${r.codigo}`]=true; });
                            });
                            setExpCobertura(newExp);
                            setExpCobCor(newCor);
                          }
                        }} style={{
                          display:'flex',alignItems:'center',gap:6,height:34,padding:'0 12px',
                          borderRadius:9,cursor:'pointer',fontFamily:K.font,fontSize:14,fontWeight:600,
                          background:allOpen?`${K.blue}25`:K.bg2,
                          border:`1px solid ${allOpen?K.blue:K.border2}`,
                          color:allOpen?K.blue:K.t1,flexShrink:0,whiteSpace:'nowrap',
                        }}>
                          {allOpen
                            ? <><ChevronDown size={13}/> Recolher</>
                            : <><ChevronRight size={13}/> Expandir tudo</>}
                        </button>
                      );
                    })()}
                  </div>

                  {/* KPIs */}
                  <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,flexShrink:0}}>
                    {/* Card 1: Carteira */}
                    <div style={{background:K.bg2,border:`1px solid ${K.border}`,borderRadius:12,
                      padding:'12px 16px',display:'flex',flexDirection:'column',gap:5,
                      boxShadow:'0 1px 4px rgba(0,0,0,0.06)',borderTop:`3px solid ${K.teal}`}}>
                      <span style={{fontSize:13,fontWeight:700,color:K.t2,textTransform:'uppercase',letterSpacing:'0.04em'}}>Carteira</span>
                      <span style={{fontSize:22,fontWeight:400,color:K.t0,letterSpacing:'-0.02em',lineHeight:1.2}}>
                        R$ {cobKpis.totalValorCarteira.toLocaleString('pt-BR',{maximumFractionDigits:0})}
                      </span>
                      <div style={{display:'flex',flexDirection:'column',gap:1}}>
                        <span style={{fontSize:12,color:K.t2}}>{cobKpis.nPedidos.toLocaleString()} pedidos</span>
                        <span style={{fontSize:12,color:K.t2}}>{cobKpis.totalPecas.toLocaleString()} peças</span>
                      </div>
                    </div>
                    <KpiCard label="Faturável (Est.)" icon={GitMerge}
                      value={cobKpis.totalFat.toLocaleString()}
                      sub={`R$ ${cobKpis.valorFat.toLocaleString('pt-BR',{maximumFractionDigits:0})}`}/>
                    <KpiCard label="Em Produção WIP" icon={Activity}
                      value={cobKpis.prodComprometida.toLocaleString()}
                      sub="peças c/ pedidos"/>
                    <KpiCard label="Atende / Parcial" icon={TrendingUp}
                      value={`${cobKpis.pedAtende} / ${cobKpis.pedParcial}`}
                      sub={`${cobKpis.pedFalta} sem cobertura`}/>
                    <KpiCard label="Falta Grade" icon={AlertTriangle}
                      value={cobKpis.pedFalta.toLocaleString()}
                      sub="Zero estoque" alert={cobKpis.pedFalta>0}/>
                  </div>

                  {/* Botão pedidos faturáveis + filtro status + filtro mês entrega */}
                  <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0,flexWrap:'wrap'}}>
                    <button
                      onClick={()=>setCobFilters(p=>({...p,somenteFaturavel:!p.somenteFaturavel}))}
                      style={{
                        display:'flex',alignItems:'center',gap:8,height:34,padding:'0 14px',
                        borderRadius:9,cursor:'pointer',fontFamily:K.font,fontSize:14,fontWeight:700,
                        background:cobFilters.somenteFaturavel?K.green:`${K.green}18`,
                        border:`1px solid ${cobFilters.somenteFaturavel?K.green:`${K.green}55`}`,
                        color:cobFilters.somenteFaturavel?K.bg0:K.green,transition:'all 0.15s',
                        flexShrink:0,
                      }}>
                      <GitMerge size={14}/>
                      Pedidos Faturáveis
                    </button>
                    {cobFilters.somenteFaturavel && (
                      <span style={{fontSize:14,color:K.t2,flexShrink:0}}>
                        mín. R$ 2.000 · {cobTree.length} pedido{cobTree.length!==1?'s':''}
                      </span>
                    )}

                    {/* Filtro status */}
                    <div style={{width:1,height:24,background:K.border,flexShrink:0}}/>
                    {[
                      {v:'TODOS',  l:'Todos',        c:K.t2},
                      {v:'ATENDE', l:'OK',           c:K.green},
                      {v:'PRODUCAO',l:'Em Produção', c:K.amber},
                      {v:'RUPTURA',l:'Ruptura',      c:K.red},
                    ].map(({v,l,c})=>(
                      <button key={v}
                        onClick={()=>setCobFilters(p=>({...p,statusFilter:v}))}
                        style={{height:28,padding:'0 12px',borderRadius:7,cursor:'pointer',
                          fontFamily:K.font,fontSize:14,fontWeight:600,flexShrink:0,
                          background:cobFilters.statusFilter===v?`${c}20`:K.bg2,
                          border:`1px solid ${cobFilters.statusFilter===v?c:K.border2}`,
                          color:cobFilters.statusFilter===v?c:K.t1}}>
                        {l}
                      </button>
                    ))}

                    {/* Mês entrega */}
                    {(cobOptions.meses||[]).length>0&&(
                      <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6,flexWrap:'nowrap'}}>
                        <Calendar size={13} color={cobFilters.mesEntrega.length>0?K.blue:K.t2}/>
                        {cobOptions.meses.map(({key,label})=>{
                          const active=cobFilters.mesEntrega.includes(key);
                          return (
                            <button key={key}
                              onClick={e=>{
                                if(e.ctrlKey||e.metaKey){
                                  setCobFilters(p=>({...p,mesEntrega:active?p.mesEntrega.filter(k=>k!==key):[...p.mesEntrega,key]}));
                                } else {
                                  setCobFilters(p=>({...p,mesEntrega:active&&p.mesEntrega.length===1?[]:[key]}));
                                }
                              }}
                              style={{
                                height:30,padding:'0 12px',borderRadius:7,cursor:'pointer',
                                fontFamily:K.font,fontSize:14,fontWeight:600,whiteSpace:'nowrap',
                                background:active?`${K.blue}30`:K.bg2,
                                border:`1px solid ${active?K.blue:K.border2}`,
                                color:active?K.blue:K.t1,transition:'all 0.12s',
                              }}>
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Tabela de pedidos */}
                  <div style={{flex:1,borderRadius:12,border:`1px solid ${K.border}`,overflow:'hidden auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse'}}>
                      <thead style={{position:'sticky',top:0,background:K.bg1,zIndex:10}}>
                        <tr style={{borderBottom:`1px solid ${K.border}`}}>
                          <th style={{padding:'11px 18px',textAlign:'left',width:90}}>
                            <span style={{fontSize:14,fontWeight:700,color:K.t2,textTransform:'uppercase',letterSpacing:'0.1em'}}>Pedido</span></th>
                          <th style={{padding:'11px 18px',textAlign:'left'}}>
                            <span style={{fontSize:14,fontWeight:700,color:K.t2,textTransform:'uppercase',letterSpacing:'0.1em'}}>Cliente / Representante</span></th>
                          <th style={{padding:'11px 18px',textAlign:'center',width:120}}>
                            <span style={{fontSize:14,fontWeight:700,color:K.t2,textTransform:'uppercase',letterSpacing:'0.1em'}}>Status</span></th>
                          <th style={{padding:'11px 18px',textAlign:'center',width:80}}>
                            <span style={{fontSize:14,fontWeight:700,color:K.t2,textTransform:'uppercase',letterSpacing:'0.1em'}}>Pedido</span></th>
                          <th style={{padding:'11px 18px',textAlign:'center',width:80}}>
                            <span style={{fontSize:14,fontWeight:700,color:K.t2,textTransform:'uppercase',letterSpacing:'0.1em'}}>Estoque</span></th>
                          <th style={{padding:'11px 18px',textAlign:'center',width:90}}>
                            <span style={{fontSize:14,fontWeight:700,color:K.t2,textTransform:'uppercase',letterSpacing:'0.1em'}}>Produção</span></th>
                          <th style={{padding:'11px 18px',textAlign:'right',width:110}}>
                            <span style={{fontSize:14,fontWeight:700,color:K.t2,textTransform:'uppercase',letterSpacing:'0.1em'}}>Total Ped.</span></th>
                          <th style={{padding:'11px 18px',textAlign:'right',width:110}}>
                            <span style={{fontSize:14,fontWeight:700,color:K.t2,textTransform:'uppercase',letterSpacing:'0.1em'}}>Faturável</span></th>
                          <th style={{padding:'11px 18px',textAlign:'center',width:130}}>
                            <span style={{fontSize:14,fontWeight:700,color:K.t2,textTransform:'uppercase',letterSpacing:'0.1em'}}>Cobertura</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {cobTree.map((ped,pi)=>{
                          // Filtro status em cascata
                          const sf = cobFilters.statusFilter;
                          const filteredRefs = sf==='TODOS' ? ped.refs : ped.refs.map(ref=>({
                            ...ref,
                            cores:(ref.cores||[]).filter(c=>c.status===sf)
                          })).filter(ref=>ref.cores.length>0);
                          if(sf!=='TODOS' && filteredRefs.length===0) return null;
                          const statusColor=ped.statusPed==='ATENDE'?K.green:ped.statusPed==='PRODUCAO'?K.amber:K.red;
                          const statusBg=ped.statusPed==='ATENDE'?K.greenD:ped.statusPed==='PRODUCAO'?K.amberD:K.redD;
                          const statusLabel=ped.statusPed==='ATENDE'?'OK':ped.statusPed==='PRODUCAO'?'EM PRODUÇÃO':'RUPTURA';
                          const isOpen=expCobertura[ped.numero];
                          return (
                            <React.Fragment key={pi}>
                              {/* Pedido header */}
                              <tr onClick={()=>setExpCobertura(p=>({...p,[ped.numero]:!p[ped.numero]}))}
                                style={{borderBottom:`1px solid ${K.border}`,cursor:'pointer',
                                  background:pi%2===0?K.bg2:K.bg3}}>
                                <td style={{padding:'12px 18px',verticalAlign:'middle',width:130}}>
                                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                                    {isOpen?<ChevronDown size={14} color={K.blue}/>:<ChevronRight size={14} color={K.t2}/>}
                                    <span style={{fontSize:14,fontWeight:700,color:K.blue,fontFamily:'monospace',whiteSpace:'nowrap'}}>#{ped.numero}</span>
                                  </div>
                                </td>
                                <td style={{padding:'12px 18px',verticalAlign:'middle',maxWidth:220,overflow:'hidden'}}>
                                  <div style={{overflow:'hidden'}}>
                                    <span style={{fontSize:14,fontWeight:600,color:K.t0,display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ped.cliente}</span>
                                    <span style={{fontSize:14,color:K.t2,display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ped.rep}</span>
                                  </div>
                                </td>
                                <td style={{padding:'12px 18px',textAlign:'center',verticalAlign:'middle',width:120}}>
                                  {ped.descStatus&&<span style={{fontSize:14,fontWeight:700,padding:'3px 8px',borderRadius:5,whiteSpace:'nowrap',display:'inline-block',
                                    background:ped.descStatus.toUpperCase()==='EM CARTEIRA'?`${K.blue}25`:ped.descStatus.toUpperCase()==='BLOQUEADO'?`${K.red}25`:ped.descStatus.toUpperCase()==='LIBERADO EXPEDICAO'?`${K.green}25`:`${K.amber}25`,
                                    color:ped.descStatus.toUpperCase()==='EM CARTEIRA'?K.blue:ped.descStatus.toUpperCase()==='BLOQUEADO'?K.red:ped.descStatus.toUpperCase()==='LIBERADO EXPEDICAO'?K.green:K.amber}}>
                                    {ped.descStatus}
                                  </span>}
                                </td>
                                <td style={{padding:'12px 18px',textAlign:'center',verticalAlign:'middle',width:80}}>
                                  <span style={{fontSize:14,fontWeight:700,color:K.t1}}>{ped.totalPedido.toLocaleString()}</span>
                                </td>
                                <td style={{padding:'12px 18px',textAlign:'center',verticalAlign:'middle',width:80}}>
                                  <span style={{fontSize:14,fontWeight:700,color:K.blue}}>{ped.totalEstoque.toLocaleString()}</span>
                                </td>
                                <td style={{padding:'12px 18px',textAlign:'center',verticalAlign:'middle',width:90}}>
                                  <span style={{fontSize:14,fontWeight:700,color:ped.totalProducao>0?K.purple:K.t2}}>
                                    {ped.totalProducao>0?ped.totalProducao.toLocaleString():'—'}
                                  </span>
                                </td>
                                <td style={{padding:'12px 18px',textAlign:'right',verticalAlign:'middle',width:110}}>
                                  <span style={{fontSize:14,fontWeight:700,color:K.t1,whiteSpace:'nowrap'}}>
                                    R$ {ped.totalValor.toLocaleString('pt-BR',{maximumFractionDigits:0})}
                                  </span>
                                </td>
                                <td style={{padding:'12px 18px',textAlign:'right',verticalAlign:'middle',width:110}}>
                                  <span style={{fontSize:14,fontWeight:700,color:K.green,whiteSpace:'nowrap'}}>
                                    R$ {ped.valorFaturavel.toLocaleString('pt-BR',{maximumFractionDigits:0})}
                                  </span>
                                </td>
                                <td style={{padding:'12px 18px',textAlign:'center',verticalAlign:'middle',width:130}}>
                                  <span style={{fontSize:14,fontWeight:800,padding:'4px 10px',
                                    borderRadius:6,background:statusBg,color:statusColor,
                                    whiteSpace:'nowrap',display:'inline-block'}}>
                                    {statusLabel}
                                  </span>
                                </td>
                              </tr>

                              {/* REF level */}
                              {isOpen && filteredRefs.map((ref,ri)=>(
                                <React.Fragment key={`${ped.numero}-${ref.codigo}`}>
                                  <tr onClick={()=>setExpCobCor(p=>({...p,[`${ped.numero}||${ref.codigo}`]:!p[`${ped.numero}||${ref.codigo}`]}))}
                                    style={{borderBottom:`1px solid ${K.border}`,cursor:'pointer',
                                      background:K.bg2}}>
                                    <td style={{padding:'9px 18px 9px 42px'}}>
                                      <div style={{display:'flex',alignItems:'center',gap:8,minWidth:0}}>
                                        {expCobCor[`${ped.numero}||${ref.codigo}`]
                                          ?<ChevronDown size={12} color={K.t2}/>
                                          :<ChevronRight size={12} color={K.t2}/>}
                                        <span style={{fontSize:14,fontWeight:700,color:K.blue,fontFamily:'monospace',flexShrink:0}}>{ref.codigo}</span>
                                        <span style={{fontSize:14,color:K.t1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ref.descricao}</span>
                                      </div>
                                    </td>
                                    <td/>
                                    <td/>
                                    <td style={{padding:'9px 18px',textAlign:'center'}}>
                                      <span style={{fontSize:14,color:K.t1}}>{ref.pedRef.toLocaleString()}</span>
                                    </td>
                                    <td style={{padding:'9px 18px',textAlign:'center'}}>
                                      <span style={{fontSize:14,color:K.blue}}>{ref.estRef.toLocaleString()}</span>
                                    </td>
                                    <td style={{padding:'9px 18px',textAlign:'center'}}>
                                      <span style={{fontSize:14,color:ref.prodRef>0?K.purple:K.t2}}>
                                        {ref.prodRef>0?ref.prodRef.toLocaleString():'—'}
                                      </span>
                                    </td>
                                    <td/>
                                    <td/>
                                    <td style={{padding:'9px 18px',textAlign:'center'}}>
                                      <span style={{fontSize:14,fontWeight:700,color:ref.fatRef===0?K.red:ref.fatRef>=ref.pedRef?K.green:K.amber}}>
                                        {ref.fatRef===0?'Ruptura':ref.fatRef>=ref.pedRef?'OK':'Em Produção'}
                                      </span>
                                    </td>
                                  </tr>

                                  {/* COR level */}
                                  {expCobCor[`${ped.numero}||${ref.codigo}`] && (ref.cores||[])
                                    .filter(c=>!cobFilters.somenteFaturavel||c.status!=='RUPTURA')
                                    .map((corObj,ci)=>{
                                    const cColor=corObj.status==='ATENDE'?K.green:corObj.status==='PRODUCAO'?K.amber:K.red;
                                    return (
                                      <tr key={ci} style={{borderBottom:`1px solid ${K.border}`,background:K.bg0}}>
                                        <td style={{padding:'8px 18px 8px 68px'}} colSpan={2}>
                                          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                                            {/* Grade chips ANTES da cor */}
                                            <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                                              {corObj.tams.map(({tam,qtdePed,qtdeEst,fatTam,qtdeProd},ti)=>{
                                                const chipColor = qtdeEst>=qtdePed ? K.green : (qtdeEst+qtdeProd)>=qtdePed ? K.amber : K.red;
                                                const chipBg    = qtdeEst>=qtdePed ? K.greenD : (qtdeEst+qtdeProd)>=qtdePed ? K.amberD : K.redD;
                                                return (
                                                <div key={ti} style={{
                                                  display:'inline-flex',flexDirection:'column',
                                                  border:`1px solid ${chipColor}`,
                                                  borderRadius:8,overflow:'hidden',fontSize:14,minWidth:52,
                                                  background:chipBg,
                                                }}>
                                                  <span style={{padding:'2px 6px',textAlign:'center',
                                                    fontWeight:700,color:chipColor,
                                                    borderBottom:`1px solid ${chipColor}40`}}>
                                                    {tam}
                                                  </span>
                                                  <div style={{display:'flex',flexDirection:'column',padding:'3px 6px',gap:1}}>
                                                    <span style={{fontSize:14,color:K.t2}}>Ped <span style={{color:K.t1,fontWeight:700}}>{qtdePed}</span></span>
                                                    <span style={{fontSize:14,color:K.t2}}>Est <span style={{color:K.blue,fontWeight:700}}>{qtdeEst}</span></span>
                                                    <span style={{fontSize:14,color:K.t2}}>Prod <span style={{color:qtdeProd>0?K.purple:K.t2,fontWeight:700}}>{qtdeProd}</span></span>
                                                  </div>
                                                </div>
                                                );
                                              })}
                                            </div>
                                            <span style={{fontSize:14,color:K.t2,fontFamily:'monospace'}}>[{corObj.cor}]</span>
                                            <span style={{fontSize:14,fontWeight:600,color:K.t1}}>{corObj.desccor}</span>
                                          </div>
                                          {(corObj.prodOps||[]).length>0 && (
                                            <div style={{display:'flex',gap:5,flexWrap:'wrap',marginTop:6}}>
                                              {corObj.prodOps.map((op,oi)=>(
                                                <span key={oi} style={{
                                                  display:'inline-flex',alignItems:'center',gap:4,
                                                  padding:'2px 8px',borderRadius:5,fontSize:13,
                                                  background:K.purpleD,border:`1px solid ${K.purple}50`,
                                                  color:K.t0,whiteSpace:'nowrap',
                                                }}>
                                                  <span style={{fontFamily:'monospace',color:K.purple,fontWeight:700}}>OF {op.of}</span>
                                                  <span style={{color:K.t2}}>·</span>
                                                  <span style={{color:K.t1}}>{op.setor}</span>
                                                  <span style={{color:K.t2}}>·</span>
                                                  <span style={{color:K.t0}}>{op.quantidade.toLocaleString()} pçs</span>
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </td>
                                        <td/>
                                        <td style={{padding:'8px 18px',textAlign:'center'}}>
                                          <span style={{fontSize:14,color:K.t1}}>{corObj.pedCor}</span>
                                        </td>
                                        <td style={{padding:'8px 18px',textAlign:'center'}}>
                                          <span style={{fontSize:14,color:K.blue}}>{corObj.estCor}</span>
                                        </td>
                                        <td style={{padding:'8px 18px',textAlign:'center'}}>
                                          <span style={{fontSize:14,color:corObj.prodCor>0?K.purple:K.t2}}>
                                            {corObj.prodCor>0?corObj.prodCor.toLocaleString():'—'}
                                          </span>
                                        </td>
                                        <td/>
                                        <td/>
                                        <td style={{padding:'8px 18px',textAlign:'center'}}>
                                          <span style={{fontSize:14,fontWeight:800,padding:'3px 8px',
                                            borderRadius:5,color:cColor,
                                            background:corObj.status==='ATENDE'?K.greenD:corObj.status==='PRODUCAO'?K.amberD:K.redD}}>
                                            {corObj.status==='ATENDE'?'OK':corObj.status==='PRODUCAO'?'Em Produção':'Ruptura'}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </React.Fragment>
                              ))}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════ S&OP ═══════════════════════════════ */}
          {activeDash==='SOP' && (
            <div style={{flex:1,display:'flex',flexDirection:'column',gap:14,overflow:'hidden'}}>

              {/* Tab bar + seletor de visão */}
              <div style={{display:'flex',alignItems:'center',
                borderBottom:`1px solid ${K.border}`,flexShrink:0,gap:4}}>
                <Tab active={tabSop==='PLANEJAMENTO'} onClick={()=>setTabSop('PLANEJAMENTO')}>Planejamento</Tab>
                <Tab active={tabSop==='PL_SOP'} onClick={()=>setTabSop('PL_SOP')}>Private Label</Tab>
                <Tab active={tabSop==='TABELA'} onClick={()=>setTabSop('TABELA')}>Tabela Consolidada</Tab>
              </div>

              {!dataSop ? (
                <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',
                  justifyContent:'center',gap:14,color:K.t2}}>
                  <BarChart2 size={44} color={K.t2}/>
                  <span style={{fontSize:14,color:K.t2,textAlign:'center'}}>
                    Carregue o arquivo S&OP Seeder (.xlsx) com abas Demanda, Capacidade e Parâmetros
                  </span>
                </div>
              ) : (() => {
                // Guards: suporte a dados do storage antigo (CSV) ou incompletos
                const mesesRaw         = dataSop.meses            || [];
                const totalDemandaRaw  = dataSop.totalDemanda     || mesesRaw.map(()=>0);
                const totalCapRaw      = dataSop.totalCapacidade  || mesesRaw.map(()=>0);

                // Filtrar maio a dezembro (excluir jan-abr)
                const MESES_EXCLUIR = ['jan','fev','mar','abr','ene','feb','apr'];
                const idxFiltro = mesesRaw.map((_,i)=>i).filter(i=>{
                  const m = String(mesesRaw[i]).toLowerCase().slice(0,3);
                  return !MESES_EXCLUIR.includes(m);
                });
                const meses           = idxFiltro.map(i=>mesesRaw[i]);
                const totalDemanda    = idxFiltro.map(i=>totalDemandaRaw[i]||0);
                const totalCapacidade = idxFiltro.map(i=>totalCapRaw[i]||0);

                const demByCanal       = (() => {
                  const raw = dataSop.demByCanal || {};
                  const out = {};
                  Object.keys(raw).forEach(c => { out[c] = idxFiltro.map(i=>raw[c][i]||0); });
                  return out;
                })();
                const demByFamilia     = (() => {
                  const raw = dataSop.demByFamilia || {};
                  const out = {};
                  Object.keys(raw).forEach(f => { out[f] = idxFiltro.map(i=>raw[f][i]||0); });
                  return out;
                })();
                const demByClienteFamilia = dataSop.demByClienteFamilia || [];
                const capByFamilia     = dataSop.capByFamilia     || {};
                const costureiros      = dataSop.costureiros      || [];
                const parametros       = dataSop.parametros       || {};
                const paramMetas       = dataSop.paramMetas       || {};

                // ── Metas do mês corrente via paramMetas ─────────────
                const _hoje = new Date();
                const _MESES_ABREV3 = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
                const _mesLabel = _MESES_ABREV3[_hoje.getMonth()]; // ex: 'Mai'
                const _getMetaMes = (chave) => paramMetas[chave]?.[_mesLabel] || 0;

                // Se veio do storage antigo (CSV), não tem demByCanal → mostrar aviso
                if (!meses.length || !Object.keys(demByCanal).length) {
                  return (
                    <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',
                      justifyContent:'center',gap:14,color:K.t2}}>
                      <BarChart2 size={44} color={K.amber}/>
                      <span style={{fontSize:14,color:K.amber,textAlign:'center'}}>
                        Base S&OP desatualizada. Recarregue o arquivo .xlsx para atualizar.
                      </span>
                    </div>
                  );
                }

                const canais = Object.keys(demByCanal).sort();
                const familias = Object.keys(demByFamilia).sort();
                const utilizacoes = meses.map((_,i) =>
                  totalCapacidade[i]>0 ? (totalDemanda[i]/totalCapacidade[i])*100 : 0);
                const gap = meses.map((_,i) => totalCapacidade[i] - totalDemanda[i]);
                const totalDem = totalDemanda.reduce((a,b)=>a+b,0);
                const totalCap = totalCapacidade.reduce((a,b)=>a+b,0);
                const mediaUtil = utilizacoes.filter(u=>u>0).reduce((a,b)=>a+b,0)/(utilizacoes.filter(u=>u>0).length||1);
                const maxUtilIdx = utilizacoes.indexOf(Math.max(...utilizacoes));
                const mesGargalo = meses[maxUtilIdx] || '';
                const gargaloUtil = utilizacoes[maxUtilIdx]||0;

                // Cores por canal
                const canalColor = {
                  'Seeder':           K.teal,
                  'Private label':    K.amber,
                  'Next Eleven':      K.purple,
                  'Carteira Petersen':K.t2,
                };
                const canalFill = {
                  'Seeder':           '#0A4A4A',
                  'Private label':    K.amberD,
                  'Next Eleven':      K.purpleD,
                  'Carteira Petersen':`${K.t2}40`,
                };
                const getCanalFill  = (c) => canalFill[c]  || K.bg3;
                const getCanalColor = (c) => canalColor[c] || K.t1;

                // Chart data: demanda empilhada por canal + capacidade
                const chartData = meses.map((mes,i) => {
                  const d = { mes };
                  canais.forEach(c => { d[c] = demByCanal[c]?.[i]||0; });
                  d['Capacidade'] = totalCapacidade[i]||0;
                  d['Gap'] = gap[i];
                  d['Utilizacao'] = utilizacoes[i];
                  return d;
                });

                // Chart familia data
                const familiaChartData = meses.map((mes,i) => {
                  const d = { mes };
                  familias.forEach(f => { d[f] = demByFamilia[f]?.[i]||0; });
                  d['_cap'] = totalCapacidade[i]||0;
                  return d;
                });

                // Capacidade por família chart
                const capFamiliaData = familias.map(f => ({
                  familia: f.length > 14 ? f.slice(0,13)+'…' : f,
                  familiaFull: f,
                  cap: (capByFamilia[f]||[]).reduce((a,b)=>a+b,0),
                  dem: (demByFamilia[f]||[]).reduce((a,b)=>a+b,0),
                }));

                const famColors = [
                  {fill:'#0A4A4A', stroke:K.teal},
                  {fill:K.amberD,  stroke:K.amber},
                  {fill:K.purpleD, stroke:K.purple},
                  {fill:`${K.t2}40`, stroke:K.t2},
                  {fill:`${K.teal}30`, stroke:`${K.teal}90`},
                  {fill:`${K.amber}30`, stroke:`${K.amber}90`},
                ];

                return (
                  <div style={{flex:1,display:'flex',flexDirection:'column',gap:12,overflow:'hidden'}}>

                    {/* KPIs */}
                    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,flexShrink:0}}>
                      <KpiCard label="Demanda Total" icon={TrendingUp}
                        value={totalDem.toLocaleString('pt-BR')} accent
                        sub={`${meses.length} meses planejados`}/>
                      <KpiCard label="Capacidade Total" icon={Target}
                        value={Math.round(totalCap).toLocaleString('pt-BR')}
                        sub={`${costureiros.length} costureiros`}/>
                      <KpiCard label="Utilização Média" icon={BarChart2}
                        value={`${mediaUtil.toFixed(1)}%`}
                        accent={mediaUtil<=85} alert={mediaUtil>100}
                        sub={mediaUtil>100?'Acima da capacidade':mediaUtil>85?'Atenção: próximo do limite':'Dentro da capacidade'}/>
                      <KpiCard label="Mês Gargalo" icon={AlertTriangle}
                        value={mesGargalo}
                        alert={gargaloUtil>100} accent={gargaloUtil<=85}
                        sub={`${gargaloUtil.toFixed(1)}% de utilização`}/>
                      <KpiCard label="Gap Acumulado" icon={Activity}
                        value={Math.round(totalCap-totalDem).toLocaleString('pt-BR')}
                        accent={totalCap>=totalDem} alert={totalCap<totalDem}
                        sub={totalCap>=totalDem?'Capacidade suficiente':'Déficit de capacidade'}/>
                    </div>

                    {/* Gráficos linha 1 */}
                    <div style={{flex:1,minHeight:0}}>

                      {/* Demanda empilhada por canal + linha capacidade */}
                      <div style={{background:K.bg2,border:`1px solid ${K.border}`,borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                        display:'flex',flexDirection:'column',overflow:'hidden',height:'100%'}}>
                        <div style={{padding:'10px 18px',borderBottom:`1px solid ${K.border}`,
                          display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
                          <span style={{fontSize:14,fontWeight:700,color:K.t2,textTransform:'uppercase',
                            letterSpacing:'0.1em'}}>Demanda por Canal vs Capacidade (peças)</span>
                          <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                            {canais.map((c,ci)=>{
                              const cs=[K.blue,K.purple,K.green,K.amber,K.teal];
                              return <span key={c} style={{display:'flex',alignItems:'center',gap:4,fontSize:14,color:K.t1}}>
                                <span style={{width:10,height:10,borderRadius:2,background:cs[ci%cs.length],display:'inline-block'}}/>
                                {c}
                              </span>;
                            })}
                            <span style={{display:'flex',alignItems:'center',gap:4,fontSize:14,color:K.t1}}>
                              <span style={{width:18,height:2,background:K.teal,display:'inline-block'}}/>Cap.
                            </span>
                          </div>
                        </div>
                        <div style={{flex:1,padding:'8px',minHeight:0}}>
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{top:8,right:12,left:4,bottom:0}}
                              barCategoryGap="25%">
                              {grid}
                              <XAxis dataKey="mes" axisLine={false} tickLine={false}
                                tick={{fill:K.t2,fontSize:14,fontFamily:K.font}}/>
                              <YAxis hide/>
                              <Tooltip contentStyle={{background:K.bg2,border:`1px solid ${K.border2}`,
                                borderRadius:8,fontSize:14}} labelStyle={{color:K.t0}} itemStyle={{color:K.t0}}
                                formatter={(v,n)=>[v>0?v.toLocaleString('pt-BR'):'—',n]} cursor={false}/>
                              {canais.map((c,i) => (
                                <Bar key={c} dataKey={c} stackId="dem" name={c}
                                  fill={getCanalFill(c)} stroke={getCanalColor(c)} strokeWidth={1.5} radius={i===canais.length-1?[3,3,0,0]:[0,0,0,0]}
                                  barSize={56}>
                                  {i===canais.length-1 && (
                                    <LabelList dataKey={c} position="top"
                                      content={(props)=>{
                                        const {x,y,width,index} = props;
                                        const tot = canais.reduce((s,cc)=>s+(chartData[index]?.[cc]||0),0);
                                        if(!tot) return null;
                                        return (
                                          <text x={x+(width/2)} y={y-6} textAnchor="middle"
                                            fill={K.t0} fontSize={14} fontFamily={K.font}>
                                            {tot.toLocaleString('pt-BR')}
                                          </text>
                                        );
                                      }}/>
                                  )}
                                </Bar>
                              ))}

                              <Line dataKey="Capacidade" name="Capacidade" type="monotone"
                                stroke={K.teal} strokeWidth={2.5} strokeDasharray="5 3"
                                dot={{r:4,fill:K.bg2,stroke:K.teal,strokeWidth:2}}/>
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {tabSop==='PLANEJAMENTO' && (<>
                    {/* Gráficos linha 2 */}
                    <div style={{display:'grid',gridTemplateColumns:'3fr 1fr',gap:12,flexShrink:0}}>

                      {/* Demanda por família */}
                      <div style={{background:K.bg2,border:`1px solid ${K.border}`,borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                        display:'flex',flexDirection:'column',overflow:'hidden'}}>
                        <div style={{padding:'10px 18px',borderBottom:`1px solid ${K.border}`,
                          display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
                          <span style={{fontSize:14,fontWeight:700,color:K.t2,textTransform:'uppercase',
                            letterSpacing:'0.1em'}}>Demanda por Família de Produto</span>
                          <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                            {familias.map((f,i)=>(
                              <span key={f} style={{display:'flex',alignItems:'center',gap:4,fontSize:14,color:K.t1}}>
                                <span style={{width:10,height:10,borderRadius:2,display:'inline-block',
                                  background:famColors[i%famColors.length].fill,border:`1px solid ${famColors[i%famColors.length].stroke}`}}/>
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div style={{height:190,padding:'8px',minHeight:0}}>
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={familiaChartData} margin={{top:20,right:8,left:4,bottom:0}}
                              barCategoryGap="25%">
                              {grid}
                              <XAxis dataKey="mes" axisLine={false} tickLine={false}
                                tick={{fill:K.t2,fontSize:14,fontFamily:K.font}}/>
                              <YAxis hide/>
                              <Tooltip contentStyle={{background:K.bg2,border:`1px solid ${K.border2}`,
                                borderRadius:8,fontSize:14}} labelStyle={{color:K.t0}} itemStyle={{color:K.t0}}
                                formatter={(v,n)=>n==='_cap'?[v.toLocaleString('pt-BR'),'Capacidade']:[v>0?v.toLocaleString('pt-BR'):'—',n]} cursor={false}/>
                              {familias.map((f,i)=>(
                                <Bar key={f} dataKey={f} stackId="fam" name={f}
                                  fill={famColors[i%famColors.length].fill} stroke={famColors[i%famColors.length].stroke} strokeWidth={1.5}
                                  radius={i===familias.length-1?[3,3,0,0]:[0,0,0,0]} barSize={48}>
                                  {i===familias.length-1 && (
                                    <LabelList
                                      formatter={(v,entry)=>{
                                        const idx = entry?.index??-1;
                                        const tot = familias.reduce((s,f2)=>s+(familiaChartData[idx]?.[f2]||0),0);
                                        return tot>0?(tot/1000).toFixed(0)+'k':'';
                                      }}
                                      position="top" fill={K.t1} style={{fontSize:14,fontWeight:400}}/>
                                  )}
                                </Bar>
                              ))}

                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Cap vs Dem por família */}
                      <Panel title="Demanda por Família (total período)">
                        <div style={{height:190,padding:'8px 4px 8px 8px',minHeight:0}}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={capFamiliaData} layout="vertical"
                              margin={{top:4,right:60,left:4,bottom:4}}>
                              <XAxis type="number" hide/>
                              <YAxis dataKey="familia" type="category" width={120}
                                axisLine={false} tickLine={false}
                                tick={{fill:K.t1,fontSize:14,fontFamily:K.font}}/>
                              <Tooltip contentStyle={{background:K.bg2,border:`1px solid ${K.border2}`,
                                borderRadius:8,fontSize:14}} labelStyle={{color:K.t0}} itemStyle={{color:K.t0}}
                                formatter={v=>v.toLocaleString('pt-BR')} cursor={false}/>
                              <Bar dataKey="dem" name="Demanda" fill={K.tealD} stroke={K.teal}
                                strokeWidth={1} radius={[0,3,3,0]} barSize={14}>
                                <LabelList dataKey="dem" position="right"
                                  fill={K.t0} style={{fontSize:14,fontWeight:400}}
                                  formatter={v=>(v/1000).toFixed(0)+'k'}/>
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Panel>
                    </div>

                    </>)}

                    {tabSop==='PL_SOP' && (<>
                    {/* ── Dados filtrados PL ── */}
                    {(()=>{
                      const plCanalKey = Object.keys(demByCanal).find(c=>normalize(c).includes('PRIVATE LABEL')||normalize(c).includes('PRIVATELABEL'))||'';
                      const plDemByFamilia = {};
                      (demByClienteFamilia||[]).filter(r=>normalize(r.canal||'').includes('PRIVATE LABEL')||normalize(r.canal||'').includes('PRIVATELABEL')).forEach(r=>{
                        if(!plDemByFamilia[r.familia]) plDemByFamilia[r.familia]=meses.map(()=>0);
                        r.qtdes.forEach((q,i)=>plDemByFamilia[r.familia][i]+=q);
                      });
                      const plFamilias = Object.keys(plDemByFamilia).sort();
                      const plChartData = meses.map((mes,i)=>{
                        const d={mes};
                        plFamilias.forEach(f=>{ d[f]=plDemByFamilia[f]?.[i]||0; });
                        d['Capacidade']=totalCapacidade[i]||0;
                        d['PL Total']=(demByCanal[plCanalKey]?.[i])||0;
                        return d;
                      });
                      const plCapFamData = plFamilias.map(f=>({
                        familia:f.length>14?f.slice(0,13)+'…':f, familiaFull:f,
                        cap:(capByFamilia[f]||[]).reduce((a,b)=>a+b,0),
                        dem:(plDemByFamilia[f]||[]).reduce((a,b)=>a+b,0),
                      }));
                      return (<>
                    {/* Gráficos linha 2 */}
                    <div style={{display:'grid',gridTemplateColumns:'3fr 1fr',gap:12,flexShrink:0}}>

                      {/* Demanda por família */}
                      <div style={{background:K.bg2,border:`1px solid ${K.border}`,borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                        display:'flex',flexDirection:'column',overflow:'hidden'}}>
                        <div style={{padding:'10px 18px',borderBottom:`1px solid ${K.border}`,
                          display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
                          <span style={{fontSize:14,fontWeight:700,color:K.t2,textTransform:'uppercase',
                            letterSpacing:'0.1em'}}>Demanda por Família de Produto</span>
                          <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                            {plFamilias.map((f,i)=>(
                              <span key={f} style={{display:'flex',alignItems:'center',gap:4,fontSize:14,color:K.t1}}>
                                <span style={{width:10,height:10,borderRadius:2,display:'inline-block',
                                  background:famColors[i%famColors.length].fill,border:`1px solid ${famColors[i%famColors.length].stroke}`}}/>
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div style={{height:190,padding:'8px',minHeight:0}}>
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={plChartData} margin={{top:20,right:8,left:4,bottom:0}}
                              barCategoryGap="25%">
                              {grid}
                              <XAxis dataKey="mes" axisLine={false} tickLine={false}
                                tick={{fill:K.t2,fontSize:14,fontFamily:K.font}}/>
                              <YAxis hide/>
                              <Tooltip contentStyle={{background:K.bg2,border:`1px solid ${K.border2}`,
                                borderRadius:8,fontSize:14}} labelStyle={{color:K.t0}} itemStyle={{color:K.t0}}
                                formatter={(v,n)=>n==='_cap'?[v.toLocaleString('pt-BR'),'Capacidade']:[v>0?v.toLocaleString('pt-BR'):'—',n]} cursor={false}/>
                              {plFamilias.map((f,i)=>(
                                <Bar key={f} dataKey={f} stackId="fam" name={f}
                                  fill={famColors[i%famColors.length].fill} stroke={famColors[i%famColors.length].stroke} strokeWidth={1.5}
                                  radius={i===plFamilias.length-1?[3,3,0,0]:[0,0,0,0]} barSize={48}>
                                  {i===familias.length-1 && (
                                    <LabelList
                                      formatter={(v,entry)=>{
                                        const idx = entry?.index??-1;
                                        const tot = plFamilias.reduce((s,f2)=>s+(plChartData[idx]?.[f2]||0),0);
                                        return tot>0?(tot/1000).toFixed(0)+'k':'';
                                      }}
                                      position="top" fill={K.t1} style={{fontSize:14,fontWeight:400}}/>
                                  )}
                                </Bar>
                              ))}

                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Cap vs Dem por família */}
                      <Panel title="Demanda por Família (total período)">
                        <div style={{height:190,padding:'8px 4px 8px 8px',minHeight:0}}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={plCapFamData} layout="vertical"
                              margin={{top:4,right:60,left:4,bottom:4}}>
                              <XAxis type="number" hide/>
                              <YAxis dataKey="familia" type="category" width={120}
                                axisLine={false} tickLine={false}
                                tick={{fill:K.t1,fontSize:14,fontFamily:K.font}}/>
                              <Tooltip contentStyle={{background:K.bg2,border:`1px solid ${K.border2}`,
                                borderRadius:8,fontSize:14}} labelStyle={{color:K.t0}} itemStyle={{color:K.t0}}
                                formatter={v=>v.toLocaleString('pt-BR')} cursor={false}/>
                              <Bar dataKey="dem" name="Demanda" fill={K.tealD} stroke={K.teal}
                                strokeWidth={1} radius={[0,3,3,0]} barSize={14}>
                                <LabelList dataKey="dem" position="right"
                                  fill={K.t0} style={{fontSize:14,fontWeight:400}}
                                  formatter={v=>(v/1000).toFixed(0)+'k'}/>
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Panel>
                    </div>

                    </>);})()}
                    </> )}


                    {tabSop==='TABELA' && (
                    <div style={{flex:1,background:K.bg2,border:`1px solid ${K.border}`,borderRadius:12,
                      overflow:'hidden auto'}}>
                      <div style={{padding:'10px 18px',borderBottom:`1px solid ${K.border}`,
                        fontSize:14,fontWeight:700,color:K.t1,textTransform:'uppercase',
                        letterSpacing:'0.1em'}}>Tabela Consolidada S&OP</div>
                      <div style={{overflowX:'auto'}}>
                        <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
                          <thead>
                            <tr style={{background:K.bg3,borderBottom:`1px solid ${K.border}`}}>
                              <th style={{padding:'8px 16px',textAlign:'left',color:K.t2,fontWeight:700,
                                textTransform:'uppercase',letterSpacing:'0.06em',width:160,whiteSpace:'nowrap'}}>Linha</th>
                              {meses.map(m=>(
                                <th key={m} style={{padding:'8px 12px',textAlign:'right',color:K.t2,
                                  fontWeight:700,textTransform:'uppercase',letterSpacing:'0.04em',whiteSpace:'nowrap'}}>{m}</th>
                              ))}
                              <th style={{padding:'8px 12px',textAlign:'right',color:K.t2,fontWeight:700,
                                textTransform:'uppercase',letterSpacing:'0.04em',whiteSpace:'nowrap'}}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Canais */}
                            {canais.map((c,ci)=>(
                              <tr key={c} style={{borderBottom:`1px solid ${K.border}`,
                                background:ci%2===0?K.bg2:K.bg3}}>
                                <td style={{padding:'8px 16px',color:getCanalColor(c),fontWeight:600}}>
                                  {c}
                                </td>
                                {meses.map((_,i)=>(
                                  <td key={i} style={{padding:'8px 12px',textAlign:'right',color:getCanalColor(c)}}>
                                    {(demByCanal[c]?.[i]||0)>0?(demByCanal[c][i]).toLocaleString('pt-BR'):'—'}
                                  </td>
                                ))}
                                <td style={{padding:'8px 12px',textAlign:'right',color:getCanalColor(c),fontWeight:700}}>
                                  {(demByCanal[c]||[]).reduce((a,b)=>a+b,0).toLocaleString('pt-BR')}
                                </td>
                              </tr>
                            ))}
                            {/* Total Demanda */}
                            <tr style={{borderBottom:`2px solid ${K.border2}`,background:K.bg2}}>
                              <td style={{padding:'8px 16px',color:K.t0,fontWeight:800}}>Total Demanda</td>
                              {totalDemanda.map((v,i)=>(
                                <td key={i} style={{padding:'8px 12px',textAlign:'right',color:K.t0,fontWeight:700}}>
                                  {v>0?v.toLocaleString('pt-BR'):'—'}
                                </td>
                              ))}
                              <td style={{padding:'8px 12px',textAlign:'right',color:K.t0,fontWeight:800}}>
                                {totalDem.toLocaleString('pt-BR')}
                              </td>
                            </tr>
                            {/* Capacidade */}
                            <tr style={{borderBottom:`1px solid ${K.border}`,background:K.bg2}}>
                              <td style={{padding:'8px 16px',color:K.teal,fontWeight:600}}>Capacidade</td>
                              {totalCapacidade.map((v,i)=>(
                                <td key={i} style={{padding:'8px 12px',textAlign:'right',color:K.amber}}>
                                  {Math.round(v).toLocaleString('pt-BR')}
                                </td>
                              ))}
                              <td style={{padding:'8px 12px',textAlign:'right',color:K.amber,fontWeight:700}}>
                                {Math.round(totalCap).toLocaleString('pt-BR')}
                              </td>
                            </tr>
                            {/* Gap */}
                            <tr style={{borderBottom:`1px solid ${K.border}`,background:K.bg3}}>
                              <td style={{padding:'8px 16px',color:K.t1,fontWeight:600}}>Gap (Cap − Dem)</td>
                              {gap.map((v,i)=>(
                                <td key={i} style={{padding:'8px 12px',textAlign:'right',
                                  color:v<0?K.red:K.green,fontWeight:v<0?700:400}}>
                                  {Math.round(v).toLocaleString('pt-BR')}
                                </td>
                              ))}
                              <td style={{padding:'8px 12px',textAlign:'right',
                                color:totalCap-totalDem<0?K.red:K.green,fontWeight:700}}>
                                {Math.round(totalCap-totalDem).toLocaleString('pt-BR')}
                              </td>
                            </tr>
                            {/* Utilização */}
                            <tr style={{background:K.bg2}}>
                              <td style={{padding:'8px 16px',color:K.t1,fontWeight:600}}>Utilização %</td>
                              {utilizacoes.map((v,i)=>(
                                <td key={i} style={{padding:'8px 12px',textAlign:'right',
                                  color:v>100?K.red:v>85?K.amber:K.green,fontWeight:v>100?700:400}}>
                                  {v>0?`${v.toFixed(1)}%`:'—'}
                                </td>
                              ))}
                              <td style={{padding:'8px 12px',textAlign:'right',
                                color:mediaUtil>100?K.red:mediaUtil>85?K.amber:K.green,fontWeight:700}}>
                                {`${mediaUtil.toFixed(1)}%`}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    )}

                  </div>
                );
              })()}
            </div>
          )}

          {/* CSV Export Modal */}
          {cobCsvOpen && (
            <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:9000,
              display:'flex',alignItems:'center',justifyContent:'center'}}
              onClick={()=>setCobCsvOpen(false)}>
              <div style={{background:K.bg2,border:`1px solid ${K.border}`,borderRadius:16,
                padding:24,width:580,maxHeight:'80vh',display:'flex',flexDirection:'column',gap:12}}
                onClick={e=>e.stopPropagation()}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontSize:15,fontWeight:700,color:K.t0}}>CSV — Cobertura</span>
                  <button onClick={()=>setCobCsvOpen(false)}
                    style={{background:'transparent',border:'none',cursor:'pointer',color:K.t2,fontSize:20}}>✕</button>
                </div>
                <span style={{fontSize:13,color:K.t2}}>Selecione tudo e cole no Excel (Ctrl+A → Ctrl+C)</span>
                <textarea readOnly value={cobCsvText}
                  onClick={e=>e.target.select()}
                  style={{flex:1,minHeight:300,fontFamily:'monospace',fontSize:12,
                    background:K.bg3,border:`1px solid ${K.border}`,borderRadius:8,
                    padding:10,color:K.t0,resize:'none',outline:'none'}}/>
                <button onClick={()=>{navigator.clipboard.writeText(cobCsvText).then(()=>setCobCsvOpen(false));}}
                  style={{height:36,borderRadius:8,cursor:'pointer',fontFamily:K.font,
                    fontSize:14,fontWeight:600,background:K.tealD,border:`1px solid ${K.teal}`,color:K.teal}}>
                  Copiar para Clipboard
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════ VISÃO EXECUTIVA ═══════════════════════════ */}
          {activeDash==='EXECPLTESTE' && (()=>{

            // ---- Filtro PL: colecao === 'PRIVATE LABEL' ----------------------------------
            const wipPL = dataWip.filter(i => normalize(i.colecao||'') === 'PRIVATE LABEL');

            // ---- KPIs WIP PL ----------------------------------------------------------------------------------------
            const totalPecas      = wipPL.reduce((s,i)=>s+i.quantidade, 0);
            const totalOFs        = new Set(wipPL.map(i=>i.of)).size;
            const totalRefs       = new Set(wipPL.map(i=>i.ref)).size;
            const criticos15      = wipPL.filter(i=>i.diasNoSetor>15);
            const criticos30      = wipPL.filter(i=>i.diasNoSetor>30);
            const preCorte        = wipPL.filter(i=>i.fluxo==='PRÉ'||i.fluxo==='PRE');
            const posCorte        = wipPL.filter(i=>i.fluxo==='PÓS'||i.fluxo==='POS');
            const pecasPreCorte   = preCorte.reduce((s,i)=>s+i.quantidade,0);
            const pecasPosCorte   = posCorte.reduce((s,i)=>s+i.quantidade,0);

            // ---- Faturamento PL ----------------------------------------------------------------------------------
            const fatPLVal  = fatKpis.pl.val;
            const atingPL   = GOAL_PRIVATE>0?(fatPLVal/GOAL_PRIVATE)*100:0;
            const gapPL     = Math.max(0, GOAL_PRIVATE - fatPLVal);
            const hoje      = new Date();
            const diasRest  = new Date(hoje.getFullYear(),hoje.getMonth()+1,0).getDate()-hoje.getDate()+1;
            const ritmoPL   = diasRest>0?gapPL/diasRest:0;
            const colorPL   = atingPL>=100?K.green:atingPL>=70?K.amber:K.red;

            // ---- Producao (Panorama) ------------------------------------------------------------------------
            const realizado   = totalPan;
            const projecao    = potencial;
            const metaMensal  = MONTHLY_TARGET_PCS;
            const metaProp2   = metaProp;

            // ---- Em Processo: por setor ------------------------------------------------------------------
            const setoresMap = {};
            wipPL.forEach(i=>{
              if(!setoresMap[i.setor]) setoresMap[i.setor]={
                setor:i.setor, qty:0, ofs:new Set(), maxLt:0, fluxo:i.fluxo
              };
              setoresMap[i.setor].qty      += i.quantidade;
              setoresMap[i.setor].ofs.add(i.of);
              if(i.diasNoSetor>setoresMap[i.setor].maxLt) setoresMap[i.setor].maxLt=i.diasNoSetor;
            });
            const setoresArr = Object.values(setoresMap)
              .sort((a,b)=>b.qty-a.qty)
              .map(s=>({...s, nOfs:s.ofs.size}));

            // ---- Carteira: por periodo de entrega --------------------------------------------
            const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
            // Carteira por periodo (semana) com Pre e Pos corte
            const carteiraByPeriodo = {};
            wipPL.forEach(i=>{
              const p = i.entrega||'N/A';
              if(p==='N/A') return;
              if(!carteiraByPeriodo[p]) carteiraByPeriodo[p]={periodo:p,pre:0,pos:0,ofs:new Set()};
              if(i.fluxo==='PRE') carteiraByPeriodo[p].pre+=i.quantidade;
              else                carteiraByPeriodo[p].pos+=i.quantidade;
              carteiraByPeriodo[p].ofs.add(i.of);
            });
            const carteiraArr = Object.values(carteiraByPeriodo)
              .sort((a,b)=>a.periodo.localeCompare(b.periodo))
              .map(m=>({...m, total:m.pre+m.pos, nOfs:m.ofs.size}));

            // ---- Estoque PL por DescMarca (cliente) ----------------------------------------
            const estPL = dataEstoque.filter(i=>normalize(i.descColecao||'')==='PRIVATE LABEL');
            const estMarcaMap = {};
            estPL.forEach(i=>{
              const m = i.descMarca||i.marca||'Sem cliente';
              if(!estMarcaMap[m]) estMarcaMap[m]={cliente:m,qtde:0,custo:0,lento:0,refs:new Set()};
              estMarcaMap[m].qtde  += i.qtde;
              estMarcaMap[m].custo += i.qtde*(i.custo||0);
              estMarcaMap[m].refs.add(i.codigo);
              if(i.dias>60) estMarcaMap[m].lento += i.qtde;
            });
            const estPLArr = Object.values(estMarcaMap)
              .sort((a,b)=>b.qtde-a.qtde)
              .map(m=>({...m, nRefs:m.refs.size}));
            const estPLTotal = estPL.reduce((s,i)=>s+i.qtde, 0);
            const estPLCusto = estPL.reduce((s,i)=>s+i.qtde*(i.custo||0), 0);

            // ---- Top refs PL ----------------------------------------------------------------------------------------
            const refsMap = {};
            wipPL.forEach(i=>{
              if(!refsMap[i.ref]) refsMap[i.ref]={ref:i.ref,descricao:i.descricao,qty:0,ofs:new Set(),maxLt:0};
              refsMap[i.ref].qty+=i.quantidade;
              refsMap[i.ref].ofs.add(i.of);
              if(i.diasNoSetor>refsMap[i.ref].maxLt) refsMap[i.ref].maxLt=i.diasNoSetor;
            });
            const topRefs = Object.values(refsMap).sort((a,b)=>b.qty-a.qty).slice(0,8).map(r=>({...r,nOfs:r.ofs.size}));

            return (
              <div style={{flex:1,display:'flex',flexDirection:'column',gap:14,overflow:'hidden'}}>

                {/* Tab bar */}
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                  borderBottom:`1px solid ${K.border}`,flexShrink:0,gap:4}}>
                  <Tab active={true} onClick={()=>{}}>Private Label</Tab>
                  <button onClick={()=>setPlInfoOpen(true)}
                    title="Fontes e Logica"
                    style={{background:'transparent',border:'none',cursor:'pointer',
                      color:K.t2,padding:'4px 10px',marginRight:4,borderRadius:8,
                      display:'flex',alignItems:'center',gap:4}}>
                    <Info size={14}/>
                  </button>
                </div>

                {/* Modal popup */}
                {plInfoOpen && (
                  <div style={{position:'fixed',inset:0,zIndex:999,display:'flex',alignItems:'center',justifyContent:'center'}}
                    onClick={()=>setPlInfoOpen(false)}>
                    <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.6)'}}/>
                    <div style={{position:'relative',background:K.bg1,border:`1px solid ${K.border2}`,
                      borderRadius:16,padding:'24px 28px',maxWidth:700,width:'90%',
                      maxHeight:'80vh',overflowY:'auto',boxShadow:'0 24px 64px rgba(0,0,0,0.6)'}}
                      onClick={e=>e.stopPropagation()}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
                        <span style={{fontSize:16,fontWeight:700,color:K.t0}}>Fontes e Logica — Aba PL</span>
                        <button onClick={()=>setPlInfoOpen(false)}
                          style={{background:'transparent',border:'none',cursor:'pointer',color:K.t2,fontSize:20,lineHeight:1}}>✕</button>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',gap:14}}>
                        {[
                          {titulo:'Gauge Faturamento', cor:K.teal, desc:`Arquivo: 3_-_Faturamento.csv | Canal = PRIVATE LABEL | Meta mensal: R$ ${GOAL_PRIVATE.toLocaleString('pt-BR')} | Acumulado no mes corrente`},
                          {titulo:'Card WIP', cor:K.teal, desc:'Arquivo: 2_-_WIP.csv | Filtro: Colecao = PRIVATE LABEL | Pre Corte = setores antes do corte (Tinturaria, Malha, Corte...) | Pos Corte = demais setores'},
                          {titulo:'Card Estoque', cor:K.teal, desc:'Arquivo: 4_-_Produto_acabado.csv | Filtro: Colecao = PRIVATE LABEL | Exibe total de pecas em estoque PL'},
                          {titulo:'Grafico Carteira PL', cor:K.amber, desc:`Arquivo: Pedidos_a_produzir_PL_Atualizado_com_Indatex.xlsx | Aba: Acompanhameto entrada de pedido | Valor Total x Data Cliente | Filtro: Posicao PCP ≠ FATURADO | Meses anteriores ao atual sao acumulados no mes corrente (rollover)`},
                          {titulo:'Barra Cobertura WIP', cor:K.amber, desc:'Base: WIP PL × R$ 34,03/peca | Setores pos-corte (Costura, Embalagem, Expedicao...) → mes atual | Tinturaria e Tecelagem → mes atual +2 | Demais setores → mes seguinte'},
                          {titulo:'Barra Faturado (azul)', cor:'#2E6DB4', desc:'Arquivo: 3_-_Faturamento.csv | Canal = PRIVATE LABEL | Agrupado por mes de emissao | Empilhado sobre a barra de cobertura'},
                        ].map((item,i)=>(
                          <div key={i} style={{display:'flex',gap:14,alignItems:'flex-start',
                            background:K.bg2,borderRadius:10,padding:'12px 16px',
                            borderLeft:`3px solid ${item.cor}`}}>
                            <div style={{flex:1}}>
                              <div style={{fontWeight:700,color:K.t0,marginBottom:4,fontSize:14}}>{item.titulo}</div>
                              <div style={{color:K.t2,fontSize:13,lineHeight:1.6}}>{item.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}






                {(!wipPL.length && !dataFat.length) ? (
                  <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:14}}>
                    <Factory size={44} color={K.t2}/>
                    <span style={{fontSize:14,color:K.t2}}>Carregue WIP e Faturamento para visualizar</span>
                  </div>
                ) : (
                  <div style={{flex:1,display:'flex',flexDirection:'column',gap:14,overflow:'auto',paddingRight:4}}>

                    {/* ---- LINHA 1: Gauge + Cards em uma linha ---- */}
                    <div style={{display:'grid',gridTemplateColumns:'auto auto 1fr',gap:12,flexShrink:0,alignItems:'stretch'}}>

                      {/* Gauge PL -- mesmo tamanho do Executivo */}
                      {(()=>{
                        const pct   = GOAL_PRIVATE>0?Math.min(100,(fatPLVal/GOAL_PRIVATE)*100):0;
                        const color = pct>=100?K.green:pct>=70?K.amber:K.red;
                        const W=300, H=175, cx=W/2, cy=H;
                        const R=130, strokeW=24;
                        const toRad = (deg) => (deg*Math.PI)/180;
                        const arcPath = (startDeg, endDeg, radius) => {
                          const s={x:cx+radius*Math.cos(toRad(startDeg)),y:cy+radius*Math.sin(toRad(startDeg))};
                          const e={x:cx+radius*Math.cos(toRad(endDeg)),  y:cy+radius*Math.sin(toRad(endDeg))};
                          const large=(endDeg-startDeg)>180?1:0;
                          return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
                        };
                        const endAngle = -180 + pct*1.8;
                        const fmtVal = (v) => `R$ ${Math.round(v/1000)+'k'}`;
                        return (
                          <div style={{background:K.bg2,border:`1px solid ${K.border}`,borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                            padding:'12px 16px 8px',borderTop:`3px solid ${K.teal}`,
                            display:'flex',flexDirection:'column',alignItems:'center'}}>
                            <div style={{display:'flex',justifyContent:'space-between',
                              alignItems:'center',width:'100%',marginBottom:4}}>
                              <span style={{fontSize:14,fontWeight:700,color:K.t2,
                                letterSpacing:'0.04em'}}>{'Faturamento -- '+['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][new Date().getMonth()]}</span>
                            </div>



                            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{overflow:'visible'}}>
                              <path d={arcPath(-180,0,R)} fill="none" stroke={K.border} strokeWidth={strokeW} strokeLinecap="butt"/>
                              {pct>0 && <path d={arcPath(-180,endAngle,R)} fill="none" stroke={K.teal} strokeWidth={strokeW} strokeLinecap="butt"/>}
                              <text x={cx-R} y={cy+18} textAnchor="middle" fill={K.t0} fontSize={14} fontFamily={K.font}>0%</text>
                              <text x={cx+R} y={cy+18} textAnchor="middle" fill={K.t0} fontSize={14} fontFamily={K.font}>100%</text>
                              <text x={cx} y={cy-55} textAnchor="middle" fill={K.t0} fontSize={28} fontWeight={400} fontFamily={K.font}>{fmtVal(fatPLVal)}</text>
                              {pct>0 && (() => {
                                const tipX = cx + (R+strokeW/2+10)*Math.cos((endAngle*Math.PI)/180);
                                const tipY = cy + (R+strokeW/2+10)*Math.sin((endAngle*Math.PI)/180);
                                return <text x={tipX} y={tipY} textAnchor="middle" fill={K.t0} fontSize={13} fontWeight={400} fontFamily={K.font}>{pct.toFixed(1)}%</text>;
                              })()}
                              <text x={cx} y={cy-6} textAnchor="middle" fill={K.t0} fontSize={14} fontFamily={K.font}>Meta {fmtVal(GOAL_PRIVATE)}</text>
                            </svg>
                          </div>
                        );
                      })()}









                      {/* Card WIP -- gauge pre/pos */}
                      {(()=>{
                        const pctPre = totalPecas>0?(pecasPreCorte/totalPecas)*100:0;
                        const pctPos = totalPecas>0?(pecasPosCorte/totalPecas)*100:0;
                        const W=300, H=200, cx=W/2, cy=H-26;
                        const R=130, strokeW=24;
                        const toRad = (deg) => (deg*Math.PI)/180;
                        const arcPath = (startDeg, endDeg, radius) => {
                          const s={x:cx+radius*Math.cos(toRad(startDeg)),y:cy+radius*Math.sin(toRad(startDeg))};
                          const e={x:cx+radius*Math.cos(toRad(endDeg)),  y:cy+radius*Math.sin(toRad(endDeg))};
                          const large=(endDeg-startDeg)>180?1:0;
                          return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
                        };
                        const preEnd = -180 + pctPre*1.8;
                        const posEnd = preEnd + pctPos*1.8;
                        return (
                          <div style={{background:K.bg2,border:`1px solid ${K.border}`,borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                            padding:'12px 16px 8px',borderTop:`3px solid ${K.teal}`,
                            display:'flex',flexDirection:'column',alignItems:'center'}}>
                            <div style={{display:'flex',justifyContent:'space-between',
                              alignItems:'center',width:'100%',marginBottom:2}}>
                              <span style={{fontSize:14,fontWeight:700,color:K.t2,textTransform:'uppercase',
                                letterSpacing:'0.04em'}}>WIP</span>
                              <span style={{fontSize:14,fontWeight:800,color:K.teal,padding:'2px 8px',
                                borderRadius:6,background:K.tealD}}>
                                {totalOFs} OFs
                              </span>
                            </div>
                            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{overflow:'visible'}}>
                              <path d={arcPath(-180,0,R)} fill="none" stroke={K.border2} strokeWidth={strokeW} strokeLinecap="butt"/>
                              {pctPre>0 && <path d={arcPath(-180,preEnd,R)} fill="none" stroke={K.amber} strokeWidth={strokeW} strokeLinecap="butt"/>}
                              {pctPos>0 && <path d={arcPath(preEnd,posEnd,R)} fill="none" stroke={K.teal} strokeWidth={strokeW} strokeLinecap="butt"/>}
                              <text x={cx} y={cy-55} textAnchor="middle" fill={K.t0} fontSize={28} fontWeight={400} fontFamily={K.font}>
                                {totalPecas.toLocaleString('pt-BR')}
                              </text>
                              <text x={cx} y={cy-6} textAnchor="middle" fill={K.t2} fontSize={15} fontFamily={K.font}>
                                {totalRefs} referencias
                              </text>
                              <rect x={cx-70} y={cy+8} width={10} height={10} fill={K.amber} rx={2}/>
                              <text x={cx-56} y={cy+17} fill={K.amber} fontSize={14} fontFamily={K.font} fontWeight={600}>
                                Pre {pecasPreCorte.toLocaleString('pt-BR')}
                              </text>
                              <rect x={cx+10} y={cy+8} width={10} height={10} fill={K.teal} rx={2}/>
                              <text x={cx+24} y={cy+17} fill={K.teal} fontSize={14} fontFamily={K.font} fontWeight={600}>
                                Pos {pecasPosCorte.toLocaleString('pt-BR')}
                              </text>
                            </svg>
                          </div>
                        );
                      })()}

                      {/* Card Estoque PL -- aging bars */}
                      {(()=>{
                        const diasMes2 = hoje.getDate();
                        const entrou   = estPL.filter(i=>i.dias<=diasMes2).reduce((s,i)=>s+i.qtde,0);
                        const entrouRefs = new Set(estPL.filter(i=>i.dias<=diasMes2).map(i=>i.codigo)).size;
                        const aging = [
                          {label:'0-15d',  qty:estPL.filter(i=>i.dias<=15).reduce((s,i)=>s+i.qtde,0), color:K.green},
                          {label:'16-30d', qty:estPL.filter(i=>i.dias>15&&i.dias<=30).reduce((s,i)=>s+i.qtde,0), color:K.blue},
                          {label:'31-60d', qty:estPL.filter(i=>i.dias>30&&i.dias<=60).reduce((s,i)=>s+i.qtde,0), color:K.amber},
                          {label:'+60d',   qty:estPL.filter(i=>i.dias>60).reduce((s,i)=>s+i.qtde,0), color:K.red},
                        ];
                        return (
                          <div style={{background:K.bg2,border:`1px solid ${K.border}`,borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                            padding:'12px 16px 8px',borderTop:`3px solid ${K.teal}`,
                            display:'flex',flexDirection:'column',gap:8}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                              <span style={{fontSize:14,fontWeight:700,color:K.t2,
                                letterSpacing:'0.04em'}}>Estoque</span>
                              <span style={{fontSize:22,fontWeight:400,color:K.t0}}>
                                {estPLTotal.toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <span style={{fontSize:14,color:K.t2}}>
                              {new Set(estPL.map(i=>i.codigo)).size} refs . Mes: <span style={{color:K.green,fontWeight:700}}>{entrou.toLocaleString('pt-BR')} pcs . {entrouRefs} refs</span>
                            </span>
                            {/* Aging bars */}
                            <div style={{display:'flex',flexDirection:'column',gap:5,marginTop:4}}>
                              {aging.map((a,i)=>{
                                const pct=estPLTotal>0?(a.qty/estPLTotal)*100:0;
                                return (
                                  <div key={i}>
                                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                                      <span style={{fontSize:14,color:a.color,fontWeight:600}}>{a.label}</span>
                                      <span style={{fontSize:14,color:K.t1,fontWeight:700}}>{a.qty.toLocaleString('pt-BR')} <span style={{color:K.t2,fontWeight:400}}>({pct.toFixed(0)}%)</span></span>
                                    </div>
                                    <div style={{height:5,borderRadius:3,background:K.border2}}>
                                      <div style={{height:'100%',borderRadius:3,background:a.color,width:`${pct}%`}}/>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}


                    </div>

                    {/* ---- LINHA 3: Carteira PL + Em Processo por setor ---- */}
                    <div style={{flex:1,display:'grid',gridTemplateColumns:'2fr 1fr',gap:14,minHeight:0}}>

                      {/* Carteira PL por Mes -- 2/3 */}
                      {(()=>{
                        // Setores que entregam no mes corrente
                        const SETORES_MES_CORRENTE = new Set([
                          'COSTURA','AGUARDANDO PARTES','EMBALAGEM','CD COSTURA','CASEADO/BOTAO',
                          'INSPECAO DE QUALIDADE','PREPARACAO GOLA/PE DE GOLA','SILK CARIMBO',
                          'EXPEDICAO','LAVANDERIA PECA PRONTA','ABERTURA LATERAL MAQUINAS',
                          'ESTAMPARIA','AGUARDANDO PEITILHO'
                        ].map(s=>{
                          // normalize: remove accents, uppercase
                          return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
                        }));
                        const normSetor = (s) => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();

                        const VALOR_MEDIO_PL = 34.03;
                        const hoje = new Date();
                        const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
                        const SETORES_MES_MAIS_DOIS = new Set(['TINTURARIA','TECELAGEM'].map(s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()));

                        const coberturaMap = {};
                        dataWip.filter(i=>normalize(i.colecao||'')==='PRIVATE LABEL').forEach(i=>{
                          const ns = normSetor(i.setor);
                          const mesesOffset = SETORES_MES_MAIS_DOIS.has(ns) ? 2 : SETORES_MES_CORRENTE.has(ns) ? 0 : 1;
                          const dt = new Date(hoje.getFullYear(), hoje.getMonth()+mesesOffset, 1);
                          const mes = `${MESES[dt.getMonth()]}/${String(dt.getFullYear()).slice(-2)}`;
                          const mesSort = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
                          if(!coberturaMap[mesSort]) coberturaMap[mesSort]={mes,mesSort,cobertura:0};
                          coberturaMap[mesSort].cobertura += (i.quantidade||0) * VALOR_MEDIO_PL;
                        });

                        // Faturamento PL por mes (do dataFat)
                        const fatPorMes = {};
                        dataFat.filter(i=>i.canal==='PRIVATE LABEL').forEach(i=>{
                          // i.dia = day of month, need year/month from dataFat reference
                          const ref = dataFat[0]?.data || '';
                          const parts = ref.split('/');
                          const mm = parts[1]||'01', yyyy = parts[2]||'2026';
                          const mes = `${MESES[parseInt(mm)-1]}/${String(yyyy).slice(-2)}`;
                          const mesSort = `${yyyy}-${String(mm).padStart(2,'0')}`;
                          if(!fatPorMes[mesSort]) fatPorMes[mesSort]={mes,mesSort,faturado:0};
                          fatPorMes[mesSort].faturado += i.valorLiq||0;
                        });

                        // Merge carteira + cobertura + faturado
                        const allKeys = new Set([
                          ...dataCarteiraPLTeste.map(m=>m.mesSort),
                          ...Object.keys(coberturaMap),
                          ...Object.keys(fatPorMes)
                        ]);
                        const mesSortAtual = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}`;
                        const mesAtualLabel = `${MESES[hoje.getMonth()]}/${String(hoje.getFullYear()).slice(-2)}`;

                        // Rollover: somar meses anteriores no mês atual
                        let rollover = 0;
                        const sortedKeys = [...allKeys].sort();
                        sortedKeys.forEach(key=>{
                          if(key < mesSortAtual){
                            const cart = dataCarteiraPLTeste.find(m=>m.mesSort===key);
                            rollover += cart?.valor || 0;
                          }
                        });

                        const chartData = sortedKeys
                          .filter(key => key >= mesSortAtual)
                          .map((key, idx)=>{
                            const cart = dataCarteiraPLTeste.find(m=>m.mesSort===key);
                            const cob  = coberturaMap[key];
                            const fat  = fatPorMes[key];
                            const valorBase = cart?.valor || 0;
                            return {
                              mes:       cart?.mes || cob?.mes || fat?.mes || mesAtualLabel,
                              mesSort:   key,
                              valor:     idx===0 ? valorBase + rollover : valorBase,
                              cobertura: cob?.cobertura || 0,
                              faturado:  fat?.faturado  || 0,
                            };
                          });

                        return (
                          <div style={{background:K.bg2,border:`1px solid ${K.border}`,borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                            display:'flex',flexDirection:'column',overflow:'hidden'}}>
                            <div style={{padding:'10px 18px',borderBottom:`1px solid ${K.border}`,
                              display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
                              <span style={{fontSize:14,fontWeight:700,color:K.t2,letterSpacing:'0.04em'}}>Carteira PL</span>
                              <span style={{fontSize:16,fontWeight:400,color:K.t0}}>
                                R$ {Math.round(chartData.reduce((s,m)=>s+m.valor,0)).toLocaleString('pt-BR',{maximumFractionDigits:0})}
                              </span>
                            </div>
                            {!chartData.length?(
                              <div style={{padding:'20px',textAlign:'center',color:K.t2,fontSize:14}}>
                                Carregue o arquivo de acompanhamento (.xlsx)
                              </div>
                            ):(
                              <div style={{flex:1,padding:'8px',minHeight:0}}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={chartData} margin={{top:22,right:8,left:4,bottom:0}} barCategoryGap="20%" barGap={4}>
                                    {grid}
                                    <XAxis dataKey="mes" axisLine={false} tickLine={false}
                                      tick={{fill:K.t0,fontSize:14,fontFamily:K.font,fontWeight:600}}/>
                                    <YAxis hide/>
                                    <Tooltip contentStyle={{background:K.bg2,border:`1px solid ${K.border2}`,
                                      borderRadius:8,fontSize:14}} labelStyle={{color:K.t0}} itemStyle={{color:K.t0}}
                                      formatter={(v,n)=>[`${Math.round(v/1000)}k`,n]} cursor={false}/>
                                    {/* Barra 1 — Carteira (pendente) */}
                                    <Bar dataKey="valor" name="Carteira" stackId="cart" fill={K.tealD} stroke={K.teal} strokeWidth={1} radius={[4,4,0,0]}>
                                      <LabelList dataKey="valor" position="top"
                                        content={(props)=>{
                                          const {x,y,width,value}=props;
                                          if(!value) return null;
                                          return <text x={x+width/2} y={y-6} textAnchor="middle"
                                            fill={K.t0} fontSize={14} fontFamily={K.font} fontWeight={600}>
                                            {`${Math.round(value/1000)}k`}
                                          </text>;
                                        }}/>
                                    </Bar>
                                    {/* Barra 2 — Cobertura WIP (base) + Faturado (topo) */}
                                    <Bar dataKey="cobertura" name="Cobertura WIP" stackId="cob" fill={K.amberD} stroke={K.amber} strokeWidth={1} radius={[0,0,0,0]}/>
                                    <Bar dataKey="faturado" name="Faturado" stackId="cob" fill={'#B8E6C8'} stroke={'#5AAF7A'} strokeWidth={1} radius={[4,4,0,0]}>
                                      <LabelList dataKey="faturado" position="top"
                                        content={(props)=>{
                                          const {x,y,width,value,index}=props;
                                          const total=(chartData[index]?.cobertura||0)+(value||0);
                                          if(!total) return null;
                                          return <text x={x+width/2} y={y-6} textAnchor="middle"
                                            fill={K.t0} fontSize={14} fontFamily={K.font} fontWeight={600}>
                                            {`${Math.round(total/1000)}k`}
                                          </text>;
                                        }}/>
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Em Processo por Setor -- 1/3 */}
                      <Panel title="Em Processo -- Setores PL">
                        <div style={{flex:1,padding:'8px',minHeight:0}}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={setoresArr} layout="vertical"
                              margin={{top:4,right:70,left:8,bottom:4}}>
                              <XAxis type="number" hide/>
                              <YAxis dataKey="setor" type="category" width={160}
                                axisLine={false} tickLine={false}
                                tick={(props)=>{
                                  const {x,y,payload}=props;
                                  const max=18;
                                  const txt=payload.value.length>max?payload.value.slice(0,max-1)+'...':payload.value;
                                  return <text x={x} y={y} dy={5} textAnchor="end"
                                    fill={K.t1} fontSize={14} fontFamily={K.font} fontWeight={600}>{txt}</text>;
                                }}/>
                              <Tooltip contentStyle={{background:K.bg2,border:`1px solid ${K.border2}`,
                                borderRadius:8,fontSize:14}} labelStyle={{color:K.t0}} itemStyle={{color:K.t0}}
                                formatter={(v,n)=>[v.toLocaleString('pt-BR'),n]} cursor={false}/>
                              <Bar dataKey="qty" radius={[0,4,4,0]} barSize={24}>
                                {setoresArr.map((d,i)=>{
                                  return <Cell key={i} fill={K.tealD} stroke={K.teal} strokeWidth={1.5}/>;
                                  const ltD=d.maxLt>30?K.redD:d.maxLt>15?K.amberD:K.purpleD;
                                  return <Cell key={i} fill={ltD} stroke={ltC} strokeWidth={1.5}/>;
                                })}
                                <LabelList dataKey="qty" position="right"
                                  content={(props)=>{
                                    const {x,y,width,height,value}=props;
                                    if(!value) return null;
                                    return <text x={x+width+6} y={y+height/2+5}
                                      fill={K.t1} fontSize={14} fontWeight={600} fontFamily={K.font}>
                                      {value.toLocaleString('pt-BR')}
                                    </text>;
                                  }}/>
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Panel>
                    </div>

                  </div>
                )}
              </div>
            );
          })()}
          {activeDash==='EXECNE' && (()=>{

            // ---- Filtro PL: colecao === 'PRIVATE LABEL' ----------------------------------
            const wipPL = dataWip.filter(i => normalize(i.colecao||'').includes('NEXT ELEVEN'));

            // ---- KPIs WIP PL ----------------------------------------------------------------------------------------
            const totalPecas      = wipPL.reduce((s,i)=>s+i.quantidade, 0);
            const totalOFs        = new Set(wipPL.map(i=>i.of)).size;
            const totalRefs       = new Set(wipPL.map(i=>i.ref)).size;
            const criticos15      = wipPL.filter(i=>i.diasNoSetor>15);
            const criticos30      = wipPL.filter(i=>i.diasNoSetor>30);
            const preCorte        = wipPL.filter(i=>i.fluxo==='PRÉ'||i.fluxo==='PRE');
            const posCorte        = wipPL.filter(i=>i.fluxo==='PÓS'||i.fluxo==='POS');
            const pecasPreCorte   = preCorte.reduce((s,i)=>s+i.quantidade,0);
            const pecasPosCorte   = posCorte.reduce((s,i)=>s+i.quantidade,0);

            // ---- Faturamento PL ----------------------------------------------------------------------------------
            const fatPLVal  = dataFat.filter(i=>normalize(i.canal||'').includes('NEXT ELEVEN')).reduce((s,i)=>s+i.valorLiq,0);
            const atingPL   = 0;
            const gapPL     = 0;
            const hoje      = new Date();
            const diasRest  = new Date(hoje.getFullYear(),hoje.getMonth()+1,0).getDate()-hoje.getDate()+1;
            const ritmoPL   = diasRest>0?gapPL/diasRest:0;
            const colorPL   = atingPL>=100?K.green:atingPL>=70?K.amber:K.red;

            // ---- Producao (Panorama) ------------------------------------------------------------------------
            const realizado   = totalPan;
            const projecao    = potencial;
            const metaMensal  = MONTHLY_TARGET_PCS;
            const metaProp2   = metaProp;

            // ---- Em Processo: por setor ------------------------------------------------------------------
            const setoresMap = {};
            wipPL.forEach(i=>{
              if(!setoresMap[i.setor]) setoresMap[i.setor]={
                setor:i.setor, qty:0, ofs:new Set(), maxLt:0, fluxo:i.fluxo
              };
              setoresMap[i.setor].qty      += i.quantidade;
              setoresMap[i.setor].ofs.add(i.of);
              if(i.diasNoSetor>setoresMap[i.setor].maxLt) setoresMap[i.setor].maxLt=i.diasNoSetor;
            });
            const setoresArr = Object.values(setoresMap)
              .sort((a,b)=>b.qty-a.qty)
              .map(s=>({...s, nOfs:s.ofs.size}));

            // ---- Carteira: por periodo de entrega --------------------------------------------
            const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
            // Carteira por periodo (semana) com Pre e Pos corte
            const carteiraByPeriodo = {};
            wipPL.forEach(i=>{
              const p = i.entrega||'N/A';
              if(p==='N/A') return;
              if(!carteiraByPeriodo[p]) carteiraByPeriodo[p]={periodo:p,pre:0,pos:0,ofs:new Set()};
              if(i.fluxo==='PRE') carteiraByPeriodo[p].pre+=i.quantidade;
              else                carteiraByPeriodo[p].pos+=i.quantidade;
              carteiraByPeriodo[p].ofs.add(i.of);
            });
            const carteiraArr = Object.values(carteiraByPeriodo)
              .sort((a,b)=>a.periodo.localeCompare(b.periodo))
              .map(m=>({...m, total:m.pre+m.pos, nOfs:m.ofs.size}));

            // ---- Estoque PL por DescMarca (cliente) ----------------------------------------
            const estPL = dataEstoque.filter(i=>normalize(i.descColecao||'').includes('NEXT ELEVEN'));
            const estMarcaMap = {};
            estPL.forEach(i=>{
              const m = i.descMarca||i.marca||'Sem cliente';
              if(!estMarcaMap[m]) estMarcaMap[m]={cliente:m,qtde:0,custo:0,lento:0,refs:new Set()};
              estMarcaMap[m].qtde  += i.qtde;
              estMarcaMap[m].custo += i.qtde*(i.custo||0);
              estMarcaMap[m].refs.add(i.codigo);
              if(i.dias>60) estMarcaMap[m].lento += i.qtde;
            });
            const estPLArr = Object.values(estMarcaMap)
              .sort((a,b)=>b.qtde-a.qtde)
              .map(m=>({...m, nRefs:m.refs.size}));
            const estPLTotal = estPL.reduce((s,i)=>s+i.qtde, 0);
            const estPLCusto = estPL.reduce((s,i)=>s+i.qtde*(i.custo||0), 0);

            // ---- Top refs PL ----------------------------------------------------------------------------------------
            const refsMap = {};
            wipPL.forEach(i=>{
              if(!refsMap[i.ref]) refsMap[i.ref]={ref:i.ref,descricao:i.descricao,qty:0,ofs:new Set(),maxLt:0};
              refsMap[i.ref].qty+=i.quantidade;
              refsMap[i.ref].ofs.add(i.of);
              if(i.diasNoSetor>refsMap[i.ref].maxLt) refsMap[i.ref].maxLt=i.diasNoSetor;
            });
            const topRefs = Object.values(refsMap).sort((a,b)=>b.qty-a.qty).slice(0,8).map(r=>({...r,nOfs:r.ofs.size}));

            return (
              <div style={{flex:1,display:'flex',flexDirection:'column',gap:14,overflow:'hidden'}}>

                {/* Tab bar */}
                <div style={{display:'flex',alignItems:'center',
                  borderBottom:`1px solid ${K.border}`,flexShrink:0,gap:4}}>
                  <Tab active={true} onClick={()=>{}}>Next Eleven</Tab>
                </div>






                {(!wipPL.length && !dataFat.length) ? (
                  <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:14}}>
                    <Factory size={44} color={K.t2}/>
                    <span style={{fontSize:14,color:K.t2}}>Carregue WIP e Faturamento para visualizar</span>
                  </div>
                ) : (
                  <div style={{flex:1,display:'flex',flexDirection:'column',gap:14,overflow:'auto',paddingRight:4}}>

                    {/* ---- LINHA 1: Gauge + Cards em uma linha ---- */}
                    <div style={{display:'grid',gridTemplateColumns:'auto auto 1fr',gap:12,flexShrink:0,alignItems:'stretch'}}>

                      {/* Gauge PL -- mesmo tamanho do Executivo */}
                      {(()=>{
                        const pct   = GOAL_PRIVATE>0?Math.min(100,(fatPLVal/GOAL_PRIVATE)*100):0;
                        const color = pct>=100?K.green:pct>=70?K.amber:K.red;
                        const W=300, H=175, cx=W/2, cy=H;
                        const R=130, strokeW=24;
                        const toRad = (deg) => (deg*Math.PI)/180;
                        const arcPath = (startDeg, endDeg, radius) => {
                          const s={x:cx+radius*Math.cos(toRad(startDeg)),y:cy+radius*Math.sin(toRad(startDeg))};
                          const e={x:cx+radius*Math.cos(toRad(endDeg)),  y:cy+radius*Math.sin(toRad(endDeg))};
                          const large=(endDeg-startDeg)>180?1:0;
                          return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
                        };
                        const endAngle = -180 + pct*1.8;
                        const fmtVal = (v) => `R$ ${Math.round(v/1000)+'k'}`;
                        return (
                          <div style={{background:K.bg2,border:`1px solid ${K.border}`,borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                            padding:'12px 16px 8px',borderTop:`3px solid ${K.teal}`,
                            display:'flex',flexDirection:'column',alignItems:'center'}}>
                            <div style={{display:'flex',justifyContent:'space-between',
                              alignItems:'center',width:'100%',marginBottom:4}}>
                              <span style={{fontSize:14,fontWeight:700,color:K.t2,
                                letterSpacing:'0.04em'}}>{'Faturamento -- '+['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][new Date().getMonth()]}</span>
                            </div>



                            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{overflow:'visible'}}>
                              <path d={arcPath(-180,0,R)} fill="none" stroke={K.border} strokeWidth={strokeW} strokeLinecap="butt"/>
                              {pct>0 && <path d={arcPath(-180,endAngle,R)} fill="none" stroke={K.teal} strokeWidth={strokeW} strokeLinecap="butt"/>}
                              <text x={cx-R} y={cy+18} textAnchor="middle" fill={K.t0} fontSize={14} fontFamily={K.font}>0%</text>
                              <text x={cx+R} y={cy+18} textAnchor="middle" fill={K.t0} fontSize={14} fontFamily={K.font}>100%</text>
                              <text x={cx} y={cy-55} textAnchor="middle" fill={K.t0} fontSize={28} fontWeight={400} fontFamily={K.font}>{fmtVal(fatPLVal)}</text>
                              {pct>0 && (() => {
                                const tipX = cx + (R+strokeW/2+10)*Math.cos((endAngle*Math.PI)/180);
                                const tipY = cy + (R+strokeW/2+10)*Math.sin((endAngle*Math.PI)/180);
                                return <text x={tipX} y={tipY} textAnchor="middle" fill={K.t0} fontSize={13} fontWeight={400} fontFamily={K.font}>{pct.toFixed(1)}%</text>;
                              })()}
                              <text x={cx} y={cy-6} textAnchor="middle" fill={K.t0} fontSize={14} fontFamily={K.font}>Meta {fmtVal(0)}</text>
                            </svg>
                          </div>
                        );
                      })()}









                      {/* Card WIP -- gauge pre/pos */}
                      {(()=>{
                        const pctPre = totalPecas>0?(pecasPreCorte/totalPecas)*100:0;
                        const pctPos = totalPecas>0?(pecasPosCorte/totalPecas)*100:0;
                        const W=300, H=200, cx=W/2, cy=H-26;
                        const R=130, strokeW=24;
                        const toRad = (deg) => (deg*Math.PI)/180;
                        const arcPath = (startDeg, endDeg, radius) => {
                          const s={x:cx+radius*Math.cos(toRad(startDeg)),y:cy+radius*Math.sin(toRad(startDeg))};
                          const e={x:cx+radius*Math.cos(toRad(endDeg)),  y:cy+radius*Math.sin(toRad(endDeg))};
                          const large=(endDeg-startDeg)>180?1:0;
                          return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
                        };
                        const preEnd = -180 + pctPre*1.8;
                        const posEnd = preEnd + pctPos*1.8;
                        return (
                          <div style={{background:K.bg2,border:`1px solid ${K.border}`,borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                            padding:'12px 16px 8px',borderTop:`3px solid ${K.teal}`,
                            display:'flex',flexDirection:'column',alignItems:'center'}}>
                            <div style={{display:'flex',justifyContent:'space-between',
                              alignItems:'center',width:'100%',marginBottom:2}}>
                              <span style={{fontSize:14,fontWeight:700,color:K.t2,textTransform:'uppercase',
                                letterSpacing:'0.04em'}}>WIP</span>
                              <span style={{fontSize:14,fontWeight:800,color:K.teal,padding:'2px 8px',
                                borderRadius:6,background:K.tealD}}>
                                {totalOFs} OFs
                              </span>
                            </div>
                            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{overflow:'visible'}}>
                              <path d={arcPath(-180,0,R)} fill="none" stroke={K.border2} strokeWidth={strokeW} strokeLinecap="butt"/>
                              {pctPre>0 && <path d={arcPath(-180,preEnd,R)} fill="none" stroke={K.amber} strokeWidth={strokeW} strokeLinecap="butt"/>}
                              {pctPos>0 && <path d={arcPath(preEnd,posEnd,R)} fill="none" stroke={K.teal} strokeWidth={strokeW} strokeLinecap="butt"/>}
                              <text x={cx} y={cy-55} textAnchor="middle" fill={K.t0} fontSize={28} fontWeight={400} fontFamily={K.font}>
                                {totalPecas.toLocaleString('pt-BR')}
                              </text>
                              <text x={cx} y={cy-6} textAnchor="middle" fill={K.t2} fontSize={15} fontFamily={K.font}>
                                {totalRefs} referencias
                              </text>
                              <rect x={cx-70} y={cy+8} width={10} height={10} fill={K.amber} rx={2}/>
                              <text x={cx-56} y={cy+17} fill={K.amber} fontSize={14} fontFamily={K.font} fontWeight={600}>
                                Pre {pecasPreCorte.toLocaleString('pt-BR')}
                              </text>
                              <rect x={cx+10} y={cy+8} width={10} height={10} fill={K.teal} rx={2}/>
                              <text x={cx+24} y={cy+17} fill={K.teal} fontSize={14} fontFamily={K.font} fontWeight={600}>
                                Pos {pecasPosCorte.toLocaleString('pt-BR')}
                              </text>
                            </svg>
                          </div>
                        );
                      })()}

                      {/* Card Estoque PL -- aging bars */}
                      {(()=>{
                        const diasMes2 = hoje.getDate();
                        const entrou   = estPL.filter(i=>i.dias<=diasMes2).reduce((s,i)=>s+i.qtde,0);
                        const entrouRefs = new Set(estPL.filter(i=>i.dias<=diasMes2).map(i=>i.codigo)).size;
                        const aging = [
                          {label:'0-15d',  qty:estPL.filter(i=>i.dias<=15).reduce((s,i)=>s+i.qtde,0), color:K.green},
                          {label:'16-30d', qty:estPL.filter(i=>i.dias>15&&i.dias<=30).reduce((s,i)=>s+i.qtde,0), color:K.blue},
                          {label:'31-60d', qty:estPL.filter(i=>i.dias>30&&i.dias<=60).reduce((s,i)=>s+i.qtde,0), color:K.amber},
                          {label:'+60d',   qty:estPL.filter(i=>i.dias>60).reduce((s,i)=>s+i.qtde,0), color:K.red},
                        ];
                        return (
                          <div style={{background:K.bg2,border:`1px solid ${K.border}`,borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                            padding:'12px 16px 8px',borderTop:`3px solid ${K.teal}`,
                            display:'flex',flexDirection:'column',gap:8}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                              <span style={{fontSize:14,fontWeight:700,color:K.t2,
                                letterSpacing:'0.04em'}}>Estoque</span>
                              <span style={{fontSize:22,fontWeight:400,color:K.t0}}>
                                {estPLTotal.toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <span style={{fontSize:14,color:K.t2}}>
                              {new Set(estPL.map(i=>i.codigo)).size} refs . Mes: <span style={{color:K.green,fontWeight:700}}>{entrou.toLocaleString('pt-BR')} pcs . {entrouRefs} refs</span>
                            </span>
                            {/* Aging bars */}
                            <div style={{display:'flex',flexDirection:'column',gap:5,marginTop:4}}>
                              {aging.map((a,i)=>{
                                const pct=estPLTotal>0?(a.qty/estPLTotal)*100:0;
                                return (
                                  <div key={i}>
                                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                                      <span style={{fontSize:14,color:a.color,fontWeight:600}}>{a.label}</span>
                                      <span style={{fontSize:14,color:K.t1,fontWeight:700}}>{a.qty.toLocaleString('pt-BR')} <span style={{color:K.t2,fontWeight:400}}>({pct.toFixed(0)}%)</span></span>
                                    </div>
                                    <div style={{height:5,borderRadius:3,background:K.border2}}>
                                      <div style={{height:'100%',borderRadius:3,background:a.color,width:`${pct}%`}}/>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}


                    </div>

                    {/* ---- LINHA 3: Carteira PL + Em Processo por setor ---- */}
                    <div style={{flex:1,display:'grid',gridTemplateColumns:'2fr 1fr',gap:14,minHeight:0}}>

                      {/* Carteira PL por Mes -- 2/3 */}
                      {(()=>{
                        // Setores que entregam no mes corrente
                        const SETORES_MES_CORRENTE = new Set([
                          'COSTURA','AGUARDANDO PARTES','EMBALAGEM','CD COSTURA','CASEADO/BOTAO',
                          'INSPECAO DE QUALIDADE','PREPARACAO GOLA/PE DE GOLA','SILK CARIMBO',
                          'EXPEDICAO','LAVANDERIA PECA PRONTA','ABERTURA LATERAL MAQUINAS',
                          'ESTAMPARIA','AGUARDANDO PEITILHO'
                        ].map(s=>{
                          // normalize: remove accents, uppercase
                          return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
                        }));
                        const normSetor = (s) => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();

                        const VALOR_MEDIO_PL = 34.03;
                        const hoje = new Date();
                        const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
                        const SETORES_MES_MAIS_DOIS = new Set(['TINTURARIA','TECELAGEM'].map(s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()));

                        const coberturaMap = {};
                        dataWip.filter(i=>normalize(i.colecao||'').includes('NEXT ELEVEN')).forEach(i=>{
                          const ns = normSetor(i.setor);
                          const mesesOffset = SETORES_MES_MAIS_DOIS.has(ns) ? 2 : SETORES_MES_CORRENTE.has(ns) ? 0 : 1;
                          const dt = new Date(hoje.getFullYear(), hoje.getMonth()+mesesOffset, 1);
                          const mes = `${MESES[dt.getMonth()]}/${String(dt.getFullYear()).slice(-2)}`;
                          const mesSort = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
                          if(!coberturaMap[mesSort]) coberturaMap[mesSort]={mes,mesSort,cobertura:0};
                          coberturaMap[mesSort].cobertura += (i.quantidade||0) * VALOR_MEDIO_PL;
                        });

                        // Faturamento PL por mes (do dataFat)
                        const fatPorMes = {};
                        dataFat.filter(i=>normalize(i.canal||'').includes('NEXT ELEVEN')).forEach(i=>{
                          // i.dia = day of month, need year/month from dataFat reference
                          const ref = dataFat[0]?.data || '';
                          const parts = ref.split('/');
                          const mm = parts[1]||'01', yyyy = parts[2]||'2026';
                          const mes = `${MESES[parseInt(mm)-1]}/${String(yyyy).slice(-2)}`;
                          const mesSort = `${yyyy}-${String(mm).padStart(2,'0')}`;
                          if(!fatPorMes[mesSort]) fatPorMes[mesSort]={mes,mesSort,faturado:0};
                          fatPorMes[mesSort].faturado += i.valorLiq||0;
                        });

                        // Merge carteira + cobertura + faturado
                        // Carteira NE por mes (do dataCarteiraNE)
                        const carteiraNEByMes = {};
                        dataCarteiraNE.forEach(item=>{
                          const per = String(item.periodo||'');
                          if(!per) return;
                          const yyww = parseInt(per)||0;
                          const yy = Math.floor(yyww/100); const ww = yyww%100;
                          const ano = yy<100?2000+yy:yy;
                          const dt = new Date(ano, 0, 1 + (ww-1)*7);
                          const mesSort = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
                          const mes = `${MESES[dt.getMonth()]}/${String(dt.getFullYear()).slice(-2)}`;
                          if(!carteiraNEByMes[mesSort]) carteiraNEByMes[mesSort]={mes,mesSort,valor:0};
                          carteiraNEByMes[mesSort].valor += item.valor||0;
                        });

                        const allKeys = new Set([
                          ...Object.keys(carteiraNEByMes),
                          ...Object.keys(coberturaMap),
                          ...Object.keys(fatPorMes)
                        ]);
                        const mesSortAtual = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}`;
                        const mesAtualLabel = `${MESES[hoje.getMonth()]}/${String(hoje.getFullYear()).slice(-2)}`;

                        // Rollover: somar meses anteriores no mês atual
                        let rollover = 0;
                        const sortedKeys = [...allKeys].sort();
                        sortedKeys.forEach(key=>{
                          if(key < mesSortAtual){
                            const cart = carteiraNEByMes[key];
                            rollover += cart?.valor || 0;
                          }
                        });

                        const chartData = sortedKeys
                          .filter(key => key >= mesSortAtual)
                          .map((key, idx)=>{
                            const cart = carteiraNEByMes[key];
                            const cob  = coberturaMap[key];
                            const fat  = fatPorMes[key];
                            const valorBase = cart?.valor || 0;
                            return {
                              mes:       cart?.mes || cob?.mes || fat?.mes || mesAtualLabel,
                              mesSort:   key,
                              valor:     idx===0 ? valorBase + rollover : valorBase,
                              cobertura: cob?.cobertura || 0,
                              faturado:  fat?.faturado  || 0,
                            };
                          });

                        return (
                          <div style={{background:K.bg2,border:`1px solid ${K.border}`,borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                            display:'flex',flexDirection:'column',overflow:'hidden'}}>
                            <div style={{padding:'10px 18px',borderBottom:`1px solid ${K.border}`,
                              display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
                              <span style={{fontSize:14,fontWeight:700,color:K.t2,letterSpacing:'0.04em'}}>Carteira Next Eleven</span>
                              <span style={{fontSize:16,fontWeight:400,color:K.t0}}>
                                R$ {Math.round(chartData.reduce((s,m)=>s+m.valor,0)).toLocaleString('pt-BR',{maximumFractionDigits:0})}
                              </span>
                            </div>
                            {!chartData.length?(
                              <div style={{padding:'20px',textAlign:'center',color:K.t2,fontSize:14}}>
                                Carregue o arquivo Carteira_NE.csv
                              </div>
                            ):(
                              <div style={{flex:1,padding:'8px',minHeight:0}}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={chartData} margin={{top:22,right:8,left:4,bottom:0}} barCategoryGap="20%" barGap={4}>
                                    {grid}
                                    <XAxis dataKey="mes" axisLine={false} tickLine={false}
                                      tick={{fill:K.t0,fontSize:14,fontFamily:K.font,fontWeight:600}}/>
                                    <YAxis hide/>
                                    <Tooltip contentStyle={{background:K.bg2,border:`1px solid ${K.border2}`,
                                      borderRadius:8,fontSize:14}} labelStyle={{color:K.t0}} itemStyle={{color:K.t0}}
                                      formatter={(v,n)=>[`${Math.round(v/1000)}k`,n]} cursor={false}/>
                                    {/* Barra 1 — Carteira (pendente) */}
                                    <Bar dataKey="valor" name="Carteira" stackId="cart" fill={K.tealD} stroke={K.teal} strokeWidth={1} radius={[4,4,0,0]}>
                                      <LabelList dataKey="valor" position="top"
                                        content={(props)=>{
                                          const {x,y,width,value}=props;
                                          if(!value) return null;
                                          return <text x={x+width/2} y={y-6} textAnchor="middle"
                                            fill={K.t0} fontSize={14} fontFamily={K.font} fontWeight={600}>
                                            {`${Math.round(value/1000)}k`}
                                          </text>;
                                        }}/>
                                    </Bar>
                                    {/* Barra 2 — Cobertura WIP (base) + Faturado (topo) */}
                                    <Bar dataKey="cobertura" name="Cobertura WIP" stackId="cob" fill={K.amberD} stroke={K.amber} strokeWidth={1} radius={[0,0,0,0]}/>
                                    <Bar dataKey="faturado" name="Faturado" stackId="cob" fill={'#B8E6C8'} stroke={'#5AAF7A'} strokeWidth={1} radius={[4,4,0,0]}>
                                      <LabelList dataKey="faturado" position="top"
                                        content={(props)=>{
                                          const {x,y,width,value,index}=props;
                                          const total=(chartData[index]?.cobertura||0)+(value||0);
                                          if(!total) return null;
                                          return <text x={x+width/2} y={y-6} textAnchor="middle"
                                            fill={K.t0} fontSize={14} fontFamily={K.font} fontWeight={600}>
                                            {`${Math.round(total/1000)}k`}
                                          </text>;
                                        }}/>
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Em Processo por Setor -- 1/3 */}
                      <Panel title="Em Processo -- Setores PL">
                        <div style={{flex:1,padding:'8px',minHeight:0}}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={setoresArr} layout="vertical"
                              margin={{top:4,right:70,left:8,bottom:4}}>
                              <XAxis type="number" hide/>
                              <YAxis dataKey="setor" type="category" width={160}
                                axisLine={false} tickLine={false}
                                tick={(props)=>{
                                  const {x,y,payload}=props;
                                  const max=18;
                                  const txt=payload.value.length>max?payload.value.slice(0,max-1)+'...':payload.value;
                                  return <text x={x} y={y} dy={5} textAnchor="end"
                                    fill={K.t1} fontSize={14} fontFamily={K.font} fontWeight={600}>{txt}</text>;
                                }}/>
                              <Tooltip contentStyle={{background:K.bg2,border:`1px solid ${K.border2}`,
                                borderRadius:8,fontSize:14}} labelStyle={{color:K.t0}} itemStyle={{color:K.t0}}
                                formatter={(v,n)=>[v.toLocaleString('pt-BR'),n]} cursor={false}/>
                              <Bar dataKey="qty" radius={[0,4,4,0]} barSize={24}>
                                {setoresArr.map((d,i)=>{
                                  return <Cell key={i} fill={K.tealD} stroke={K.teal} strokeWidth={1.5}/>;
                                  const ltD=d.maxLt>30?K.redD:d.maxLt>15?K.amberD:K.purpleD;
                                  return <Cell key={i} fill={ltD} stroke={ltC} strokeWidth={1.5}/>;
                                })}
                                <LabelList dataKey="qty" position="right"
                                  content={(props)=>{
                                    const {x,y,width,height,value}=props;
                                    if(!value) return null;
                                    return <text x={x+width+6} y={y+height/2+5}
                                      fill={K.t1} fontSize={14} fontWeight={600} fontFamily={K.font}>
                                      {value.toLocaleString('pt-BR')}
                                    </text>;
                                  }}/>
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Panel>
                    </div>

                  </div>
                )}
              </div>
            );
          })()}
          {activeDash==='EXECSD' && (()=>{

            // ---- Filtro Seeder: nao PL e nao Next Eleven --------------------------------
            const wipPL = dataWip.filter(i => { const c=normalize(i.colecao||''); return c!=='PRIVATE LABEL' && !c.includes('NEXT ELEVEN'); });

            // ---- KPIs WIP PL ----------------------------------------------------------------------------------------
            const totalPecas      = wipPL.reduce((s,i)=>s+i.quantidade, 0);
            const totalOFs        = new Set(wipPL.map(i=>i.of)).size;
            const totalRefs       = new Set(wipPL.map(i=>i.ref)).size;
            const criticos15      = wipPL.filter(i=>i.diasNoSetor>15);
            const criticos30      = wipPL.filter(i=>i.diasNoSetor>30);
            const preCorte        = wipPL.filter(i=>i.fluxo==='PRÉ'||i.fluxo==='PRE');
            const posCorte        = wipPL.filter(i=>i.fluxo==='PÓS'||i.fluxo==='POS');
            const pecasPreCorte   = preCorte.reduce((s,i)=>s+i.quantidade,0);
            const pecasPosCorte   = posCorte.reduce((s,i)=>s+i.quantidade,0);

            // ---- Faturamento PL ----------------------------------------------------------------------------------
            const fatPLVal  = fatKpis.sd.val;
            const atingPL   = 1000000>0?(fatPLVal/1000000)*100:0;
            const gapPL     = Math.max(0, 1000000 - fatPLVal);
            const hoje      = new Date();
            const diasRest  = new Date(hoje.getFullYear(),hoje.getMonth()+1,0).getDate()-hoje.getDate()+1;
            const ritmoPL   = diasRest>0?gapPL/diasRest:0;
            const colorPL   = atingPL>=100?K.green:atingPL>=70?K.amber:K.red;

            // ---- Producao (Panorama) ------------------------------------------------------------------------
            const realizado   = totalPan;
            const projecao    = potencial;
            const metaMensal  = MONTHLY_TARGET_PCS;
            const metaProp2   = metaProp;

            // ---- Em Processo: por setor ------------------------------------------------------------------
            const setoresMap = {};
            wipPL.forEach(i=>{
              if(!setoresMap[i.setor]) setoresMap[i.setor]={
                setor:i.setor, qty:0, ofs:new Set(), maxLt:0, fluxo:i.fluxo
              };
              setoresMap[i.setor].qty      += i.quantidade;
              setoresMap[i.setor].ofs.add(i.of);
              if(i.diasNoSetor>setoresMap[i.setor].maxLt) setoresMap[i.setor].maxLt=i.diasNoSetor;
            });
            const setoresArr = Object.values(setoresMap)
              .sort((a,b)=>b.qty-a.qty)
              .map(s=>({...s, nOfs:s.ofs.size}));

            // ---- Carteira: por periodo de entrega --------------------------------------------
            const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
            // Carteira por periodo (semana) com Pre e Pos corte
            const carteiraByPeriodo = {};
            wipPL.forEach(i=>{
              const p = i.entrega||'N/A';
              if(p==='N/A') return;
              if(!carteiraByPeriodo[p]) carteiraByPeriodo[p]={periodo:p,pre:0,pos:0,ofs:new Set()};
              if(i.fluxo==='PRE') carteiraByPeriodo[p].pre+=i.quantidade;
              else                carteiraByPeriodo[p].pos+=i.quantidade;
              carteiraByPeriodo[p].ofs.add(i.of);
            });
            const carteiraArr = Object.values(carteiraByPeriodo)
              .sort((a,b)=>a.periodo.localeCompare(b.periodo))
              .map(m=>({...m, total:m.pre+m.pos, nOfs:m.ofs.size}));

            // ---- Estoque PL por DescMarca (cliente) ----------------------------------------
            const estPL = dataEstoque.filter(i=>{ const c=normalize(i.descColecao||''); return c!=='PRIVATE LABEL' && !c.includes('NEXT ELEVEN'); });
            const estMarcaMap = {};
            estPL.forEach(i=>{
              const m = i.descMarca||i.marca||'Sem cliente';
              if(!estMarcaMap[m]) estMarcaMap[m]={cliente:m,qtde:0,custo:0,lento:0,refs:new Set()};
              estMarcaMap[m].qtde  += i.qtde;
              estMarcaMap[m].custo += i.qtde*(i.custo||0);
              estMarcaMap[m].refs.add(i.codigo);
              if(i.dias>60) estMarcaMap[m].lento += i.qtde;
            });
            const estPLArr = Object.values(estMarcaMap)
              .sort((a,b)=>b.qtde-a.qtde)
              .map(m=>({...m, nRefs:m.refs.size}));
            const estPLTotal = estPL.reduce((s,i)=>s+i.qtde, 0);
            const estPLCusto = estPL.reduce((s,i)=>s+i.qtde*(i.custo||0), 0);

            // ---- Top refs PL ----------------------------------------------------------------------------------------
            const refsMap = {};
            wipPL.forEach(i=>{
              if(!refsMap[i.ref]) refsMap[i.ref]={ref:i.ref,descricao:i.descricao,qty:0,ofs:new Set(),maxLt:0};
              refsMap[i.ref].qty+=i.quantidade;
              refsMap[i.ref].ofs.add(i.of);
              if(i.diasNoSetor>refsMap[i.ref].maxLt) refsMap[i.ref].maxLt=i.diasNoSetor;
            });
            const topRefs = Object.values(refsMap).sort((a,b)=>b.qty-a.qty).slice(0,8).map(r=>({...r,nOfs:r.ofs.size}));

            return (
              <div style={{flex:1,display:'flex',flexDirection:'column',gap:14,overflow:'hidden'}}>

                {/* Tab bar */}
                <div style={{display:'flex',alignItems:'center',
                  borderBottom:`1px solid ${K.border}`,flexShrink:0,gap:4}}>
                  <Tab active={true} onClick={()=>{}}>Seeder</Tab>
                </div>






                {(!wipPL.length && !dataFat.length) ? (
                  <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:14}}>
                    <Factory size={44} color={K.t2}/>
                    <span style={{fontSize:14,color:K.t2}}>Carregue WIP e Faturamento para visualizar</span>
                  </div>
                ) : (
                  <div style={{flex:1,display:'flex',flexDirection:'column',gap:14,overflow:'auto',paddingRight:4}}>

                    {/* ---- LINHA 1: Gauge + Cards em uma linha ---- */}
                    <div style={{display:'grid',gridTemplateColumns:'auto auto 1fr',gap:12,flexShrink:0,alignItems:'stretch'}}>

                      {/* Gauge PL -- mesmo tamanho do Executivo */}
                      {(()=>{
                        const pct   = 1000000>0?Math.min(100,(fatPLVal/1000000)*100):0;
                        const color = pct>=100?K.green:pct>=70?K.amber:K.red;
                        const W=300, H=175, cx=W/2, cy=H;
                        const R=130, strokeW=24;
                        const toRad = (deg) => (deg*Math.PI)/180;
                        const arcPath = (startDeg, endDeg, radius) => {
                          const s={x:cx+radius*Math.cos(toRad(startDeg)),y:cy+radius*Math.sin(toRad(startDeg))};
                          const e={x:cx+radius*Math.cos(toRad(endDeg)),  y:cy+radius*Math.sin(toRad(endDeg))};
                          const large=(endDeg-startDeg)>180?1:0;
                          return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
                        };
                        const endAngle = -180 + pct*1.8;
                        const fmtVal = (v) => `R$ ${Math.round(v/1000)+'k'}`;
                        return (
                          <div style={{background:K.bg2,border:`1px solid ${K.border}`,borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                            padding:'12px 16px 8px',borderTop:`3px solid ${K.teal}`,
                            display:'flex',flexDirection:'column',alignItems:'center'}}>
                            <div style={{display:'flex',justifyContent:'space-between',
                              alignItems:'center',width:'100%',marginBottom:4}}>
                              <span style={{fontSize:14,fontWeight:700,color:K.t2,
                                letterSpacing:'0.04em'}}>{'Faturamento -- '+['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][new Date().getMonth()]}</span>
                            </div>



                            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{overflow:'visible'}}>
                              <path d={arcPath(-180,0,R)} fill="none" stroke={K.border} strokeWidth={strokeW} strokeLinecap="butt"/>
                              {pct>0 && <path d={arcPath(-180,endAngle,R)} fill="none" stroke={K.teal} strokeWidth={strokeW} strokeLinecap="butt"/>}
                              <text x={cx-R} y={cy+18} textAnchor="middle" fill={K.t0} fontSize={14} fontFamily={K.font}>0%</text>
                              <text x={cx+R} y={cy+18} textAnchor="middle" fill={K.t0} fontSize={14} fontFamily={K.font}>100%</text>
                              <text x={cx} y={cy-55} textAnchor="middle" fill={K.t0} fontSize={28} fontWeight={400} fontFamily={K.font}>{fmtVal(fatPLVal)}</text>
                              {pct>0 && (() => {
                                const tipX = cx + (R+strokeW/2+10)*Math.cos((endAngle*Math.PI)/180);
                                const tipY = cy + (R+strokeW/2+10)*Math.sin((endAngle*Math.PI)/180);
                                return <text x={tipX} y={tipY} textAnchor="middle" fill={K.t0} fontSize={13} fontWeight={400} fontFamily={K.font}>{pct.toFixed(1)}%</text>;
                              })()}
                              <text x={cx} y={cy-6} textAnchor="middle" fill={K.t0} fontSize={14} fontFamily={K.font}>Meta {fmtVal(1000000)}</text>
                            </svg>
                          </div>
                        );
                      })()}









                      {/* Card WIP -- gauge pre/pos */}
                      {(()=>{
                        const pctPre = totalPecas>0?(pecasPreCorte/totalPecas)*100:0;
                        const pctPos = totalPecas>0?(pecasPosCorte/totalPecas)*100:0;
                        const W=300, H=200, cx=W/2, cy=H-26;
                        const R=130, strokeW=24;
                        const toRad = (deg) => (deg*Math.PI)/180;
                        const arcPath = (startDeg, endDeg, radius) => {
                          const s={x:cx+radius*Math.cos(toRad(startDeg)),y:cy+radius*Math.sin(toRad(startDeg))};
                          const e={x:cx+radius*Math.cos(toRad(endDeg)),  y:cy+radius*Math.sin(toRad(endDeg))};
                          const large=(endDeg-startDeg)>180?1:0;
                          return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
                        };
                        const preEnd = -180 + pctPre*1.8;
                        const posEnd = preEnd + pctPos*1.8;
                        return (
                          <div style={{background:K.bg2,border:`1px solid ${K.border}`,borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                            padding:'12px 16px 8px',borderTop:`3px solid ${K.teal}`,
                            display:'flex',flexDirection:'column',alignItems:'center'}}>
                            <div style={{display:'flex',justifyContent:'space-between',
                              alignItems:'center',width:'100%',marginBottom:2}}>
                              <span style={{fontSize:14,fontWeight:700,color:K.t2,textTransform:'uppercase',
                                letterSpacing:'0.04em'}}>WIP</span>
                              <span style={{fontSize:14,fontWeight:800,color:K.teal,padding:'2px 8px',
                                borderRadius:6,background:K.tealD}}>
                                {totalOFs} OFs
                              </span>
                            </div>
                            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{overflow:'visible'}}>
                              <path d={arcPath(-180,0,R)} fill="none" stroke={K.border2} strokeWidth={strokeW} strokeLinecap="butt"/>
                              {pctPre>0 && <path d={arcPath(-180,preEnd,R)} fill="none" stroke={K.amber} strokeWidth={strokeW} strokeLinecap="butt"/>}
                              {pctPos>0 && <path d={arcPath(preEnd,posEnd,R)} fill="none" stroke={K.teal} strokeWidth={strokeW} strokeLinecap="butt"/>}
                              <text x={cx} y={cy-55} textAnchor="middle" fill={K.t0} fontSize={28} fontWeight={400} fontFamily={K.font}>
                                {totalPecas.toLocaleString('pt-BR')}
                              </text>
                              <text x={cx} y={cy-6} textAnchor="middle" fill={K.t2} fontSize={15} fontFamily={K.font}>
                                {totalRefs} referencias
                              </text>
                              <rect x={cx-70} y={cy+8} width={10} height={10} fill={K.amber} rx={2}/>
                              <text x={cx-56} y={cy+17} fill={K.amber} fontSize={14} fontFamily={K.font} fontWeight={600}>
                                Pre {pecasPreCorte.toLocaleString('pt-BR')}
                              </text>
                              <rect x={cx+10} y={cy+8} width={10} height={10} fill={K.teal} rx={2}/>
                              <text x={cx+24} y={cy+17} fill={K.teal} fontSize={14} fontFamily={K.font} fontWeight={600}>
                                Pos {pecasPosCorte.toLocaleString('pt-BR')}
                              </text>
                            </svg>
                          </div>
                        );
                      })()}

                      {/* Card Estoque PL -- aging bars */}
                      {(()=>{
                        const diasMes2 = hoje.getDate();
                        const entrou   = estPL.filter(i=>i.dias<=diasMes2).reduce((s,i)=>s+i.qtde,0);
                        const entrouRefs = new Set(estPL.filter(i=>i.dias<=diasMes2).map(i=>i.codigo)).size;
                        const aging = [
                          {label:'0-15d',  qty:estPL.filter(i=>i.dias<=15).reduce((s,i)=>s+i.qtde,0), color:K.green},
                          {label:'16-30d', qty:estPL.filter(i=>i.dias>15&&i.dias<=30).reduce((s,i)=>s+i.qtde,0), color:K.blue},
                          {label:'31-60d', qty:estPL.filter(i=>i.dias>30&&i.dias<=60).reduce((s,i)=>s+i.qtde,0), color:K.amber},
                          {label:'+60d',   qty:estPL.filter(i=>i.dias>60).reduce((s,i)=>s+i.qtde,0), color:K.red},
                        ];
                        return (
                          <div style={{background:K.bg2,border:`1px solid ${K.border}`,borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                            padding:'12px 16px 8px',borderTop:`3px solid ${K.teal}`,
                            display:'flex',flexDirection:'column',gap:8}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                              <span style={{fontSize:14,fontWeight:700,color:K.t2,
                                letterSpacing:'0.04em'}}>Estoque</span>
                              <span style={{fontSize:22,fontWeight:400,color:K.t0}}>
                                {estPLTotal.toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <span style={{fontSize:14,color:K.t2}}>
                              {new Set(estPL.map(i=>i.codigo)).size} refs . Mes: <span style={{color:K.green,fontWeight:700}}>{entrou.toLocaleString('pt-BR')} pcs . {entrouRefs} refs</span>
                            </span>
                            {/* Aging bars */}
                            <div style={{display:'flex',flexDirection:'column',gap:5,marginTop:4}}>
                              {aging.map((a,i)=>{
                                const pct=estPLTotal>0?(a.qty/estPLTotal)*100:0;
                                return (
                                  <div key={i}>
                                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                                      <span style={{fontSize:14,color:a.color,fontWeight:600}}>{a.label}</span>
                                      <span style={{fontSize:14,color:K.t1,fontWeight:700}}>{a.qty.toLocaleString('pt-BR')} <span style={{color:K.t2,fontWeight:400}}>({pct.toFixed(0)}%)</span></span>
                                    </div>
                                    <div style={{height:5,borderRadius:3,background:K.border2}}>
                                      <div style={{height:'100%',borderRadius:3,background:a.color,width:`${pct}%`}}/>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}


                    </div>

                    {/* ---- LINHA 3: Carteira PL + Em Processo por setor ---- */}
                    <div style={{flex:1,display:'grid',gridTemplateColumns:'2fr 1fr',gap:14,minHeight:0}}>

                      {/* Carteira PL por Mes -- 2/3 */}
                      {(()=>{
                        // Setores que entregam no mes corrente
                        const SETORES_MES_CORRENTE = new Set([
                          'COSTURA','AGUARDANDO PARTES','EMBALAGEM','CD COSTURA','CASEADO/BOTAO',
                          'INSPECAO DE QUALIDADE','PREPARACAO GOLA/PE DE GOLA','SILK CARIMBO',
                          'EXPEDICAO','LAVANDERIA PECA PRONTA','ABERTURA LATERAL MAQUINAS',
                          'ESTAMPARIA','AGUARDANDO PEITILHO'
                        ].map(s=>{
                          // normalize: remove accents, uppercase
                          return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
                        }));
                        const normSetor = (s) => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();

                        const VALOR_MEDIO_PL = 40.06;
                        const hoje = new Date();
                        const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
                        const SETORES_MES_MAIS_DOIS = new Set(['TINTURARIA','TECELAGEM'].map(s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()));

                        const coberturaMap = {};
                        dataWip.filter(i=>{ const c=normalize(i.colecao||''); return c!=='PRIVATE LABEL' && !c.includes('NEXT ELEVEN'); }).forEach(i=>{
                          const ns = normSetor(i.setor);
                          const mesesOffset = SETORES_MES_MAIS_DOIS.has(ns) ? 2 : SETORES_MES_CORRENTE.has(ns) ? 0 : 1;
                          const dt = new Date(hoje.getFullYear(), hoje.getMonth()+mesesOffset, 1);
                          const mes = `${MESES[dt.getMonth()]}/${String(dt.getFullYear()).slice(-2)}`;
                          const mesSort = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
                          if(!coberturaMap[mesSort]) coberturaMap[mesSort]={mes,mesSort,cobertura:0};
                          coberturaMap[mesSort].cobertura += (i.quantidade||0) * VALOR_MEDIO_PL;
                        });

                        // Faturamento PL por mes (do dataFat)
                        const fatPorMes = {};
                        dataFat.filter(i=>i.canal!=='PRIVATE LABEL' && normalize(i.canal||'')!=='NEXT ELEVEN').forEach(i=>{
                          // i.dia = day of month, need year/month from dataFat reference
                          const ref = dataFat[0]?.data || '';
                          const parts = ref.split('/');
                          const mm = parts[1]||'01', yyyy = parts[2]||'2026';
                          const mes = `${MESES[parseInt(mm)-1]}/${String(yyyy).slice(-2)}`;
                          const mesSort = `${yyyy}-${String(mm).padStart(2,'0')}`;
                          if(!fatPorMes[mesSort]) fatPorMes[mesSort]={mes,mesSort,faturado:0};
                          fatPorMes[mesSort].faturado += i.valorLiq||0;
                        });

                        // Merge carteira + cobertura + faturado
                        // Carteira Seeder: build from dataComercial (5_-_Comercial.csv)
                        const carteiraSD = {};
                        dataComercial.filter(i=>{ const c=normalize(i.colecao||''); return c!=='PRIVATE LABEL' && !c.includes('NEXT ELEVEN'); }).forEach(i=>{
                          if(String(i.descStatus||'').toUpperCase()==='FATURADO') return;
                          const ent = String(i.entrega||'').trim();
                          if(!ent || !ent.includes('/')) return;
                          const pts = ent.split('/');
                          if(pts.length < 3) return;
                          const m=parseInt(pts[1]), y=parseInt(pts[2]);
                          if(!m || !y) return;
                          const mesSort = `${y}-${String(m).padStart(2,'0')}`;
                          const mes = `${MESES[m-1]}/${String(y).slice(-2)}`;
                          const val = (i.qtde||0) * (i.preco||0);
                          if(!carteiraSD[mesSort]) carteiraSD[mesSort]={mes,mesSort,valor:0};
                          carteiraSD[mesSort].valor += val;
                        });
                        const allKeys = new Set([
                          ...Object.keys(carteiraSD),
                          ...Object.keys(coberturaMap),
                          ...Object.keys(fatPorMes)
                        ]);
                        const mesSortAtual = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}`;
                        const mesAtualLabel = `${MESES[hoje.getMonth()]}/${String(hoje.getFullYear()).slice(-2)}`;

                        // Rollover: somar meses anteriores no mês atual
                        let rollover = 0;
                        const sortedKeys = [...allKeys].sort();
                        sortedKeys.forEach(key=>{
                          if(key < mesSortAtual){
                            const cart = carteiraSD[key];
                            rollover += cart?.valor || 0;
                          }
                        });

                        const chartData = sortedKeys
                          .filter(key => key >= mesSortAtual)
                          .map((key, idx)=>{
                            const cart = carteiraSD[key];
                            const cob  = coberturaMap[key];
                            const fat  = fatPorMes[key];
                            const valorBase = cart?.valor || 0;
                            return {
                              mes:       cart?.mes || cob?.mes || fat?.mes || mesAtualLabel,
                              mesSort:   key,
                              valor:     idx===0 ? valorBase + rollover : valorBase,
                              cobertura: cob?.cobertura || 0,
                              faturado:  fat?.faturado  || 0,
                            };
                          });

                        return (
                          <div style={{background:K.bg2,border:`1px solid ${K.border}`,borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                            display:'flex',flexDirection:'column',overflow:'hidden'}}>
                            <div style={{padding:'10px 18px',borderBottom:`1px solid ${K.border}`,
                              display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
                              <span style={{fontSize:14,fontWeight:700,color:K.t2,letterSpacing:'0.04em'}}>Carteira PL</span>
                              <span style={{fontSize:16,fontWeight:400,color:K.t0}}>
                                R$ {Math.round(Object.values(carteiraSD).reduce((s,m)=>s+m.valor,0)).toLocaleString('pt-BR',{maximumFractionDigits:0})}
                              </span>
                            </div>
                            {!chartData.length?(
                              <div style={{padding:'20px',textAlign:'center',color:K.t2,fontSize:14}}>
                                Carregue o arquivo Comercial (5_-_Comercial.csv)
                              </div>
                            ):(
                              <div style={{flex:1,padding:'8px',minHeight:0}}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={chartData} margin={{top:22,right:8,left:4,bottom:0}} barCategoryGap="20%" barGap={4}>
                                    {grid}
                                    <XAxis dataKey="mes" axisLine={false} tickLine={false}
                                      tick={{fill:K.t0,fontSize:14,fontFamily:K.font,fontWeight:600}}/>
                                    <YAxis hide/>
                                    <Tooltip contentStyle={{background:K.bg2,border:`1px solid ${K.border2}`,
                                      borderRadius:8,fontSize:14}} labelStyle={{color:K.t0}} itemStyle={{color:K.t0}}
                                      formatter={(v,n)=>[`${Math.round(v/1000)}k`,n]} cursor={false}/>
                                    {/* Barra 1 — Carteira (pendente) */}
                                    <Bar dataKey="valor" name="Carteira" stackId="cart" fill={K.tealD} stroke={K.teal} strokeWidth={1} radius={[4,4,0,0]}>
                                      <LabelList dataKey="valor" position="top"
                                        content={(props)=>{
                                          const {x,y,width,value}=props;
                                          if(!value) return null;
                                          return <text x={x+width/2} y={y-6} textAnchor="middle"
                                            fill={K.t0} fontSize={14} fontFamily={K.font} fontWeight={600}>
                                            {`${Math.round(value/1000)}k`}
                                          </text>;
                                        }}/>
                                    </Bar>
                                    {/* Barra 2 — Cobertura WIP (base) + Faturado (topo) */}
                                    <Bar dataKey="cobertura" name="Cobertura WIP" stackId="cob" fill={K.amberD} stroke={K.amber} strokeWidth={1} radius={[0,0,0,0]}/>
                                    <Bar dataKey="faturado" name="Faturado" stackId="cob" fill={'#B8E6C8'} stroke={'#5AAF7A'} strokeWidth={1} radius={[4,4,0,0]}>
                                      <LabelList dataKey="faturado" position="top"
                                        content={(props)=>{
                                          const {x,y,width,value,index}=props;
                                          const total=(chartData[index]?.cobertura||0)+(value||0);
                                          if(!total) return null;
                                          return <text x={x+width/2} y={y-6} textAnchor="middle"
                                            fill={K.t0} fontSize={14} fontFamily={K.font} fontWeight={600}>
                                            {`${Math.round(total/1000)}k`}
                                          </text>;
                                        }}/>
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Em Processo por Setor -- 1/3 */}
                      <Panel title="Em Processo -- Setores PL">
                        <div style={{flex:1,padding:'8px',minHeight:0}}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={setoresArr} layout="vertical"
                              margin={{top:4,right:70,left:8,bottom:4}}>
                              <XAxis type="number" hide/>
                              <YAxis dataKey="setor" type="category" width={160}
                                axisLine={false} tickLine={false}
                                tick={(props)=>{
                                  const {x,y,payload}=props;
                                  const max=18;
                                  const txt=payload.value.length>max?payload.value.slice(0,max-1)+'...':payload.value;
                                  return <text x={x} y={y} dy={5} textAnchor="end"
                                    fill={K.t1} fontSize={14} fontFamily={K.font} fontWeight={600}>{txt}</text>;
                                }}/>
                              <Tooltip contentStyle={{background:K.bg2,border:`1px solid ${K.border2}`,
                                borderRadius:8,fontSize:14}} labelStyle={{color:K.t0}} itemStyle={{color:K.t0}}
                                formatter={(v,n)=>[v.toLocaleString('pt-BR'),n]} cursor={false}/>
                              <Bar dataKey="qty" radius={[0,4,4,0]} barSize={24}>
                                {setoresArr.map((d,i)=>{
                                  return <Cell key={i} fill={K.tealD} stroke={K.teal} strokeWidth={1.5}/>;
                                  const ltD=d.maxLt>30?K.redD:d.maxLt>15?K.amberD:K.purpleD;
                                  return <Cell key={i} fill={ltD} stroke={ltC} strokeWidth={1.5}/>;
                                })}
                                <LabelList dataKey="qty" position="right"
                                  content={(props)=>{
                                    const {x,y,width,height,value}=props;
                                    if(!value) return null;
                                    return <text x={x+width+6} y={y+height/2+5}
                                      fill={K.t1} fontSize={14} fontWeight={600} fontFamily={K.font}>
                                      {value.toLocaleString('pt-BR')}
                                    </text>;
                                  }}/>
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Panel>
                    </div>

                  </div>
                )}
              </div>
            );
          })()}
          {activeDash==='INDATEX' && (()=>{

            // ── DADOS FIXOS PETERSEN ─────────────────────────────────────────
            const FAT2025 = [
              {mes:'Jan', f25:1113869.81, f26:0, prev:0},
              {mes:'Fev', f25:1408636.66, f26:0, prev:0},
              {mes:'Mar', f25:1646710.03, f26:0, prev:0},
              {mes:'Abr', f25:1729050.27, f26:0, prev:0},
              {mes:'Mai', f25:892968.95,  f26:1145766.66, prev:784000},
              {mes:'Jun', f25:649897.46,  f26:0, prev:820607.95},
              {mes:'Jul', f25:1225315.32, f26:0, prev:94128.00},
              {mes:'Ago', f25:1600199.83, f26:0, prev:0},
              {mes:'Set', f25:1525430.76, f26:0, prev:8100.00},
              {mes:'Out', f25:1760504.51, f26:0, prev:0},
              {mes:'Nov', f25:535307.42,  f26:0, prev:0},
              {mes:'Dez', f25:356322.13,  f26:0, prev:0},
            ];
            // Jan-Abr 2026 ja faturado (nao aparece como prev)
            FAT2025[0].f26 = 227625.40;
            FAT2025[1].f26 = 686342.38;
            FAT2025[2].f26 = 888154.47;
            FAT2025[3].f26 = 742156.36;

            const total25    = FAT2025.reduce((s,m)=>s+m.f25,0);
            const total26    = FAT2025.reduce((s,m)=>s+m.f26,0);
            const totalPrev  = FAT2025.reduce((s,m)=>s+m.prev,0);
            const ytd25      = FAT2025.slice(0,5).reduce((s,m)=>s+m.f25,0); // Jan-Mai 2025
            const ytd26      = total26; // Jan-Mai 2026
            const varYTD     = ytd25>0?((ytd26-ytd25)/ytd25)*100:0;
            const totalComPrev = total26 + totalPrev;
            const fmtR = (v) => `${Math.round(v/1000)}k`;
            const fmtM = (v) => `R$ ${(v/1000000).toFixed(2).replace('.',',')}M`;

            return (
              <div style={{flex:1,display:'flex',flexDirection:'column',gap:14,overflow:'hidden'}}>

                {/* Tab bar */}
                <div style={{display:'flex',alignItems:'center',
                  borderBottom:`1px solid ${K.border}`,flexShrink:0,gap:4}}>
                  <Tab active={true} onClick={()=>{}}>Carteira Petersen</Tab>
                </div>

                {/* KPI Cards */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,flexShrink:0}}>
                  {[
                    {label:'Total 2025', value:fmtM(total25), sub:'Jan–Dez', color:K.t2},
                    {label:'Faturado 2026', value:fmtM(total26), sub:'Jan–Mai', color:K.teal},
                    {label:'YTD Jan–Mai', value:`${varYTD>=0?'+':''} ${varYTD.toFixed(1)}%`, sub:`2026 vs 2025`, color:varYTD>=0?K.teal:K.red},
                    {label:'Carteira Prevista', value:fmtM(totalPrev), sub:'Mai–Set/26', color:K.amber},
                  ].map((c,i)=>(
                    <div key={i} style={{background:K.bg2,border:`1px solid ${K.border}`,borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                      padding:'12px 16px',borderTop:`3px solid ${K.teal}`}}>
                      <span style={{fontSize:13,fontWeight:700,color:K.t2,letterSpacing:'0.04em',display:'block',marginBottom:6}}>{c.label}</span>
                      <span style={{fontSize:22,fontWeight:400,color:K.t0,display:'block'}}>{c.value}</span>
                      <span style={{fontSize:12,color:K.t2,marginTop:4,display:'block'}}>{c.sub}</span>
                    </div>
                  ))}
                </div>

                {/* Grafico principal */}
                <div style={{flex:1,background:K.bg2,border:`1px solid ${K.border}`,borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                  display:'flex',flexDirection:'column',overflow:'hidden',minHeight:0}}>
                  <div style={{padding:'10px 18px',borderBottom:`1px solid ${K.border}`,flexShrink:0,
                    display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span style={{fontSize:14,fontWeight:700,color:K.t2,letterSpacing:'0.04em'}}>Faturamento Mensal — 2025 vs 2026</span>
                    <div style={{display:'flex',gap:16,alignItems:'center'}}>
                      {[{fill:K.bg3,stroke:K.t2,label:'2025'},{fill:K.tealD,stroke:K.teal,label:'2026 Realizado'},{fill:K.amberD,stroke:K.amber,label:'Previsto'},].map((l,i)=>(
                        <div key={i} style={{display:'flex',alignItems:'center',gap:5}}>
                          <div style={{width:10,height:10,borderRadius:2,background:l.fill,border:`1px solid ${l.stroke}`}}/>
                          <span style={{fontSize:12,color:K.t2}}>{l.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{flex:1,padding:'8px',minHeight:0}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={FAT2025} margin={{top:24,right:8,left:4,bottom:0}} barCategoryGap="15%" barGap={3}>
                        {grid}
                        <XAxis dataKey="mes" axisLine={false} tickLine={false}
                          tick={{fill:K.t0,fontSize:13,fontFamily:K.font}}/>
                        <YAxis hide/>
                        <Tooltip contentStyle={{background:K.bg2,border:`1px solid ${K.border}`,borderRadius:8,fontSize:13}}
                          labelStyle={{color:K.t0}} itemStyle={{color:K.t0}}
                          formatter={(v,n)=>[`${Math.round(v/1000)}k`,n]} cursor={false}/>
                        {/* 2025 */}
                        <Bar dataKey="f25" name="2025" fill={K.bg3} stroke={K.t2} strokeWidth={1} radius={[3,3,0,0]}>
                          <LabelList dataKey="f25" position="top" content={(props)=>{
                            const {x,y,width,value}=props; if(!value) return null;
                            return <text x={x+width/2} y={y-5} textAnchor="middle" fill={K.t0} fontSize={14} fontFamily={K.font}>
                              {`${Math.round(value/1000).toLocaleString('pt-BR')}k`}
                            </text>;
                          }}/>
                        </Bar>
                        {/* 2026 realizado (base da barra empilhada) */}
                        <Bar dataKey="f26" name="2026 Realizado" stackId="y26" fill={K.tealD} stroke={K.teal} strokeWidth={1} radius={[0,0,0,0]}>
                        </Bar>
                        {/* Previsto (topo da barra empilhada) */}
                        <Bar dataKey="prev" name="Previsto" stackId="y26" fill={K.amberD} stroke={K.amber} strokeWidth={1} radius={[3,3,0,0]}>
                          <LabelList dataKey="prev" position="top" content={(props)=>{
                            const {x,y,width,value,index}=props;
                            const total=(FAT2025[index]?.f26||0)+(value||0);
                            if(!total) return null;
                            return <text x={x+width/2} y={y-5} textAnchor="middle" fill={K.t0} fontSize={14} fontFamily={K.font}>
                              {`${Math.round(total/1000).toLocaleString('pt-BR')}k`}
                            </text>;
                          }}/>
                        </Bar>
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            );
          })()}
        </main>

        {/* Footer */}
        <footer style={{height:40,background:K.bg1,borderTop:`1px solid ${K.border}`,
          display:'flex',alignItems:'center',justifyContent:'space-between',
          padding:'0 24px',flexShrink:0,gap:12,overflow:'hidden'}}>
          <div style={{display:'flex',gap:12,alignItems:'center',flexShrink:0}}>
            <span style={{fontSize:13,color:K.t2,fontWeight:600,whiteSpace:'nowrap'}}>Gestão Industrial V28.07.2</span>
            <div style={{width:1,height:16,background:K.border2}}/>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{width:6,height:6,background:K.green,borderRadius:'50%'}}/>
              <span style={{fontSize:13,color:K.green,fontWeight:600}}>Online</span>
            </div>
          </div>
          {/* File badges */}
          <div style={{display:'flex',alignItems:'center',gap:8,flex:1,overflow:'hidden',justifyContent:'center'}}>
            {(()=>{
              const fileMap = {
                PANORAMA:[{file:'Panorama.csv', ts:lastUpdated.panorama}],
                WIP:[{file:'WIP.csv', ts:lastUpdated.wip}],
                FATURAMENTO:[{file:'Faturamento.csv', ts:lastUpdated.fat}],
                ESTOQUE:[{file:'Estoque.csv', ts:lastUpdated.estoque}],
                COBERTURA:[
                  {file:'Comercial.csv', ts:lastUpdated.cobertura},
                  {file:'Estoque.csv', ts:lastUpdated.estoque},
                ],
                SOP:[
                  {file:'S_OP.xlsx', ts:lastUpdated.sop},
                  {file:'WIP.csv', ts:lastUpdated.wip},
                ],
                EXECPLTESTE:[
                  {file:'Pedidos_a_produzir_PL.xlsx', ts:lastUpdated.carteiraPLTeste},
                  {file:'WIP.csv', ts:lastUpdated.wip},
                  {file:'Fat.csv', ts:lastUpdated.fat},
                  {file:'Estoque.csv', ts:lastUpdated.estoque},
                ],
                EXECNE:[
                  {file:'Carteira_NE.csv', ts:lastUpdated.carteiraNE},
                  {file:'WIP.csv', ts:lastUpdated.wip},
                  {file:'Fat.csv', ts:lastUpdated.fat},
                  {file:'Estoque.csv', ts:lastUpdated.estoque},
                ],
                EXECSD:[
                  {file:'Comercial.csv', ts:lastUpdated.cobertura},
                  {file:'WIP.csv', ts:lastUpdated.wip},
                  {file:'Fat.csv', ts:lastUpdated.fat},
                  {file:'Estoque.csv', ts:lastUpdated.estoque},
                ],
                INDATEX:[{file:'Dados fixos', ts:null}],
              };
              const infos = fileMap[activeDash];
              if(!infos) return null;
              return infos.map((info,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:5,
                  border:`1px solid ${K.border2}`,borderRadius:6,padding:'2px 8px',
                  flexShrink:0,whiteSpace:'nowrap'}}>
                  <span style={{fontSize:12,color:K.t2}}>📄</span>
                  <span style={{fontSize:12,color:K.t1,fontWeight:600}}>{info.file}</span>
                  {info.ts && (
                    <>
                      <span style={{fontSize:12,color:K.t2}}>·</span>
                      <span style={{fontSize:12,color:K.t2}}>{info.ts}</span>
                    </>
                  )}
                </div>
              ));
            })()}
          </div>
          <span style={{fontSize:13,color:K.blue,fontWeight:600,flexShrink:0,whiteSpace:'nowrap'}}>
            Cícero R. Mendes · Operações
          </span>
        </footer>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#1A2E4E; border-radius:6px; }
        ::-webkit-scrollbar-thumb:hover { background:#243A5E; }
        select option { background:#0D1627; color:#EEF2FF; }
      `}</style>
    </div>
  );
}
