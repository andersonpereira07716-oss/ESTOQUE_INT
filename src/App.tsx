import { useState } from 'react';

interface ProductBatch {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  expiryDate: string;
  status: 'critical' | 'alert' | 'healthy';
}

const initialBatches: ProductBatch[] = [
  { id: '7891000101', name: 'Leite UHT Integral 1L', category: 'Laticínios', price: 4.89, stock: 45, minStock: 100, expiryDate: '2026-11-10', status: 'critical' },
  { id: '7891000102', name: 'Arroz Tipo 1 5kg', category: 'Mercearia', price: 29.90, stock: 12, minStock: 50, expiryDate: '2027-05-15', status: 'critical' },
  { id: '7891000103', name: 'Presunto Fatiado 200g', category: 'Frios & Embutidos', price: 18.50, stock: 15, minStock: 20, expiryDate: '2026-11-15', status: 'alert' },
  { id: '7891000104', name: 'Cerveja Pilsen 350ml', category: 'Bebidas', price: 3.59, stock: 210, minStock: 80, expiryDate: '2027-02-28', status: 'healthy' },
  { id: '7891000105', name: 'Detergente Líquido 500ml', category: 'Limpeza', price: 2.15, stock: 88, minStock: 30, expiryDate: '2028-01-10', status: 'healthy' },
  { id: '7891000106', name: 'Iogurte Natural 170g', category: 'Laticínios', price: 3.20, stock: 8, minStock: 40, expiryDate: '2026-11-08', status: 'critical' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'nfe'>('dashboard');
  const [xmlInput, setXmlInput] = useState<string>('');
  const [batches, setBatches] = useState<ProductBatch[]>(initialBatches);
  
  // FUNCIONALIDADE 1: Filtro Rápido por Status
  const [filter, setFilter] = useState<'all' | 'critical' | 'alert' | 'healthy'>('all');

  // FUNCIONALIDADE 2: Modal de Cadastro Manual
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Mercearia',
    price: '',
    stock: '',
    minStock: '',
    expiryDate: '',
  });

  // FUNCIONALIDADE 3: Modal da Decisão da IA
  const [selectedAiItem, setSelectedAiItem] = useState<ProductBatch | null>(null);

  const filteredBatches = batches.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.stock) return;

    const stockNum = Number(newProduct.stock);
    const minNum = Number(newProduct.minStock) || 10;
    
    // Determina status automaticamente
    let status: 'critical' | 'alert' | 'healthy' = 'healthy';
    if (stockNum < minNum) status = 'critical';

    const createdItem: ProductBatch = {
      id: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
      name: newProduct.name,
      category: newProduct.category,
      price: Number(newProduct.price) || 0,
      stock: stockNum,
      minStock: minNum,
      expiryDate: newProduct.expiryDate || '2027-12-31',
      status: status
    };

    setBatches([createdItem, ...batches]);
    setIsModalOpen(false);
    setNewProduct({ name: '', category: 'Mercearia', price: '', stock: '', minStock: '', expiryDate: '' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#090d16' }}>
      
      {/* Topbar / Header Corporativo */}
      <header style={{
        backgroundColor: '#111726',
        borderBottom: '1px solid #1f293d',
        padding: '12px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 10px #10b981'
          }}></div>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '-0.5px' }}>
            ESTOQUE<span style={{ color: '#10b981' }}>INTELIGENTE</span>
          </h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{
            backgroundColor: '#10b981',
            color: '#090d16',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          + Novo Item
        </button>
      </header>

      {/* Navegação Secundária por Abas */}
      <nav style={{
        backgroundColor: '#0d1320',
        borderBottom: '1px solid #1f293d',
        display: 'flex',
        padding: '0 16px',
        gap: '20px'
      }}>
        <button 
          onClick={() => setActiveTab('dashboard')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'dashboard' ? '#10b981' : '#9ca3af',
            borderBottom: activeTab === 'dashboard' ? '2px solid #10b981' : '2px solid transparent',
            padding: '12px 0',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          📊 Visão Geral
        </button>
        <button 
          onClick={() => setActiveTab('nfe')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'nfe' ? '#10b981' : '#9ca3af',
            borderBottom: activeTab === 'nfe' ? '2px solid #10b981' : '2px solid transparent',
            padding: '12px 0',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          📥 Importar NF-e
        </button>
      </nav>

      {/* Conteúdo Principal */}
      <main style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto', width: '100%', flex: 1 }}>
        
        {/* CARDS DE KPI */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <KpiCard title="Risco de Ruptura" value={`${batches.filter(b => b.stock < b.minStock).length} Itens`} icon="⚠️" border="#ef4444" detail="Abaixo do mínimo" />
          <KpiCard title="Vencendo (7d)" value={`${batches.filter(b => b.status === 'critical').length} Lotes`} icon="🍎" border="#f59e0b" detail="Remarcação imediata" />
          <KpiCard title="Valor em Risco" value="R$ 1.850" icon="💰" border="#f59e0b" detail="Prejuízo evitado" />
          <KpiCard title="CMV em Estoque" value={`R$ ${batches.reduce((acc, b) => acc + (b.price * b.stock), 0).toFixed(0)}`} icon="📦" border="#10b981" detail="Total estocado" />
        </div>

        {/* ÁREA DE IMPORTAÇÃO DE NOTA FISCAL */}
        {(activeTab === 'nfe' || activeTab === 'dashboard') && (
          <section style={{
            backgroundColor: '#111726',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #1f293d',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '15px', color: '#ffffff', fontWeight: 600 }}>
                ⚡ Importador de NF-e (XML / Chave DANFE)
              </h2>
              <span style={{ fontSize: '10px', background: '#10b98120', color: '#10b981', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                IA PARSER ACTIVO
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <textarea 
                rows={2}
                placeholder="Cole o XML da NF-e aqui..."
                value={xmlInput}
                onChange={(e) => setXmlInput(e.target.value)}
                style={{
                  backgroundColor: '#090d16',
                  border: '1px solid #1f293d',
                  borderRadius: '8px',
                  padding: '10px',
                  color: '#e5e7eb',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  outline: 'none'
                }}
              />
              <button 
                onClick={() => alert('Nota processada com sucesso!')}
                style={{
                  backgroundColor: '#10b981',
                  color: '#090d16',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Processar Entrada de Estoque
              </button>
            </div>
          </section>
        )}

        {/* TABELA PREDITIVA COM FILTROS (FUNCIONALIDADE 1) */}
        <section style={{
          backgroundColor: '#111726',
          borderRadius: '12px',
          border: '1px solid #1f293d',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #1f293d', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '15px', color: '#ffffff', fontWeight: 600 }}>
                📋 Gestão Preditiva de Validade
              </h2>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>{filteredBatches.length} itens exibidos</span>
            </div>

            {/* BOTÕES DE FILTRO */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="Todos" color="#9ca3af" />
              <FilterButton active={filter === 'critical'} onClick={() => setFilter('critical')} label="Críticos" color="#ef4444" />
              <FilterButton active={filter === 'alert'} onClick={() => setFilter('alert')} label="Alertas" color="#f59e0b" />
              <FilterButton active={filter === 'healthy'} onClick={() => setFilter('healthy')} label="Estáveis" color="#10b981" />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#090d16', color: '#9ca3af', borderBottom: '1px solid #1f293d', textTransform: 'uppercase', fontSize: '10px' }}>
                  <th style={{ padding: '12px 16px' }}>Código</th>
                  <th style={{ padding: '12px 16px' }}>Produto</th>
                  <th style={{ padding: '12px 16px' }}>Estoque</th>
                  <th style={{ padding: '12px 16px' }}>Validade</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Ação (IA)</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((item, index) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #1f293d', backgroundColor: index % 2 === 0 ? 'transparent' : '#0d1320' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#6b7280' }}>{item.id}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#ffffff' }}>
                      {item.name}
                      <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 'normal' }}>{item.category}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold', color: item.stock < item.minStock ? '#ef4444' : '#f3f4f6' }}>
                      {item.stock} un <span style={{ fontSize: '10px', color: '#6b7280' }}>(Mín: {item.minStock})</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: item.status === 'critical' ? '#ef4444' : item.status === 'alert' ? '#f59e0b' : '#10b981' }}>
                      {item.expiryDate}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button 
                        onClick={() => setSelectedAiItem(item)} // FUNCIONALIDADE 3: ABRIR MODAL DA IA
                        style={{
                          backgroundColor: item.stock < item.minStock ? '#ef4444' : item.status === 'critical' ? '#ef4444' : item.status === 'alert' ? '#f59e0b' : '#10b981',
                          color: item.status === 'healthy' && item.stock >= item.minStock ? '#090d16' : '#ffffff',
                          border: 'none',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        {item.stock < item.minStock ? '🚨 Repor' : item.status === 'critical' ? '⚡ Desconto' : item.status === 'alert' ? '🏷️ Promo' : '✅ Ok'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* MODAL 1: CADASTRO MANUAL DE PRODUTO (FUNCIONALIDADE 2) */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: '#111726',
            border: '1px solid #1f293d',
            borderRadius: '12px',
            padding: '20px',
            width: '100%',
            maxWidth: '400px'
          }}>
            <h3 style={{ color: '#ffffff', marginBottom: '16px', fontSize: '16px' }}>Cadastrar Novo Produto</h3>
            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input 
                placeholder="Nome do Produto" 
                value={newProduct.name}
                onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                style={inputStyle}
                required
              />
              <input 
                placeholder="Preço (R$)" 
                type="number"
                step="0.01"
                value={newProduct.price}
                onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                style={inputStyle}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  placeholder="Estoque Atual" 
                  type="number"
                  value={newProduct.stock}
                  onChange={e => setNewProduct({...newProduct, stock: e.target.value})}
                  style={inputStyle}
                  required
                />
                <input 
                  placeholder="Estoque Mínimo" 
                  type="number"
                  value={newProduct.minStock}
                  onChange={e => setNewProduct({...newProduct, minStock: e.target.value})}
                  style={inputStyle}
                />
              </div>
              <input 
                placeholder="Data de Validade (AAAA-MM-DD)" 
                type="date"
                value={newProduct.expiryDate}
                onChange={e => setNewProduct({...newProduct, expiryDate: e.target.value})}
                style={inputStyle}
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ ...btnStyle, backgroundColor: '#1f293d', color: '#fff' }}>Cancelar</button>
                <button type="submit" style={{ ...btnStyle, backgroundColor: '#10b981', color: '#090d16' }}>Salvar Produto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SUGESTÃO DE DECISÃO DA IA (FUNCIONALIDADE 3) */}
      {selectedAiItem && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: '#111726',
            border: '1px solid #10b981',
            borderRadius: '12px',
            padding: '20px',
            width: '100%',
            maxWidth: '400px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>🤖</span>
              <h3 style={{ color: '#10b981', fontSize: '16px' }}>Recomendação de Precificação IA</h3>
            </div>
            
            <p style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>
              {selectedAiItem.name}
            </p>
            
            <div style={{ backgroundColor: '#090d16', padding: '12px', borderRadius: '8px', border: '1px solid #1f293d', marginBottom: '16px', fontSize: '12px', color: '#9ca3af' }}>
              <p style={{ marginBottom: '6px' }}><strong style={{ color: '#fff' }}>Status do Lote:</strong> {selectedAiItem.status.toUpperCase()}</p>
              <p style={{ marginBottom: '6px' }}><strong style={{ color: '#fff' }}>Preço Atual:</strong> R$ {selectedAiItem.price.toFixed(2)}</p>
              <p style={{ color: '#10b981', fontWeight: 'bold' }}>
                💡 Sugestão IA: {
                  selectedAiItem.status === 'critical' ? 'Aplicar Desconto de 40% na etiqueta para liquidação imediata.' :
                  selectedAiItem.status === 'alert' ? 'Criar encarte promocional "Compre 2 Leve 3" para acelerar saída.' :
                  'Manter preço regular. Margem de lucro otimizada.'
                }
              </p>
            </div>

            <button 
              onClick={() => setSelectedAiItem(null)}
              style={{ ...btnStyle, backgroundColor: '#10b981', color: '#090d16', width: '100%' }}
            >
              Aplicar Sugestão
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ padding: '16px', textAlign: 'center', fontSize: '11px', color: '#4b5563', borderTop: '1px solid #1f293d', backgroundColor: '#0d1320' }}>
        EstoqueInteligente PRO • Tecnologia de Alta Performance para Supermercados
      </footer>

    </div>
  );
}

// Estilos Auxiliares
const inputStyle: React.CSSProperties = {
  backgroundColor: '#090d16',
  border: '1px solid #1f293d',
  borderRadius: '6px',
  padding: '10px',
  color: '#ffffff',
  fontSize: '12px',
  outline: 'none',
  width: '100%'
};

const btnStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: '6px',
  padding: '10px',
  fontWeight: 'bold',
  fontSize: '12px',
  cursor: 'pointer'
};

function FilterButton({ active, onClick, label, color }: { active: boolean; onClick: () => void; label: string; color: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: active ? `${color}20` : '#090d16',
        color: active ? color : '#9ca3af',
        border: `1px solid ${active ? color : '#1f293d'}`,
        borderRadius: '6px',
        padding: '4px 10px',
        fontSize: '11px',
        fontWeight: 'bold',
        cursor: 'pointer'
      }}
    >
      {label}
    </button>
  );
}

function KpiCard({ title, value, icon, border, detail }: { title: string; value: string; icon: string; border: string; detail: string }) {
  return (
    <div style={{
      backgroundColor: '#111726',
      padding: '14px',
      borderRadius: '10px',
      border: '1px solid #1f293d',
      borderLeft: `4px solid ${border}`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>{title}</span>
        <span style={{ fontSize: '16px' }}>{icon}</span>
      </div>
      <div style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px' }}>{value}</div>
      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>{detail}</div>
    </div>
  );
}
