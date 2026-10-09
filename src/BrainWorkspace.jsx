import { useEffect, useMemo, useState } from "react";

const categories = ["All", "Ideas", "Notes", "Projects", "People", "Tasks"];
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
        <div><div className="eyebrow"><span className="pulse" /> YOUR LIVING MEMORY</div><h1>Your <span>Brain.</span></h1><p className="subpage-intro">A universe for your thoughts. Capture what matters, then find the connections.</p></div>
        <button className="brain-add-button" onClick={() => { setShowForm((open) => !open); setNotice(""); }}><span>{showForm ? "−" : "＋"}</span> {showForm ? "Close capture" : "New memory"}</button>
      </div>

      <div className="brain-universe-panel">
        <div className="brain-universe-top"><div><span className="live-orb" /><span className="brain-kicker">MEMORY CONSTELLATION</span></div><span className="brain-count">{memories.length} {memories.length === 1 ? "memory" : "memories"}</span></div>
        <div className="brain-universe">
          <div className="universe-glow" />
          <div className="brain-core"><span className="core-ring core-ring-one" /><span className="core-ring core-ring-two" /><span className="core-symbol">✳</span><span className="core-label">YOUR MIND</span></div>
          <svg className="brain-connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {memories.map((memory) => <line key={memory.id} x1="50" y1="48" x2={memory.x ?? 50} y2={memory.y ?? 50} className={selectedId === memory.id ? "connection-line connection-active" : "connection-line"} />)}
          </svg>
          {memories.map((memory, index) => <button key={memory.id} className={`memory-node node-${index % 5} ${selectedId === memory.id ? "node-selected" : ""} ${memory.pinned ? "node-pinned" : ""}`} style={{ left: `${memory.x ?? 50}%`, top: `${memory.y ?? 50}%` }} onClick={() => setSelectedId(memory.id)} title={memory.title} aria-label={`Open memory: ${memory.title}`}><span className="node-orb">{memory.pinned ? "✦" : "·"}</span><span className="node-name">{memory.title}</span></button>)}
          {memories.length === 0 && <div className="empty-universe">Your universe is waiting.<br />Add your first memory to begin.</div>}
          <div className="universe-legend"><span /> IDEAS & MEMORIES <i /> CONNECTED THINKING</div>
        </div>
        <div className="universe-footer"><span>✧ Every thought has a place.</span><span>SELECT A NODE TO EXPLORE</span></div>
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
