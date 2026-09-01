"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Brain, Check, ChevronRight, Clock3, Compass, Gauge, Grid3X3, LockKeyhole, Plane, RotateCcw, Sparkles, Target, Timer, Trophy, X, Zap } from "lucide-react";

type Area = "direction" | "numerical" | "logic" | "attention";
type Question = { prompt: string; options: string[]; answer: number; detail: string };
type Result = { area: Area; correct: number; total: number; date: string };

const tests: Record<Area, { title: string; kicker: string; description: string; time: number; icon: typeof Compass; color: string; questions: Question[] }> = {
  direction: { title: "Direction & Orientation", kicker: "Spatial awareness", description: "Track headings through rapid sequences of turns.", time: 90, icon: Compass, color: "cyan", questions: [
    { prompt: "You are facing North. Turn 90° right, then 180°, then 90° left. Which direction are you facing?", options: ["North", "East", "South", "West"], answer: 2, detail: "North → East → West → South." },
    { prompt: "Aircraft Kilo is heading West. It turns 270° clockwise. What is its new heading?", options: ["North", "East", "South", "West"], answer: 2, detail: "A 270° clockwise turn from West finishes South." },
    { prompt: "You face South-East, turn 90° anticlockwise, then 45° clockwise. Where do you face?", options: ["North-East", "East", "South-East", "South"], answer: 1, detail: "South-East → North-East → East." },
    { prompt: "A plane is travelling North-East. It reverses direction. What is its new heading?", options: ["North-West", "South-East", "South-West", "West"], answer: 2, detail: "The opposite of North-East is South-West." },
  ]},
  numerical: { title: "Rapid Calculations", kicker: "Numerical ability", description: "Accurate mental arithmetic under a strict clock.", time: 90, icon: Gauge, color: "violet", questions: [
    { prompt: "An aircraft travels 420 miles in 3 hours. What is its average speed?", options: ["120 mph", "130 mph", "140 mph", "160 mph"], answer: 2, detail: "420 ÷ 3 = 140 mph." },
    { prompt: "What is 15% of 260?", options: ["36", "39", "42", "45"], answer: 1, detail: "10% is 26 and 5% is 13; together that is 39." },
    { prompt: "Three sectors handle 24, 31 and 17 aircraft. Six transfer out. How many remain?", options: ["62", "64", "66", "68"], answer: 2, detail: "24 + 31 + 17 − 6 = 66." },
    { prompt: "Complete the sequence: 3, 7, 15, 31, ?", options: ["47", "55", "61", "63"], answer: 3, detail: "Each number is doubled, then 1 is added." },
  ]},
  logic: { title: "Logic & Rules", kicker: "Logical thinking", description: "Identify rules, sequences and relationships quickly.", time: 100, icon: Brain, color: "amber", questions: [
    { prompt: "All Zetas are fast. No fast aircraft are grounded. Which statement must be true?", options: ["Some Zetas are grounded", "No Zetas are grounded", "All grounded aircraft are Zetas", "No aircraft are fast"], answer: 1, detail: "If every Zeta is fast and no fast aircraft is grounded, no Zeta can be grounded." },
    { prompt: "Which comes next? AB, DE, GH, JK, ?", options: ["LM", "MN", "NO", "OP"], answer: 1, detail: "Each pair begins three letters after the previous pair: A, D, G, J, M." },
    { prompt: "If BLUE = 36 using the sum of letter positions, what does RED equal?", options: ["25", "27", "29", "31"], answer: 1, detail: "R (18) + E (5) + D (4) = 27." },
    { prompt: "Alpha arrives before Bravo. Charlie arrives after Bravo. Delta arrives before Alpha. Who arrives first?", options: ["Alpha", "Bravo", "Charlie", "Delta"], answer: 3, detail: "The only possible order begins Delta, then Alpha, Bravo and Charlie." },
  ]},
  attention: { title: "Selective Attention", kicker: "Concentration", description: "Find exact signals while filtering distractions.", time: 75, icon: Target, color: "green", questions: [
    { prompt: "Target: ▲ 7 K. Which sequence is an exact match?", options: ["▲ 7 K", "▲ K 7", "△ 7 K", "▲ 7 X"], answer: 0, detail: "The first sequence matches all three characters and their order." },
    { prompt: "Count the letter R: R P B R R K P R B K R", options: ["3", "4", "5", "6"], answer: 2, detail: "R appears in positions 1, 4, 5, 8 and 11: five times." },
    { prompt: "Rule: choose the only item where the number is odd AND the arrow points left.", options: ["8 ←", "7 →", "5 ←", "4 →"], answer: 2, detail: "5 is odd and its arrow points left." },
    { prompt: "Which callsign appears twice? AX41 · BX14 · AX14 · BX41 · AX41", options: ["AX41", "BX14", "AX14", "BX41"], answer: 0, detail: "AX41 is the first and final callsign." },
  ]},
};

