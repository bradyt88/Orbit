import { useEffect, useMemo, useState } from "react";

const categories = ["All", "Ideas", "Notes", "Projects", "People", "Tasks", "Work", "Family", "Finance", "Health", "Creative", "Travel", "Learning", "Calendar", "Apps"];
const starterMemories = [
  { id: 101, title: "The big picture", content: "A space to connect ideas, plans and the things that matter.", category: "Ideas", pinned: true, createdAt: Date.now() - 50000, x: 50, y: 42 },
  { id: 102, title: "Future projects", content: "Keep promising ideas together so they can grow into projects.", category: "Projects", pinned: false, createdAt: Date.now() - 40000, x: 24, y: 24 },
  { id: 103, title: "People to remember", content: "Important people, conversations and things to follow up.", category: "People", pinned: false, createdAt: Date.now() - 30000, x: 76, y: 24 },
  { id: 104, title: "Things to explore", content: "Questions, inspiration and useful discoveries.", category: "Notes", pinned: false, createdAt: Date.now() - 20000, x: 24, y: 72 },
  { id: 105, title: "Next steps", content: "Small actions that move a bigger idea forward.", category: "Tasks", pinned: false, createdAt: Date.now() - 10000, x: 76, y: 72 },
];
const positions = [[50, 42], [24, 24], [76, 24], [24, 72], [76, 72], [50, 16], [50, 78], [15, 48], [85, 48], [35, 18], [65, 78], [82, 48]];

