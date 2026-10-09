import { useEffect, useMemo, useState } from "react";

const categories = [
  { name: "Personal", color: "#65d8c8" },
  { name: "Work", color: "#7baeff" },
  { name: "Family", color: "#c1a2ff" },
  { name: "Health", color: "#f1b879" },
  { name: "Other", color: "#f18ca8" },
];
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const shiftDate = (value, amount) => {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const starterEvents = [
  { id: "demo-1", title: "Plan the week", date: today(), start: "09:00", end: "09:30", category: "Personal", notes: "Example event — edit or delete it." , demo: true },
  { id: "demo-2", title: "Focus session", date: today(), start: "11:00", end: "12:00", category: "Work", notes: "Example event — edit or delete it.", demo: true },
  { id: "demo-3", title: "Personal time", date: shiftDate(today(), 1), start: "18:00", end: "19:00", category: "Family", notes: "Example event — edit or delete it.", demo: true },
];
const emptyForm = (date) => ({ title: "", date, start: "09:00", end: "09:30", category: "Personal", reminder: "15", notes: "" });
const fmtDate = (value, options = { weekday: "long", day: "numeric", month: "long" }) => new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", options);
const timeLabel = (value) => value ? new Date(`2000-01-01T${value}:00`).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" }) : "";

export default function CalendarWorkspace() {
  const [events, setEvents] = useState(() => {
    try { const saved = localStorage.getItem("orbit-calendar-events"); return saved ? JSON.parse(saved) : starterEvents; }
    catch { return starterEvents; }
  });
  const [view, setView] = useState("Day");
  const [selectedDate, setSelectedDate] = useState(today);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(() => emptyForm(today()));
  const [enabledCategories, setEnabledCategories] = useState(categories.map((category) => category.name));
  const [notice, setNotice] = useState("");
  useEffect(() => { try { localStorage.setItem("orbit-calendar-events", JSON.stringify(events)); } catch { /* browser storage may be unavailable */ } }, [events]);

  const visibleEvents = useMemo(() => events.filter((event) => enabledCategories.includes(event.category)).sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start)), [events, enabledCategories]);
  const dayEvents = visibleEvents.filter((event) => event.date === selectedDate);
  const weekStart = (() => { const date = new Date(`${selectedDate}T12:00:00`); date.setDate(date.getDate() - ((date.getDay() + 6) % 7)); return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; })();
  const weekDates = Array.from({ length: 7 }, (_, i) => shiftDate(weekStart, i));
  const monthDate = new Date(`${selectedDate}T12:00:00`);
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1, 12);
  const monthOffset = (monthStart.getDay() + 6) % 7;
  const monthCells = Array.from({ length: Math.ceil((monthOffset + new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate()) / 7) * 7 }, (_, i) => {
    const d = new Date(monthDate.getFullYear(), monthDate.getMonth(), i - monthOffset + 1, 12);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  });
  function movePeriod(amount) {
    if (view === "Month") { const d = new Date(`${selectedDate}T12:00:00`); d.setMonth(d.getMonth() + amount); setSelectedDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`); }
    else setSelectedDate(shiftDate(selectedDate, amount * (view === "Week" ? 7 : 1)));
  }
  function openNew(date = selectedDate) { setEditingId(null); setForm(emptyForm(date)); setShowForm(true); setNotice(""); }
  function openEdit(event) { setEditingId(event.id); setForm({ title: event.title, date: event.date, start: event.start, end: event.end, category: event.category, reminder: event.reminder ?? "15", notes: event.notes ?? "" }); setShowForm(true); setNotice(""); }
  function saveEvent(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.date || !form.start || !form.end) { setNotice("Add a title, date and start/end time."); return; }
    if (form.end <= form.start) { setNotice("The end time must be after the start time."); return; }
    const next = { ...form, title: form.title.trim(), id: editingId ?? `event-${Date.now()}`, demo: false };
    setEvents((current) => editingId ? current.map((event) => event.id === editingId ? next : event) : [...current.filter((event) => !event.demo), next]);
    setSelectedDate(form.date); setView("Day"); setShowForm(false); setEditingId(null); setNotice(editingId ? "Event updated on this device." : "Event saved on this device.");
  }
  function deleteEvent(id) { setEvents((current) => current.filter((event) => event.id !== id)); setShowForm(false); setEditingId(null); setNotice("Event deleted."); }
  function renderEvent(event) {
    const category = categories.find((item) => item.name === event.category) ?? categories[0];
    return <button type="button" className="orbit-event" key={event.id} style={{ "--event-color": category.color }} onClick={() => openEdit(event)} title="Open event details">
      <span className="orbit-event-time">{timeLabel(event.start)} – {timeLabel(event.end)}</span><strong>{event.title}</strong><span className="orbit-event-category">{event.category}{event.demo ? " · EXAMPLE" : ""}</span>
    </button>;
  }

  return <section className="subpage calendar-page">
    <div className="calendar-heading">
      <div><div className="eyebrow"><span className="pulse" /> YOUR TIME, IN ORBIT</div><h1>Smart <span>Calendar.</span></h1><p className="subpage-intro">One clear view of work, personal time and family commitments — with smarter planning to come.</p></div>
      <button className="calendar-add-button" onClick={() => openNew()}>＋ New event</button>
    </div>
    <div className="calendar-toolbar">
      <div className="calendar-period-nav"><button onClick={() => movePeriod(-1)} aria-label="Previous period">‹</button><button className="calendar-today-button" onClick={() => setSelectedDate(today())}>Today</button><button onClick={() => movePeriod(1)} aria-label="Next period">›</button><strong>{view === "Month" ? monthDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : view === "Week" ? `${fmtDate(weekDates[0], { day: "numeric", month: "short" })} – ${fmtDate(weekDates[6], { day: "numeric", month: "short", year: "numeric" })}` : fmtDate(selectedDate)}</strong></div>
      <div className="calendar-view-switch">{["Day", "Week", "Month", "Agenda"].map((item) => <button key={item} className={view === item ? "active" : ""} onClick={() => setView(item)}>{item}</button>)}</div>
    </div>
    <div className="calendar-layout">
      <div className="calendar-main-panel">
        {view === "Day" && <div className="calendar-day-view"><div className="calendar-day-title"><span>{fmtDate(selectedDate, { weekday: "short" }).toUpperCase()}</span><strong>{fmtDate(selectedDate, { day: "numeric" })}</strong><small>{fmtDate(selectedDate, { month: "long", year: "numeric" })}</small></div>
          <div className="calendar-day-events">{dayEvents.length ? dayEvents.map(renderEvent) : <div className="calendar-empty"><span>✧</span><strong>A little room to breathe.</strong><p>No events on this day. Add a commitment or leave the space free.</p><button onClick={() => openNew(selectedDate)}>＋ Add an event</button></div>}</div></div>}
        {view === "Week" && <div className="calendar-week-grid">{weekDates.map((date) => <button type="button" key={date} className={`calendar-week-day ${date === selectedDate ? "selected" : ""} ${date === today() ? "is-today" : ""}`} onClick={() => setSelectedDate(date)}><span>{fmtDate(date, { weekday: "short" })}</span><strong>{fmtDate(date, { day: "numeric" })}</strong><div>{visibleEvents.filter((event) => event.date === date).slice(0, 3).map((event) => <i key={event.id} style={{ background: categories.find((c) => c.name === event.category)?.color }} title={event.title} />)}</div></button>)}
          <div className="calendar-week-agenda"><h3>{fmtDate(selectedDate)}</h3>{dayEvents.length ? dayEvents.map(renderEvent) : <p className="muted">Nothing scheduled. Select a day to inspect it or add an event.</p>}<button className="outline-button" onClick={() => openNew(selectedDate)}>＋ Add to selected day</button></div></div>}
        {view === "Month" && <div className="calendar-month-grid">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => <div className="calendar-month-weekday" key={day}>{day}</div>)}{monthCells.map((date) => { const inMonth = new Date(`${date}T12:00:00`).getMonth() === monthDate.getMonth(); const dayItems = visibleEvents.filter((event) => event.date === date); return <button type="button" key={date} className={`calendar-month-cell ${inMonth ? "" : "outside"} ${date === selectedDate ? "selected" : ""} ${date === today() ? "is-today" : ""}`} onClick={() => { setSelectedDate(date); setView("Day"); }}><span>{fmtDate(date, { day: "numeric" })}</span>{dayItems.slice(0, 2).map((event) => <i key={event.id} style={{ "--event-color": categories.find((c) => c.name === event.category)?.color }}>{event.title}</i>)}{dayItems.length > 2 && <small>+{dayItems.length - 2} more</small>}</button>; })}</div>}
        {view === "Agenda" && <div className="calendar-agenda-view"><h2>Upcoming commitments</h2>{visibleEvents.filter((event) => event.date >= selectedDate).length ? visibleEvents.filter((event) => event.date >= selectedDate).map((event) => <div className="calendar-agenda-row" key={event.id}><button className="calendar-agenda-date" onClick={() => { setSelectedDate(event.date); setView("Day"); }}><strong>{fmtDate(event.date, { day: "numeric" })}</strong><span>{fmtDate(event.date, { month: "short", weekday: "short" })}</span></button>{renderEvent(event)}</div>) : <p className="muted">No upcoming events yet.</p>}</div>}
      </div>
      <aside className="calendar-side-panel">
        <div className="calendar-side-title"><div><span className="section-symbol">✳</span><h2>My calendars</h2></div><span className="mini-tag">FILTERS</span></div>
        <p className="muted">Show or hide categories in your schedule.</p>
        {categories.map((category) => <label className="calendar-category-toggle" key={category.name}><input type="checkbox" checked={enabledCategories.includes(category.name)} onChange={() => setEnabledCategories((current) => current.includes(category.name) ? current.filter((name) => name !== category.name) : [...current, category.name])} /><span style={{ "--event-color": category.color }} /><strong>{category.name}</strong><small>{events.filter((event) => event.category === category.name).length}</small></label>)}
        <div className="calendar-smart-note"><span>✧</span><div><strong>Smart planning is next</strong><p>Orbit will flag clashes, suggest free slots and help you plan preparation time. These suggestions aren't active yet.</p></div></div>
        <div className="calendar-reminder-note"><span>◷</span><div><strong>Reminder settings</strong><p>Events can store a reminder preference, but phone notifications are not yet connected.</p></div></div>
      </aside>
    </div>
    {showForm && <div className="calendar-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}><form className="calendar-event-form" onSubmit={saveEvent}>
      <div className="section-heading"><div><span className="section-symbol">✧</span><h2>{editingId ? "Edit event" : "Create an event"}</h2></div><button type="button" className="calendar-close" onClick={() => setShowForm(false)} aria-label="Close">×</button></div>
      <p className="muted">Changes are saved in this browser for now. Cloud sync and active reminders will be added later.</p>
      <label className="brain-field calendar-full-field"><span>EVENT TITLE</span><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What do you need to do?" autoFocus /></label>
      <div className="calendar-form-grid"><label className="brain-field"><span>DATE</span><input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label><label className="brain-field"><span>CATEGORY</span><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((item) => <option key={item.name}>{item.name}</option>)}</select></label><label className="brain-field"><span>START</span><input type="time" required value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></label><label className="brain-field"><span>END</span><input type="time" required value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></label><label className="brain-field calendar-full-field"><span>REMIND ME</span><select value={form.reminder} onChange={(e) => setForm({ ...form, reminder: e.target.value })}><option value="0">At event time</option><option value="5">5 minutes before</option><option value="15">15 minutes before</option><option value="30">30 minutes before</option><option value="60">1 hour before</option><option value="1440">1 day before</option><option value="none">No reminder</option></select></label></div>
      <label className="brain-field calendar-full-field"><span>NOTES (OPTIONAL)</span><textarea rows="2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Address, preparation or anything to remember..." /></label>
      {notice && <p className="calendar-form-notice" role="alert">{notice}</p>}
      <div className="brain-form-actions">{editingId && <button type="button" className="calendar-delete-button" onClick={() => deleteEvent(editingId)}>Delete event</button>}<button type="button" className="brain-cancel-button" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="brain-save-button">Save event ↗</button></div>
    </form></div>}
    {notice && !showForm && <div className="brain-notice" role="status">{notice}</div>}
  </section>;
}
