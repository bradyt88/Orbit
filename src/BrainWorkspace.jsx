import { useEffect, useMemo, useState } from "react";

const branches = ["All", "Calendar", "Tasks", "Goals", "Moments", "People", "Ideas", "Work", "Family"];
const starters = [
  { id: 1, title: "Welcome to your Brain", content: "This is your starting point. Add something below and Orbit will place it into a branch.", category: "Ideas", createdAt: Date.now() }
];

function classify(text) {
  const value = text.toLowerCase();
  if (/\b(meeting|appointment|calendar|event|remind|reminder|schedule|tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\s?(am|pm))\b/.test(value)) return "Calendar";
  if (/\b(goal|aim|target|achieve|milestone|objective)\b/.test(value)) return "Goals";
  if (/\b(moment|memory|remember when|happened|experience|photo|occasion)\b/.test(value)) return "Moments";
  if (/\b(call|email|send|finish|buy|pick up|task|todo|to-do|need to|must do)\b/.test(value)) return "Tasks";
  if (/\b(family|mum|mom|dad|wife|husband|son|daughter|kids|children)\b/.test(value)) return "Family";
  if (/\b(work|boss|shift|office|warehouse|job|colleague)\b/.test(value)) return "Work";
  if (/\b(person|friend|meet|contact|speak to)\b/.test(value)) return "People";
  return "Ideas";
}

function dateFor(text) {
  const value = text.toLowerCase();
  const now = new Date();
  if (/\btoday\b/.test(value)) return now;
  if (/\btomorrow\b/.test(value)) { now.setDate(now.getDate() + 1); return now; }
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const day = days.find((name) => new RegExp("\\b" + name + "\\b").test(value));
  if (!day) return null;
  let delta = (days.indexOf(day) - now.getDay() + 7) % 7;
  if (delta === 0 || /\bnext\b/.test(value)) delta += 7;
  now.setDate(now.getDate() + delta);
  return now;
}
function dateString(date) {
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}