export default function BrainWorkspace() {
  const [memories, setMemories] = useState(() => {
    try { const saved = localStorage.getItem("orbit-brain-memories"); return saved ? JSON.parse(saved) : starterMemories; }
    catch { return starterMemories; }
  });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedId, setSelectedId] = useState(101);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Ideas");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try { localStorage.setItem("orbit-brain-memories", JSON.stringify(memories)); } catch { /* storage may be unavailable */ }
  }, [memories]);

  const filtered = useMemo(() => memories.filter((memory) => {
    const matchesCategory = filter === "All" || memory.category === filter;
    const query = search.trim().toLowerCase();
    return matchesCategory && (!query || `${memory.title} ${memory.content} ${memory.category}`.toLowerCase().includes(query));
  }).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt - a.createdAt), [memories, filter, search]);
  const selected = memories.find((memory) => memory.id === selectedId);

  function saveMemory(event) {
    event.preventDefault();
    if (!title.trim()) { setNotice("Give this memory a title first."); return; }
    const [x, y] = positions[memories.length % positions.length];
    const memory = { id: Date.now(), title: title.trim(), content: content.trim() || "No details added yet.", category, pinned: false, createdAt: Date.now(), x, y };
    setMemories((current) => [memory, ...current]);
    setSelectedId(memory.id);
    setTitle(""); setContent(""); setFilter("All"); setSearch(""); setShowForm(false);
    setNotice("Memory added to your Brain.");
  }
  function togglePin(id) {
    setMemories((current) => current.map((memory) => memory.id === id ? { ...memory, pinned: !memory.pinned } : memory));
    setNotice("Memory updated.");
  }
  function removeMemory(id) {
    setMemories((current) => current.filter((memory) => memory.id !== id));
    setSelectedId((current) => current === id ? null : current);
    setNotice("Memory removed.");
  }

  return (
    <section className="subpage brain-page">
      <div className="brain-heading">
        <div><div className="eyebrow"><span className="pulse" /> YOUR LIVING MEMORY</div><h1>Your <span>Brain.</span></h1><p className="subpage-intro">Your life, ideas and plans — connected through one living brain.</p></div>
        <button className="brain-add-button" onClick={() => { setShowForm((open) => !open); setNotice(""); }}><span>{showForm ? "−" : "＋"}</span> {showForm ? "Close capture" : "New memory"}</button>
      </div>

      <div className="brain-universe-panel">
        <div className="brain-universe-top"><div><span className="live-orb" /><span className="brain-kicker">NEURAL COMMAND CENTRE</span></div><span className="brain-count">{memories.length} {memories.length === 1 ? "memory" : "memories"}</span></div>
        <div className="brain-universe">
          <div className="universe-glow" />
          <div className="brain-core" aria-label="Orbit central brain">
            <span className="core-ring core-ring-one" /><span className="core-ring core-ring-two" />
            <svg className="anatomical-brain" viewBox="0 0 320 240" role="img" aria-label="Glowing 3D-style brain illustration">
              <defs>
                <linearGradient id="brainGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fff0b0"/><stop offset="42%" stopColor="#ffb52e"/><stop offset="72%" stopColor="#ff642f"/><stop offset="100%" stopColor="#a51e2d"/></linearGradient>
                <filter id="brainGlow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>
              <g fill="#170b0d" stroke="url(#brainGold)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#brainGlow)">
                <path d="M157 54 C143 24 105 24 88 43 C61 37 40 58 44 83 C20 98 29 129 47 141 C37 164 55 185 78 184 C89 207 118 205 135 187 L157 169 Z"/>
                <path d="M163 54 C178 24 216 24 233 43 C260 37 281 58 277 83 C301 98 292 129 274 141 C284 164 266 185 243 184 C232 207 203 205 186 187 L163 169 Z"/>
                <path d="M160 52 L160 171" fill="none" strokeWidth="2.4"/>
                <path d="M91 47 C74 62 93 72 77 84 S69 111 87 119 S73 145 94 156 S111 175 102 188" fill="none"/>
                <path d="M120 37 C104 51 124 63 111 76 S106 99 126 105 S110 132 130 143 S125 167 137 178" fill="none"/>
                <path d="M49 91 C69 92 69 105 57 115 M55 145 C76 135 87 147 81 164 M137 57 C147 72 130 83 144 96 M100 95 C117 89 119 103 111 116" fill="none" strokeWidth="2.4"/>
                <path d="M229 47 C246 62 227 72 243 84 S251 111 233 119 S247 145 226 156 S209 175 218 188" fill="none"/>
                <path d="M200 37 C216 51 196 63 209 76 S214 99 194 105 S210 132 190 143 S195 167 183 178" fill="none"/>
                <path d="M271 91 C251 92 251 105 263 115 M265 145 C244 135 233 147 239 164 M183 57 C173 72 190 83 176 96 M220 95 C203 89 201 103 209 116" fill="none" strokeWidth="2.4"/>
                <path d="M145 171 C144 192 151 207 160 215 C169 207 176 192 175 171" fill="#260b12"/>
              </g>
              <g fill="#ffe9a3"><circle cx="73" cy="75" r="2.5"/><circle cx="122" cy="61" r="2"/><circle cx="102" cy="146" r="2.5"/><circle cx="245" cy="76" r="2.5"/><circle cx="197" cy="61" r="2"/><circle cx="218" cy="146" r="2.5"/></g>
            </svg>
            <span className="core-label">ORBIT CORE</span>
          </div>
          <svg className="brain-connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <line x1="50" y1="48" x2="50" y2="12" className="connection-line" />
            <line x1="50" y1="48" x2="78" y2="22" className="connection-line" />
            <line x1="50" y1="48" x2="89" y2="49" className="connection-line" />
            <line x1="50" y1="48" x2="78" y2="78" className="connection-line" />
            <line x1="50" y1="48" x2="50" y2="88" className="connection-line" />
            <line x1="50" y1="48" x2="22" y2="78" className="connection-line" />
            <line x1="50" y1="48" x2="11" y2="49" className="connection-line" />
            <line x1="50" y1="48" x2="22" y2="22" className="connection-line" />
            <line x1="50" y1="48" x2="35" y2="13" className="connection-line" />
            <line x1="50" y1="48" x2="65" y2="13" className="connection-line" />
          </svg>
          {[
            { name: "Calendar", icon: "▦", x: 50, y: 12, filter: "Calendar", tone: "red" },
            { name: "Family", icon: "♧", x: 78, y: 22, filter: "Family", tone: "gold" },
            { name: "Creative", icon: "♫", x: 89, y: 49, filter: "Creative", tone: "red" },
            { name: "Travel", icon: "✈", x: 78, y: 78, filter: "Travel", tone: "gold" },
            { name: "Learning", icon: "▤", x: 65, y: 88, filter: "Learning", tone: "gold" },
            { name: "AI assistant", icon: "◉", x: 50, y: 91, filter: "All", tone: "red" },
            { name: "Health", icon: "♡", x: 22, y: 78, filter: "Health", tone: "red" },
            { name: "Finance", icon: "◈", x: 11, y: 49, filter: "Finance", tone: "gold" },
            { name: "Work", icon: "▣", x: 22, y: 22, filter: "Work", tone: "gold" },
            { name: "Tasks", icon: "✓", x: 35, y: 13, filter: "Tasks", tone: "gold" }
          ].map((node) => <button type="button" key={node.name} className={`brain-category-node ${node.tone} ${filter === node.filter && node.filter !== "All" ? "category-node-active" : ""}`} style={{ left: `${node.x}%`, top: `${node.y}%` }} onClick={() => { setFilter(node.filter); setSearch(""); if (node.filter === "All") setNotice("Orbit assistant selected — your connected workspaces will live here."); else setNotice(`${node.name} branch selected.`); }} aria-label={`Explore ${node.name}`}><span className="category-node-icon">{node.icon}</span><span className="category-node-label">{node.name}</span></button>)}
          {memories.length === 0 && <div className="empty-universe">Your universe is waiting.<br />Add your first memory to begin.</div>}
          <div className="universe-legend"><span /> IDEAS & MEMORIES <i /> CONNECTED THINKING</div>
        </div>
        <div className="universe-footer"><span>✦ Every part of your life, connected.</span><span>SELECT A BRANCH TO EXPLORE</span></div>
      </div>

      {showForm && <form className="brain-create-card" onSubmit={saveMemory}>
        <div className="section-heading"><div><span className="section-symbol">✧</span><h2>Plant a new thought</h2></div><span className="mini-tag">QUICK CAPTURE</span></div>
        <div className="brain-form-grid">
          <label className="brain-field"><span>MEMORY TITLE</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give it a name..." autoFocus /></label>
          <label className="brain-field"><span>TYPE</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.filter((item) => item !== "All").map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
        <label className="brain-field brain-detail-field"><span>DETAILS</span><textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Add context, a thought, or why this matters..." rows="3" /></label>
        <div className="brain-form-actions"><button type="button" className="brain-cancel-button" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="brain-save-button">Save memory <span>↗</span></button></div>
      </form>}

      <div className="brain-library-head"><div><div className="eyebrow"><span className="pulse" /> MEMORY LIBRARY</div><h2>Explore your mind</h2></div><label className="brain-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search memories..." aria-label="Search memories" />{search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search">×</button>}</label></div>
      <div className="brain-filters">{categories.map((item) => <button type="button" key={item} className={filter === item ? "brain-filter active" : "brain-filter"} onClick={() => setFilter(item)}>{item}<span>{item === "All" ? memories.length : memories.filter((memory) => memory.category === item).length}</span></button>)}</div>
      <div className="brain-lower-grid">
        <div className="brain-memory-list">{filtered.length ? filtered.map((memory) => <button type="button" key={memory.id} className={`memory-card ${selectedId === memory.id ? "memory-card-active" : ""}`} onClick={() => setSelectedId(memory.id)}>
          <span className={`memory-card-icon memory-icon-${memory.category.toLowerCase()}`}>{memory.category === "Ideas" ? "✧" : memory.category === "Projects" ? "◇" : memory.category === "People" ? "◉" : memory.category === "Tasks" ? "☷" : "▤"}</span>
          <span className="memory-card-copy"><strong>{memory.title}</strong><span>{memory.content}</span></span><span className="memory-card-meta">{memory.pinned ? "✦" : "↗"}</span>
        </button>) : <div className="brain-empty-list">No memories match that search. Try another phrase or category.</div>}</div>
        <aside className="memory-detail-panel">{selected ? <>
          <div className="detail-topline"><span className="mini-tag">{selected.category.toUpperCase()}</span><span className="detail-star">{selected.pinned ? "✦ PINNED" : "MEMORY"}</span></div>
          <div className="detail-orb">✳</div><h2>{selected.title}</h2><p>{selected.content}</p><div className="detail-divider" />
          <div className="detail-meta"><span>CREATED</span><strong>{new Date(selected.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</strong></div>
          <div className="detail-actions"><button type="button" className="detail-action" onClick={() => togglePin(selected.id)}>{selected.pinned ? "☆ Unpin" : "✦ Pin memory"}</button><button type="button" className="detail-action danger" onClick={() => removeMemory(selected.id)}>⌫ Delete</button></div>
        </> : <div className="detail-empty"><span>✧</span><h2>Select a memory</h2><p>Choose a node or a memory card to see its details here.</p></div>}</aside>
      </div>
      {notice && <div className="brain-notice" role="status">{notice}</div>}
    </section>
  );
}
