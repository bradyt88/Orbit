import { useEffect, useMemo, useState } from "react";

const branches = ["All", "Calendar", "Inbox", "Tasks", "Goals", "Moments", "People", "Ideas", "Work", "Family", "Creative", "Finance", "Health", "Learning", "Travel"];
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
  const [replyDraft, setReplyDraft] = useState("Hi Sarah, thanks for letting me know. Tuesday should be fine for me. Could you send over the time and any details I need beforehand?");
  const [replyApprovedDemo, setReplyApprovedDemo] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [nodePositions, setNodePositions] = useState({});
  const [people, setPeople] = useState(() => { try { return JSON.parse(localStorage.getItem("orbit-people") || "[]"); } catch { return []; } });
  const [familyLinks, setFamilyLinks] = useState(() => { try { return JSON.parse(localStorage.getItem("orbit-family-links") || "[]"); } catch { return []; } });
  const [personSearch, setPersonSearch] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState(null);
  const [personDraft, setPersonDraft] = useState({ name: "", preferredName: "", relationship: "", birthday: "", email: "", phone: "", notes: "" });
  const [linkDraft, setLinkDraft] = useState({ personId: "", label: "Parent" });
  const [familyMode, setFamilyMode] = useState("overview");
  const [familyFocusId, setFamilyFocusId] = useState(null);
  const [treeFullscreen, setTreeFullscreen] = useState(false);
  const [treeNodePositions, setTreeNodePositions] = useState(() => { try { return JSON.parse(localStorage.getItem("orbit-family-tree-positions") || "{}"); } catch { return {}; } });
  const [draggingTreePerson, setDraggingTreePerson] = useState(null);
  const [calendarView, setCalendarView] = useState("Monthly");
  const [calendarCursor, setCalendarCursor] = useState(() => new Date());
  const [calendarSearch, setCalendarSearch] = useState("");
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState(() => {
    try { return JSON.parse(localStorage.getItem("orbit-calendar-events") || "[]"); } catch { return []; }
  });
  const [eventDraft, setEventDraft] = useState({ title: "", date: new Date().toISOString().slice(0, 10), start: "09:00", end: "09:30", location: "", notes: "", reminder: "default", recurrence: "none" });

  useEffect(() => {
    try { localStorage.setItem("orbit-brain-memories", JSON.stringify(entries)); } catch {}
  }, [entries]);

  useEffect(() => { try { localStorage.setItem("orbit-family-tree-positions", JSON.stringify(treeNodePositions)); } catch {} }, [treeNodePositions]);

  useEffect(() => {
    if (!treeFullscreen) return;
    const handleKeyDown = (event) => { if (event.key === "Escape") setTreeFullscreen(false); };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [treeFullscreen]);

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
          oldEvents.push({ id: "event-" + entry.id, title: text, date: dateString(date), start, end, category: "Personal", reminder: "default", reminders: ["3 days", "2 days", "1 day", "12 hours", "2 hours"], location: "", notes: "Added from Orbit Brain.", demo: false });
          localStorage.setItem("orbit-calendar-events", JSON.stringify(oldEvents));
          setCalendarEvents(oldEvents);
          setNotice("Filed under Calendar and added to the calendar. Phone notifications will be connected with the backend.");
        } catch { setNotice("Saved to the Calendar branch. Calendar storage could not be updated."); }
      } else setNotice("Filed under Calendar. Add a clear day and time, such as “Dentist tomorrow at 2pm”, to create a dated calendar entry.");
    } else setNotice("Added to your " + category + " branch.");
  }

  const calendarDate = (value) => {
    const date = new Date(value + "T12:00:00");
    return Number.isNaN(date.getTime()) ? new Date() : date;
  };
  const calendarDateKey = (date) => date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  const monthLabel = calendarCursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const filteredCalendarEvents = calendarEvents.map((event) => {
    if (event.recurrence === "yearly" && event.birthdayDate) {
      const monthDay = event.birthdayDate.slice(5);
      const now = new Date();
      const today = dateString(now).slice(5);
      const year = now.getFullYear() + (monthDay < today ? 1 : 0);
      const next = new Date(year, Number(monthDay.slice(0, 2)) - 1, Number(monthDay.slice(3, 5)));
      return { ...event, date: dateString(next) };
    }
    return event;
  }).filter((event) => {
    const q = calendarSearch.trim().toLowerCase();
    return !q || [event.title, event.location, event.notes, event.category].some((part) => String(part || "").toLowerCase().includes(q));
  }).sort((a,b) => (a.date + (a.start || "")).localeCompare(b.date + (b.start || "")));
  const todayKey = calendarDateKey(new Date());
  function moveCalendarCursor(amount, unit) {
    setCalendarCursor((current) => {
      const next = new Date(current);
      if (unit === "day") next.setDate(next.getDate() + amount);
      else if (unit === "week") next.setDate(next.getDate() + amount * 7);
      else next.setMonth(next.getMonth() + amount);
      return next;
    });
  }
  function openNewEvent(date) {
    setEditingEventId(null);
    setEventDraft({ title: "", date: date || calendarDateKey(calendarCursor), start: "09:00", end: "09:30", location: "", notes: "", reminder: "default", recurrence: "none" });
    setShowEventForm(true);
  }
  function openEditEvent(event) {
    setEditingEventId(event.id);
    setEventDraft({ title: event.title || "", date: event.date || todayKey, start: event.start || "", end: event.end || "", location: event.location || "", notes: event.notes || "", reminder: event.reminder || "default", recurrence: event.recurrence || "none" });
    setShowEventForm(true);
  }
  function saveCalendarEvent(event) {
    event.preventDefault();
    if (!eventDraft.title.trim() || !eventDraft.date) return;
    const record = { ...eventDraft, id: editingEventId || "orbit-event-" + Date.now(), title: eventDraft.title.trim(), category: "Personal", reminders: ["3 days", "2 days", "1 day", "12 hours", "2 hours"], updatedAt: Date.now() };
    setCalendarEvents((current) => editingEventId ? current.map((item) => item.id === editingEventId ? record : item) : [...current, record]);
    setShowEventForm(false); setEditingEventId(null); setNotice("Calendar event saved. Reminder times are stored, but phone notifications need the backend to be connected.");
  }
  function deleteCalendarEvent(id) {
    setCalendarEvents((current) => current.filter((event) => event.id !== id));
    setNotice("Calendar event deleted.");
  }

  const selectedPerson = people.find((person) => person.id === selectedPersonId) || null;
  const visiblePeople = people.filter((person) => [person.name, person.preferredName, person.relationship, person.email].some((part) => String(part || "").toLowerCase().includes(personSearch.toLowerCase())));
  function openNewPerson() {
    setEditingPersonId(null);
    setPersonDraft({ name: "", preferredName: "", relationship: "", birthday: "", email: "", phone: "", notes: "" });
    setShowPersonForm(true);
  }
  function openEditPerson(person) {
    setEditingPersonId(person.id);
    setPersonDraft({ name: person.name || "", preferredName: person.preferredName || "", relationship: person.relationship || "", birthday: person.birthday || "", email: person.email || "", phone: person.phone || "", notes: person.notes || "" });
    setShowPersonForm(true);
  }
  function savePerson(event) {
    event.preventDefault();
    if (!personDraft.name.trim()) return;
    const id = editingPersonId || "person-" + Date.now();
    const person = { ...personDraft, id, name: personDraft.name.trim(), createdAt: editingPersonId ? (people.find((item) => item.id === editingPersonId)?.createdAt || Date.now()) : Date.now(), updatedAt: Date.now() };
    setPeople((current) => editingPersonId ? current.map((item) => item.id === editingPersonId ? person : item) : [...current, person]);
    setSelectedPersonId(id); setFamilyFocusId(id); setShowPersonForm(false); setEditingPersonId(null);
    if (person.birthday) {
      const eventId = "birthday-" + id;
      setCalendarEvents((current) => {
        const found = current.some((item) => item.id === eventId);
        const birthdayMonthDay = person.birthday.slice(5); const now = new Date(); let nextBirthday = new Date(now.getFullYear() + (birthdayMonthDay < dateString(now).slice(5) ? 1 : 0), Number(birthdayMonthDay.slice(0,2)) - 1, Number(birthdayMonthDay.slice(3,5))); const birthdayEvent = { id: eventId, title: (person.preferredName || person.name) + "'s birthday", date: dateString(nextBirthday), birthdayDate: person.birthday, start: "", end: "", category: "Personal", reminder: "default", reminders: ["3 days", "2 days", "1 day", "12 hours", "2 hours"], recurrence: "yearly", personId: id, linkedRecordType: "person-birthday", location: "", notes: "Birthday linked to " + person.name + "'s profile.", updatedAt: Date.now() };
        return found ? current.map((item) => item.id === eventId ? { ...item, ...birthdayEvent } : item) : [...current, birthdayEvent];
      });
    } else setCalendarEvents((current) => current.filter((item) => item.id !== "birthday-" + id));
    setNotice(editingPersonId ? "Person profile updated." : "Person added to Orbit.");
  }
  function deletePerson(id) {
    const person = people.find((item) => item.id === id);
    setPeople((current) => current.filter((item) => item.id !== id));
    setFamilyLinks((current) => current.filter((link) => link.from !== id && link.to !== id));
    setCalendarEvents((current) => current.map((item) => item.personId === id ? { ...item, personId: undefined, notes: (item.notes ? item.notes + " " : "") + "Person profile removed; event preserved." } : item));
    setEntries((current) => current.map((entry) => entry.personId === id ? { ...entry, personId: undefined } : entry));
    setSelectedPersonId(null); setFamilyFocusId(null); setNotice((person?.name || "Person") + " profile deleted. Linked events and memories have been preserved.");
  }
  function addFamilyLink(event) {
    event.preventDefault();
    if (!selectedPersonId || !linkDraft.personId || selectedPersonId === linkDraft.personId) return;
    const exists = familyLinks.some((link) => (link.from === selectedPersonId && link.to === linkDraft.personId) || (link.to === selectedPersonId && link.from === linkDraft.personId));
    if (exists) { setNotice("These people are already connected."); return; }
    setFamilyLinks((current) => [...current, { id: "relationship-" + Date.now(), from: selectedPersonId, to: linkDraft.personId, label: linkDraft.label }]);
    setFamilyFocusId(selectedPersonId); setNotice("Family relationship added.");
  }
  function removeFamilyLink(id) { setFamilyLinks((current) => current.filter((link) => link.id !== id)); setNotice("Relationship removed."); }
  const treePeople = familyMode === "overview" || !familyFocusId ? people : people.filter((person) => person.id === familyFocusId || familyLinks.some((link) => (link.from === familyFocusId && link.to === person.id) || (link.to === familyFocusId && link.from === person.id)));
  const selfPerson = treePeople.find((person) => person.isSelf || /^(me|myself|self|you)$/i.test(String(person.relationship || "").trim()) || /^(me|myself|self|you)$/i.test(String(person.preferredName || person.name || "").trim()));
  const outerTreePeople = treePeople.filter((person) => person.id !== selfPerson?.id);
  const treeNodes = outerTreePeople.map((person, index) => {
    const count = outerTreePeople.length;
    const angle = (Math.PI * 2 * index / Math.max(count, 1)) - Math.PI / 2;
    const radiusX = count > 10 ? 39 : count > 5 ? 34 : 28;
    const radiusY = count > 10 ? 34 : count > 5 ? 30 : 25;
    const defaults = { x: 50 + Math.cos(angle) * radiusX, y: 50 + Math.sin(angle) * radiusY };
    const saved = treeNodePositions[person.id];
    return { ...person, x: saved?.x ?? defaults.x, y: saved?.y ?? defaults.y };
  });
  function moveTreePerson(event, person) {
    if (!draggingTreePerson || draggingTreePerson !== person.id) return;
    const bounds = event.currentTarget.closest(".orbit-living-tree")?.getBoundingClientRect();
    if (!bounds) return;
    const x = Math.max(5, Math.min(95, ((event.clientX - bounds.left) / bounds.width) * 100));
    const y = Math.max(8, Math.min(90, ((event.clientY - bounds.top) / bounds.height) * 100));
    setTreeNodePositions((current) => ({ ...current, [person.id]: { x, y } }));
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

  const baseNodeLayout = [
    { name: "Tasks", icon: "✓", x: 30, y: 17, tone: "gold", hint: "To-do · Projects" },
    { name: "Calendar", icon: "▦", x: 50, y: 7, tone: "red", hint: "Events · Reminders" },
    { name: "Inbox", icon: "✉", x: 50, y: 20, tone: "red", hint: "Email · Reply drafts" },
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
    { name: "People", icon: "♧", x: 89, y: 22, tone: "gold", hint: "Friends · Contacts" }
  ];
  const nodeLayout = baseNodeLayout.map((node) => ({ ...node, ...(nodePositions[node.name] || {}) }));

  function startVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setNotice("Voice input is not supported in this browser. Try Chrome or Edge."); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-GB"; recognition.interimResults = true;
    recognition.onstart = () => setVoiceListening(true);
    recognition.onend = () => setVoiceListening(false);
    recognition.onerror = () => { setVoiceListening(false); setNotice("Voice input stopped. Check microphone permission and try again."); };
    recognition.onresult = (event) => setInput(Array.from(event.results).map((result) => result[0].transcript).join(" "));
    recognition.start();
  }

  function moveNode(event, node) {
    if (event.buttons !== 1) return;
    const bounds = event.currentTarget.parentElement.getBoundingClientRect();
    const x = Math.min(94, Math.max(6, ((event.clientX - bounds.left) / bounds.width) * 100));
    const y = Math.min(90, Math.max(6, ((event.clientY - bounds.top) / bounds.height) * 100));
    setNodePositions((current) => ({ ...current, [node.name]: { x, y } }));
  }

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
        {nodeLayout.map((node, index) => (
          <button key={node.name} type="button" style={{ left: node.x + "%", top: node.y + "%", "--node-float": (5.5 + (index % 4) * 0.8) + "s", "--node-delay": (-index * 0.7) + "s", touchAction: "none" }}
            onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.dataset.dragged = "true"; }}
            onPointerMove={(event) => { if (event.currentTarget.dataset.dragged === "true" && event.buttons === 1) moveNode(event, node); }}
            onPointerUp={(event) => { event.currentTarget.dataset.dragged = "false"; }}
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

      <section className="orbit-capture-area orbit-cosmic-capture">
        <div className="orbit-section-title"><span className="orbit-gold-spark">✦</span><div><h1>Ask or add to your Brain...</h1><p>Tell Orbit anything — an event, a task, a goal, a thought. It will organise it for you.</p></div></div>
        <form className="orbit-capture-form" onSubmit={addEntry}>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Tell Orbit anything… what's on your mind?" aria-label="Ask or add to your Brain" rows={2} />
          <div className="orbit-voice-row"><button type="button" className={"orbit-voice-button " + (voiceListening ? "listening" : "")} onClick={startVoiceInput} aria-label="Speak to Orbit"><span>{voiceListening ? "●" : "🎙"}</span> {voiceListening ? "Listening…" : "Speak to Orbit"}</button><span>Use your voice or type naturally</span></div>
          <div className="orbit-capture-bottom"><span className="orbit-input-hint">✦ YOUR LIFE, READY TO CONNECT</span><button type="submit" disabled={!input.trim()}><span>↗</span> Add to Brain</button></div>
        </form>
        <div className="orbit-quick-add">{[{label:"▦ Add event",value:"Event: "},{label:"✓ Add task",value:"Task: "},{label:"◎ Add goal",value:"Goal: "},{label:"♡ Add moment",value:"Moment: "},{label:"✧ Add idea",value:"Idea: "}].map((item) => <button type="button" key={item.label} onClick={() => setInput((current) => current || item.value)}>{item.label}</button>)}</div>
        {notice && <p className="orbit-action-notice" role="status">{notice}</p>}
      </section>

      <nav className="orbit-branches orbit-branches-compact" aria-label="Brain branches">
        {branches.map((branch) => (
          <button key={branch} type="button" className={"orbit-branch-pill " + (activeBranch === branch ? "active" : "")} onClick={() => { setActiveBranch(branch); setEditingId(null); }}>
            {branch}{branch !== "All" && <span>{entries.filter((entry) => entry.category === branch).length}</span>}
          </button>
        ))}
      </nav>

      {activeBranch === "Inbox" && <section className="orbit-inbox-workspace" aria-label="Orbit email review demo">\n        <div className="orbit-inbox-heading"><div><span className="orbit-small-eyebrow">CONNECTED COMMUNICATIONS · DESIGN PREVIEW</span><h2>Inbox & suggested replies</h2><p>Orbit reviews the context, drafts in your style and waits for your approval.</p></div><span className="orbit-demo-badge">DEMO · NOT CONNECTED</span></div>\n        <div className="orbit-inbox-layout"><article className="orbit-email-card"><div className="orbit-email-top"><span className="orbit-email-avatar">S</span><div><strong>Sarah Thompson</strong><small>sarah@example.com · Illustrative message</small></div><span className="orbit-email-priority">Needs reply</span></div><h3>Appointment on Tuesday</h3><p className="orbit-email-body">Hi, are you available on Tuesday for the appointment? Let me know and I’ll send over the details.</p><div className="orbit-context-note"><span>✦ ORBIT’S CONTEXT</span><p>Suggested response based on the message and your preferred direct, friendly tone. Your actual calendar has not been checked.</p></div></article><article className="orbit-reply-card"><div className="orbit-reply-title"><div><span className="orbit-small-eyebrow">REPLY DRAFT</span><h3>Review before sending</h3></div><span className="orbit-lock-icon">⌑</span></div><label className="orbit-reply-field">To<input readOnly value="sarah@example.com" /></label><label className="orbit-reply-field">Subject<input readOnly value="Re: Appointment on Tuesday" /></label><label className="orbit-reply-field">Your message<textarea rows={5} value={replyDraft} onChange={(event)=>{setReplyDraft(event.target.value);setReplyApprovedDemo(false);}} /></label><p className="orbit-approval-rule"><span>🔒</span> Editing the message resets approval. Orbit must verify the exact recipient and text before sending.</p>{replyApprovedDemo ? <div className="orbit-demo-approval-status" role="status"><strong>Demo approval recorded</strong><span>No email was sent. Gmail is not connected yet.</span><button type="button" className="orbit-secondary-button" onClick={()=>setReplyApprovedDemo(false)}>Revoke demo approval</button></div> : <div className="orbit-reply-actions"><button type="button" className="orbit-secondary-button" onClick={()=>{setReplyDraft("Hi Sarah, thanks for letting me know. Tuesday should be fine for me. Could you send over the time and any details I need beforehand?");setReplyApprovedDemo(false);}}>Reset draft</button><button type="button" className="orbit-primary-button" disabled={!replyDraft.trim()} onClick={()=>{setReplyApprovedDemo(true);setNotice("Demo approval recorded. No email was sent; Gmail is not connected.");}}>Approve exact draft <span>→</span></button></div>}</article></div><div className="orbit-inbox-security"><span>✓</span><p><strong>Approval is explicit</strong> — changing the text or recipient invalidates the approval. The live version will send through Gmail only after server-side verification.</p></div>\n      </section>}\n\n      {activeBranch === "Calendar" && <section className="orbit-calendar-workspace" aria-label="Calendar workspace">
        <div className="orbit-calendar-heading">
          <div><span className="orbit-small-eyebrow">YOUR SCHEDULE</span><h2>Calendar</h2><p>Plan ahead. Keep everything connected.</p></div>
          <button type="button" className="orbit-calendar-add" onClick={() => openNewEvent(calendarDateKey(calendarCursor))}>＋ Add event</button>
        </div>
        <div className="orbit-calendar-toolbar">
          <div className="orbit-calendar-views">{["Daily","Weekly","Monthly","Upcoming"].map((view) => <button key={view} type="button" className={calendarView === view ? "active" : ""} onClick={() => setCalendarView(view)}>{view}</button>)}</div>
          <div className="orbit-calendar-nav"><button type="button" onClick={() => moveCalendarCursor(-1, calendarView === "Daily" ? "day" : calendarView === "Weekly" ? "week" : "month")} aria-label="Previous period">‹</button><button type="button" onClick={() => setCalendarCursor(new Date())}>Today</button><button type="button" onClick={() => moveCalendarCursor(1, calendarView === "Daily" ? "day" : calendarView === "Weekly" ? "week" : "month")} aria-label="Next period">›</button></div>
        </div>
        <div className="orbit-calendar-monthline"><h3>{calendarView === "Daily" ? calendarCursor.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"}) : calendarView === "Weekly" ? "Week of " + calendarCursor.toLocaleDateString("en-GB",{day:"numeric",month:"short"}) : calendarView === "Upcoming" ? "Coming up" : monthLabel}</h3><label className="orbit-calendar-search"><icon>⌕</icon><input value={calendarSearch} onChange={(e) => setCalendarSearch(e.target.value)} placeholder="Search events..." aria-label="Search calendar events" /></label></div>
        {calendarView === "Monthly" && <div className="orbit-month-grid">
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day) => <div className="orbit-month-weekday" key={day}>{day}</div>)}
          {(() => { const first = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), 1); const offset = (first.getDay()+6)%7; const days = new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,0).getDate(); return Array.from({length:Math.ceil((offset+days)/7)*7},(_,i)=>{ const n=i-offset+1; const valid=n>=1&&n<=days; const date=valid?new Date(calendarCursor.getFullYear(),calendarCursor.getMonth(),n):null; const key=date?calendarDateKey(date):""; const dayEvents=filteredCalendarEvents.filter((event)=>event.date===key); return <button type="button" key={i} className={"orbit-month-day "+(!valid?"outside":"")+(key===todayKey?" today":"")+(valid&&key<todayKey?" past":"")} disabled={!valid} onClick={()=>openNewEvent(key)}><span>{valid?n: ""}</span>{dayEvents.slice(0,2).map((event)=> <i key={event.id} title={event.title} role="button" tabIndex={0} onClick={(e)=>{e.stopPropagation();openEditEvent(event);}} onKeyDown={(e)=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopPropagation();openEditEvent(event);}}}>{event.title}</i>)}{dayEvents.length>2&&<small>+{dayEvents.length-2} more</small>}</button>; }); })()}
        </div>}
        {calendarView === "Daily" && <div className="orbit-calendar-agenda">{filteredCalendarEvents.filter((event)=>event.date===calendarDateKey(calendarCursor)).length ? filteredCalendarEvents.filter((event)=>event.date===calendarDateKey(calendarCursor)).map((event)=><button type="button" className="orbit-calendar-event-row" key={event.id} onClick={()=>openEditEvent(event)}><time>{event.start || "All day"}</time><span><strong>{event.title}</strong><small>{event.location || event.notes || "No additional details"}</small></span><b>↗</b></button>) : <div className="orbit-calendar-empty">Nothing scheduled for this day. Add an event to get started.</div>}</div>}
        {calendarView === "Weekly" && <div className="orbit-week-grid">{Array.from({length:7},(_,i)=>{const date=new Date(calendarCursor);const mondayOffset=(date.getDay()+6)%7;date.setDate(date.getDate()-mondayOffset+i);const key=calendarDateKey(date);const list=filteredCalendarEvents.filter((event)=>event.date===key);return <div className={"orbit-week-column "+(key===todayKey?"today":"")} key={key}><button type="button" onClick={()=>openNewEvent(key)}><small>{date.toLocaleDateString("en-GB",{weekday:"short"})}</small><strong>{date.getDate()}</strong></button>{list.map((event)=><button type="button" className="orbit-week-event" key={event.id} onClick={()=>openEditEvent(event)}>{event.start&&<small>{event.start}</small>}{event.title}</button>)}</div>})}</div>}
        {calendarView === "Upcoming" && <div className="orbit-calendar-agenda">{filteredCalendarEvents.filter((event)=>event.date>=todayKey).length ? filteredCalendarEvents.filter((event)=>event.date>=todayKey).map((event)=><button type="button" className="orbit-calendar-event-row" key={event.id} onClick={()=>openEditEvent(event)}><time>{calendarDate(event.date).toLocaleDateString("en-GB",{day:"2-digit",month:"short"})}<small>{event.start || "All day"}</small></time><span><strong>{event.title}</strong><small>{event.location || event.notes || "No additional details"}</small></span><b>↗</b></button>) : <div className="orbit-calendar-empty">No upcoming events yet. Add your next event.</div>}</div>}
        <div className="orbit-calendar-bottomline"><span>{filteredCalendarEvents.length} saved {filteredCalendarEvents.length===1?"event":"events"}</span><span>Reminders: 3d · 2d · 1d · 12h · 2h</span></div>
        {showEventForm && <div className="orbit-event-form-wrap"><form className="orbit-event-form" onSubmit={saveCalendarEvent}><div className="orbit-event-form-heading"><h3>{editingEventId?"Edit event":"New event"}</h3><button type="button" onClick={()=>setShowEventForm(false)} aria-label="Close event form">×</button></div><label>Event title<input autoFocus value={eventDraft.title} onChange={(e)=>setEventDraft({...eventDraft,title:e.target.value})} placeholder="What is happening?" required /></label><div className="orbit-event-fields"><label>Date<input type="date" value={eventDraft.date} onChange={(e)=>setEventDraft({...eventDraft,date:e.target.value})} required /></label><label>Repeats<select value={eventDraft.recurrence} onChange={(e)=>setEventDraft({...eventDraft,recurrence:e.target.value})}><option value="none">Does not repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></label><label>Start time<input type="time" value={eventDraft.start} onChange={(e)=>setEventDraft({...eventDraft,start:e.target.value})} /></label><label>End time<input type="time" value={eventDraft.end} onChange={(e)=>setEventDraft({...eventDraft,end:e.target.value})} /></label></div><label>Location<input value={eventDraft.location} onChange={(e)=>setEventDraft({...eventDraft,location:e.target.value})} placeholder="Add a location" /></label><label>Notes<textarea rows={3} value={eventDraft.notes} onChange={(e)=>setEventDraft({...eventDraft,notes:e.target.value})} placeholder="Details, people, or anything to remember" /></label><div className="orbit-event-reminder-note"><icon>🔔</icon><span>Default reminders: 3 days, 2 days, 1 day, 12 hours and 2 hours before. Phone delivery will be connected with the backend.</span></div><div className="orbit-event-form-actions">{editingEventId&&<button type="button" className="orbit-delete-button" onClick={()=>{deleteCalendarEvent(editingEventId);setShowEventForm(false);}}>Delete event</button>}<button type="button" className="orbit-secondary-button" onClick={()=>setShowEventForm(false)}>Cancel</button><button type="submit" className="orbit-primary-button">Save event</button></div></form></div>}
      </section>}
      {(activeBranch === "People" || activeBranch === "Family") && <section className="orbit-people-workspace" aria-label={activeBranch === "People" ? "People workspace" : "Family tree workspace"}>
        <div className="orbit-people-heading"><div><span className="orbit-small-eyebrow">{activeBranch === "People" ? "YOUR CONNECTIONS" : "YOUR FAMILY UNIVERSE"}</span><h2>{activeBranch === "People" ? "People" : "Family Tree"}</h2><p>{activeBranch === "People" ? "One profile for every person who matters to you." : "A living tree, grown from your family connections."}</p></div>{activeBranch === "People" && <button type="button" className="orbit-calendar-add" onClick={openNewPerson}>＋ Add person</button>}</div>
        {activeBranch === "People" ? <div className="orbit-people-layout">
          <div className="orbit-people-directory"><label className="orbit-calendar-search"><span>⌕</span><input value={personSearch} onChange={(e)=>setPersonSearch(e.target.value)} placeholder="Find a person..." aria-label="Search people" /></label>
            {visiblePeople.map((person)=><button type="button" key={person.id} className={"orbit-person-row "+(selectedPersonId===person.id?"selected":"")} onClick={()=>setSelectedPersonId(person.id)}><span className="orbit-person-avatar">{(person.preferredName||person.name).trim().charAt(0).toUpperCase()}</span><span className="orbit-person-row-copy"><strong>{person.preferredName||person.name}</strong><small>{person.relationship||"Relationship not set"}</small></span><span>›</span></button>)}
            {!visiblePeople.length && <div className="orbit-calendar-empty">{people.length?"No people match your search yet.":"Your people directory is ready. Add your first person."}</div>}
          </div>
          <div className="orbit-person-detail">{selectedPerson ? <><div className="orbit-person-profile-top"><span className="orbit-person-avatar large">{(selectedPerson.preferredName||selectedPerson.name).trim().charAt(0).toUpperCase()}</span><div className="orbit-person-profile-title"><h3>{selectedPerson.preferredName||selectedPerson.name}</h3><p>{selectedPerson.relationship||"Relationship not set"}</p></div><button type="button" className="orbit-secondary-button" onClick={()=>openEditPerson(selectedPerson)}>Edit</button></div>
            <div className="orbit-person-facts">{selectedPerson.birthday&&<div><small>Birthday</small><strong>{new Date(selectedPerson.birthday+"T12:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</strong></div>}{selectedPerson.email&&<div><small>Email</small><strong>{selectedPerson.email}</strong></div>}{selectedPerson.phone&&<div><small>Phone</small><strong>{selectedPerson.phone}</strong></div>}</div>
            <div className="orbit-person-notes"><span className="orbit-small-eyebrow">NOTES & PREFERENCES</span><p>{selectedPerson.notes||"No notes yet. Edit this profile to add useful details Orbit can remember."}</p></div>
            <div className="orbit-person-related"><span className="orbit-small-eyebrow">CONNECTED FAMILY</span>{familyLinks.filter((link)=>link.from===selectedPerson.id||link.to===selectedPerson.id).map((link)=>{const other=people.find((person)=>person.id===(link.from===selectedPerson.id?link.to:link.from));return other?<div className="orbit-person-link-row" key={link.id}><span>{other.preferredName||other.name}</span><small>{link.label}</small><button type="button" onClick={()=>removeFamilyLink(link.id)} aria-label={"Remove relationship with "+other.name}>×</button></div>:null})}
              {people.filter((person)=>person.id!==selectedPerson.id).length>0&&<form className="orbit-link-person-form" onSubmit={addFamilyLink}><select value={linkDraft.personId} onChange={(e)=>setLinkDraft({...linkDraft,personId:e.target.value})} aria-label="Choose a person to connect"><option value="">Choose person…</option>{people.filter((person)=>person.id!==selectedPerson.id).map((person)=><option key={person.id} value={person.id}>{person.preferredName||person.name}</option>)}</select><select value={linkDraft.label} onChange={(e)=>setLinkDraft({...linkDraft,label:e.target.value})} aria-label="Relationship type"><option>Parent</option><option>Child</option><option>Partner</option><option>Sibling</option><option>Grandparent</option><option>Grandchild</option><option>Other family</option><option>Friend</option><option>Custom</option></select><button type="submit" className="orbit-secondary-button">＋ Link</button></form>}
            </div><div className="orbit-person-profile-actions"><button type="button" className="orbit-delete-button" onClick={()=>deletePerson(selectedPerson.id)}>Delete profile</button><button type="button" className="orbit-secondary-button" onClick={()=>{setActiveBranch("Family");setFamilyFocusId(selectedPerson.id);}}>View in Family Tree ↗</button></div></> : <div className="orbit-calendar-empty">Select a person to view their profile, relationships and connected information.</div>}</div>
        </div> : <><div className="orbit-tree-toolbar"><div className="orbit-calendar-views"><button type="button" className={familyMode==="overview"?"active":""} onClick={()=>setFamilyMode("overview")}>Full tree</button><button type="button" className={familyMode==="focus"?"active":""} onClick={()=>setFamilyMode("focus")}>Close family</button></div><div className="orbit-tree-toolbar-right"><button type="button" className="orbit-secondary-button" onClick={()=>setTreeFullscreen(true)}>⛶ Expand tree</button>{familyMode==="focus"&&<select value={familyFocusId||""} onChange={(e)=>setFamilyFocusId(e.target.value)} aria-label="Focus family member"><option value="">Choose person…</option>{people.map((person)=><option key={person.id} value={person.id}>{person.preferredName||person.name}</option>)}</select>}<button type="button" className="orbit-calendar-add" onClick={()=>{setActiveBranch("People");openNewPerson();}}>＋ Add person</button></div></div>
          <div className={"orbit-living-tree "+(familyMode==="focus"?"focused-tree":"overview-tree")+(treeFullscreen?" fullscreen-tree":"")} role="region" aria-label="Interactive family tree">
            {treeFullscreen&&<button type="button" className="orbit-tree-close-fullscreen" onClick={()=>setTreeFullscreen(false)}>× <span>Back to Orbit</span></button>}
            <img className="orbit-tree-background-image" src={import.meta.env.BASE_URL+"images/family-tree/family-tree-background.png"} alt="" aria-hidden="true" />
            <div className="orbit-tree-canopy-glow" aria-hidden="true"></div>
            <div className="orbit-tree-stars" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div>
            <svg className="orbit-tree-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <defs><linearGradient id="orbitBark" x1="0" y1="1" x2="0.8" y2="0"><stop offset="0" stopColor="#5e271c"/><stop offset=".45" stopColor="#e3a24e"/><stop offset="1" stopColor="#ffdf9a"/></linearGradient><linearGradient id="orbitCrimsonBranch"><stop offset="0" stopColor="#8f303b"/><stop offset="1" stopColor="#ff746d"/></linearGradient><filter id="orbitTreeBloom"><feGaussianBlur stdDeviation=".7" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
              <path className="orbit-tree-trunk" d="M50 105 C48 90 53 82 50 68 C47 58 51 48 50 38 C49 28 50 19 50 8" />
              <path className="orbit-tree-limb" d="M50 80 C41 75 35 66 31 54 C28 46 20 42 12 37 M49 68 C60 65 66 57 70 46 C73 39 81 34 90 30 M50 57 C40 52 38 44 36 35 C34 28 28 23 21 19 M50 47 C59 41 61 32 62 24 C63 18 69 13 76 9 M50 89 C37 84 28 78 21 67 M51 85 C65 79 75 72 81 61" />
              <path className="orbit-tree-limb crimson" d="M31 54 C24 53 18 48 15 42 M70 46 C78 47 84 42 88 36 M36 35 C30 34 25 28 23 23 M62 24 C68 24 73 19 76 14" />
              {treeNodes.map((person,index)=>{const anchorX=person.x;const anchorY=person.y;const trunkY=familyMode==="focus"?52:58;const bendX=(anchorX+50)/2;const branchY=Math.min(anchorY-5,trunkY-3);return <g key={"branch-"+person.id} className="orbit-tree-growing-branch"><path className={index%3===1?"orbit-tree-connection crimson":"orbit-tree-connection"} d={"M 50 94 C "+(50+(anchorX-50)*.18)+" 80, "+bendX+" "+(branchY+10)+", "+anchorX+" "+(anchorY+5)} /><path className="orbit-tree-branch-vein" d={"M 50 91 Q "+bendX+" "+(branchY+5)+" "+anchorX+" "+(anchorY+5)} /></g>})}
              {Array.from({length:24},(_,i)=><circle key={"ember-"+i} className="orbit-tree-ember" cx={12+(i*37)%76} cy={10+(i*23)%78} r={i%4===0?".38":".2"} style={{animationDelay:(i%9)*-.7+"s"}}/>)}
            </svg>
            <div className="orbit-tree-root-label"><span>ROOTS</span><i/></div>
            <button type="button" className="orbit-tree-person orbit-tree-self" aria-label="Open your personal profile" onClick={()=>{if(selfPerson){setSelectedPersonId(selfPerson.id);setActiveBranch("People");}else{setActiveBranch("People");setSelectedPersonId(null);setNotice("Add your own profile in People, then mark the relationship as Me to show your profile here.");}}}><span className="orbit-tree-person-orb"><span>{selfPerson?(selfPerson.preferredName||selfPerson.name).trim().charAt(0).toUpperCase():"Y"}</span><i/></span><strong>{selfPerson?(selfPerson.preferredName||selfPerson.name):"You"}</strong><small>Personal profile</small></button>
            {treeNodes.map((person,index)=><button type="button" key={person.id} className={"orbit-tree-person draggable-tree-person "+(familyFocusId===person.id?"focused":"")+(selectedPersonId===person.id?" selected":"")} style={{left:person.x+"%",top:person.y+"%","--tree-delay":(-index*.35)+"s",touchAction:"none"}} onPointerDown={(event)=>{event.currentTarget.setPointerCapture(event.pointerId);setDraggingTreePerson(person.id);}} onPointerMove={(event)=>moveTreePerson(event,person)} onPointerUp={()=>setDraggingTreePerson(null)} onPointerCancel={()=>setDraggingTreePerson(null)} onClick={()=>{if(draggingTreePerson)return;setSelectedPersonId(person.id);setFamilyFocusId(person.id);setFamilyMode("focus");}}><span className="orbit-tree-person-orb"><span>{(person.preferredName||person.name).trim().charAt(0).toUpperCase()}</span><i/></span><strong>{person.preferredName||person.name}</strong><small>{person.relationship||"Family member"}</small></button>)}
            {!people.length&&<div className="orbit-tree-empty"><span className="orbit-tree-seed">✦</span><h3>Your family tree starts here</h3><p>Add the people who matter to you, then connect them to grow the branches.</p><button type="button" className="orbit-calendar-add" onClick={()=>{setActiveBranch("People");openNewPerson();}}>＋ Add first person</button></div>}
          </div>
          {selectedPerson&&<div className="orbit-tree-selected-card"><div><span className="orbit-small-eyebrow">SELECTED BRANCH</span><h3>{selectedPerson.preferredName||selectedPerson.name}</h3><p>{selectedPerson.relationship||"Relationship not set"}{selectedPerson.birthday?" · Birthday "+new Date(selectedPerson.birthday+"T12:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short"}):""}</p></div><button type="button" className="orbit-secondary-button" onClick={()=>setActiveBranch("People")}>Open profile ↗</button></div>}
        </>}
        {showPersonForm&&<div className="orbit-event-form-wrap"><form className="orbit-event-form" onSubmit={savePerson}><div className="orbit-event-form-heading"><h3>{editingPersonId?"Edit person":"Add a person"}</h3><button type="button" onClick={()=>setShowPersonForm(false)} aria-label="Close person form">×</button></div><label>Full name<input autoFocus value={personDraft.name} onChange={(e)=>setPersonDraft({...personDraft,name:e.target.value})} placeholder="Their name" required /></label><div className="orbit-event-fields"><label>Preferred name<input value={personDraft.preferredName} onChange={(e)=>setPersonDraft({...personDraft,preferredName:e.target.value})} placeholder="What you call them" /></label><label>Relationship to you<input value={personDraft.relationship} onChange={(e)=>setPersonDraft({...personDraft,relationship:e.target.value})} placeholder="e.g. sister, friend, manager" /></label><label>Birthday<input type="date" value={personDraft.birthday} onChange={(e)=>setPersonDraft({...personDraft,birthday:e.target.value})}/></label><label>Email<input type="email" value={personDraft.email} onChange={(e)=>setPersonDraft({...personDraft,email:e.target.value})} /></label><label>Phone<input type="tel" value={personDraft.phone} onChange={(e)=>setPersonDraft({...personDraft,phone:e.target.value})} /></label></div><label>Notes and preferences<textarea rows={3} value={personDraft.notes} onChange={(e)=>setPersonDraft({...personDraft,notes:e.target.value})} placeholder="Details you want Orbit to remember" /></label><div className="orbit-event-form-actions"><button type="button" className="orbit-secondary-button" onClick={()=>setShowPersonForm(false)}>Cancel</button><button type="submit" className="orbit-primary-button">Save person</button></div></form></div>}
      </section>}
      <section className={"orbit-branch-content" + (["Calendar","Inbox","People","Family"].includes(activeBranch) ? " orbit-branch-content-hidden" : "")} aria-live="polite">
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