function formatTime(value: number) { return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`; }

export default function Home() {
  const [view, setView] = useState<"home" | "test" | "results">("home");
  const [area, setArea] = useState<Area>("direction");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [time, setTime] = useState(90);
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => { const saved = localStorage.getItem("nats-ready-results"); if (saved) setResults(JSON.parse(saved)); }, []);
  useEffect(() => {
    if (view !== "test") return;
    if (time <= 0) { finish(); return; }
    const timer = window.setInterval(() => setTime(t => t - 1), 1000);
    return () => window.clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, time]);

  const active = tests[area];
  const score = useMemo(() => answers.reduce((sum, answer, i) => sum + (answer === active.questions[i]?.answer ? 1 : 0), 0), [answers, active.questions]);

  function begin(type: Area) { setArea(type); setIndex(0); setAnswers([]); setSelected(null); setTime(tests[type].time); setView("test"); }
  function next() {
    if (selected === null) return;
    const updated = [...answers, selected]; setAnswers(updated); setSelected(null);
    if (index === active.questions.length - 1) finish(updated); else setIndex(i => i + 1);
  }
  function finish(finalAnswers = answers) {
    const correct = finalAnswers.reduce((sum, answer, i) => sum + (answer === active.questions[i]?.answer ? 1 : 0), 0);
    const entry = { area, correct, total: active.questions.length, date: new Date().toISOString() };
    const updated = [entry, ...results].slice(0, 20); setResults(updated); localStorage.setItem("nats-ready-results", JSON.stringify(updated)); setAnswers(finalAnswers); setView("results");
  }

  if (view === "test") return <main className="testShell">
    <header className="testHeader"><button className="back" onClick={() => setView("home")}><X size={20}/> Exit practice</button><div className={`timer ${time < 20 ? "urgent" : ""}`}><Clock3 size={18}/>{formatTime(time)}</div></header>
    <section className="testPanel">
      <div className="testMeta"><span>{active.kicker}</span><span>Question {index + 1} of {active.questions.length}</span></div>
      <div className="progress"><i style={{width: `${((index + 1) / active.questions.length) * 100}%`}} /></div>
      <h1>{active.questions[index].prompt}</h1>
      <div className="options">{active.questions[index].options.map((option, i) => <button key={option} onClick={() => setSelected(i)} className={selected === i ? "chosen" : ""}><b>{String.fromCharCode(65 + i)}</b><span>{option}</span>{selected === i && <Check size={20}/>}</button>)}</div>
      <div className="testActions"><span>Choose the best answer</span><button disabled={selected === null} onClick={next}>{index === active.questions.length - 1 ? "Finish test" : "Next question"}<ArrowRight size={18}/></button></div>
    </section>
  </main>;

  if (view === "results") { const pct = Math.round((score / active.questions.length) * 100); return <main className="resultShell">
    <section className="resultCard"><div className="resultIcon"><Trophy/></div><p className="eyebrow">Practice complete</p><h1>{pct}%</h1><h2>{score} of {active.questions.length} correct</h2><p>{pct >= 75 ? "Strong work. Your accuracy held up well under the timer." : "Good first run. Review the explanations, then try again for speed and accuracy."}</p>
      <div className="review">{active.questions.map((q, i) => <div key={q.prompt}><span className={answers[i] === q.answer ? "right" : "wrong"}>{answers[i] === q.answer ? <Check/> : <X/>}</span><p><b>Question {i + 1}</b>{q.detail}</p></div>)}</div>
      <div className="resultActions"><button className="secondary" onClick={() => setView("home")}><ArrowLeft size={18}/>Dashboard</button><button onClick={() => begin(area)}><RotateCcw size={18}/>Try again</button></div>
    </section>
  </main>; }

  const lastScore = results[0] ? Math.round(results[0].correct / results[0].total * 100) : null;
  return <main>
    <nav><div className="brand"><span><Plane size={20}/></span>NATS <b>READY</b></div><div className="navLinks"><a href="#practice">Practice</a><a href="#progress">Progress</a><button><LockKeyhole size={15}/> Private training</button></div></nav>
    <section className="hero"><div className="heroCopy"><div className="pill"><Sparkles size={15}/> Built for Stage One preparation</div><h1>Train your mind.<br/><em>Control the pressure.</em></h1><p>Focused ability training for aspiring air traffic controllers. Build speed, accuracy and confidence before assessment day.</p><div className="heroActions"><button onClick={() => begin("direction")}>Start diagnostic <ArrowRight size={18}/></button><a href="#practice">Explore practice <ChevronRight size={18}/></a></div><div className="trust"><span><Check/> Skill-based practice</span><span><Check/> Instant feedback</span><span><Check/> Progress saved</span></div></div>
      <div className="radarCard"><div className="radarTop"><span>TRAINING RADAR</span><span className="live"><i/> LIVE</span></div><div className="radar"><i className="sweep"/><i className="ring r1"/><i className="ring r2"/><span className="blip b1"/><span className="blip b2"/><span className="blip b3"/><Plane className="plane"/></div><div className="radarStats"><div><b>4</b><span>Training areas</span></div><div><b>{results.length}</b><span>Tests completed</span></div><div><b>{lastScore ?? "—"}{lastScore !== null && "%"}</b><span>Latest score</span></div></div></div>
    </section>
    <section className="section" id="practice"><div className="sectionHead"><div><p className="eyebrow">Training modules</p><h2>Choose an ability to sharpen</h2></div><p>Each session is short, timed and designed to develop the underlying skills assessed in selection.</p></div>
      <div className="testGrid">{(Object.keys(tests) as Area[]).map(type => { const test = tests[type], Icon = test.icon; return <article className={`module ${test.color}`} key={type}><div className="moduleTop"><span><Icon/></span><small>{test.kicker}</small></div><h3>{test.title}</h3><p>{test.description}</p><div className="moduleInfo"><span><Timer/> {formatTime(test.time)}</span><span><Grid3X3/> {test.questions.length} questions</span></div><button onClick={() => begin(type)}>Start practice <ArrowRight size={18}/></button></article>})}</div>
    </section>
    <section className="section progressSection" id="progress"><div className="sectionHead"><div><p className="eyebrow">Performance</p><h2>Your recent training</h2></div><p>Your results are saved privately on this device.</p></div>
      {results.length ? <div className="history">{results.slice(0, 5).map((r, i) => <div key={r.date}><span className="historyIcon"><Zap/></span><p><b>{tests[r.area].title}</b><small>{new Date(r.date).toLocaleDateString("en-GB", {day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</small></p><strong>{r.correct}/{r.total}</strong><span className="scoreBar"><i style={{width:`${r.correct/r.total*100}%`}}/></span><em>{Math.round(r.correct/r.total*100)}%</em></div>)}</div> : <div className="empty"><Brain/><h3>Your progress starts here</h3><p>Complete a practice module and your results will appear here.</p><button onClick={() => begin("direction")}>Take first test</button></div>}
    </section>
    <section className="coming"><div><p className="eyebrow">Coming next</p><h2>Full mock assessment</h2><p>Eleven back-to-back ability modules with realistic timing, breaks disabled and a complete performance breakdown.</p></div><span>IN DEVELOPMENT</span></section>
    <footer><div className="brand"><span><Plane size={20}/></span>NATS <b>READY</b></div><p>Independent preparation platform. Not affiliated with or endorsed by NATS or Aon.</p></footer>
  </main>;
}
