import {
  Book, Check, CheckCircle2, CheckSquare, ChevronDown, ChevronRight,
  Circle, Clock, LayoutDashboard, Loader2, LogOut, Pencil,
  Sparkles, Trash2, Plus, X, ListTree
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Subtopico {
  id: string;
  topico_id: string;
  nome: string;
  concluido: boolean;
}

interface Topico {
  id: string;
  disciplina_id: string;
  nome: string;
  grupo?: string;
  concluido: boolean;
  subtopicos?: Subtopico[];
}

interface Disciplina {
  id: string;
  nome: string;
  topicos?: Topico[];
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  
  // NOME DA ABA ALTERADO PARA O PORTFÓLIO
  const [activeTab, setActiveTab] = useState('Trilhas & Módulos');
  
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [novaDisciplina, setNovaDisciplina] = useState('');
  const [expandedDisciplinas, setExpandedDisciplinas] = useState<Record<string, boolean>>({});
  
  const [novoTopicoNome, setNovoTopicoNome] = useState<Record<string, string>>({});
  const [novoTopicoGrupo, setNovoTopicoGrupo] = useState<Record<string, string>>({});
  
  const [editingTopicoId, setEditingTopicoId] = useState<string | null>(null);
  const [editingTopicoNome, setEditingTopicoNome] = useState('');
  const [editingTopicoGrupo, setEditingTopicoGrupo] = useState('');

  const [editingGroup, setEditingGroup] = useState<{ discId: string, oldName: string } | null>(null);
  const [editingGroupNewName, setEditingGroupNewName] = useState('');

  // Estados do Modal de Subtópicos
  const [subtopicosModalTopico, setSubtopicosModalTopico] = useState<Topico | null>(null);
  const [novoSubtopico, setNovoSubtopico] = useState('');
  const [editingSubtopicoId, setEditingSubtopicoId] = useState<string | null>(null);
  const [editingSubtopicoNome, setEditingSubtopicoNome] = useState('');
  const [isGeneratingSubtopicos, setIsGeneratingSubtopicos] = useState(false);

  // Estados do Modal de Importação com IA
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rawText, setRawText] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3.7-flash');
  const [isParsing, setIsParsing] = useState(false);

  // MENU ALTERADO PARA O PORTFÓLIO
  const menuItems = [
    { icon: LayoutDashboard, label: 'Visão Geral' },
    { icon: Book, label: 'Trilhas & Módulos' },
    { icon: CheckSquare, label: 'Questões & Desafios técnicos' },
    { icon: Clock, label: 'Revisões' },
  ];

  useEffect(() => {
    if (activeTab === 'Trilhas & Módulos' || activeTab === 'Visão Geral') {
      fetchDisciplinasComTopicos();
    }
  }, [activeTab]);

  async function fetchDisciplinasComTopicos() {
    const { data: discData } = await supabase.from('disciplinas').select('*').order('created_at', { ascending: false });
    const { data: topData } = await supabase.from('topicos').select('*').order('created_at', { ascending: true });
    const { data: subData } = await supabase.from('subtopicos').select('*').order('created_at', { ascending: true });

    const agrupado = (discData || []).map((d) => ({
      ...d,
      topicos: (topData || []).filter((t) => t.disciplina_id === d.id).map((t) => ({
        ...t,
        subtopicos: (subData || []).filter((s) => s.topico_id === t.id)
      })),
    }));

    setDisciplinas(agrupado);
    
    if (subtopicosModalTopico) {
      const topicoAtualizado = agrupado.flatMap(d => d.topicos || []).find(t => t.id === subtopicosModalTopico.id);
      if (topicoAtualizado) setSubtopicosModalTopico(topicoAtualizado);
    }
  }

  const toggleExpand = (id: string) => setExpandedDisciplinas(prev => ({ ...prev, [id]: !prev[id] }));

  // --- CRUD DISCIPLINAS E TÓPICOS ---
  async function handleAddDisciplina(e: React.FormEvent) {
    e.preventDefault();
    if (!novaDisciplina.trim() || !user) return;
    const { data } = await supabase.from('disciplinas').insert([{ nome: novaDisciplina, user_id: user.id }]).select();
    if (data) {
      setDisciplinas([{ ...data[0], topicos: [] }, ...disciplinas]);
      setNovaDisciplina('');
      setExpandedDisciplinas(prev => ({ ...prev, [data[0].id]: true }));
    }
  }

  async function handleAddTopico(disciplinaId: string) {
    const nome = novoTopicoNome[disciplinaId];
    const grupo = novoTopicoGrupo[disciplinaId]?.trim() || 'Geral';
    if (!nome || !nome.trim() || !user) return;
    const { data } = await supabase.from('topicos').insert([{ disciplina_id: disciplinaId, user_id: user.id, nome: nome.trim(), concluido: false, grupo }]).select();
    if (data) {
      setDisciplinas(disciplinas.map(d => d.id === disciplinaId ? { ...d, topicos: [...(d.topicos || []), { ...data[0], subtopicos: [] }] } : d));
      setNovoTopicoNome(prev => ({ ...prev, [disciplinaId]: '' }));
      setNovoTopicoGrupo(prev => ({ ...prev, [disciplinaId]: '' }));
    }
  }

  async function handleToggleTopico(topico: Topico) {
    const novoStatus = !topico.concluido;
    const { error } = await supabase.from('topicos').update({ concluido: novoStatus }).eq('id', topico.id);
    if (!error) fetchDisciplinasComTopicos();
  }

  async function handleSaveEditTopico(topicoId: string) {
    if (!editingTopicoNome.trim()) return;
    const novoGrupo = editingTopicoGrupo.trim() || 'Geral';
    const { error } = await supabase.from('topicos').update({ nome: editingTopicoNome.trim(), grupo: novoGrupo }).eq('id', topicoId);
    if (!error) {
      fetchDisciplinasComTopicos();
      setEditingTopicoId(null);
    }
  }

  async function handleSaveGroup(discId: string, oldName: string) {
    if (!editingGroupNewName.trim() || editingGroupNewName.trim() === oldName) return setEditingGroup(null);
    const { error } = await supabase.from('topicos').update({ grupo: editingGroupNewName.trim() }).eq('disciplina_id', discId).eq('grupo', oldName);
    if (!error) {
      fetchDisciplinasComTopicos();
      setEditingGroup(null);
    }
  }

  async function handleDeleteDisciplina(id: string) {
    await supabase.from('disciplinas').delete().eq('id', id);
    fetchDisciplinasComTopicos();
  }

  async function handleDeleteTopico(topicoId: string) {
    await supabase.from('topicos').delete().eq('id', topicoId);
    fetchDisciplinasComTopicos();
  }

  // --- CRUD SUBTÓPICOS ---
  async function handleAddSubtopico(topicoId: string) {
    if (!novoSubtopico.trim() || !user) return;
    await supabase.from('subtopicos').insert([{ topico_id: topicoId, user_id: user.id, nome: novoSubtopico.trim(), concluido: false }]);
    setNovoSubtopico('');
    fetchDisciplinasComTopicos();
  }

  async function handleToggleSubtopico(subtopico: Subtopico) {
    await supabase.from('subtopicos').update({ concluido: !subtopico.concluido }).eq('id', subtopico.id);
    fetchDisciplinasComTopicos();
  }

  async function handleDeleteSubtopico(subtopicoId: string) {
    await supabase.from('subtopicos').delete().eq('id', subtopicoId);
    fetchDisciplinasComTopicos();
  }

  async function handleSaveEditSubtopico(subtopicoId: string) {
    if (!editingSubtopicoNome.trim()) return;
    await supabase.from('subtopicos').update({ nome: editingSubtopicoNome.trim() }).eq('id', subtopicoId);
    setEditingSubtopicoId(null);
    fetchDisciplinasComTopicos();
  }

  // --- IA PARA ECOSSISTEMA/SUBTÓPICOS ---
  async function handleIAEcossistema() {
    if (!subtopicosModalTopico || !user) return;
    setIsGeneratingSubtopicos(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error('Chave VITE_GEMINI_API_KEY ausente.');
      
      const prompt = `O usuário está estudando tecnologia. O tópico principal é: "${subtopicosModalTopico.nome}". Liste o ecossistema desse tópico (principais frameworks, bibliotecas e conceitos-chave) que ele deve dominar.
      Retorne APENAS um array JSON puro de strings. Exemplo: ["Conceito 1", "Framework X", "Biblioteca Y"].`;
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      
      const result = await response.json();
      let jsonLimpo = result.candidates?.[0]?.content?.parts?.[0]?.text;
      const p = jsonLimpo.indexOf('['); const u = jsonLimpo.lastIndexOf(']');
      if (p !== -1 && u !== -1) jsonLimpo = jsonLimpo.substring(p, u + 1);
      
      const parsedData: string[] = JSON.parse(jsonLimpo);
      
      const payload = parsedData.map(nome => ({
        topico_id: subtopicosModalTopico.id,
        user_id: user.id,
        nome: nome,
        concluido: false
      }));

      if (payload.length > 0) {
        await supabase.from('subtopicos').insert(payload);
        fetchDisciplinasComTopicos();
      }
    } catch (e: any) {
      alert("Erro ao consultar IA: " + e.message);
    } finally {
      setIsGeneratingSubtopicos(false);
    }
  }

  // --- IA PARA IMPORTAÇÃO EM MASSA (BLOCOS) ---
  async function handleProcessarEditalIA() {
    if (!rawText.trim() || !user) return;
    const inputNome = (document.getElementById('manual-disciplina-nome') as HTMLInputElement)?.value || 'Tecnologia da Informação';
    setIsParsing(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const prompt = `Você é um especialista em estruturar trilhas de conhecimento. Assunto: "${inputNome}". Analise o texto fornecido. Identifique BLOCOS de assunto e desmembre os SUBTÓPICOS. Retorne APENAS um array JSON puro: [{"bloco": "Banco de Dados", "topicos": ["MongoDB", "PostgreSQL"]}]. Texto: ${rawText}`;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
      const result = await response.json();
      let jsonLimpo = result.candidates?.[0]?.content?.parts?.[0]?.text;
      const p = jsonLimpo.indexOf('['); const u = jsonLimpo.lastIndexOf(']');
      if (p !== -1 && u !== -1) jsonLimpo = jsonLimpo.substring(p, u + 1);
      const parsedData = JSON.parse(jsonLimpo);
      const { data: discData } = await supabase.from('disciplinas').insert([{ nome: inputNome, user_id: user.id }]).select();
      const discId = discData![0].id;
      const topicosPayload = [];
      for (const grupo of parsedData) { if (grupo.topicos) { for (const tNome of grupo.topicos) { topicosPayload.push({ disciplina_id: discId, user_id: user.id, nome: tNome, grupo: grupo.bloco || 'Geral', concluido: false }); } } }
      if (topicosPayload.length > 0) await supabase.from('topicos').insert(topicosPayload);
      await fetchDisciplinasComTopicos();
      setRawText(''); setIsModalOpen(false);
    } catch (err: any) { alert('Erro: ' + err.message); } finally { setIsParsing(false); }
  }

  const totalTopicos = disciplinas.reduce((acc, d) => acc + (d.topicos?.length || 0), 0);
  const totalConcluidos = disciplinas.reduce((acc, d) => acc + (d.topicos?.filter(t => t.concluido).length || 0), 0);
  const percentualGeral = totalTopicos > 0 ? Math.round((totalConcluidos / totalTopicos) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-6"><h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Book className="text-primary" /> Planner</h1></div>
        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item, index) => (
            <button key={index} onClick={() => setActiveTab(item.label)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === item.label ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-gray-100'}`}><item.icon size={20} />{item.label}</button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200"><button onClick={signOut} className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"><LogOut size={20} />Sair</button></div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
          
          {activeTab === 'Visão Geral' && (
            <div>
              {/* TEXTOS ALTERADOS PARA PORTFÓLIO */}
              <header className="mb-8"><h2 className="text-2xl font-bold text-gray-900">Dashboard de Aprendizado</h2></header>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between text-sm font-medium mb-2"><span>Cobertura da Trilha</span><span>{percentualGeral}% concluído</span></div>
                <div className="w-full bg-gray-200 rounded-full h-3"><div className="bg-primary h-3 rounded-full transition-all duration-500" style={{ width: `${percentualGeral}%` }}></div></div>
              </div>
            </div>
          )}

          {activeTab === 'Trilhas & Módulos' && (
            <div>
              {/* TEXTOS ALTERADOS PARA PORTFÓLIO */}
              <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Trilhas de Estudo</h2>
                  <p className="text-gray-600 mt-1">Gerencie a árvore de conhecimentos e habilidades técnicas.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-sm">
                  <Sparkles size={18} /> Importar com IA
                </button>
              </header>

              <form onSubmit={handleAddDisciplina} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex gap-4">
                <input type="text" placeholder="Criar trilha / disciplina manual..." value={novaDisciplina} onChange={(e) => setNovaDisciplina(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none text-sm" />
                <button type="submit" className="bg-primary hover:bg-blue-600 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 text-sm"><Plus size={18} /> Adicionar</button>
              </form>

              <div className="space-y-4">
                {disciplinas.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">Nenhuma trilha cadastrada.</div>
                ) : (
                  disciplinas.map((disciplina) => {
                    const topicos = disciplina.topicos || [];
                    const concluidos = topicos.filter(t => t.concluido).length;
                    const isExpanded = !!expandedDisciplinas[disciplina.id];

                    const groupedTopicos = topicos.reduce((acc, topico) => {
                      const grupo = topico.grupo || 'Geral';
                      if (!acc[grupo]) acc[grupo] = [];
                      acc[grupo].push(topico);
                      return acc;
                    }, {} as Record<string, Topico[]>);

                    return (
                      <div key={disciplina.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div onClick={() => toggleExpand(disciplina.id)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <button className="text-gray-400">{isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}</button>
                            <span className="font-semibold text-gray-900">{disciplina.nome}</span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{concluidos}/{topicos.length}</span>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteDisciplina(disciplina.id); }} className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg"><Trash2 size={18} /></button>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-gray-100 bg-gray-50/50 p-6 space-y-6">
                            {Object.entries(groupedTopicos).map(([grupoNome, listaTopicos]) => (
                              <div key={grupoNome} className="space-y-3">
                                {grupoNome !== 'Geral' && (
                                  <div className="flex items-center gap-2 mb-2 ml-1">
                                    {editingGroup?.discId === disciplina.id && editingGroup?.oldName === grupoNome ? (
                                      <div className="flex items-center gap-2">
                                        <input autoFocus value={editingGroupNewName} onChange={e => setEditingGroupNewName(e.target.value)} className="text-xs font-bold text-gray-700 uppercase tracking-wider border border-purple-500 rounded px-2 py-1 outline-none" />
                                        <button onClick={() => handleSaveGroup(disciplina.id, grupoNome)} className="text-green-600 bg-green-50 p-1 rounded"><Check size={14}/></button>
                                        <button onClick={() => setEditingGroup(null)} className="text-gray-400 bg-gray-100 p-1 rounded"><X size={14}/></button>
                                      </div>
                                    ) : (
                                      <><h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{grupoNome}</h4><button onClick={() => { setEditingGroup({ discId: disciplina.id, oldName: grupoNome }); setEditingGroupNewName(grupoNome); }} className="text-gray-400 hover:text-purple-600"><Pencil size={12} /></button></>
                                    )}
                                  </div>
                                )}
                                
                                <ul className="space-y-2">
                                  {listaTopicos.map((topico) => {
                                    const isEditing = editingTopicoId === topico.id;
                                    const hasSubtopicos = (topico.subtopicos?.length || 0) > 0;

                                    return (
                                      <li key={topico.id} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-200 gap-3">
                                        <div className="flex items-center gap-3 flex-1">
                                          {!isEditing && (
                                            <button onClick={() => handleToggleTopico(topico)}>
                                              {topico.concluido ? <CheckCircle2 size={18} className="text-green-600 shrink-0" /> : <Circle size={18} className="text-gray-300 shrink-0" />}
                                            </button>
                                          )}
                                          
                                          {isEditing ? (
                                            <div className="flex flex-1 gap-2">
                                              <input type="text" value={editingTopicoGrupo} onChange={(e) => setEditingTopicoGrupo(e.target.value)} placeholder="Grupo (ex: Geral)" className="w-1/3 text-sm border border-purple-500 rounded px-2 py-1 outline-none font-medium text-gray-600" />
                                              <input type="text" value={editingTopicoNome} onChange={(e) => setEditingTopicoNome(e.target.value)} className="w-2/3 text-sm border border-purple-500 rounded px-2 py-1 outline-none font-medium" autoFocus />
                                            </div>
                                          ) : (
                                            /* O RISCO FOI REMOVIDO AQUI: a classe line-through não existe mais */
                                            <span onClick={() => handleToggleTopico(topico)} className="text-sm cursor-pointer flex-1 text-gray-700 font-medium hover:text-gray-900 transition-colors">
                                              {topico.nome}
                                            </span>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-1">
                                          {/* BOTÃO PARA ABRIR O MODAL DE SUBTÓPICOS (ECOSSISTEMA) */}
                                          <button 
                                            onClick={() => setSubtopicosModalTopico(topico)} 
                                            className={`p-1.5 rounded transition-colors flex items-center gap-1 ${hasSubtopicos ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                            title="Ecossistema / Subtópicos"
                                          >
                                            <ListTree size={16} />
                                            {hasSubtopicos && <span className="text-[10px] font-bold">{topico.subtopicos?.length}</span>}
                                          </button>

                                          {isEditing ? (
                                            <button onClick={() => handleSaveEditTopico(topico.id)} className="text-green-600 hover:bg-green-50 p-1.5 rounded"><Check size={16} /></button>
                                          ) : (
                                            <button onClick={() => { setEditingTopicoId(topico.id); setEditingTopicoNome(topico.nome); setEditingTopicoGrupo(topico.grupo || 'Geral'); }} className="text-gray-400 hover:text-purple-600 hover:bg-purple-50 p-1.5 rounded"><Pencil size={15} /></button>
                                          )}
                                          <button onClick={() => handleDeleteTopico(topico.id)} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 size={16} /></button>
                                        </div>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            ))}

                            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200 mt-4">
                              <input type="text" placeholder="Grupo / Módulo..." value={novoTopicoGrupo[disciplina.id] || ''} onChange={(e) => setNovoTopicoGrupo({ ...novoTopicoGrupo, [disciplina.id]: e.target.value })} className="w-full sm:w-1/3 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg outline-none" />
                              <input type="text" placeholder="Nome do novo tópico..." value={novoTopicoNome[disciplina.id] || ''} onChange={(e) => setNovoTopicoNome({ ...novoTopicoNome, [disciplina.id]: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && handleAddTopico(disciplina.id)} className="flex-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg outline-none" />
                              <button onClick={() => handleAddTopico(disciplina.id)} className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-1.5 text-sm rounded-lg font-medium">Adicionar</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE SUBTÓPICOS (ECOSSISTEMA) */}
      {subtopicosModalTopico && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full flex flex-col shadow-xl relative max-h-[90vh]">
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ListTree className="text-blue-500" /> Ecossistema
                </h3>
                <p className="text-sm text-gray-500 mt-1">Tópico: <strong className="text-gray-800">{subtopicosModalTopico.nome}</strong></p>
              </div>
              <button onClick={() => setSubtopicosModalTopico(null)} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg"><X size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
              <ul className="space-y-2 mb-4">
                {subtopicosModalTopico.subtopicos?.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                    Nenhum detalhe ou tecnologia cadastrada ainda.
                  </div>
                ) : (
                  subtopicosModalTopico.subtopicos?.map(sub => {
                    const isEditing = editingSubtopicoId === sub.id;
                    return (
                      <li key={sub.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 shadow-sm gap-3">
                        <div className="flex items-center gap-3 flex-1">
                          {!isEditing && (
                            <button onClick={() => handleToggleSubtopico(sub)}>
                              {sub.concluido ? <CheckCircle2 size={18} className="text-green-600 shrink-0" /> : <Circle size={18} className="text-gray-300 shrink-0" />}
                            </button>
                          )}
                          {isEditing ? (
                            <input type="text" value={editingSubtopicoNome} onChange={(e) => setEditingSubtopicoNome(e.target.value)} className="w-full text-sm border border-blue-500 rounded px-2 py-1 outline-none font-medium" autoFocus />
                          ) : (
                            <span onClick={() => handleToggleSubtopico(sub)} className="text-sm cursor-pointer flex-1 text-gray-700 font-medium hover:text-gray-900">{sub.nome}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {isEditing ? (
                            <button onClick={() => handleSaveEditSubtopico(sub.id)} className="text-green-600 hover:bg-green-50 p-1.5 rounded"><Check size={16} /></button>
                          ) : (
                            <button onClick={() => { setEditingSubtopicoId(sub.id); setEditingSubtopicoNome(sub.nome); }} className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded"><Pencil size={15} /></button>
                          )}
                          <button onClick={() => handleDeleteSubtopico(sub.id)} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 size={16} /></button>
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
              
              <div className="flex gap-2">
                <input 
                  type="text" placeholder="Adicionar subitem manual..." value={novoSubtopico} 
                  onChange={(e) => setNovoSubtopico(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubtopico(subtopicosModalTopico.id)} 
                  className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg outline-none" 
                />
                <button onClick={() => handleAddSubtopico(subtopicosModalTopico.id)} className="bg-gray-800 text-white px-4 py-2 text-sm rounded-lg font-medium">Adicionar</button>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-white rounded-b-2xl">
               <button onClick={handleIAEcossistema} disabled={isGeneratingSubtopicos} className="text-sm font-medium text-purple-600 hover:bg-purple-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                  {isGeneratingSubtopicos ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Expandir com IA
               </button>
               <button onClick={() => setSubtopicosModalTopico(null)} className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Concluir</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IA IMPORTAÇÃO DE TRILHA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button>
            <div className="flex items-center gap-3 mb-4"><div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl"><Sparkles size={24} /></div><div><h3 className="text-lg font-bold text-gray-900">Importação com Blocos</h3></div></div>
            <div className="mb-4"><label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Disciplina Principal:</label><input type="text" id="manual-disciplina-nome" defaultValue="Tecnologia da Informação" className="w-full p-2.5 text-sm border border-gray-300 rounded-xl bg-gray-50 outline-none" /></div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Modelo de IA:</label>
              <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="w-full p-2.5 text-sm border border-gray-300 rounded-xl bg-gray-50 outline-none"><option value="gemini-3.7-flash">Gemini 3.7 Flash</option><option value="gemini-3.6-flash">Gemini 3.6 Flash</option><option value="gemini-3.5-flash">Gemini 3.5 Flash</option></select>
            </div>
            
            {/* TEXTO ALTERADO PARA PORTFÓLIO: Ementa / Conteúdo Programático */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Ementa / Conteúdo Programático:</label>
              <textarea rows={6} value={rawText} onChange={(e) => setRawText(e.target.value)} className="w-full p-3 text-sm border border-gray-300 rounded-xl outline-none font-mono"></textarea>
            </div>
            
            <div className="flex justify-end gap-3"><button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button><button onClick={handleProcessarEditalIA} disabled={isParsing || !rawText.trim()} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 text-sm font-medium rounded-lg flex items-center gap-2">{isParsing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}Processar e Salvar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}