export default function BrainWorkspace() {
  const [entries, setEntries] = useState(() => {
    try { return JSON.parse(localStorage.getItem("orbit-brain-memories") || "null") || starters; }
    catch { return starters; }
  });
  const [activeBranch, setActiveBranch] = useState("All");
  const [input, setInput] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editBranch, setEditBranch] = useState("Ideas");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try { localStorage.setItem("orbit-brain-memories", JSON.stringify(entries)); } catch {}
  }, [entries]);

  const visibleEntries = useMemo(() => entries.filter((entry) => activeBranch === "All" || entry.category === activeBranch), [entries, activeBranch]);
  const selected = entries.find((entry) => entry.id === selectedId) || visibleEntries[0] || null;

  function addEntry(event) {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;
    const category = classify(text);
    const entry = { id: Date.now(), title: text.length > 64 ? text.slice(0, 61) + "…" : text, content: text, category, createdAt: Date.now() };
    setEntries((current) => [entry, ...current]);
    setSelectedId(entry.id);
    setActiveBranch(category);
    setInput("");
    if (category === "Calendar") {
      const date = dateFor(text);
      const time = text.toLowerCase().match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
      if (date && time) {
        let hour = Number(time[1]);
        if (time[3] === "pm" && hour < 12) hour += 12;
        if (time[3] === "am" && hour === 12) hour = 0;
        const start = String(hour).padStart(2, "0") + ":" + String(Number(time[2] || 0)).padStart(2, "0");
        const endDate = new Date("2000-01-01T" + start + ":00");
        endDate.setMinutes(endDate.getMinutes() + 30);
        const end = String(endDate.getHours()).padStart(2, "0") + ":" + String(endDate.getMinutes()).padStart(2, "0");
        try {
          const oldEvents = JSON.parse(localStorage.getItem("orbit-calendar-events") || "[]");
          oldEvents.push({ id: "event-" + entry.id, title: text, date: dateString(date), start, end, category: "Personal", reminder: "15", notes: "Added from Orbit Brain.", demo: false });
          localStorage.setItem("orbit-calendar-events", JSON.stringify(oldEvents));
          setNotice("Filed under Calendar and added to the calendar. Timed notifications are not connected yet.");
        } catch { setNotice("Saved to the Calendar branch. Calendar storage could not be updated."); }
      } else setNotice("Filed under Calendar. Add a clear day and time, such as “Dentist tomorrow at 2pm”, to create a dated calendar entry.");
    } else setNotice("Added to your " + category + " branch.");
  }

  function startEdit(entry) {
    setEditingId(entry.id); setEditTitle(entry.title); setEditContent(entry.content); setEditBranch(entry.category);
  }
  function saveEdit(event) {
    event.preventDefault();
    if (!editTitle.trim()) return;
    setEntries((current) => current.map((entry) => entry.id === editingId ? { ...entry, title: editTitle.trim(), content: editContent.trim(), category: editBranch } : entry));
    setActiveBranch(editBranch); setEditingId(null); setNotice("Brain entry updated.");
  }
  function removeEntry(id) {
    setEntries((current) => current.filter((entry) => entry.id !== id));
    setSelectedId(null); setEditingId(null); setNotice("Entry removed from your Brain.");
  }

  const nodeLayout = [
    { name: "Tasks", icon: "✓", x: 30, y: 17, tone: "gold", hint: "To-do · Projects" },
    { name: "Calendar", icon: "▦", x: 50, y: 7, tone: "red", hint: "Events · Reminders" },
    { name: "Family", icon: "♟", x: 70, y: 17, tone: "gold", hint: "Plans · People" },
    { name: "Work", icon: "▣", x: 20, y: 36, tone: "gold", hint: "Meetings · Career" },
    { name: "Creative", icon: "♫", x: 80, y: 34, tone: "red", hint: "Music · Ideas" },
    { name: "Finance", icon: "◉", x: 14, y: 56, tone: "gold", hint: "Budgets · Bills" },
    { name: "Health", icon: "♡", x: 24, y: 74, tone: "red", hint: "Wellbeing · Appointments" },
    { name: "Ideas", icon: "▤", x: 76, y: 70, tone: "red", hint: "Notes · Inspiration" },
    { name: "Learning", icon: "▱", x: 35, y: 86, tone: "gold", hint: "Skills · Knowledge" },
    { name: "Goals", icon: "◎", x: 65, y: 86, tone: "gold", hint: "Milestones · Progress" },
    { name: "Travel", icon: "✈", x: 87, y: 55, tone: "gold", hint: "Trips · Adventures" },
    { name: "Moments", icon: "♡", x: 50, y: 94, tone: "red", hint: "Memories · Life" },
    { name: "People", icon: "♧", x: 50, y: 20, tone: "gold", hint: "Friends · Contacts" }
  ];
  return (
    <main className="orbit-one-screen orbit-cosmos-screen">
      <div className="orbit-space-stars" aria-hidden="true" />
      <header className="orbit-minimal-header">
        <div className="orbit-wordmark"><span className="orbit-wordmark-symbol">◉</span><span>ORBIT</span></div>
        <span className="orbit-header-caption">YOUR LIFE. CONNECTED.</span>
      </header>

      <section className="orbit-cosmos" aria-label="Interactive Orbit Brain universe">
        <div className="orbit-cosmos-nebula" aria-hidden="true" />
        <div className="orbit-energy-floor" aria-hidden="true"><i /><i /><i /><i /></div>
        <svg className="orbit-cosmos-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <ellipse cx="50" cy="48" rx="43" ry="34" />
          <ellipse cx="50" cy="48" rx="35" ry="26" transform="rotate(-25 50 48)" />
          <ellipse cx="50" cy="48" rx="35" ry="26" transform="rotate(25 50 48)" />
          {nodeLayout.map((node) => <line key={node.name} x1="50" y1="48" x2={node.x} y2={node.y} className={node.tone === "red" ? "red-line" : ""} />)}
        </svg>
        <div className="orbit-central-brain">
          <div className="orbit-brain-aura" />
          <div className="orbit-brain-ring orbit-brain-ring-one" />
          <div className="orbit-brain-ring orbit-brain-ring-two" />
          <img className="orbit-core-image" src={import.meta.env.BASE_URL + "images/brain/orbit-brain.png"} alt="Orbit's glowing gold and crimson brain" />
          <div className="orbit-core-caption"><span className="orbit-live-dot" /> YOUR BRAIN IS THE CENTRE</div>
        </div>
        {nodeLayout.map((node) => (
          <button key={node.name} type="button" style={{ left: node.x + "%", top: node.y + "%" }}
            className={"orbit-space-node " + node.tone + (activeBranch === node.name ? " selected" : "")}
            onClick={() => { setActiveBranch(node.name); setEditingId(null); document.querySelector(".orbit-branch-content")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
            aria-label={"Open " + node.name + " branch"}>
            <span className="orbit-space-node-orb"><span>{node.icon}</span><i /></span>
            <strong>{node.name}</strong><small>{node.hint}</small>
            {node.name !== "Creative" && node.name !== "Travel" && node.name !== "Health" && <em>{entries.filter((entry) => entry.category === node.name).length}</em>}
          </button>
        ))}
        <div className="orbit-cosmos-caption"><span /> CONNECTED THROUGH YOUR BRAIN <span /></div>
      </section>

      <nav className="orbit-branches orbit-branches-compact" aria-label="Brain branches">
        {branches.map((branch) => (
          <button key={branch} type="button" className={"orbit-branch-pill " + (activeBranch === branch ? "active" : "")} onClick={() => { setActiveBranch(branch); setEditingId(null); }}>
            {branch}{branch !== "All" && <span>{entries.filter((entry) => entry.category === branch).length}</span>}
          </button>
        ))}
      </nav>

      <section className="orbit-capture-area orbit-cosmic-capture">
        <div className="orbit-section-title"><span className="orbit-gold-spark">✦</span><div><h1>Ask or add to your Brain...</h1><p>Tell Orbit anything — an event, a task, a goal, a thought. It will organise it for you.</p></div></div>
        <form className="orbit-capture-form" onSubmit={addEntry}>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Tell Orbit anything… what's on your mind?" aria-label="Ask or add to your Brain" rows={2} />
          <div className="orbit-capture-bottom"><span className="orbit-input-hint">✦ YOUR LIFE, READY TO CONNECT</span><button type="submit" disabled={!input.trim()}><span>↗</span> Add to Brain</button></div>
        </form>
        <div className="orbit-quick-add">{[{label:"▦ Add event",value:"Event: "},{label:"✓ Add task",value:"Task: "},{label:"◎ Add goal",value:"Goal: "},{label:"♡ Add moment",value:"Moment: "},{label:"✧ Add idea",value:"Idea: "}].map((item) => <button type="button" key={item.label} onClick={() => setInput((current) => current || item.value)}>{item.label}</button>)}</div>
        {notice && <p className="orbit-action-notice" role="status">{notice}</p>}
      </section>

      <section className="orbit-branch-content" aria-live="polite">
        <div className="orbit-branch-content-heading"><div><span className="orbit-small-eyebrow">BRAIN BRANCH</span><h2>{activeBranch === "All" ? "Everything connected" : activeBranch}</h2></div><span className="orbit-entry-count">{visibleEntries.length} {visibleEntries.length === 1 ? "entry" : "entries"}</span></div>
        <div className="orbit-entry-list">
          {visibleEntries.length ? visibleEntries.map((entry) => <button type="button" key={entry.id} className={"orbit-entry-row " + (selected?.id === entry.id ? "selected" : "")} onClick={() => { setSelectedId(entry.id); setEditingId(null); }}><span className="orbit-entry-category">{entry.category}</span><span className="orbit-entry-title">{entry.title}</span><span className="orbit-entry-arrow">↗</span></button>) : <div className="orbit-empty-branch">Nothing filed here yet. Add something above and Orbit will place it in this branch.</div>}
        </div>
        {selected && <article className="orbit-entry-detail">
          {editingId === selected.id ? <form className="orbit-edit-form" onSubmit={saveEdit}><label>Title<input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} required /></label><label>Branch<select value={editBranch} onChange={(event) => setEditBranch(event.target.value)}>{branches.filter((branch) => branch !== "All").map((branch) => <option key={branch}>{branch}</option>)}</select></label><label>Details<textarea rows={4} value={editContent} onChange={(event) => setEditContent(event.target.value)} /></label><div className="orbit-detail-actions"><button type="button" onClick={() => setEditingId(null)} className="orbit-secondary-button">Cancel</button><button type="submit" className="orbit-primary-button">Save changes</button></div></form> : <><div className="orbit-detail-top"><span className="orbit-entry-category">{selected.category}</span><div className="orbit-detail-actions"><button type="button" className="orbit-secondary-button" onClick={() => startEdit(selected)}>Edit</button><button type="button" className="orbit-delete-button" onClick={() => removeEntry(selected.id)}>Delete</button></div></div><h3>{selected.title}</h3><p>{selected.content}</p></>}
        </article>}
      </section>
      <footer className="orbit-minimal-footer">ORBIT · ONE BRAIN. ONE PLACE. YOUR LIFE, ORGANISED.</footer>
    </main>
  );
}
