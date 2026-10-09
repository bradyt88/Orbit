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
  const selected = memories.find((memory) => memory.id === selectedId);\n

  function captureCommand(event) {
    event.preventDefault();
    const value = command.trim();
    if (!value) return;
    const text = value.toLowerCase();
    const isCalendar = /\\b(meeting|appointment|calendar|event|remind|reminder|schedule|book|tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\\d{1,2}\\s?(am|pm)|\\d{1,2}\\/\\d{1,2})\\b/.test(text);
    const detectedCategory =
      isCalendar ? "Calendar" :
      /\\b(goal|aim|target|achieve|milestone|objective)\\b/.test(text) ? "Goals" :
      /\\b(moment|memory|remember when|happened|experience|photo|occasion)\\b/.test(text) ? "Moments" :
      /\\b(family|mum|mom|dad|wife|husband|son|daughter|kids|children)\\b/.test(text) ? "Family" :
      /\\b(work|boss|shift|office|warehouse|job|colleague)\\b/.test(text) ? "Work" :
      /\\b(bill|money|budget|pay|bank|spend|finance)\\b/.test(text) ? "Finance" :
      /\\b(doctor|health|hospital|medicine|gp)\\b/.test(text) ? "Health" :
      /\\b(song|music|video|design|write|create|art|content)\\b/.test(text) ? "Creative" :
      /\\b(task|todo|to-do|finish|call|email|send|fix|clean|buy|pick up)\\b/.test(text) ? "Tasks" : "Ideas";
    const now = new Date();
    const dateMatch = text.match(/\\b(\\d{4}-\\d{2}-\\d{2})\\b/);
    let eventDate = dateMatch?.[1] || "";
    if (!eventDate && /\\btoday\\b/.test(text)) eventDate = toDateString(now);
    if (!eventDate && /\\btomorrow\\b/.test(text)) { const d = new Date(now); d.setDate(d.getDate() + 1); eventDate = toDateString(d); }
    if (!eventDate) {
      const weekdays = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
      const dayName = weekdays.find((day) => new RegExp("\\\\b" + day + "\\\\b").test(text));
      if (dayName) { const d = new Date(now); let delta = (weekdays.indexOf(dayName) - d.getDay() + 7) % 7; if (delta === 0 || /\\bnext\\b/.test(text)) delta += 7; d.setDate(d.getDate() + delta); eventDate = toDateString(d); }
    }
    const timeMatch = text.match(/\\b(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)\\b/) || text.match(/\\b([01]?\\d|2[0-3]):([0-5]\\d)\\b/);
    let startTime = "";
    if (timeMatch) {
      let hour = Number(timeMatch[1]); const minute = Number(timeMatch[2] || 0); const meridiem = timeMatch[3];
      if (meridiem === "pm" && hour < 12) hour += 12; if (meridiem === "am" && hour === 12) hour = 0;
      startTime = String(hour).padStart(2,"0") + ":" + String(minute).padStart(2,"0");
    }
    const [x, y] = positions[memories.length % positions.length];
    const memory = { id: Date.now(), title: value.length > 58 ? value.slice(0, 55) + "..." : value, content: value, category: detectedCategory, pinned: false, createdAt: Date.now(), x, y };
    setMemories((current) => [memory, ...current]);
    setSelectedId(memory.id);
    setFilter(detectedCategory);
    setSearch("");
    setCommand("");
    if (detectedCategory === "Calendar") {
      if (eventDate && startTime) {
        const endDate = new Date("2000-01-01T" + startTime + ":00");
        endDate.setMinutes(endDate.getMinutes() + 30);
        const endTime = String(endDate.getHours()).padStart(2,"0") + ":" + String(endDate.getMinutes()).padStart(2,"0");
        let calendarEvents = [];
        try { calendarEvents = JSON.parse(localStorage.getItem("orbit-calendar-events") || "[]"); } catch { calendarEvents = []; }
        const eventTitle = value.replace(/\\b(today|tomorrow|next\\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\\b/ig, "").trim();
        calendarEvents.push({ id: "event-" + Date.now(), title: eventTitle || value, date: eventDate, start: startTime, end: endTime, category: /\\b(work|office|shift|meeting with boss)\\b/.test(text) ? "Work" : /\\b(family|mum|dad|kids|children)\\b/.test(text) ? "Family" : /\\b(doctor|gp|hospital)\\b/.test(text) ? "Health" : "Personal", reminder: "15", notes: "Added through Orbit Brain command.", demo: false });
        localStorage.setItem("orbit-calendar-events", JSON.stringify(calendarEvents));
        setNotice("Orbit filed this under Calendar and added it to your calendar for " + eventDate + " at " + startTime + ". Timed notifications are not active yet.");
      } else {
        setNotice("Saved under Calendar. To add it to the calendar, include a date and time, for example: “Dentist tomorrow at 2pm”.");
      }
    } else {
      setNotice("Orbit filed this under " + detectedCategory + " and added it to your Brain. Select the branch below to review or edit it.");
    }
  }
  function toDateString(date) { return date.getFullYear() + "-" + String(date.getMonth()+1).padStart(2,"0") + "-" + String(date.getDate()).padStart(2,"0"); }
  function beginEdit(memory) { setEditingId(memory.id); setEditTitle(memory.title); setEditContent(memory.content); setEditCategory(memory.category); }
  function saveEdit(event) {
    event.preventDefault();
    if (!editTitle.trim()) { setNotice("A title is required."); return; }
    setMemories((current) => current.map((memory) => memory.id === editingId ? { ...memory, title: editTitle.trim(), content: editContent.trim(), category: editCategory } : memory));
    setFilter(editCategory); setEditingId(null); setNotice("Brain entry updated.");
  }

