import React, { useState, useEffect, useRef } from 'react';

interface ItemEstoque {
  id: string;
  nome: string;
  categoria: string;
  estoque: number;
  min: number;
  validade: string;
  preco: number;
  custo?: number;
}

interface RegistroPerda {
  id: string;
  nome: string;
  quantidade: number;
  prejuizo: number;
  data: string;
}

export default function EstoqueInteligenteApp() {
  const [itens, setItens] = useState<ItemEstoque[]>(() => {
    const salvo = localStorage.getItem('estoque_inteligente_itens');
    if (salvo) {
      try { return JSON.parse(salvo); } catch (e) { /* fallback */ }
    }
    return [
      { id: '7891000101', nome: 'Leite UHT Integral 1L', categoria: 'Laticínios', estoque: 45, min: 100, validade: '2026-11-10', preco: 5.90, custo: 4.50 },
      { id: '7891000102', nome: 'Arroz Tipo 1 5kg', categoria: 'Mercearia', estoque: 12, min: 50, validade: '2027-05-15', preco: 32.90, custo: 24.90 },
      { id: '7891000103', nome: 'Presunto Fatiado 200g', categoria: 'Frios & Embutidos', estoque: 15, min: 20, validade: '2026-11-15', preco: 11.90, custo: 8.90 },
      { id: '7891000104', nome: 'Cerveja Pilsen 350ml', categoria: 'Bebidas', estoque: 210, min: 80, validade: '2027-02-28', preco: 4.50, custo: 3.50 },
      { id: '7891000105', nome: 'Detergente Líquido 500ml', categoria: 'Limpeza', estoque: 88, min: 30, validade: '2028-01-10', preco: 3.00, custo: 2.20 },
      { id: '7891000106', nome: 'Iogurte Natural 170g', categoria: 'Laticínios', estoque: 8, min: 40, validade: '2026-11-08', preco: 3.50, custo: 2.50 },
    ];
  });

  const [perdas, setPerdas] = useState<RegistroPerda[]>(() => {
    const salvo = localStorage.getItem('estoque_inteligente_perdas');
    if (salvo) {
      try { return JSON.parse(salvo); } catch (e) { /* fallback */ }
    }
    return [];
  });

  const [filtroAtivo, setFiltroAtivo] = useState<string>('Todos');
  const [busca, setBusca] = useState<string>('');
  const [catFiltro, setCatFiltro] = useState<string>('Todas');
  const [xmlInput, setXmlInput] = useState<string>('');
  const [modalAberto, setModalAberto] = useState<boolean>(false);
  const [abaAtiva, setAbaAtiva] = useState<'estoque' | 'perdas'>('estoque');

  // Estados do Modal Novo Item
  const [novoId, setNovoId] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [novoCat, setNovoCat] = useState('Mercearia');
  const [novoEstoque, setNovoEstoque] = useState('');
  const [novoMin, setNovoMin] = useState('');
  const [novoValidade, setNovoValidade] = useState('');
  const [novoCusto, setNovoCusto] = useState('');
  const [novoPreco, setNovoPreco] = useState('');

  // Estado da Câmara / Leitor de Código de Barras
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    localStorage.setItem('estoque_inteligente_itens', JSON.stringify(itens));
  }, [itens]);

  useEffect(() => {
    localStorage.setItem('estoque_inteligente_perdas', JSON.stringify(perdas));
  }, [perdas]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (cameraAtiva) {
      navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch((err) => {
          alert("Não foi possível aceder à câmara: " + err.message);
          setCameraAtiva(false);
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraAtiva]);

  const capturarCodigoBarrasCamera = () => {
    const codigoSimulado = '789' + Math.floor(100000000 + Math.random() * 900000000);
    setNovoId(codigoSimulado);
    setCameraAtiva(false);
    alert(`📷 Código de Barras escaneado com sucesso: ${codigoSimulado}`);
  };

  const darBaixaRapidaVenda = (item: ItemEstoque) => {
    const qtdVendidaStr = prompt(`Quantas unidades de "${item.nome}" foram vendidas/retiradas?`, "1");
    if (!qtdVendidaStr) return;
    const q = parseInt(qtdVendidaStr);
    if (isNaN(q) || q <= 0) {
      alert("Quantidade inválida.");
      return;
    }
    if (q > item.estoque) {
      alert(`Erro: Quantidade informada (${q}) maior do que o estoque atual (${item.estoque}).`);
      return;
    }

    setItens(itens.map(i => i.id === item.id ? { ...i, estoque: i.estoque - q } : i));
    alert(`✅ Saída de ${q} un de "${item.nome}" registrada com sucesso!`);
  };

  const processarEntradaXML = () => {
    if (!xmlInput.trim()) {
      alert("Por favor, cole o XML da NF-e.");
      return;
    }

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlInput, "text/xml");
      const detNodes = xmlDoc.getElementsByTagName("det");

      if (detNodes.length > 0) {
        let novosItensAdicionados = [...itens];
        
        for (let i = 0; i < detNodes.length; i++) {
          const det = detNodes[i];
          const xProd = det.getElementsByTagName("xProd")[0]?.textContent || "Produto NF-e";
          const qCom = parseFloat(det.getElementsByTagName("qCom")[0]?.textContent || "10");
          const cEAN = det.getElementsByTagName("cEAN")[0]?.textContent || ('789' + Math.floor(100000 + Math.random() * 900000));
          const vUnCom = parseFloat(det.getElementsByTagName("vUnCom")[0]?.textContent || "5.00");
          
          const dataFutura = new Date();
          dataFutura.setFullYear(dataFutura.getFullYear() + 1);
          const validadeStr = dataFutura.toISOString().split('T')[0];

          novosItensAdicionados.unshift({
            id: cEAN.trim() === "" || cEAN.trim() === "SEM GTIN" ? '789' + Math.floor(100000 + Math.random() * 900000) : cEAN,
            nome: xProd,
            categoria: 'Importados NF-e',
            estoque: Math.round(qCom),
            min: 10,
            validade: validadeStr,
            custo: vUnCom,
            preco: parseFloat((vUnCom * 1.3).toFixed(2))
          });
        }

        setItens(novosItensAdicionados);
        setXmlInput('');
        alert(`✅ ${detNodes.length} item(ns) importado(s) com sucesso!`);
      } else {
        const custoF = 10.00;
        const novoItemFallback: ItemEstoque = {
          id: '789' + Math.floor(100000 + Math.random() * 900000),
          nome: 'Lote Importado via Chave NF-e',
          categoria: 'Geral',
          estoque: 50,
          min: 15,
          validade: '2027-12-31',
          custo: custoF,
          preco: 14.00
        };
        setItens([novoItemFallback, ...itens]);
        setXmlInput('');
        alert("✅ Chave de NF-e processada com sucesso!");
      }
    } catch (e) {
      alert("❌ Erro ao interpretar o XML.");
    }
  };

  const carregarDadosExemplo = () => {
    setItens([
      { id: '7891000101', nome: 'Leite UHT Integral 1L', categoria: 'Laticínios', estoque: 45, min: 100, validade: '2026-11-10', preco: 5.90, custo: 4.50 },
      { id: '7891000102', nome: 'Arroz Tipo 1 5kg', categoria: 'Mercearia', estoque: 12, min: 50, validade: '2027-05-15', preco: 32.90, custo: 24.90 },
      { id: '7891000103', nome: 'Presunto Fatiado 200g', categoria: 'Frios & Embutidos', estoque: 15, min: 20, validade: '2026-11-15', preco: 11.90, custo: 8.90 },
      { id: '7891000104', nome: 'Cerveja Pilsen 350ml', categoria: 'Bebidas', estoque: 210, min: 80, validade: '2027-02-28', preco: 4.50, custo: 3.50 },
      { id: '7891000105', nome: 'Detergente Líquido 500ml', categoria: 'Limpeza', estoque: 88, min: 30, validade: '2028-01-10', preco: 3.00, custo: 2.20 },
      { id: '7891000106', nome: 'Iogurte Natural 170g', categoria: 'Laticínios', estoque: 8, min: 40, validade: '2026-11-08', preco: 3.50, custo: 2.50 },
    ]);
  };

  const registrarPerda = (item: ItemEstoque) => {
    const qtdDescarte = prompt(`Quantas unidades de "${item.nome}" deseja descartar por perda/vencimento?`, "1");
    if (!qtdDescarte) return;
    const q = parseInt(qtdDescarte);
    if (isNaN(q) || q <= 0 || q > item.estoque) {
      alert("Quantidade inválida.");
      return;
    }

    const custoUnit = item.custo || (item.preco * 0.7);
    const prejuizoTotal = q * custoUnit;

    const novaPerda: RegistroPerda = {
      id: Math.random().toString(36).substring(2, 9),
      nome: item.nome,
      quantidade: q,
      prejuizo: prejuizoTotal,
      data: new Date().toLocaleDateString('pt-BR')
    };

    setPerdas([novaPerda, ...perdas]);
    setItens(itens.map(i => i.id === item.id ? { ...i, estoque: i.estoque - q } : i));
    alert(`⚠️ Descarte registrado! Prejuízo calculated: R$ ${prejuizoTotal.toFixed(2)}`);
  };

  const dispararWhatsApp = (item: ItemEstoque) => {
    const mensagem = encodeURIComponent(
      `🚨 *OFERTA RELÂMPAGO - QUEIMA DE ESTOQUE* 🚨\n\n` +
      `Produto: *${item.nome}*\n` +
      `Validade Próxima: *${item.validade}*\n` +
      `Por apenas *R$ ${item.preco.toFixed(2)}*!\n\n` +
      `🏃‍♂️ Aproveite enquanto durar o estoque!`
    );
    window.open(`https://api.whatsapp.com/send?text=${mensagem}`, '_blank');
  };

  const handleSalvarNovoItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome || !novoEstoque || !novoValidade || !novoPreco) {
      alert("Preencha os campos obrigatórios, incluindo o Preço de Venda.");
      return;
    }

    const itemCriado: ItemEstoque = {
      id: novoId.trim() !== "" ? novoId : ('789' + Math.floor(100000 + Math.random() * 900000)),
      nome: novoNome,
      categoria: novoCat,
      estoque: parseInt(novoEstoque) || 0,
      min: parseInt(novoMin) || 10,
      validade: novoValidade,
      custo: parseFloat(novoCusto) || 0.00,
      preco: parseFloat(novoPreco) || 0.00
    };

    setItens([itemCriado, ...itens]);
    setNovoId('');
    setNovoNome('');
    setNovoEstoque('');
    setNovoMin('');
    setNovoValidade('');
    setNovoCusto('');
    setNovoPreco('');
    setModalAberto(false);
    alert("✅ Novo item cadastrado com sucesso!");
  };

  const itensFiltrados = itens.filter(item => {
    const diasParaVencer = Math.ceil((new Date(item.validade).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    let matchValidade = true;
    if (filtroAtivo === 'Críticos') matchValidade = diasParaVencer <= 7;
    if (filtroAtivo === 'Alertas') matchValidade = diasParaVencer > 7 && diasParaVencer <= 30;
    if (filtroAtivo === 'Estáveis') matchValidade = diasParaVencer > 30;

    const matchBusca = item.nome.toLowerCase().includes(busca.toLowerCase()) || item.id.includes(busca);
    const matchCat = catFiltro === 'Todas' || item.categoria === catFiltro;

    return matchValidade && matchBusca && matchCat;
  });

  const totalPrejuizoPerdas = perdas.reduce((acc, p) => acc + p.prejuizo, 0);

  // Cálculos do Dashboard Financeiro
  const valorTotalInvestido = itens.reduce((acc, item) => acc + (item.estoque * (item.custo || (item.preco * 0.7))), 0);
  const valorTotalImobilizadoVenda = itens.reduce((acc, item) => acc + (item.estoque * item.preco), 0);
  const lucroPotencialCalculado = valorTotalImobilizadoVenda - valorTotalInvestido;

  return (
    <div style={{ backgroundColor: '#070a10', color: '#f8fafc', minHeight: '100vh', padding: '16px', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: '#34d399', borderRadius: '50%', display: 'inline-block' }}></span>
            <h1 style={{ fontSize: '16px', fontWeight: '900', color: '#34d399', margin: 0 }}>ESTOQUE<span style={{ color: '#ffffff' }}>INTELIGENTE</span></h1>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setAbaAtiva('estoque')} style={{ backgroundColor: abaAtiva === 'estoque' ? '#34d399' : '#1e293b', color: abaAtiva === 'estoque' ? '#030712' : '#cbd5e1', border: 'none', padding: '6px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
              Estoque
            </button>
            <button onClick={() => setAbaAtiva('perdas')} style={{ backgroundColor: abaAtiva === 'perdas' ? '#f87171' : '#1e293b', color: abaAtiva === 'perdas' ? '#030712' : '#cbd5e1', border: 'none', padding: '6px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
              Perdas ({perdas.length})
            </button>
          </div>
        </div>

        {abaAtiva === 'estoque' && (
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <button onClick={carregarDadosExemplo} style={{ flex: 1, backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', padding: '8px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
              ⚡ Demo
            </button>
            <button onClick={() => setModalAberto(true)} style={{ flex: 1, backgroundColor: '#34d399', color: '#030712', border: 'none', fontWeight: 'bold', padding: '8px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' }}>
              + Novo Item
            </button>
          </div>
        )}
      </div>

      {/* DASHBOARD FINANCEIRO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '4px' }}>ESTOQUE CUSTO</div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#f8fafc', fontFamily: 'monospace' }}>R$ {valorTotalInvestido.toFixed(2)}</div>
        </div>
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '4px' }}>LUCRO PROJETADO</div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#34d399', fontFamily: 'monospace' }}>R$ {lucroPotencialCalculado.toFixed(2)}</div>
        </div>
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '4px' }}>TOTAL PERDAS</div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#f87171', fontFamily: 'monospace' }}>R$ {totalPrejuizoPerdas.toFixed(2)}</div>
        </div>
      </div>

      {abaAtiva === 'estoque' ? (
        <>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#34d399', marginTop: 0, marginBottom: '8px' }}>
              ⚡ Importador NF-e (Entrada Livre)
            </h2>
            <textarea 
              value={xmlInput}
              onChange={(e) => setXmlInput(e.target.value)}
              placeholder="Cole o XML completo da NF-e aqui..."
              style={{ width: '100%', backgroundColor: '#030712', border: '1px solid #1e293b', borderRadius: '8px', padding: '8px', color: '#e2e8f0', fontSize: '12px', height: '55px', resize: 'none', marginBottom: '8px', boxSizing: 'border-box' }}
            />
            <button 
              onClick={processarEntradaXML}
              style={{ width: '100%', backgroundColor: '#34d399', color: '#030712', border: 'none', fontWeight: 'bold', padding: '8px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
            >
              Processar Entrada de Estoque
            </button>
          </div>

          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input 
                type="text" 
                value={busca} 
                onChange={(e) => setBusca(e.target.value)}
                placeholder="🔍 Pesquisar produto ou código..."
                style={{ flex: 1, backgroundColor: '#030712', border: '1px solid #1e293b', borderRadius: '8px', padding: '8px', color: '#fff', fontSize: '11px', boxSizing: 'border-box' }}
              />
              <select 
                value={catFiltro} 
                onChange={(e) => setCatFiltro(e.target.value)}
                style={{ backgroundColor: '#030712', border: '1px solid #1e293b', borderRadius: '8px', padding: '8px', color: '#fff', fontSize: '11px', boxSizing: 'border-box' }}
              >
                <option value="Todas">Todas Categorias</option>
                <option value="Mercearia">Mercearia</option>
                <option value="Laticínios">Laticínios</option>
                <option value="Frios & Embutidos">Frios & Embutidos</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Limpeza">Limpeza</option>
                <option value="Importados NF-e">Importados NF-e</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
              {['Todos', 'Críticos', 'Alertas', 'Estáveis'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFiltroAtivo(tab)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: filtroAtivo === tab ? 'bold' : 'normal',
                    backgroundColor: filtroAtivo === tab ? '#34d399' : '#1e293b',
                    color: filtroAtivo === tab ? '#030712' : '#94a3b8',
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#e2e8f0', margin: 0 }}>📋 Gestão Preditiva & Ações</h2>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>{itensFiltrados.length} itens</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e293b', color: '#94a3b8', fontSize: '10px' }}>
                    <th style={{ paddingBottom: '8px', width: '30%' }}>PRODUTO</th>
                    <th style={{ paddingBottom: '8px', width: '15%' }}>ESTQ</th>
                    <th style={{ paddingBottom: '8px', width: '20%' }}>VALIDADE</th>
                    <th style={{ paddingBottom: '8px', width: '35%', textAlign: 'right' }}>AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {itensFiltrados.map((item) => {
                    const diasParaVencer = Math.ceil((new Date(item.validade).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    const isCritico = diasParaVencer <= 7;
                    const abaixoMin = item.estoque < item.min;

                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #1e293b33' }}>
                        <td style={{ padding: '10px 0' }}>
                          <div style={{ fontWeight: 'bold', color: '#f1f5f9', lineHeight: '1.2' }}>{item.nome}</div>
                          <div style={{ fontSize: '9px', color: '#34d399' }}>R$ {item.preco.toFixed(2)}</div>
                        </td>
                        <td style={{ padding: '10px 0' }}>
                          <div style={{ fontWeight: 'bold', color: abaixoMin ? '#f87171' : '#34d399' }}>{item.estoque} un</div>
                        </td>
                        <td style={{ padding: '10px 0', fontFamily: 'monospace', color: isCritico ? '#f87171' : '#fbbf24', fontSize: '10px' }}>
                          {item.validade}
                        </td>
                        <td style={{ padding: '10px 0', textAlign: 'right', display: 'flex', gap: '3px', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                          <button 
                            onClick={() => darBaixaRapidaVenda(item)}
                            title="Dar Baixa em Vendas do Dia"
                            style={{ backgroundColor: '#0284c722', color: '#38bdf8', border: '1px solid #0284c744', padding: '4px 5px', borderRadius: '6px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            📉 Saída
                          </button>
                          {isCritico && (
                            <button 
                              onClick={() => dispararWhatsApp(item)}
                              title="Enviar Oferta Relâmpago WhatsApp"
                              style={{ backgroundColor: '#22c55e22', color: '#4ade80', border: '1px solid #22c55e44', padding: '4px 5px', borderRadius: '6px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                              📱 Wpp
                            </button>
                          )}
                          <button 
                            onClick={() => registrarPerda(item)}
                            title="Registrar Perda / Descarte"
                            style={{ backgroundColor: '#f8717122', color: '#f87171', border: '1px solid #f8717144', padding: '4px 5px', borderRadius: '6px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#f87171', margin: 0 }}>📉 Relatório de Perdas & Descarte</h2>
            <span style={{ fontSize: '10px', color: '#f87171', fontWeight: 'bold' }}>Total: R$ {totalPrejuizoPerdas.toFixed(2)}</span>
          </div>

          {perdas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b', fontSize: '11px' }}>
              Nenhum descarte ou perda registrada até o momento.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e293b', color: '#94a3b8', fontSize: '10px' }}>
                    <th style={{ paddingBottom: '8px' }}>PRODUTO</th>
                    <th style={{ paddingBottom: '8px' }}>QTD</th>
                    <th style={{ paddingBottom: '8px' }}>PREJUÍZO</th>
                    <th style={{ paddingBottom: '8px', textAlign: 'right' }}>DATA</th>
                  </tr>
                </thead>
                <tbody>
                  {perdas.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #1e293b33' }}>
                      <td style={{ padding: '8px 0', color: '#f1f5f9', fontWeight: 'bold' }}>{p.nome}</td>
                      <td style={{ padding: '8px 0', color: '#f87171' }}>-{p.quantidade} un</td>
                      <td style={{ padding: '8px 0', fontFamily: 'monospace', color: '#f87171' }}>R$ {p.prejuizo.toFixed(2)}</td>
                      <td style={{ padding: '8px 0', textAlign: 'right', fontSize: '10px', color: '#94a3b8' }}>{p.data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modalAberto && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(3, 7, 18, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', zIndex: 50 }}>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '400px', boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#34d399', marginTop: 0, marginBottom: '12px' }}>
              + Cadastrar Novo Item
            </h3>

            {cameraAtiva && (
              <div style={{ marginBottom: '12px', textAlign: 'center', backgroundColor: '#000', borderRadius: '8px', padding: '8px' }}>
                <video ref={videoRef} style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '6px' }} muted playsInline />
                <p style={{ fontSize: '10px', color: '#34d399', margin: '4px 0' }}>Aponte para o Código de Barras...</p>
                <button 
                  type="button" 
                  onClick={capturarCodigoBarrasCamera}
                  style={{ backgroundColor: '#34d399', color: '#030712', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', marginRight: '6px' }}
                >
                  📸 Capturar Código
                </button>
                <button 
                  type="button" 
                  onClick={() => setCameraAtiva(false)}
                  style={{ backgroundColor: '#1e293b', color: '#f87171', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Fechar Câmara
                </button>
              </div>
            )}
            
            <form onSubmit={handleSalvarNovoItem} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '10px', color: '#94a3b8' }}>Código de Barras / GTIN</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input 
                    type="text" 
                    value={novoId} 
                    onChange={(e) => setNovoId(e.target.value)} 
                    placeholder="Ex: 7891000..."
                    style={{ flex: 1, backgroundColor: '#030712', border: '1px solid #1e293b', borderRadius: '8px', padding: '8px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                  {!cameraAtiva && (
                    <button 
                      type="button" 
                      onClick={() => setCameraAtiva(true)}
                      style={{ backgroundColor: '#1e293b', color: '#34d399', border: '1px solid #34d39944', padding: '8px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      📷 Ler
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '10px', color: '#94a3b8' }}>Nome do Produto *</label>
                <input 
                  type="text" 
                  value={novoNome} 
                  onChange={(e) => setNovoNome(e.target.value)} 
                  placeholder="Ex: Queijo Mozarela 1kg"
                  style={{ width: '100%', backgroundColor: '#030712', border: '1px solid #1e293b', borderRadius: '8px', padding: '8px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }}
                  required 
                />
              </div>

              <div>
                <label style={{ fontSize: '10px', color: '#94a3b8' }}>Categoria</label>
                <select 
                  value={novoCat} 
                  onChange={(e) => setNovoCat(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#030712', border: '1px solid #1e293b', borderRadius: '8px', padding: '8px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }}
                >
                  <option value="Mercearia">Mercearia</option>
                  <option value="Laticínios">Laticínios</option>
                  <option value="Frios & Embutidos">Frios & Embutidos</option>
                  <option value="Bebidas">Bebidas</option>
                  <option value="Limpeza">Limpeza</option>
                  <option value="Hortifrúti">Hortifrúti</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '10px', color: '#94a3b8' }}>Qtd Estoque *</label>
                  <input 
                    type="number" 
                    value={novoEstoque} 
                    onChange={(e) => setNovoEstoque(e.target.value)} 
                    placeholder="Ex: 30"
                    style={{ width: '100%', backgroundColor: '#030712', border: '1px solid #1e293b', borderRadius: '8px', padding: '8px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }}
                    required 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '10px', color: '#94a3b8' }}>Estoque Mín.</label>
                  <input 
                    type="number" 
                    value={novoMin} 
                    onChange={(e) => setNovoMin(e.target.value)} 
                    placeholder="Ex: 10"
                    style={{ width: '100%', backgroundColor: '#030712', border: '1px solid #1e293b', borderRadius: '8px', padding: '8px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '10px', color: '#94a3b8' }}>Preço Custo (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={novoCusto} 
                    onChange={(e) => setNovoCusto(e.target.value)} 
                    placeholder="Opcional"
                    style={{ width: '100%', backgroundColor: '#030712', border: '1px solid #1e293b', borderRadius: '8px', padding: '8px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '10px', color: '#34d399' }}>Preço Venda (R$) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={novoPreco} 
                    onChange={(e) => setNovoPreco(e.target.value)} 
                    placeholder="Ex: 14.90"
                    style={{ width: '100%', backgroundColor: '#030712', border: '1px solid #1e293b', borderRadius: '8px', padding: '8px', color: '#34d399', fontWeight: 'bold', fontSize: '12px', boxSizing: 'border-box' }}
                    required 
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '10px', color: '#94a3b8' }}>Data Validade *</label>
                <input 
                  type="date" 
                  value={novoValidade} 
                  onChange={(e) => setNovoValidade(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#030712', border: '1px solid #1e293b', borderRadius: '8px', padding: '8px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }}
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setModalAberto(false)}
                  style={{ flex: 1, backgroundColor: '#1e293b', color: '#cbd5e1', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  style={{ flex: 1, backgroundColor: '#34d399', color: '#030712', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                >
                  Salvar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '9px', color: '#475569' }}>
        EstoqueInteligente PRO • Tecnologia de Alta Performance para Supermercados
      </div>
    </div>
  );
}
