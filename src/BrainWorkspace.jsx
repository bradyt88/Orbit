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

  return (
    <main className="orbit-one-screen">
      <header className="orbit-minimal-header">
        <div className="orbit-wordmark"><span className="orbit-wordmark-symbol">◉</span><span>ORBIT</span></div>
        <span className="orbit-header-caption">YOUR LIFE, CONNECTED</span>
      </header>

      <section className="orbit-brain-core" aria-label="Orbit Brain">
        <img className="orbit-core-image" src={import.meta.env.BASE_URL + "images/brain/orbit-brain.png"} alt="Orbit's glowing gold and crimson neural brain" />
        <div className="orbit-core-caption"><span className="orbit-live-dot" /> YOUR BRAIN IS THE CENTRE</div>
      </section>

      <nav className="orbit-branches" aria-label="Brain branches">
        {branches.map((branch) => (
          <button key={branch} type="button" className={`orbit-branch-pill ${activeBranch === branch ? "active" : ""}`} onClick={() => { setActiveBranch(branch); setEditingId(null); }}>
            {branch}
            {branch !== "All" && <span>{entries.filter((entry) => entry.category === branch).length}</span>}
          </button>
        ))}
      </nav>

      <section className="orbit-capture-area">
        <div className="orbit-section-title"><span className="orbit-gold-spark">✦</span><div><h1>Ask or add to your Brain</h1><p>Say it naturally. Orbit will organise it into a branch.</p></div></div>
        <form className="orbit-capture-form" onSubmit={addEntry}>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Tell Orbit anything… an event, a task, a goal, a moment, an idea…" aria-label="Ask or add to your Brain" rows={2} />
          <div className="orbit-capture-bottom">
            <span className="orbit-input-hint">TYPE WHAT'S ON YOUR MIND</span>
            <button type="submit" disabled={!input.trim()}><span>＋</span> Add to Brain <span>↗</span></button>
          </div>
        </form>
        <div className="orbit-quick-add">{[{label:"+ Event",value:"Event: "},{label:"+ Task",value:"Task: "},{label:"+ Goal",value:"Goal: "},{label:"+ Moment",value:"Moment: "},{label:"+ Idea",value:"Idea: "}].map((item) => <button type="button" key={item.label} onClick={() => setInput((current) => current || item.value)}>{item.label}</button>)}</div>
        {notice && <p className="orbit-action-notice" role="status">{notice}</p>}
      </section>

      <section className="orbit-branch-content" aria-live="polite">
        <div className="orbit-branch-content-heading"><div><span className="orbit-small-eyebrow">BRAIN BRANCH</span><h2>{activeBranch === "All" ? "Everything connected" : activeBranch}</h2></div><span className="orbit-entry-count">{visibleEntries.length} {visibleEntries.length === 1 ? "entry" : "entries"}</span></div>
        <div className="orbit-entry-list">
          {visibleEntries.length ? visibleEntries.map((entry) => <button type="button" key={entry.id} className={`orbit-entry-row ${selected?.id === entry.id ? "selected" : ""}`} onClick={() => { setSelectedId(entry.id); setEditingId(null); }}><span className="orbit-entry-category">{entry.category}</span><span className="orbit-entry-title">{entry.title}</span><span className="orbit-entry-arrow">↗</span></button>) : <div className="orbit-empty-branch">Nothing filed here yet. Add something above and Orbit will place it in this branch.</div>}
        </div>
        {selected && <article className="orbit-entry-detail">
          {editingId === selected.id ? <form className="orbit-edit-form" onSubmit={saveEdit}><label>Title<input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} required /></label><label>Branch<select value={editBranch} onChange={(event) => setEditBranch(event.target.value)}>{branches.filter((branch) => branch !== "All").map((branch) => <option key={branch}>{branch}</option>)}</select></label><label>Details<textarea rows={4} value={editContent} onChange={(event) => setEditContent(event.target.value)} /></label><div className="orbit-detail-actions"><button type="button" onClick={() => setEditingId(null)} className="orbit-secondary-button">Cancel</button><button type="submit" className="orbit-primary-button">Save changes</button></div></form> : <><div className="orbit-detail-top"><span className="orbit-entry-category">{selected.category}</span><div className="orbit-detail-actions"><button type="button" className="orbit-secondary-button" onClick={() => startEdit(selected)}>Edit</button><button type="button" className="orbit-delete-button" onClick={() => removeEntry(selected.id)}>Delete</button></div></div><h3>{selected.title}</h3><p>{selected.content}</p></>}
        </article>}
      </section>
      <footer className="orbit-minimal-footer">ORBIT · ONE BRAIN. ONE PLACE. YOUR LIFE, ORGANISED.</footer>
    </main>
  );
}
