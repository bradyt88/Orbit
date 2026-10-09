
import { useEffect, useState } from "react";
import "./index.css";

const initialTasks = [
  { id: 1, title: "Review today's priorities", time: "09:00", done: false },
  { id: 2, title: "Check upcoming appointments", time: "10:00", done: false },
  { id: 3, title: "Make time for a personal project", time: "18:00", done: true },
];

const navItems = [
  { name: "Today", icon: "◷" },
  { name: "Brain", icon: "✳" },
  { name: "Calendar", icon: "▦" },
  { name: "Tasks", icon: "☷" },
  { name: "Goals", icon: "◎" },
  { name: "Finance", icon: "£" },
  { name: "My World", icon: "◉" },
];

function App() {
  const [page, setPage] = useState("Today");
  const [tasks, setTasks] = useState(() => {
    try {
      const savedTasks = localStorage.getItem("orbit-tasks");
      return savedTasks ? JSON.parse(savedTasks) : initialTasks;
    } catch {
      return initialTasks;
    }
  });
  const [capture, setCapture] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("orbit-tasks", JSON.stringify(tasks));
    } catch {
      // Orbit remains usable if browser storage is unavailable.
    }
  }, [tasks]);

  const unfinished = tasks.filter((task) => !task.done).length;

  function addCapture(event) {
    event.preventDefault();
    const value = capture.trim();
    if (!value) return;

    setTasks((current) => [
      ...current,
      {
        id: Date.now(),
        title: value,
        time: "Unscheduled",
        done: false,
      },
    ]);
    setCapture("");
    setPage("Tasks");
    setNotice("Captured in your task list");
    setTimeout(() => setNotice(""), 2500);
  }

  function toggleTask(id) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-orbit">O</div>
          <div>
            <div className="brand-name">ORBIT<span>.</span></div>
            <div className="brand-caption">YOUR PERSONAL UNIVERSE</div>
          </div>
        </div>

        <div className="profile">
          <div className="avatar">B</div>
          <div className="profile-copy">
            <strong>Your space</strong>
            <span>Personal assistant</span>
          </div>
          <span className="online-dot" />
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav>
          {navItems.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${page === item.name ? "active" : ""}`}
              onClick={() => setPage(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.name}</span>
              {item.name === "Tasks" && unfinished > 0 && (
                <span className="nav-count">{unfinished}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="ai-status">
            <span className="status-orb">✳</span>
            <div>
              <strong>Orbit Core</strong>
              <span>Personal workspace</span>
            </div>
            <span className="online-dot" />
          </div>
          <button className="nav-item settings" onClick={() => setPage("Settings")}>
            <span className="nav-icon">⚙</span> Settings
          </button>
          <div className="version">ORBIT · FIRST FLIGHT</div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">YOUR UNIVERSE <span>/</span> {page.toUpperCase()}</div>
          <div className="topbar-right">
            <span className="system-status"><span className="online-dot" /> SYSTEM READY</span>
            <div className="small-avatar">B</div>
          </div>
        </header>

        <div className="page-content">
          {page === "Today" && (
            <>
              <section className="welcome">
                <div>
                  <div className="eyebrow"><span className="pulse" /> YOUR PERSONAL COMMAND CENTRE</div>
                  <h1>Make space for<br /><span>what matters.</span></h1>
                  <p>One place for your plans, ideas and everything life throws at you.</p>
                </div>
                <div className="planet-art" aria-hidden="true">
                  <div className="planet-ring" />
                  <div className="planet"><div className="planet-shine" /></div>
                  <span className="star star-one">✦</span>
                  <span className="star star-two">·</span>
                  <span className="star star-three">✧</span>
                </div>
              </section>

              <section className="stats-grid">
                <div className="stat-card">
                  <div className="stat-top"><span>OPEN TASKS</span><span className="stat-icon">☷</span></div>
                  <div className="stat-value">{unfinished}<span className="stat-unit"> active</span></div>
                  <div className="stat-foot">Things to move forward</div>
                </div>
                <div className="stat-card">
                  <div className="stat-top"><span>COMPLETED</span><span className="stat-icon">✓</span></div>
                  <div className="stat-value">{tasks.filter((task) => task.done).length}<span className="stat-unit"> done</span></div>
                  <div className="stat-foot">Progress starts here</div>
                </div>
                <div className="stat-card">
                  <div className="stat-top"><span>UPCOMING</span><span className="stat-icon">▦</span></div>
                  <div className="stat-value">—</div>
                  <div className="stat-foot">No real appointments connected yet</div>
                </div>
              </section>

              <section className="capture-panel">
                <div className="section-heading">
                  <div><span className="section-symbol">✳</span><h2>Get it out of your head</h2></div>
                  <span className="mini-tag">QUICK CAPTURE</span>
                </div>
                <p className="muted">An idea, a job to do, something to remember. Start here.</p>
                <form className="capture-form" onSubmit={addCapture}>
                  <span className="capture-spark">✧</span>
                  <input
                    value={capture}
                    onChange={(event) => setCapture(event.target.value)}
                    placeholder="Type anything you need to remember..."
                    aria-label="Capture an idea or task"
                  />
                  <button type="submit">Capture <span>↗</span></button>
                </form>
                {notice && <div className="notice">{notice}</div>}
                <div className="capture-hint"><span>↳</span> For now, captured entries are added to Tasks. Smarter classification comes next.</div>
              </section>

              <section className="lower-grid">
                <div className="content-card">
                  <div className="section-heading">
                    <div><span className="section-symbol">☷</span><h2>Your priorities</h2></div>
                    <button className="text-button" onClick={() => setPage("Tasks")}>View all ↗</button>
                  </div>
                  <div className="task-list">
                    {tasks.slice(0, 4).map((task) => (
                      <label className={`task-row ${task.done ? "task-done" : ""}`} key={task.id}>
                        <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} />
                        <span className="custom-check" />
                        <span className="task-title">{task.title}</span>
                        <span className="task-time">{task.time}</span>
                      </label>
                    ))}
                    {tasks.length === 0 && <p className="muted">Your list is clear. Capture something to get started.</p>}
                  </div>
                  <button className="add-task-button" onClick={() => setPage("Tasks")}>＋ Manage tasks</button>
                </div>

                <div className="content-card focus-card">
                  <div className="section-heading">
                    <div><span className="section-symbol">◎</span><h2>Your direction</h2></div>
                  </div>
                  <div className="focus-visual"><div className="focus-ring"><span>01</span></div></div>
                  <h3>Build your own orbit.</h3>
                  <p className="muted">Your goals, routines and longer-term plans will live here.</p>
                  <button className="outline-button" onClick={() => setPage("Goals")}>Explore goals <span>→</span></button>
                </div>
              </section>
            </>
          )}

          {page === "Brain" && (
            <section className="subpage">
              <div className="eyebrow"><span className="pulse" /> THE THINKING SPACE</div>
              <h1>Your <span>Brain.</span></h1>
              <p className="subpage-intro">A home for ideas, notes and things you don't want to lose.</p>
              <div className="capture-panel">
                <h2>What's on your mind?</h2>
                <p className="muted">Capture it now. We'll build smarter sorting and connected memory next.</p>
                <form className="capture-form" onSubmit={addCapture}>
                  <span className="capture-spark">✧</span>
                  <input value={capture} onChange={(event) => setCapture(event.target.value)} placeholder="An idea, thought or something to remember..." />
                  <button type="submit">Capture ↗</button>
                </form>
              </div>
              <div className="content-card"><h2>Recently captured</h2><p className="muted">Your captured items currently appear in Tasks.</p>{tasks.slice(-5).reverse().map((task) => <div className="simple-row" key={task.id}><span>✳</span>{task.title}</div>)}</div>
            </section>
          )}

          {page === "Tasks" && (
            <section className="subpage">
              <div className="eyebrow"><span className="pulse" /> YOUR ACTION LIST</div>
              <h1>Small steps.<br /><span>Real progress.</span></h1>
              <p className="subpage-intro">Everything you've captured as a task, in one place.</p>
              <div className="capture-panel">
                <form className="capture-form" onSubmit={addCapture}>
                  <span className="capture-spark">＋</span>
                  <input value={capture} onChange={(event) => setCapture(event.target.value)} placeholder="Add a task..." />
                  <button type="submit">Add task ↗</button>
                </form>
              </div>
              <div className="content-card task-page-card">
                <div className="section-heading"><h2>All tasks</h2><span className="mini-tag">{unfinished} OPEN</span></div>
                {tasks.map((task) => (
                  <label className={`task-row ${task.done ? "task-done" : ""}`} key={task.id}>
                    <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} />
                    <span className="custom-check" />
                    <span className="task-title">{task.title}</span>
                    <span className="task-time">{task.time}</span>
                  </label>
                ))}
                {tasks.length === 0 && <p className="muted">No tasks yet. Add one above.</p>}
              </div>
            </section>
          )}

          {page !== "Today" && page !== "Brain" && page !== "Tasks" && (
            <section className="subpage">
              <div className="eyebrow"><span className="pulse" /> ORBIT WORKSPACE</div>
              <h1>{page === "Settings" ? "Your space." : `Explore ${page.toLowerCase()}.`}</h1>
              <p className="subpage-intro">{page === "Calendar" ? "Appointments and reminders belong here. Real calendar connections are a future step." : page === "Goals" ? "Turn bigger ambitions into manageable steps." : page === "Finance" ? "Plan bills, income and spending in one private space." : page === "My World" ? "A personal feed for the topics that matter to you." : "Make Orbit work the way you need it to."}</p>
              <div className="content-card placeholder-card">
                <div className="placeholder-icon">{navItems.find((item) => item.name === page)?.icon || "⚙"}</div>
                <h2>{page} is ready for its next build.</h2>
                <p className="muted">The workspace is in place. We'll add working features and connect the data step by step.</p>
                <button className="outline-button" onClick={() => setPage("Today")}>Return to Today <span>→</span></button>
              </div>
            </section>
          )}
          <footer className="footer"><span>ORBIT <span className="footer-dot">✳</span> YOUR LIFE, IN ORBIT.</span><span>FIRST FLIGHT · PREVIEW</span></footer>
        </div>
      </main>
    </div>
  );
}

export default App;
