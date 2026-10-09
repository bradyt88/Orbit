import { useEffect, useMemo, useState } from "react";

const categories = ["All", "Ideas", "Moments", "Notes", "Projects", "People", "Tasks", "Goals", "Work", "Family", "Finance", "Health", "Creative", "Travel", "Learning", "Calendar", "Apps"];
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
  const [command, setCommand] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("Ideas");

  useEffect(() => {
    try { localStorage.setItem("orbit-brain-memories", JSON.stringify(memories)); } catch { /* storage may be unavailable */ }
  }, [memories]);

  const filtered = useMemo(() => memories.filter((memory) => {
    const matchesCategory = filter === "All" || memory.category === filter;
    const query = search.trim().toLowerCase();
    return matchesCategory && (!query || `${memory.title} ${memory.content} ${memory.category}`.toLowerCase().includes(query));
  }).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt - a.createdAt), [memories, filter, search]);
  const selected = memories.find((memory) => memory.id === selectedId);

  function captureCommand(event) {
    event.preventDefault();
    const value = command.trim();
    if (!value) return;
    const text = value.toLowerCase();
    const isCalendar = /\b(meeting|appointment|calendar|event|remind|reminder|schedule|book|tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\s?(am|pm)|\d{1,2}\/\d{1,2})\b/.test(text);
    const detectedCategory = isCalendar ? "Calendar" :
      /\b(goal|aim|target|achieve|milestone|objective)\b/.test(text) ? "Goals" :
      /\b(moment|memory|remember when|happened|experience|photo|occasion)\b/.test(text) ? "Moments" :
      /\b(family|mum|mom|dad|wife|husband|son|daughter|kids|children)\b/.test(text) ? "Family" :
      /\b(work|boss|shift|office|warehouse|job|colleague)\b/.test(text) ? "Work" :
      /\b(bill|money|budget|pay|bank|spend|finance)\b/.test(text) ? "Finance" :
      /\b(doctor|health|hospital|medicine|gp)\b/.test(text) ? "Health" :
      /\b(song|music|video|design|write|create|art|content)\b/.test(text) ? "Creative" :
      /\b(task|todo|to-do|finish|call|email|send|fix|clean|buy|pick up)\b/.test(text) ? "Tasks" : "Ideas";
    const now = new Date();
    let eventDate = "";
    const iso = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (iso) eventDate = iso[1];
    if (!eventDate && /\btoday\b/.test(text)) eventDate = toDateString(now);
    if (!eventDate && /\btomorrow\b/.test(text)) { const d = new Date(now); d.setDate(d.getDate() + 1); eventDate = toDateString(d); }
    if (!eventDate) {
      const weekdays = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
      const dayName = weekdays.find((day) => new RegExp("\\b" + day + "\\b").test(text));
      if (dayName) { const d = new Date(now); let delta = (weekdays.indexOf(dayName) - d.getDay() + 7) % 7; if (delta === 0 || /\bnext\b/.test(text)) delta += 7; d.setDate(d.getDate() + delta); eventDate = toDateString(d); }
    }
    const timeMatch = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/) || text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    let startTime = "";
    if (timeMatch) {
      let hour = Number(timeMatch[1]); const minute = Number(timeMatch[2] || 0); const meridiem = timeMatch[3];
      if (meridiem === "pm" && hour < 12) hour += 12;
      if (meridiem === "am" && hour === 12) hour = 0;
      startTime = String(hour).padStart(2,"0") + ":" + String(minute).padStart(2,"0");
    }
    const [x, y] = positions[memories.length % positions.length];
    const memory = { id: Date.now(), title: value.length > 58 ? value.slice(0, 55) + "..." : value, content: value, category: detectedCategory, pinned: false, createdAt: Date.now(), x, y };
    setMemories((current) => [memory, ...current]); setSelectedId(memory.id); setFilter(detectedCategory); setSearch(""); setCommand("");
    if (detectedCategory === "Calendar") {
      if (eventDate && startTime) {
        const endDate = new Date("2000-01-01T" + startTime + ":00"); endDate.setMinutes(endDate.getMinutes() + 30);
        const endTime = String(endDate.getHours()).padStart(2,"0") + ":" + String(endDate.getMinutes()).padStart(2,"0");
        let events = [];
        try { events = JSON.parse(localStorage.getItem("orbit-calendar-events") || "[]"); } catch { events = []; }
        const eventCategory = /\b(work|office|shift)\b/.test(text) ? "Work" : /\b(family|mum|dad|kids|children)\b/.test(text) ? "Family" : /\b(doctor|gp|hospital)\b/.test(text) ? "Health" : "Personal";
        events.push({ id: "event-" + Date.now(), title: value, date: eventDate, start: startTime, end: endTime, category: eventCategory, reminder: "15", notes: "Added through Orbit Brain command.", demo: false });
        localStorage.setItem("orbit-calendar-events", JSON.stringify(events));
        setNotice("Filed under Calendar and added to your calendar for " + eventDate + " at " + startTime + ". Reminder preferences are saved, but notifications are not active yet.");
      } else setNotice("Saved under Calendar. Include a date and time, e.g. “Dentist tomorrow at 2pm”, to add it to your calendar.");
    } else setNotice("Orbit filed this under " + detectedCategory + ". Open the branch below to read or edit it.");
  }
  function toDateString(date) { return date.getFullYear() + "-" + String(date.getMonth()+1).padStart(2,"0") + "-" + String(date.getDate()).padStart(2,"0"); }
  function beginEdit(memory) { setEditingId(memory.id); setEditTitle(memory.title); setEditContent(memory.content); setEditCategory(memory.category); }
  function saveEdit(event) {
    event.preventDefault();
    if (!editTitle.trim()) { setNotice("A title is required."); return; }
    setMemories((current) => current.map((memory) => memory.id === editingId ? { ...memory, title: editTitle.trim(), content: editContent.trim(), category: editCategory } : memory));
    setFilter(editCategory); setEditingId(null); setNotice("Brain entry updated.");
  }
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
            <img className="anatomical-brain" src={`${import.meta.env.BASE_URL}images/brain/orbit-brain.png`} alt="Orbit gold and crimson neural brain" />
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
            { name: "Goals", icon: "◎", x: 78, y: 78, filter: "Goals", tone: "gold" },
            { name: "Moments", icon: "✦", x: 65, y: 88, filter: "Moments", tone: "gold" },
            { name: "AI assistant", icon: "◉", x: 50, y: 91, filter: "All", tone: "red" },
            { name: "Health", icon: "♡", x: 22, y: 78, filter: "Health", tone: "red" },
            { name: "Finance", icon: "◈", x: 11, y: 49, filter: "Finance", tone: "gold" },
            { name: "Work", icon: "▣", x: 22, y: 22, filter: "Work", tone: "gold" },
            { name: "Tasks", icon: "✓", x: 35, y: 13, filter: "Tasks", tone: "gold" }
          ].map((node) => <button type="button" key={node.name} className={`brain-category-node ${node.tone} ${filter === node.filter && node.filter !== "All" ? "category-node-active" : ""}`} style={{ left: `${node.x}%`, top: `${node.y}%` }} onClick={() => { setFilter(node.filter); setSearch(""); if (node.filter === "All") setNotice("Orbit assistant selected — your connected workspaces will live here."); else { setNotice(`${node.name} branch opened below the Brain.`); document.getElementById("orbit-branch-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" }); } }} aria-label={`Explore ${node.name}`}><span className="category-node-icon">{node.icon}</span><span className="category-node-label">{node.name}</span></button>)}
          {memories.length === 0 && <div className="empty-universe">Your universe is waiting.<br />Add your first memory to begin.</div>}
          <div className="universe-legend"><span /> IDEAS & MEMORIES <i /> CONNECTED THINKING</div>
        </div>
        <div className="universe-footer"><span>✦ Every part of your life, connected.</span><span>SELECT A BRANCH TO EXPLORE</span></div>
      </div>

      <section className="orbit-command-card" aria-label="Tell Orbit anything">
        <div className="command-heading">
          <span className="command-orb">✳</span>
          <div><strong>Ask or add to your Brain</strong><span>Tell Orbit about an event, moment, task, goal or idea. It files the entry into a branch.</span></div>
          <span className="command-live"><i /> READY</span>
        </div>
        <form className="orbit-command-form" onSubmit={captureCommand}>
          <span className="command-spark">✧</span>
          <input value={command} onChange={(event) => setCommand(event.target.value)} placeholder="Add a goal, remember a moment, or: Meeting with John next Tuesday at 2pm…" aria-label="Tell Orbit anything" />
          <button type="submit" disabled={!command.trim()}>Send to Orbit <span>↗</span></button>
        </form>
        <div className="command-chips">
          {["＋ Event", "✦ Moment", "✓ Task", "◎ Goal", "✧ Idea"].map((hint) => <button type="button" key={hint} onClick={() => setCommand(hint.includes("Event") ? "Meeting with " : hint.includes("Moment") ? "Moment: " : hint.includes("Task") ? "Task: " : hint.includes("Goal") ? "Goal: " : "Idea: ")}>{hint}</button>)}
        </div>
      </section>

      {showForm && <form className="brain-create-card" onSubmit={saveMemory}>
        <div className="section-heading"><div><span className="section-symbol">✧</span><h2>Plant a new thought</h2></div><span className="mini-tag">QUICK CAPTURE</span></div>
        <div className="brain-form-grid">
          <label className="brain-field"><span>MEMORY TITLE</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give it a name..." autoFocus /></label>
          <label className="brain-field"><span>TYPE</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.filter((item) => item !== "All").map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
        <label className="brain-field brain-detail-field"><span>DETAILS</span><textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Add context, a thought, or why this matters..." rows="3" /></label>
        <div className="brain-form-actions"><button type="button" className="brain-cancel-button" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="brain-save-button">Save memory <span>↗</span></button></div>
      </form>}

      <section id="orbit-branch-workspace" className="orbit-branch-workspace">
        <div className="branch-workspace-heading"><div><span className="eyebrow"><span className="pulse" /> OPEN BRAIN BRANCH</span><h2>{filter === "All" ? "Your connected mind" : filter + " branch"}</h2><p>{filter === "All" ? "Choose a category around the Brain to open its entries here." : "Everything Orbit has filed under " + filter + ". Select an entry to read it, edit it or remove it."}</p></div><span className="branch-count">{filtered.length} {filtered.length === 1 ? "entry" : "entries"}</span></div>
        <div className="branch-entry-grid">{filtered.length ? filtered.slice(0, 4).map((memory) => <button type="button" key={memory.id} className={"branch-entry " + (selectedId === memory.id ? "selected" : "")} onClick={() => setSelectedId(memory.id)}><span className="branch-entry-type">{memory.category}</span><strong>{memory.title}</strong><span>{memory.content}</span><small>{selectedId === memory.id ? "OPEN ENTRY ↓" : "OPEN ENTRY ↗"}</small></button>) : <div className="branch-empty">Nothing in this branch yet. Use “Ask or add to your Brain” above and Orbit will file it here.</div>}</div>
        {selected && <div className="branch-selected-detail"><div className="branch-selected-top"><div><span className="mini-tag">{selected.category.toUpperCase()}</span><h3>{selected.title}</h3></div><button type="button" className="brain-save-button" onClick={() => beginEdit(selected)}>✎ Edit entry</button></div>{editingId === selected.id ? <form className="branch-edit-form" onSubmit={saveEdit}><label className="brain-field"><span>TITLE</span><input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required /></label><label className="brain-field"><span>CATEGORY / BRANCH</span><select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>{categories.filter((item) => item !== "All").map((item) => <option key={item}>{item}</option>)}</select></label><label className="brain-field"><span>DETAILS</span><textarea rows="3" value={editContent} onChange={(e) => setEditContent(e.target.value)} /></label><div className="brain-form-actions"><button type="button" className="brain-cancel-button" onClick={() => setEditingId(null)}>Cancel</button><button type="submit" className="brain-save-button">Save changes ↗</button></div></form> : <><p className="branch-selected-content">{selected.content}</p><div className="detail-actions"><button type="button" className="detail-action" onClick={() => togglePin(selected.id)}>{selected.pinned ? "☆ Unpin" : "✦ Pin entry"}</button><button type="button" className="detail-action danger" onClick={() => removeMemory(selected.id)}>⌫ Delete entry</button></div></>}</div>}
      </section>

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
