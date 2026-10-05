import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useParams, Link } from 'react-router-dom'
import { supabase } from './lib/supabase'

// ===========================================================
// 1. PAINEL SUPER ADMIN (Para você, Dono do SaaS)
// ===========================================================
function SuperAdminPanel() {
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [newStore, setNewStore] = useState({ name: '', slug: '', owner_name: '', whatsapp_number: '' })

  useEffect(() => { fetchStores() }, [])

  const fetchStores = async () => {
    setLoading(true)
    const { data } = await supabase.from('stores').select('*').order('created_at', { ascending: false })
    setStores(data || [])
    setLoading(false)
  }

  const handleCreateStore = async (e) => {
    e.preventDefault()
    if (!newStore.name || !newStore.slug) return alert('Preencha nome e slug!')

    const { error } = await supabase.from('stores').insert([{
      name: newStore.name,
      slug: newStore.slug.toLowerCase().trim().replace(/\s+/g, '-'),
      owner_name: newStore.owner_name || 'Lojista',
      whatsapp_number: newStore.whatsapp_number || '',
      status: 'trial',
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }])

    if (!error) {
      alert('Loja criada em modo Teste!')
      setNewStore({ name: '', slug: '', owner_name: '', whatsapp_number: '' })
      fetchStores()
    } else {
      alert('Erro: ' + error.message)
    }
  }

  const handleUpdateStatus = async (id, status) => {
    await supabase.from('stores').update({ status }).eq('id', id)
    fetchStores()
  }

  const handleDeleteStore = async (id, name) => {
    if (!confirm(`Excluir a loja "${name}"?`)) return
    await supabase.from('products').delete().eq('store_id', id)
    await supabase.from('stores').delete().eq('id', id)
    fetchStores()
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        <h1 style={{ margin: 0, color: '#1e293b', fontSize: '1.5em' }}>🛡️ Painel Super Admin</h1>
        <span style={{ backgroundColor: '#2563eb', color: '#fff', padding: '4px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' }}>Dono do SaaS</span>
      </header>

      <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0, color: '#334155', fontSize: '1.1em' }}>➕ Criar Nova Loja</h3>
        <form onSubmit={handleCreateStore} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          <input type="text" placeholder="Nome da Loja" value={newStore.name} onChange={e => setNewStore({ ...newStore, name: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
          <input type="text" placeholder="Slug (ex: loja-da-ana)" value={newStore.slug} onChange={e => setNewStore({ ...newStore, slug: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
          <input type="text" placeholder="Nome do Lojista" value={newStore.owner_name} onChange={e => setNewStore({ ...newStore, owner_name: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          <input type="text" placeholder="WhatsApp (ex: 5511999999999)" value={newStore.whatsapp_number} onChange={e => setNewStore({ ...newStore, whatsapp_number: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          <button type="submit" style={{ gridColumn: '1 / -1', background: '#16a34a', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Criar Loja (7 Dias de Teste)</button>
        </form>
      </div>

      <h2>🏢 Lojas no Sistema ({stores.length})</h2>
      {loading ? <p>Carregando...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {stores.map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '12px 15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div>
                <strong>{s.name}</strong> <small style={{ color: '#64748b' }}>({s.slug})</small>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px' }}>
                  Status: <strong>{s.status === 'active' ? '🟢 Ativa' : s.status === 'trial' ? '🟡 Teste' : '🔴 Bloqueada'}</strong> | Whats: {s.whatsapp_number || 'N/I'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                {s.status !== 'active' && <button onClick={() => handleUpdateStatus(s.id, 'active')} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px' }}>Liberar</button>}
                {s.status !== 'suspended' && <button onClick={() => handleUpdateStatus(s.id, 'suspended')} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px' }}>Bloquear</button>}
                <button onClick={() => handleDeleteStore(s.id, s.name)} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px' }}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ===========================================================
// 2. PAINEL DO LOJISTA COM TEMAS E DASHBOARD COMPLETO
// ===========================================================
function LojistaAdmin() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [visits, setVisits] = useState(0)
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)

  // Configuração e Personalização de Cores
  const [storeConfig, setStoreConfig] = useState({
    name: '',
    whatsapp_number: '',
    logo_url: '',
    banner_url: '',
    primary_color: '#db2777',
    secondary_color: '#fbcfe8',
    background_color: '#f8fafc',
    text_color: '#1e293b'
  })
  const [logoFile, setLogoFile] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)
  const [savingStore, setSavingStore] = useState(false)
  const [copied, setCopied] = useState(false)

  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', image_file: null })
  const [uploadingProduct, setUploadingProduct] = useState(false)

  // Caderno Digital de Vendas
  const [newSale, setNewSale] = useState({ product_id: '', product_name: '', amount: '', payment_method: 'pix', payment_status: 'paid', customer_name: '' })

  useEffect(() => { fetchAdminData() }, [])

  async function fetchAdminData() {
    setLoading(true)
    const { data: storeData } = await supabase.from('stores').select('*').eq('slug', 'minha-loja').single()

    if (storeData) {
      setStore(storeData)
      setStoreConfig({
        name: storeData.name || '',
        whatsapp_number: storeData.whatsapp_number || '',
        logo_url: storeData.logo_url || '',
        banner_url: storeData.banner_url || '',
        primary_color: storeData.primary_color || '#db2777',
        secondary_color: storeData.secondary_color || '#fbcfe8',
        background_color: storeData.background_color || '#f8fafc',
        text_color: storeData.text_color || '#1e293b'
      })

      const { data: productsData } = await supabase.from('products').select('*').eq('store_id', storeData.id)
      setProducts(productsData || [])

      const { count } = await supabase.from('store_visits').select('*', { count: 'exact', head: true }).eq('store_id', storeData.id)
      setVisits(count || 0)

      const { data: salesData } = await supabase.from('sales').select('*').eq('store_id', storeData.id).order('created_at', { ascending: false })
      setSales(salesData || [])
    }
    setLoading(false)
  }

  const uploadImage = async (file, bucket = 'products') => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file)
    if (uploadError) throw uploadError
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
    return data.publicUrl
  }

  const handleSaveStoreConfig = async (e) => {
    e.preventDefault()
    setSavingStore(true)
    try {
      let finalLogoUrl = storeConfig.logo_url
      let finalBannerUrl = storeConfig.banner_url

      if (logoFile) finalLogoUrl = await uploadImage(logoFile, 'products')
      if (bannerFile) finalBannerUrl = await uploadImage(bannerFile, 'products')

      const { error } = await supabase.from('stores').update({
        name: storeConfig.name,
        whatsapp_number: storeConfig.whatsapp_number,
        logo_url: finalLogoUrl,
        banner_url: finalBannerUrl,
        primary_color: storeConfig.primary_color,
        secondary_color: storeConfig.secondary_color,
        background_color: storeConfig.background_color,
        text_color: storeConfig.text_color
      }).eq('id', store.id)

      if (!error) {
        alert('Personalização e dados salvos com sucesso!')
        setLogoFile(null)
        setBannerFile(null)
        fetchAdminData()
      }
    } catch (err) { alert('Erro ao salvar dados!') }
    setSavingStore(false)
  }

  const handleCreateProduct = async (e) => {
    e.preventDefault()
    if (!newProduct.name || !newProduct.price) return alert('Preencha nome e preço!')
    setUploadingProduct(true)
    try {
      let image_url = ''
      if (newProduct.image_file) image_url = await uploadImage(newProduct.image_file, 'products')

      const { error } = await supabase.from('products').insert([{
        store_id: store.id,
        name: newProduct.name,
        price: parseFloat(newProduct.price.toString().replace(',', '.')),
        description: newProduct.description,
        image_url
      }])

      if (!error) {
        alert('Peça cadastrada!')
        setNewProduct({ name: '', price: '', description: '', image_file: null })
        fetchAdminData()
      }
    } catch (err) { alert('Erro ao cadastrar produto.') }
    setUploadingProduct(false)
  }

  const handleDeleteProduct = async (id) => {
    if (!confirm('Excluir peça?')) return
    await supabase.from('products').delete().eq('id', id)
    fetchAdminData()
  }

  const handleSelectProductForSale = (productId) => {
    const prod = products.find(p => p.id === productId)
    if (prod) {
      setNewSale({ ...newSale, product_id: prod.id, product_name: prod.name, amount: prod.price.toString() })
    } else {
      setNewSale({ ...newSale, product_id: '', product_name: '', amount: '' })
    }
  }

  const handleCreateSale = async (e) => {
    e.preventDefault()
    if (!newSale.product_name || !newSale.amount) return alert('Informe peça e valor!')

    const { error } = await supabase.from('sales').insert([{
      store_id: store.id,
      product_id: newSale.product_id || null,
      product_name: newSale.product_name,
      amount: parseFloat(newSale.amount.toString().replace(',', '.')),
      payment_method: newSale.payment_method,
      payment_status: newSale.payment_status,
      customer_name: newSale.customer_name
    }])

    if (!error) {
      alert('Venda registrada!')
      setNewSale({ product_id: '', product_name: '', amount: '', payment_method: 'pix', payment_status: 'paid', customer_name: '' })
      fetchAdminData()
    }
  }

  const handleDeleteSale = async (id) => {
    if (!confirm('Remover venda?')) return
    await supabase.from('sales').delete().eq('id', id)
    fetchAdminData()
  }

  const storeUrl = store ? `${window.location.origin}/loja/${store.slug}` : ''

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  // CÁLCULOS FINANCEIROS POR PERÍODO (Hoje, Semana, Mês, Mês Passado, Ano)
  const calculateFinancials = () => {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]

    // Início da semana (Domingo)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    // Início deste mês
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Início e Fim do mês passado
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    // Início deste ano
    const startOfCurrentYear = new Date(now.getFullYear(), 0, 1)

    let todayTotal = 0
    let weekTotal = 0
    let monthTotal = 0
    let lastMonthTotal = 0
    let yearTotal = 0

    sales.forEach(s => {
      if (s.payment_status !== 'paid') return
      const saleDate = new Date(s.created_at)
      const saleAmount = Number(s.amount)

      // Hoje
      if (s.created_at.startsWith(todayStr)) todayTotal += saleAmount
      // Esta Semana
      if (saleDate >= startOfWeek) weekTotal += saleAmount
      // Este Mês
      if (saleDate >= startOfCurrentMonth) monthTotal += saleAmount
      // Mês Passado
      if (saleDate >= startOfLastMonth && saleDate <= endOfLastMonth) lastMonthTotal += saleAmount
      // Este Ano
      if (saleDate >= startOfCurrentYear) yearTotal += saleAmount
    })

    return { todayTotal, weekTotal, monthTotal, lastMonthTotal, yearTotal }
  }

  if (loading) return <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>Carregando Painel...</div>
  if (!store) return <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>Loja não encontrada.</div>

  const totals = calculateFinancials()
  const primary = storeConfig.primary_color
  const secondary = storeConfig.secondary_color
  const bg = storeConfig.background_color
  const text = storeConfig.text_color

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '15px', fontFamily: 'sans-serif', backgroundColor: bg, color: text, minHeight: '100vh', transition: 'all 0.3s' }}>
      
      {/* CABEÇALHO DYNAMIC THEME */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', backgroundColor: '#fff', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div>
          <h1 style={{ fontSize: '1.3em', margin: 0, color: text }}>{store.name}</h1>
          <span style={{ fontSize: '0.8em', color: '#64748b' }}>Painel de Gestão</span>
        </div>
        <a href={storeUrl} target="_blank" rel="noreferrer" style={{ backgroundColor: secondary, color: primary, padding: '8px 12px', borderRadius: '20px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.8em' }}>
          👁️ Ver Minha Loja
        </a>
      </div>

      {/* NAV ABAS */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '15px', paddingBottom: '5px' }}>
        {[
          { id: 'dashboard', label: '📊 Visão Geral' },
          { id: 'sales', label: '📓 Financeiro' },
          { id: 'products', label: `👗 Peças (${products.length})` },
          { id: 'settings', label: '🎨 Personalizar' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              minWidth: '110px',
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '0.85em',
              cursor: 'pointer',
              backgroundColor: activeTab === tab.id ? primary : '#fff',
              color: activeTab === tab.id ? '#fff' : '#475569',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ABA 1: VISÃO GERAL COM MÉTRICAS TEMPORAIS (Hoje, Semana, Mês, Mês Passado, Ano) */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <h3 style={{ margin: '0', fontSize: '1.05em', color: text }}>💰 Faturamento e Métricas em Tempo Real</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
            <div style={{ background: '#fff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75em', color: '#64748b', fontWeight: 'bold' }}>📅 Hoje</span>
              <h3 style={{ margin: '4px 0 0 0', color: '#16a34a', fontSize: '1.3em' }}>R$ {totals.todayTotal.toFixed(2).replace('.', ',')}</h3>
            </div>
            <div style={{ background: '#fff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75em', color: '#64748b', fontWeight: 'bold' }}>📆 Esta Semana</span>
              <h3 style={{ margin: '4px 0 0 0', color: '#16a34a', fontSize: '1.3em' }}>R$ {totals.weekTotal.toFixed(2).replace('.', ',')}</h3>
            </div>
            <div style={{ background: '#fff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75em', color: '#64748b', fontWeight: 'bold' }}>🗓️ Este Mês</span>
              <h3 style={{ margin: '4px 0 0 0', color: primary, fontSize: '1.3em' }}>R$ {totals.monthTotal.toFixed(2).replace('.', ',')}</h3>
            </div>
            <div style={{ background: '#fff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75em', color: '#64748b', fontWeight: 'bold' }}>⏪ Mês Passado</span>
              <h3 style={{ margin: '4px 0 0 0', color: '#0284c7', fontSize: '1.3em' }}>R$ {totals.lastMonthTotal.toFixed(2).replace('.', ',')}</h3>
            </div>
            <div style={{ background: '#fff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75em', color: '#64748b', fontWeight: 'bold' }}>🏆 Este Ano</span>
              <h3 style={{ margin: '4px 0 0 0', color: '#8b5cf6', fontSize: '1.3em' }}>R$ {totals.yearTotal.toFixed(2).replace('.', ',')}</h3>
            </div>
            <div style={{ background: '#fff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75em', color: '#64748b', fontWeight: 'bold' }}>👁️ Cliques no Catálogo</span>
              <h3 style={{ margin: '4px 0 0 0', color: '#0284c7', fontSize: '1.3em' }}>{visits}</h3>
            </div>
          </div>

          {/* CARD DE COMPARTILHAMENTO DO LINK */}
          <div style={{ backgroundColor: secondary, border: `1px solid ${primary}40`, borderRadius: '12px', padding: '16px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1em', color: primary }}>🌐 Seu Link do Catálogo Virtual</h3>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.8em', color: text }}>Divulgue para suas clientes fazerem pedidos pelo WhatsApp:</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input type="text" readOnly value={storeUrl} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.85em', fontWeight: 'bold' }} />
              <button onClick={handleCopyLink} style={{ backgroundColor: primary, color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8em' }}>
                {copied ? '✅ Copiado!' : '📋 Copiar'}
              </button>
            </div>
            <a href={`https://wa.me/?text=${encodeURIComponent(`Olá! Confira as novidades do nosso catálogo: ${storeUrl}`)}`} target="_blank" rel="noreferrer" style={{ display: 'block', textDecoration: 'none', backgroundColor: '#25D366', color: '#fff', textAlign: 'center', padding: '10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85em' }}>
              📲 Enviar Link no WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* ABA 2: FINANCEIRO / CADERNO DIGITAL */}
      {activeTab === 'sales' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '15px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.05em', color: text }}>➕ Registrar Venda</h3>
            <form onSubmit={handleCreateSale} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.8em', fontWeight: 'bold' }}>Escolher Peça do Catálogo:</label>
                <select onChange={(e) => handleSelectProductForSale(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="">-- Selecionar da loja --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} - R$ {Number(p.price).toFixed(2)}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8em', fontWeight: 'bold' }}>Nome da Peça:</label>
                  <input type="text" placeholder="Ex: Vestido Mídi" value={newSale.product_name} onChange={e => setNewSale({ ...newSale, product_name: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.8em', fontWeight: 'bold' }}>Valor (R$):</label>
                  <input type="text" placeholder="189,90" value={newSale.amount} onChange={e => setNewSale({ ...newSale, amount: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8em', fontWeight: 'bold' }}>Forma de Pagamento:</label>
                  <select value={newSale.payment_method} onChange={e => setNewSale({ ...newSale, payment_method: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <option value="pix">💚 Pix</option>
                    <option value="credit">💳 Cartão de Crédito</option>
                    <option value="debit">💳 Cartão de Débito</option>
                    <option value="cash">💵 Dinheiro</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8em', fontWeight: 'bold' }}>Status do Pagamento:</label>
                  <select value={newSale.payment_status} onChange={e => setNewSale({ ...newSale, payment_status: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <option value="paid">🟢 Concluído / Pago</option>
                    <option value="pending">🟡 Pendente (Fiado)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8em', fontWeight: 'bold' }}>Nome da Cliente (Opcional):</label>
                <input type="text" placeholder="Ex: Maria Silva" value={newSale.customer_name} onChange={e => setNewSale({ ...newSale, customer_name: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              </div>

              <button type="submit" style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Anotar Venda
              </button>
            </form>
          </div>

          <div>
            <h3 style={{ fontSize: '1em', color: text }}>Extrato Completo ({sales.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sales.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <strong style={{ fontSize: '0.9em', display: 'block', color: text }}>{s.product_name}</strong>
                    <small style={{ color: '#64748b', fontSize: '0.75em' }}>
                      Cliente: {s.customer_name || 'Não informada'} | {s.payment_method.toUpperCase()} | {new Date(s.created_at).toLocaleDateString()}
                    </small>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontWeight: 'bold', color: s.payment_status === 'paid' ? '#16a34a' : '#ca8a04', fontSize: '0.9em' }}>
                      R$ {Number(s.amount).toFixed(2).replace('.', ',')}
                    </span>
                    <button onClick={() => handleDeleteSale(s.id)} style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '11px' }}>✖</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: GERENCIAR PEÇAS */}
      {activeTab === 'products' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '15px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.05em', color: text }}>👗 Cadastrar Peça de Moda</h3>
            <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.8em', fontWeight: 'bold' }}>Nome da Peça:</label>
                <input type="text" placeholder="Ex: Vestido Mídi Floral" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8em', fontWeight: 'bold' }}>Preço (R$):</label>
                <input type="text" placeholder="189,90" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8em', fontWeight: 'bold' }}>Descrição / Tamanhos:</label>
                <textarea placeholder="Ex: Tecido leve, tamanhos P, M e G" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', height: '50px' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8em', fontWeight: 'bold' }}>Foto do Produto:</label>
                <input type="file" accept="image/*" onChange={(e) => setNewProduct({ ...newProduct, image_file: e.target.files[0] })} style={{ width: '100%', marginTop: '3px' }} />
              </div>
              <button type="submit" disabled={uploadingProduct} style={{ backgroundColor: primary, color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                {uploadingProduct ? 'Enviando foto...' : 'Cadastrar Peça'}
              </button>
            </form>
          </div>

          <div>
            <h3 style={{ fontSize: '1em', color: text }}>Peças no Catálogo ({products.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {products.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px', backgroundColor: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {item.image_url && <img src={item.image_url} alt={item.name} style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px' }} />}
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.9em', color: text }}>{item.name}</strong>
                      <span style={{ color: primary, fontSize: '0.8em', fontWeight: 'bold' }}>R$ {Number(item.price).toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteProduct(item.id)} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.75em' }}>
                    Excluir
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: PERSONALIZAÇÃO COMPLETA DE CORES E TEMAS */}
      {activeTab === 'settings' && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '15px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '1.05em', color: text }}>🎨 Personalização de Cores & Estilo</h3>
          
          <form onSubmit={handleSaveStoreConfig} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8em', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Nome da Loja:</label>
              <input type="text" value={storeConfig.name} onChange={(e) => setStoreConfig({ ...storeConfig, name: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.8em', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>WhatsApp (Ex: 5511999999999):</label>
              <input type="text" value={storeConfig.whatsapp_number} onChange={(e) => setStoreConfig({ ...storeConfig, whatsapp_number: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>

            {/* SELEÇÃO DE CORES CUSTOMIZADAS */}
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9em', color: '#334155' }}>🎨 Paleta de Cores (Seus Painéis e Loja)</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75em', fontWeight: 'bold', display: 'block' }}>Cor Principal (Botões / Destaques):</label>
                  <div style={{ display: 'flex', gap: '5px', marginTop: '4px' }}>
                    <input type="color" value={storeConfig.primary_color} onChange={e => setStoreConfig({ ...storeConfig, primary_color: e.target.value })} style={{ width: '40px', height: '35px', border: 'none', cursor: 'pointer' }} />
                    <input type="text" value={storeConfig.primary_color} onChange={e => setStoreConfig({ ...storeConfig, primary_color: e.target.value })} style={{ flex: 1, padding: '4px', fontSize: '0.8em', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75em', fontWeight: 'bold', display: 'block' }}>Cor Secundária (Fundos Leves):</label>
                  <div style={{ display: 'flex', gap: '5px', marginTop: '4px' }}>
                    <input type="color" value={storeConfig.secondary_color} onChange={e => setStoreConfig({ ...storeConfig, secondary_color: e.target.value })} style={{ width: '40px', height: '35px', border: 'none', cursor: 'pointer' }} />
                    <input type="text" value={storeConfig.secondary_color} onChange={e => setStoreConfig({ ...storeConfig, secondary_color: e.target.value })} style={{ flex: 1, padding: '4px', fontSize: '0.8em', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75em', fontWeight: 'bold', display: 'block' }}>Cor de Fundo da Tela:</label>
                  <div style={{ display: 'flex', gap: '5px', marginTop: '4px' }}>
                    <input type="color" value={storeConfig.background_color} onChange={e => setStoreConfig({ ...storeConfig, background_color: e.target.value })} style={{ width: '40px', height: '35px', border: 'none', cursor: 'pointer' }} />
                    <input type="text" value={storeConfig.background_color} onChange={e => setStoreConfig({ ...storeConfig, background_color: e.target.value })} style={{ flex: 1, padding: '4px', fontSize: '0.8em', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75em', fontWeight: 'bold', display: 'block' }}>Cor do Texto / Letras:</label>
                  <div style={{ display: 'flex', gap: '5px', marginTop: '4px' }}>
                    <input type="color" value={storeConfig.text_color} onChange={e => setStoreConfig({ ...storeConfig, text_color: e.target.value })} style={{ width: '40px', height: '35px', border: 'none', cursor: 'pointer' }} />
                    <input type="text" value={storeConfig.text_color} onChange={e => setStoreConfig({ ...storeConfig, text_color: e.target.value })} style={{ flex: 1, padding: '4px', fontSize: '0.8em', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  </div>
                </div>
              </div>

              {/* TEMAS PRÉ-DEFINIDOS RÁPIDOS */}
              <div style={{ marginTop: '12px' }}>
                <span style={{ fontSize: '0.75em', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Ou escolha um tema rápido:</span>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setStoreConfig({ ...storeConfig, primary_color: '#db2777', secondary_color: '#fbcfe8', background_color: '#f8fafc', text_color: '#1e293b' })} style={{ background: '#db2777', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>💖 Rosa Chic</button>
                  <button type="button" onClick={() => setStoreConfig({ ...storeConfig, primary_color: '#000000', secondary_color: '#e2e8f0', background_color: '#121212', text_color: '#ffffff' })} style={{ background: '#000', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>🖤 All Black (Escuro)</button>
                  <button type="button" onClick={() => setStoreConfig({ ...storeConfig, primary_color: '#16a34a', secondary_color: '#dcfce7', background_color: '#f8fafc', text_color: '#14532d' })} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>🌿 Verde Botânico</button>
                  <button type="button" onClick={() => setStoreConfig({ ...storeConfig, primary_color: '#2563eb', secondary_color: '#dbeafe', background_color: '#f8fafc', text_color: '#1e3a8a' })} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>💙 Azul Moderno</button>
                </div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label style={{ fontSize: '0.8em', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>🖼️ Foto de Perfil / Logo:</label>
              {storeConfig.logo_url && <img src={storeConfig.logo_url} alt="Logo" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50%', marginBottom: '6px' }} />}
              <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} style={{ width: '100%' }} />
            </div>

            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label style={{ fontSize: '0.8em', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>🖼️ Banner / Capa:</label>
              {storeConfig.banner_url && <img src={storeConfig.banner_url} alt="Banner" style={{ width: '100%', height: '60px', objectFit: 'cover', borderRadius: '6px', marginBottom: '6px' }} />}
              <input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files[0])} style={{ width: '100%' }} />
            </div>

            <button type="submit" disabled={savingStore} style={{ backgroundColor: primary, color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              {savingStore ? 'Salvando...' : 'Aplicar e Salvar Personalização'}
            </button>
          </form>
        </div>
      )}

    </div>
  )
}

// ===========================================================
// 3. CATÁLOGO PÚBLICO DA LOJA (COM CORES CUSTOMIZADAS)
// ===========================================================
function StoreCatalog() {
  const { slug } = useParams()
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStoreAndProducts() }, [slug])

  const fetchStoreAndProducts = async () => {
    setLoading(true)
    const { data: storeData } = await supabase.from('stores').select('*').eq('slug', slug).single()

    if (storeData) {
      setStore(storeData)
      await supabase.from('store_visits').insert([{ store_id: storeData.id }])

      const { data: prodData } = await supabase.from('products').select('*').eq('store_id', storeData.id)
      setProducts(prodData || [])
    }
    setLoading(false)
  }

  if (loading) return <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>Carregando catálogo...</div>
  if (!store) return <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>Loja não encontrada.</div>

  if (store.status === 'suspended') {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
        <h2>🚫 Catálogo Indisponível</h2>
        <p>Esta loja está temporariamente desativada.</p>
      </div>
    )
  }

  const primary = store.primary_color || '#db2777'
  const secondary = store.secondary_color || '#fbcfe8'
  const bg = store.background_color || '#f8fafc'
  const text = store.text_color || '#1e293b'

  return (
    <div style={{ backgroundColor: bg, color: text, minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '40px' }}>
      <div style={{
        height: '160px',
        backgroundColor: secondary,
        backgroundImage: store.banner_url ? `url(${store.banner_url})` : `linear-gradient(135deg, ${secondary} 0%, ${primary} 100%)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }} />

      <div style={{ maxWidth: '800px', margin: '-40px auto 20px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          backgroundColor: '#fff',
          margin: '0 auto 10px auto',
          overflow: 'hidden',
          border: '3px solid #fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {store.logo_url ? (
            <img src={store.logo_url} alt={store.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '1.8em', color: primary, fontWeight: 'bold' }}>{store.name.charAt(0)}</span>
          )}
        </div>
        <h1 style={{ margin: '0', fontSize: '1.5em', color: text }}>{store.name}</h1>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
          {products.map((product) => (
            <div key={product.id} style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid #e2e8f0' }}>
              <div>
                {product.image_url && <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }} />}
                <h3 style={{ margin: '0 0 4px 0', fontSize: '0.95em', color: '#1e293b' }}>{product.name}</h3>
                <strong style={{ fontSize: '1.1em', color: primary, display: 'block', marginBottom: '8px' }}>R$ {Number(product.price).toFixed(2).replace('.', ',')}</strong>
              </div>
              <a
                href={`https://wa.me/${store.whatsapp_number?.replace(/\D/g, '')}?text=Olá! Tenho interesse na peça: ${encodeURIComponent(product.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ backgroundColor: '#25D366', color: '#fff', textDecoration: 'none', padding: '8px', borderRadius: '6px', fontWeight: 'bold', textAlign: 'center', fontSize: '0.85em', display: 'block' }}
              >
                💬 Pedir no WhatsApp
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ===========================================================
// ROTAS
// ===========================================================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/super-admin" element={<SuperAdminPanel />} />
        <Route path="/admin" element={<LojistaAdmin />} />
        <Route path="/loja/:slug" element={<StoreCatalog />} />
        <Route path="/" element={
          <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center' }}>
            <h1>Plataforma de Catálogos Virtual SaaS</h1>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
              <Link to="/super-admin" style={{ padding: '10px 15px', background: '#2563eb', color: '#fff', textDecoration: 'none', borderRadius: '6px' }}>Super Admin</Link>
              <Link to="/admin" style={{ padding: '10px 15px', background: '#db2777', color: '#fff', textDecoration: 'none', borderRadius: '6px' }}>Painel do Lojista</Link>
              <Link to="/loja/minha-loja" style={{ padding: '10px 15px', background: '#16a34a', color: '#fff', textDecoration: 'none', borderRadius: '6px' }}>Ver Catálogo Exemplo</Link>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}