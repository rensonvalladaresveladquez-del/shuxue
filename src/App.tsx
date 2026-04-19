/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  Square, 
  BarChart, 
  Layers, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  CheckCircle2, 
  Circle, 
  ArrowLeft, 
  Download,
  Menu,
  X
} from 'lucide-react';
import { KNOWLEDGE_POINTS, CATEGORIES, KnowledgePoint } from './data';

// --- Types ---
type View = 'dashboard' | 'study';

// --- Utils ---
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [selectedPoint, setSelectedPoint] = useState<KnowledgePoint | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());

  // --- Persistence ---
  useEffect(() => {
    const saved = localStorage.getItem('math-prep-completed');
    if (saved) {
      setCompletedIds(new Set(JSON.parse(saved)));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('math-prep-completed', JSON.stringify(Array.from(completedIds)));
  }, [completedIds]);

  // --- Logic ---
  const toggleComplete = (id: string) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const stats = useMemo(() => {
    const total = KNOWLEDGE_POINTS.length;
    const completed = completedIds.size;
    const percentage = Math.round((completed / total) * 100);

    const byCategory: Record<string, { total: number; completed: number }> = {};
    CATEGORIES.forEach(cat => {
      const points = KNOWLEDGE_POINTS.filter(p => p.category === cat.name);
      byCategory[cat.name] = {
        total: points.length,
        completed: points.filter(p => completedIds.has(p.id)).length
      };
    });

    return { total, completed, percentage, byCategory };
  }, [completedIds]);

  const filteredPoints = useMemo(() => {
    if (!searchQuery) return KNOWLEDGE_POINTS;
    return KNOWLEDGE_POINTS.filter(p => 
      p.name.includes(searchQuery) || 
      p.subcategory.includes(searchQuery) || 
      p.category.includes(searchQuery)
    );
  }, [searchQuery]);

  const groupedPoints = useMemo(() => {
    const groups: Record<string, Record<string, KnowledgePoint[]>> = {};
    filteredPoints.forEach(p => {
      if (!groups[p.category]) groups[p.category] = {};
      if (!groups[p.category][p.subcategory]) groups[p.category][p.subcategory] = [];
      groups[p.category][p.subcategory].push(p);
    });
    return groups;
  }, [filteredPoints]);

  const exportCSV = () => {
    const uncompleted = KNOWLEDGE_POINTS.filter(p => !completedIds.has(p.id));
    const csvContent = "分类,子分类,知识点名称,年级\n" + 
      uncompleted.map(p => `${p.category},${p.subcategory},${p.name},${p.grade}`).join("\n");
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "未学知识点清单.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Handlers ---
  const handleEnterStudy = () => {
    setCurrentView('study');
    if (!selectedPoint && KNOWLEDGE_POINTS.length > 0) {
      setSelectedPoint(KNOWLEDGE_POINTS[0]);
    }
  };

  // --- Components ---
  const CircularProgress = ({ value }: { value: number }) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center">
        <svg className="w-32 h-32 md:w-40 md:h-40 transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-gray-100"
          />
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
            cx="50%"
            cy="50%"
            r={radius}
            stroke="url(#gradient)"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4caf50" />
              <stop offset="100%" stopColor="#81c784" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-2xl md:text-3xl font-bold text-gray-800">{value}%</span>
          <span className="text-xs text-gray-500 font-medium">总体进度</span>
        </div>
      </div>
    );
  };

  const CategoryIcon = ({ name, className }: { name: string; className?: string }) => {
    switch (name) {
      case '数与代数': return <Calculator className={className} />;
      case '几何': return <Square className={className} />;
      case '统计与概率': return <BarChart className={className} />;
      case '解决问题': return <Layers className={className} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-app-bg font-sans text-text-dark selection:bg-light-green selection:text-primary-green">
      <AnimatePresence mode="wait">
        {currentView === 'dashboard' ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col min-h-screen"
          >
            {/* Header */}
            <header className="h-[70px] px-6 md:px-10 flex items-center justify-between bg-white border-b border-gray-100 sticky top-0 z-30">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 md:w-10 md:h-10 text-primary-green">
                   <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/><path d="M8 11h8"/><path d="M8 15h6"/></svg>
                </div>
                <div className="flex flex-col md:flex-row md:items-baseline md:space-x-2">
                  <span className="text-xl md:text-2xl font-bold text-text-dark">数学小状元</span>
                  <span className="text-sm font-semibold text-primary-green">提前学</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="hidden md:inline text-sm font-medium text-text-muted">你好，陈同学</span>
                <div className="w-9 h-9 md:w-10 md:h-10 bg-gray-100 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-gray-100">
                  <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=Felix" alt="avatar" referrerPolicy="no-referrer" />
                </div>
              </div>
            </header>

            <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 md:py-10 space-y-8">
              {/* Top Summary Bar */}
              <section className="bg-white rounded-[32px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 shadow-sm border border-black/[0.02]">
                <div className="relative flex items-center justify-center">
                  <CircularProgress value={stats.percentage} />
                </div>
                <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3">
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                    加油！你已经掌握了 <span className="text-primary-green">{stats.completed}</span> 个知识点
                  </h2>
                  <p className="text-text-muted text-sm md:text-base font-medium max-w-md">
                    距离小学数学全通关还剩 <span className="font-bold">{stats.total - stats.completed}</span> 个知识点，继续努力吧！
                  </p>
                  <div className="pt-4 flex items-center space-x-8">
                    <div className="flex flex-col">
                      <span className="text-2xl font-black text-primary-green">{Math.ceil(stats.completed / (Math.max(1, new Date().getDate())))}</span>
                      <span className="text-xs text-text-muted font-bold uppercase tracking-wider">今日新学</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-black text-primary-blue">{stats.total - stats.completed}</span>
                      <span className="text-xs text-text-muted font-bold uppercase tracking-wider">待学习</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* CTA Area */}
              <div className="text-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEnterStudy}
                  className="px-12 py-4 md:py-5 bg-primary-green text-white text-lg md:text-xl font-bold rounded-full shadow-xl shadow-primary-green/20 overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary-green/30"
                >
                  <span className="flex items-center space-x-2">
                    <span>进入提前学目录</span>
                    <ChevronRight className="w-6 h-6" />
                  </span>
                </motion.button>
              </div>

              {/* Modules Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {CATEGORIES.map((cat, idx) => {
                   const progress = (stats.byCategory[cat.name].completed / stats.byCategory[cat.name].total) * 100;
                   const colors = {
                     '数与代数': { bg: 'bg-light-blue', text: 'text-primary-blue', bar: 'bg-primary-blue', icon: '123' },
                     '几何': { bg: 'bg-light-green', text: 'text-primary-green', bar: 'bg-primary-green', icon: '△' },
                     '统计与概率': { bg: 'bg-orange-50', text: 'text-orange-500', bar: 'bg-orange-500', icon: '📊' },
                     '解决问题': { bg: 'bg-purple-50', text: 'text-purple-500', bar: 'bg-purple-500', icon: '🛠️' },
                   }[cat.name] || { bg: 'bg-gray-50', text: 'text-gray-500', bar: 'bg-gray-500', icon: '•' };

                   return (
                    <motion.div
                      key={cat.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      className="bg-white p-6 rounded-[24px] shadow-sm border-2 border-transparent hover:border-light-green transition-all group"
                    >
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold mb-4", colors.bg, colors.text)}>
                        {colors.icon}
                      </div>
                      <h3 className="text-lg font-bold text-text-dark mb-4">{cat.name}</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-text-muted">
                          <span>已完成 {stats.byCategory[cat.name].completed}/{stats.byCategory[cat.name].total}</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={cn("h-full rounded-full transition-all duration-1000", colors.bar)}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer text */}
              <div className="pt-8 text-center text-text-muted text-sm font-medium italic">
                “数学是打开科学大门的钥匙。” — 培根
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="study"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-screen bg-white"
          >
            {/* Sidebar */}
            <motion.aside
              initial={false}
              animate={{ width: isSidebarOpen ? 320 : 0, opacity: isSidebarOpen ? 1 : 0 }}
              className="relative bg-app-bg border-r border-gray-100 overflow-hidden hidden md:flex flex-col"
            >
              <div className="p-6 h-full flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-primary-green">学习目录</h2>
                  <button onClick={() => setCurrentView('dashboard')} className="p-2 hover:bg-white rounded-xl transition-colors">
                    <ArrowLeft className="w-5 h-5 text-text-muted" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="搜索知识点..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-primary-green/30 transition-all text-sm outline-none"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
                  {Object.entries(groupedPoints).map(([catName, subCats]) => (
                    <div key={catName} className="space-y-1">
                      <button
                        onClick={() => setExpandedCategories(prev => {
                          const next = new Set(prev);
                          if (next.has(catName)) next.delete(catName);
                          else next.add(catName);
                          return next;
                        })}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white transition-colors group"
                      >
                        <div className="flex items-center space-x-2">
                          <CategoryIcon name={catName} className="w-4 h-4 text-primary-green" />
                          <span className="font-bold text-text-dark">{catName}</span>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 text-text-muted transition-transform", expandedCategories.has(catName) ? "rotate-180" : "")} />
                      </button>
                      
                      {expandedCategories.has(catName) && (
                        <div className="ml-4 space-y-1 border-l-2 border-primary-green/10 pl-2 mt-1">
                          {Object.entries(subCats).map(([subName, points]) => (
                            <div key={subName} className="space-y-1">
                              <button
                                onClick={() => setExpandedSubcategories(prev => {
                                  const next = new Set(prev);
                                  if (next.has(subName)) next.delete(subName);
                                  else next.add(subName);
                                  return next;
                                })}
                                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white transition-colors"
                              >
                                <span className="text-sm font-semibold text-text-muted">{subName}</span>
                                <ChevronDown className={cn("w-3 h-3 text-text-muted transition-transform", expandedSubcategories.has(subName) ? "rotate-180" : "")} />
                              </button>

                              {expandedSubcategories.has(subName) && (
                                <div className="space-y-0.5 mt-1">
                                  {points.map(p => (
                                    <div
                                      key={p.id}
                                      className={cn(
                                        "group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all",
                                        selectedPoint?.id === p.id ? "bg-white shadow-sm ring-1 ring-primary-green/20" : "hover:bg-white/50"
                                      )}
                                      onClick={() => setSelectedPoint(p)}
                                    >
                                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); toggleComplete(p.id); }}
                                          className="shrink-0"
                                        >
                                          {completedIds.has(p.id) ? (
                                            <CheckCircle2 className="w-4 h-4 text-primary-green fill-light-green" />
                                          ) : (
                                            <Circle className="w-4 h-4 text-gray-300" />
                                          )}
                                        </button>
                                        <div className="flex flex-col min-w-0">
                                          <span className={cn("text-xs font-semibold truncate", selectedPoint?.id === p.id ? "text-primary-green" : "text-text-dark")}>
                                            {p.name}
                                          </span>
                                          <span className="text-[10px] text-text-muted font-medium">{p.grade}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={exportCSV}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white text-text-dark rounded-2xl hover:bg-gray-50 border border-gray-100 shadow-sm transition-all font-bold text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>导出课程表 (未学)</span>
                  </button>
                </div>
              </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-white">
              {/* Top Bar (Mobile) */}
              <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100">
                <button onClick={() => setCurrentView('dashboard')} className="p-2">
                  <ArrowLeft className="w-6 h-6 text-text-dark" />
                </button>
                <div className="flex-1 text-center font-bold text-lg truncate px-4">
                  {selectedPoint?.name || "学习详情"}
                </div>
                <button className="p-2" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                  {isSidebarOpen ? <X className="w-6 h-6 text-text-dark" /> : <Menu className="w-6 h-6 text-text-dark" />}
                </button>
              </div>

              {/* Content Header (Desktop) */}
              <div className="hidden md:flex items-center justify-between px-10 py-6 border-b border-gray-50 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-light-green/30 rounded-2xl text-primary-green">
                    {selectedPoint ? <CategoryIcon name={selectedPoint.category} className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h1 className="text-2xl font-bold text-text-dark">{selectedPoint?.name}</h1>
                      <span className="px-2 py-0.5 bg-gray-100 text-text-muted rounded text-[10px] uppercase font-bold tracking-wider">
                        {selectedPoint?.grade}
                      </span>
                    </div>
                    <p className="text-sm text-text-muted font-medium">
                      {selectedPoint?.category} &gt; {selectedPoint?.subcategory}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => selectedPoint && toggleComplete(selectedPoint.id)}
                    className={cn(
                      "flex items-center space-x-2 px-6 py-2.5 rounded-2xl font-bold transition-all",
                      selectedPoint && completedIds.has(selectedPoint.id) 
                        ? "bg-primary-green text-white shadow-lg shadow-primary-green/20" 
                        : "bg-gray-100 text-text-muted hover:bg-gray-200"
                    )}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{selectedPoint && completedIds.has(selectedPoint.id) ? "已掌握" : "标为已学"}</span>
                  </button>
                </div>
              </div>

              {/* Iframe Area */}
              <div className="flex-1 relative bg-app-bg p-4 md:p-8 overflow-hidden">
                <div className="w-full h-full bg-white rounded-[32px] shadow-sm ring-1 ring-black/[0.02] overflow-hidden relative">
                  {selectedPoint ? (
                    <iframe
                      src={`./knowledge/${encodeURIComponent(selectedPoint.name)}.html`}
                      className="w-full h-full border-none"
                      title={selectedPoint.name}
                      onError={(e) => {
                        console.error("Iframe error", e);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                      <div className="p-6 bg-light-green/30 rounded-full animate-bounce">
                        <Layers className="w-12 h-12 text-primary-green" />
                      </div>
                      <p className="text-text-muted font-bold">请从目录中选择一个知识点开始学习</p>
                    </div>
                  )}
                  {/* Placeholder Content overlay for Demo if HTML not found */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-white z-0 opacity-5">
                     <span className="text-9xl font-black text-gray-100 uppercase tracking-widest">Math</span>
                  </div>
                </div>
              </div>

              {/* Mobile Sidebar Overlay */}
              {isSidebarOpen && (
                <div className="md:hidden fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}>
                  <motion.aside
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4/5 h-full bg-app-bg p-6 flex flex-col"
                  >
                     <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-primary-green">学习目录</h2>
                        <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-white rounded-xl">
                          <X className="w-5 h-5 text-text-muted" />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide">
                        {Object.entries(groupedPoints).map(([catName, subCats]) => (
                          <div key={catName} className="mb-4">
                             <div className="font-bold text-text-dark flex items-center space-x-2 mb-2">
                               <CategoryIcon name={catName} className="w-4 h-4 text-primary-green" />
                               <span>{catName}</span>
                             </div>
                             {Object.entries(subCats).map(([subName, points]) => (
                               <div key={subName} className="ml-4 mb-2">
                                 <div className="text-xs font-bold text-text-muted mb-1 opacity-70 uppercase tracking-wider">{subName}</div>
                                 <div className="space-y-1">
                                   {points.map(p => (
                                      <div
                                        key={p.id}
                                        className={cn(
                                          "flex items-center space-x-3 p-3 rounded-2xl transition-all",
                                          selectedPoint?.id === p.id ? "bg-white shadow-sm ring-1 ring-primary-green/10" : "bg-white/50"
                                        )}
                                        onClick={() => { setSelectedPoint(p); setIsSidebarOpen(false); }}
                                      >
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); toggleComplete(p.id); }}
                                          className="shrink-0"
                                        >
                                          {completedIds.has(p.id) ? (
                                            <CheckCircle2 className="w-5 h-5 text-primary-green" />
                                          ) : (
                                            <Circle className="w-5 h-5 text-gray-300" />
                                          )}
                                        </button>
                                        <div className="flex flex-col">
                                          <span className={cn("text-sm font-bold", selectedPoint?.id === p.id ? "text-primary-green" : "text-text-dark")}>{p.name}</span>
                                          <span className="text-[10px] text-text-muted font-bold">{p.grade}</span>
                                        </div>
                                      </div>
                                   ))}
                                 </div>
                               </div>
                             ))}
                          </div>
                        ))}
                      </div>
                  </motion.aside>
                </div>
              )}
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
