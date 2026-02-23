import { useState, useRef, useEffect } from "react";

async function callClaude(prompt, systemPrompt = "") {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "API error " + res.status);
  }
  const data = await res.json();
  return data.text || "";
}

// Storage adapter — maps window.storage calls to backend /api/storage
window.storage = {
  async get(key, shared = false) {
    try {
      const res = await fetch("/api/storage/" + encodeURIComponent(key));
      if (!res.ok) throw new Error("not found");
      return res.json();
    } catch { throw new Error("Key not found: " + key); }
  },
  async set(key, value, shared = false) {
    const res = await fetch("/api/storage/" + encodeURIComponent(key), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value, shared }),
    });
    return res.json();
  },
  async delete(key, shared = false) {
    const res = await fetch("/api/storage/" + encodeURIComponent(key), { method: "DELETE" });
    return res.json();
  },
  async list(prefix = "", shared = false) {
    const res = await fetch("/api/storage?prefix=" + encodeURIComponent(prefix));
    return res.json();
  },
};


const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',sans-serif;background:#070B14;color:#E8EDF5;min-height:100vh}
  ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0D1525}::-webkit-scrollbar-thumb{background:#1E3A5F;border-radius:2px}
  .shell{display:flex;min-height:100vh}
  .sidebar{width:210px;min-height:100vh;background:#0A1120;border-right:1px solid #131F35;display:flex;flex-direction:column;flex-shrink:0;position:sticky;top:0;height:100vh;overflow-y:auto}
  .logo-wrap{padding:24px 18px 18px;border-bottom:1px solid #131F35}
  .logo{font-family:'Syne',sans-serif;font-weight:800;font-size:17px;color:#fff;letter-spacing:-0.5px}
  .logo-sub{font-size:9px;color:#00C9A7;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-top:3px}
  .nav{padding:14px 10px;flex:1;display:flex;flex-direction:column;gap:2px}
  .nav-lbl{font-size:9px;font-weight:600;letter-spacing:2px;color:#3A5070;text-transform:uppercase;padding:8px 8px 5px}
  .nav-btn{display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:400;color:#6B87A8;transition:all 0.15s;border:none;background:none;width:100%;text-align:left;font-family:'DM Sans',sans-serif}
  .nav-btn:hover{background:#111D30;color:#C5D4E8}
  .nav-btn.active{background:linear-gradient(135deg,#0F2A4A,#0A1E38);color:#fff;border:1px solid #1E3D6A}
  .nav-btn.active .ni{color:#00C9A7}
  .ni{font-size:14px;width:17px;text-align:center}
  .sfooter{padding:14px;border-top:1px solid #131F35;font-size:10px;color:#2A4060;text-align:center}
  .main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
  .topbar{height:58px;background:#090E1A;border-bottom:1px solid #131F35;display:flex;align-items:center;justify-content:space-between;padding:0 24px;flex-shrink:0}
  .page-title{font-family:'Syne',sans-serif;font-size:17px;font-weight:700;color:#fff}
  .topbar-right{display:flex;align-items:center;gap:10px}
  .btn{padding:7px 16px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:500;cursor:pointer;border:none;transition:all 0.15s}
  .btn-p{background:linear-gradient(135deg,#00C9A7,#00A88A);color:#060E1A;font-weight:600}
  .btn-p:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(0,201,167,0.3)}
  .btn-p:disabled{opacity:0.5;cursor:not-allowed;transform:none}
  .btn-g{background:transparent;color:#6B87A8;border:1px solid #1A2E48}
  .btn-g:hover{background:#111D30;color:#C5D4E8}
  .btn-d{background:#2A1020;color:#FF6B8A;border:1px solid #3A1830}
  .btn-d:hover{background:#3A1530}
  .btn-s{padding:5px 11px;font-size:11.5px}
  .body{flex:1;overflow-y:auto;padding:24px}
  .card{background:#0C1524;border:1px solid #131F35;border-radius:12px;padding:20px}
  .card-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
  .card-ttl{font-family:'Syne',sans-serif;font-size:13.5px;font-weight:700;color:#D0DFF0}
  .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
  .stat-card{background:#0C1524;border:1px solid #131F35;border-radius:12px;padding:18px;position:relative;overflow:hidden}
  .stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--acc,#00C9A7)}
  .stat-lbl{font-size:10px;color:#4A6580;font-weight:500;text-transform:uppercase;letter-spacing:1px}
  .stat-val{font-family:'Syne',sans-serif;font-size:30px;font-weight:800;color:#fff;margin:6px 0 3px}
  .stat-chg{font-size:11px;color:#00C9A7}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
  .grid-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}
  table{width:100%;border-collapse:collapse}
  th{text-align:left;font-size:10px;font-weight:600;color:#3A5070;text-transform:uppercase;letter-spacing:1px;padding:9px 13px;border-bottom:1px solid #131F35}
  td{padding:12px 13px;border-bottom:1px solid #0F1C2E;font-size:13px;color:#B0C4D8;vertical-align:middle}
  tr:hover td{background:#0F1C2E}
  tr:last-child td{border-bottom:none}
  .badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:20px;font-size:10.5px;font-weight:600}
  .bg{background:#062A1E;color:#00C9A7;border:1px solid #0A3A28}
  .bb{background:#061A35;color:#4A9EFF;border:1px solid #0A2545}
  .ba{background:#2A1A00;color:#F5A623;border:1px solid #3A2500}
  .br{background:#2A0A15;color:#FF6B8A;border:1px solid #3A1025}
  .bp{background:#1A0A2A;color:#B87AFF;border:1px solid #250F3A}
  .bgr{background:#121E2E;color:#6B87A8;border:1px solid #1A2A3E}
  .sbar-w{display:flex;align-items:center;gap:7px}
  .sbar-bg{flex:1;height:5px;background:#131F35;border-radius:3px;overflow:hidden}
  .sbar-fill{height:100%;border-radius:3px}
  .sbar-lbl{font-size:11px;font-weight:600;min-width:34px;text-align:right}
  .form-g{margin-bottom:14px}
  .form-lbl{display:block;font-size:11px;font-weight:500;color:#5A7A9A;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.5px}
  .form-inp,.form-ta,.form-sel{width:100%;background:#070D1A;border:1px solid #1A2E48;border-radius:8px;padding:9px 13px;color:#C5D4E8;font-family:'DM Sans',sans-serif;font-size:13px;outline:none;transition:border-color 0.15s}
  .form-inp:focus,.form-ta:focus,.form-sel:focus{border-color:#00C9A7;box-shadow:0 0 0 3px rgba(0,201,167,0.07)}
  .form-ta{resize:vertical;min-height:90px}
  .form-sel option{background:#0C1524}
  .dz{border:2px dashed #1A2E48;border-radius:12px;padding:44px 24px;text-align:center;cursor:pointer;transition:all 0.2s}
  .dz:hover,.dz.on{border-color:#00C9A7;background:rgba(0,201,167,0.03)}
  .dz-ico{font-size:32px;margin-bottom:10px}
  .dz-txt{font-size:14px;color:#5A7A9A}
  .dz-sub{font-size:11px;color:#3A5070;margin-top:5px}
  .ccard{background:#0C1524;border:1px solid #131F35;border-radius:12px;padding:16px;transition:border-color 0.15s}
  .ccard:hover{border-color:#1E3A5F}
  .ccard.sl{border-color:#0A3A28;background:linear-gradient(135deg,#0C1524,#071D14)}
  .chdr{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:11px}
  .cavatar{width:38px;height:38px;border-radius:9px;background:linear-gradient(135deg,#0F2A4A,#0A3A28);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;color:#00C9A7;font-family:'Syne',sans-serif;flex-shrink:0}
  .cname{font-weight:600;font-size:13.5px;color:#D0DFF0}
  .crole{font-size:11px;color:#4A6580;margin-top:2px}
  .cscores{margin:11px 0;display:flex;flex-direction:column;gap:6px}
  .score-row{display:flex;align-items:center;gap:7px}
  .score-row-lbl{font-size:10.5px;color:#4A6580;width:84px;flex-shrink:0}
  .cactions{display:flex;gap:5px;margin-top:12px;flex-wrap:wrap}
  .ats-ep{background:#070D1A;border:1px solid #131F35;border-radius:7px;padding:11px 14px;margin-bottom:8px;display:flex;align-items:center;gap:10px;font-family:monospace;font-size:11.5px}
  .mtag{font-size:9.5px;font-weight:700;padding:2px 7px;border-radius:4px;min-width:38px;text-align:center}
  .mg{background:#062A1E;color:#00C9A7}.mp{background:#061A35;color:#4A9EFF}.md{background:#2A0A15;color:#FF6B8A}
  .modal-ov{position:fixed;inset:0;background:rgba(5,8,18,0.85);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px}
  .modal{background:#0C1524;border:1px solid #1A2E48;border-radius:14px;padding:26px;max-width:560px;width:100%;max-height:85vh;overflow-y:auto}
  .modal-ttl{font-family:'Syne',sans-serif;font-size:17px;font-weight:700;color:#fff;margin-bottom:18px}
  .spinner{width:18px;height:18px;border:2px solid #1A2E48;border-top-color:#00C9A7;border-radius:50%;animation:spin 0.6s linear infinite;display:inline-block}
  @keyframes spin{to{transform:rotate(360deg)}}
  .ai-box{display:flex;align-items:center;gap:9px;background:#070D1A;border:1px solid #0A3A28;border-radius:9px;padding:13px 16px;color:#00C9A7;font-size:12.5px;margin:10px 0}
  .tags-r{display:flex;flex-wrap:wrap;gap:5px}
  .tag{font-size:10.5px;padding:2px 9px;background:#111D30;border:1px solid #1A2E48;border-radius:20px;color:#6B87A8}
  .empty{text-align:center;padding:56px 20px}
  .empty-ico{font-size:44px;margin-bottom:14px;opacity:0.35}
  .empty-txt{color:#4A6580;font-size:14px}
  .empty-sub{color:#2A4060;font-size:12px;margin-top:7px}
  .tabs{display:flex;gap:3px;margin-bottom:18px;border-bottom:1px solid #131F35}
  .tab{padding:9px 16px;font-size:13px;font-weight:500;color:#4A6580;cursor:pointer;border:none;background:none;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all 0.15s;font-family:'DM Sans',sans-serif}
  .tab:hover{color:#8AA8C8}
  .tab.active{color:#00C9A7;border-bottom-color:#00C9A7}
  .toast{position:fixed;bottom:22px;right:22px;background:#0C1524;border:1px solid #0A3A28;border-left:3px solid #00C9A7;border-radius:10px;padding:13px 17px;font-size:13px;color:#C5D4E8;z-index:2000;animation:si 0.2s ease;max-width:300px}
  @keyframes si{from{transform:translateX(18px);opacity:0}}
  @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
  .divider{border:none;border-top:1px solid #131F35;margin:18px 0}
`;

const SC = (v) => v >= 85 ? "#00C9A7" : v >= 70 ? "#F5A623" : "#FF6B8A";
const BC = (v) => v <= 15 ? "#00C9A7" : v <= 30 ? "#F5A623" : "#FF6B8A";

function SBar({ value, color }) {
  return (
    <div className="sbar-w">
      <div className="sbar-bg"><div className="sbar-fill" style={{ width: `${value}%`, background: color || SC(value) }} /></div>
      <span className="sbar-lbl" style={{ color: color || SC(value) }}>{value}%</span>
    </div>
  );
}

function Av({ name }) {
  return <div className="cavatar">{name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>;
}

function SBadge({ status }) {
  const m = { shortlisted: ["bg", "✦ Shortlisted"], reviewing: ["bb", "◈ Reviewing"], rejected: ["br", "✕ Rejected"], offered: ["bp", "★ Offered"], active: ["bg", "● Active"], paused: ["ba", "◎ Paused"] };
  const [c, l] = m[status] || ["bgr", status];
  return <span className={`badge ${c}`}>{l}</span>;
}

const JOBS = [
  { id: 1, title: "Senior React Developer", dept: "Engineering", location: "Remote", experience: "4-6 yrs", salary: "₹18-24 LPA", status: "active", created: "2025-02-10" },
  { id: 2, title: "Product Manager", dept: "Product", location: "Gurugram", experience: "3-5 yrs", salary: "₹20-28 LPA", status: "active", created: "2025-02-12" },
  { id: 3, title: "Data Engineer", dept: "Data", location: "Hybrid", experience: "2-4 yrs", salary: "₹12-18 LPA", status: "paused", created: "2025-02-14" },
];

const CANDS = [
  { id: 1, name: "Aryan Mehta", role: "React Developer", jobId: 1, email: "aryan.m@gmail.com", phone: "+91 98765 43210", skills: ["React", "TypeScript", "Node.js", "Redux", "AWS"], experience: "5 years", education: "B.Tech CSE, IIT Delhi", fitScore: 94, retentionScore: 88, salaryAlignment: 92, backoffChance: 8, status: "shortlisted", parsed: true, summary: "Strong frontend engineer with deep React expertise and 5 yrs at product startups." },
  { id: 2, name: "Priya Sharma", role: "React Developer", jobId: 1, email: "priya.s@outlook.com", phone: "+91 87654 32109", skills: ["React", "JavaScript", "GraphQL", "CSS", "Testing"], experience: "4 years", education: "M.Sc CS, BITS Pilani", fitScore: 87, retentionScore: 91, salaryAlignment: 85, backoffChance: 14, status: "reviewing", parsed: true, summary: "Detail-oriented developer with strong testing culture and open-source contributions." },
  { id: 3, name: "Karan Patel", role: "React Developer", jobId: 1, email: "karan.p@yahoo.com", phone: "+91 76543 21098", skills: ["React", "Vue", "Node.js", "MongoDB", "Docker"], experience: "6 years", education: "B.E CSE, NIT Trichy", fitScore: 79, retentionScore: 73, salaryAlignment: 78, backoffChance: 31, status: "reviewing", parsed: true, summary: "Full-stack developer with varied exp; currently at a MNC with counter-offer risk." },
  { id: 4, name: "Sneha Iyer", role: "Product Manager", jobId: 2, email: "sneha.iyer@gmail.com", phone: "+91 99876 54321", skills: ["Roadmapping", "User Research", "SQL", "Figma", "Agile"], experience: "4 years", education: "MBA, IIM Bangalore", fitScore: 92, retentionScore: 89, salaryAlignment: 96, backoffChance: 6, status: "shortlisted", parsed: true, summary: "Ex-Razorpay PM with strong data-driven product sense and mobile-first portfolio." },
  { id: 5, name: "Rohan Gupta", role: "Product Manager", jobId: 2, email: "rohan.g@gmail.com", phone: "+91 88765 43210", skills: ["B2B SaaS", "PRDs", "OKRs", "Growth", "Analytics"], experience: "3 years", education: "B.Tech + MBA, ISB", fitScore: 82, retentionScore: 80, salaryAlignment: 88, backoffChance: 18, status: "reviewing", parsed: true, summary: "Growth-focused PM with solid SaaS metrics experience; slightly junior but high potential." },
];

// ── DASHBOARD ──
function Dashboard({ jobs, candidates }) {
  const sl = candidates.filter(c => c.status === "shortlisted").length;
  const avgFit = candidates.length ? Math.round(candidates.reduce((a, c) => a + c.fitScore, 0) / candidates.length) : 0;
  const activity = [
    { ico: "🤖", txt: "AI parsed 3 resumes for Senior React Developer", t: "2m ago" },
    { ico: "✦", txt: "Aryan Mehta shortlisted — 94% fit score", t: "12m ago" },
    { ico: "📊", txt: "JD matching completed for Product Manager role", t: "1h ago" },
    { ico: "🔗", txt: "ATS sync triggered — 5 profiles exported", t: "3h ago" },
  ];
  return (
    <div>
      <div className="stats-row">
        {[
          { lbl: "Active JDs", val: jobs.filter(j => j.status === "active").length, chg: "+2 this week", ico: "📋", acc: "#4A9EFF" },
          { lbl: "Candidates", val: candidates.length, chg: `${candidates.filter(c => c.parsed).length} AI-parsed`, ico: "👥", acc: "#00C9A7" },
          { lbl: "Shortlisted", val: sl, chg: "Ready for client", ico: "✦", acc: "#B87AFF" },
          { lbl: "Avg Fit Score", val: `${avgFit}%`, chg: `${candidates.filter(c => c.backoffChance <= 15).length} low backoff`, ico: "🎯", acc: "#F5A623" },
        ].map((s, i) => (
          <div className="stat-card" key={i} style={{ "--acc": s.acc }}>
            <div style={{ fontSize: 20, marginBottom: 7 }}>{s.ico}</div>
            <div className="stat-lbl">{s.lbl}</div>
            <div className="stat-val">{s.val}</div>
            <div className="stat-chg">{s.chg}</div>
          </div>
        ))}
      </div>
      <div className="grid2">
        <div className="card">
          <div className="card-hdr"><span className="card-ttl">Top Shortlisted</span></div>
          {candidates.filter(c => c.status === "shortlisted").slice(0, 4).map(c => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderBottom: "1px solid #0F1C2E" }}>
              <Av name={c.name} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#D0DFF0" }}>{c.name}</div>
                <div style={{ fontSize: 11, color: "#4A6580" }}>{c.role}</div>
              </div>
              <SBar value={c.fitScore} />
            </div>
          ))}
          {candidates.filter(c => c.status === "shortlisted").length === 0 && <div style={{ color: "#3A5070", fontSize: 13, textAlign: "center", padding: 22 }}>No shortlisted candidates yet</div>}
        </div>
        <div className="card">
          <div className="card-hdr"><span className="card-ttl">Recent Activity</span></div>
          {activity.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 9, padding: "8px 0", borderBottom: i < activity.length - 1 ? "1px solid #0F1C2E" : "none" }}>
              <span style={{ fontSize: 15 }}>{a.ico}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "#8AAAC8" }}>{a.txt}</div>
                <div style={{ fontSize: 10, color: "#2A4060", marginTop: 2 }}>{a.t}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── JOBS ──
function Jobs({ jobs, setJobs, candidates, setToast }) {
  const [showModal, setShowModal] = useState(false);
  const [drag, setDrag] = useState(false);
  const [fileText, setFileText] = useState("");
  const [fileName, setFileName] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(null); // AI-extracted fields
  const [expandedId, setExpandedId] = useState(null);
  const fRef = useRef();

  function resetModal() {
    setFileText(""); setFileName(""); setExtracted(null); setExtracting(false);
  }

  function handleFile(file) {
    if (!file) return;
    setFileName(file.name);
    setExtracted(null);
    const reader = new FileReader();
    reader.onload = e => setFileText(e.target.result);
    reader.readAsText(file);
  }

  async function extractJD() {
    if (!fileText.trim()) return;
    setExtracting(true);
    setExtracted(null);
    try {
      const raw = await callClaude(
        `You are a recruitment analyst. Extract all key information from this Job Description document.
Return ONLY valid JSON with this exact shape:
{
  "title": "exact job title",
  "dept": "department or function",
  "location": "location / remote / hybrid",
  "experience": "e.g. 3-5 years",
  "salary": "salary range if mentioned, else 'Not specified'",
  "employmentType": "Full-time / Part-time / Contract",
  "requiredSkills": ["skill1", "skill2", "...all must-have skills"],
  "preferredSkills": ["nice-to-have skill1", "..."],
  "responsibilities": ["key responsibility 1", "key responsibility 2", "...up to 6"],
  "qualifications": ["qualification 1", "..."],
  "summary": "2-sentence summary of the role and ideal candidate"
}

Job Description:
${fileText.slice(0, 4000)}`,
        "You are a precise recruitment analyst. Extract only what is actually stated in the JD. Return ONLY valid JSON."
      );
      const data = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setExtracted(data);
    } catch {
      setToast("Extraction failed — check file content and retry");
    }
    setExtracting(false);
  }

  function saveJD() {
    if (!extracted) return;
    setJobs(p => [...p, {
      id: Date.now(),
      title: extracted.title,
      dept: extracted.dept,
      location: extracted.location,
      experience: extracted.experience,
      salary: extracted.salary,
      employmentType: extracted.employmentType,
      requiredSkills: extracted.requiredSkills,
      preferredSkills: extracted.preferredSkills,
      responsibilities: extracted.responsibilities,
      qualifications: extracted.qualifications,
      summary: extracted.summary,
      rawText: fileText,
      fileName,
      status: "active",
      created: new Date().toISOString().slice(0, 10),
    }]);
    setToast(`"${extracted.title}" JD saved`);
    setShowModal(false);
    resetModal();
  }

  return (
    <div>
      {/* ── MODAL ── */}
      {showModal && (
        <div className="modal-ov" onClick={e => e.target === e.currentTarget && (setShowModal(false), resetModal())}>
          <div className="modal" style={{ maxWidth: 660 }}>
            <div className="modal-ttl">Upload Job Description</div>

            {/* Drop zone */}
            {!fileText && (
              <div
                className={`dz ${drag ? "on" : ""}`}
                style={{ marginBottom: 16 }}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
                onClick={() => fRef.current.click()}
              >
                <div className="dz-ico">📋</div>
                <div className="dz-txt">Drop your JD file here or click to browse</div>
                <div className="dz-sub">TXT, PDF, DOC supported · AI will extract all details automatically</div>
                <input ref={fRef} type="file" style={{ display: "none" }} accept=".txt,.pdf,.doc,.docx"
                  onChange={e => handleFile(e.target.files[0])} />
              </div>
            )}

            {/* File loaded, not extracted yet */}
            {fileText && !extracted && !extracting && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: "#070D1A", border: "1px solid #1A2E48", borderRadius: 9, marginBottom: 14 }}>
                  <span style={{ fontSize: 20 }}>📄</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#D0DFF0", fontWeight: 500 }}>{fileName}</div>
                    <div style={{ fontSize: 11, color: "#3A5070" }}>{fileText.length.toLocaleString()} characters loaded</div>
                  </div>
                  <button className="btn btn-g btn-s" onClick={resetModal}>✕ Remove</button>
                </div>
                <button className="btn btn-p" style={{ width: "100%" }} onClick={extractJD}>
                  🤖 Extract JD Details with AI
                </button>
              </div>
            )}

            {/* Extracting */}
            {extracting && (
              <div style={{ padding: "24px 0" }}>
                <div className="ai-box" style={{ justifyContent: "center" }}>
                  <div className="spinner" />
                  AI is reading the JD and extracting skills, requirements, and role details…
                </div>
              </div>
            )}

            {/* Extracted preview */}
            {extracted && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 14 }}>✓</span>
                  <span style={{ fontSize: 12, color: "#00C9A7", fontWeight: 600 }}>Extraction complete — review and save</span>
                </div>

                {/* Editable core fields */}
                <div className="grid2">
                  {[["title","Job Title"],["dept","Department"],["location","Location"],["experience","Experience"],["salary","Salary Range"],["employmentType","Employment Type"]].map(([k, lbl]) => (
                    <div className="form-g" key={k}>
                      <label className="form-lbl">{lbl}</label>
                      <input className="form-inp" value={extracted[k] || ""} onChange={e => setExtracted(p => ({ ...p, [k]: e.target.value }))} />
                    </div>
                  ))}
                </div>

                {/* Required Skills */}
                <div className="form-g">
                  <label className="form-lbl">Required Skills <span style={{ color: "#3A5070", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>— click × to remove</span></label>
                  <div className="tags-r" style={{ padding: "10px", background: "#070D1A", border: "1px solid #1A2E48", borderRadius: 8, minHeight: 44 }}>
                    {extracted.requiredSkills?.map((s, i) => (
                      <span key={i} className="tag" style={{ cursor: "pointer", display: "inline-flex", gap: 5, alignItems: "center" }}
                        onClick={() => setExtracted(p => ({ ...p, requiredSkills: p.requiredSkills.filter((_, j) => j !== i) }))}>
                        {s} <span style={{ color: "#FF6B8A", fontSize: 10 }}>×</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Preferred Skills */}
                {extracted.preferredSkills?.length > 0 && (
                  <div className="form-g">
                    <label className="form-lbl">Preferred Skills</label>
                    <div className="tags-r" style={{ padding: "10px", background: "#070D1A", border: "1px solid #1A2E48", borderRadius: 8, minHeight: 44 }}>
                      {extracted.preferredSkills?.map((s, i) => (
                        <span key={i} className="tag" style={{ cursor: "pointer", display: "inline-flex", gap: 5, alignItems: "center", borderColor: "#1A2E48", color: "#4A6580" }}
                          onClick={() => setExtracted(p => ({ ...p, preferredSkills: p.preferredSkills.filter((_, j) => j !== i) }))}>
                          {s} <span style={{ color: "#FF6B8A", fontSize: 10 }}>×</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <button className="btn btn-p" onClick={saveJD}>Save JD</button>
                  <button className="btn btn-g" onClick={() => { setExtracted(null); }}>Re-extract</button>
                  <button className="btn btn-g" onClick={() => { setShowModal(false); resetModal(); }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TABLE ── */}
      <div className="card">
        <div className="card-hdr">
          <span className="card-ttl">Job Descriptions ({jobs.length})</span>
          <button className="btn btn-p btn-s" onClick={() => setShowModal(true)}>+ Upload JD</button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Role</th><th>Dept</th><th>Location</th><th>Exp</th>
                <th>Salary</th><th>Required Skills</th><th>Candidates</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(j => (
                <>
                  <tr key={j.id} style={{ cursor: j.requiredSkills ? "pointer" : "default" }}
                    onClick={() => setExpandedId(expandedId === j.id ? null : j.id)}>
                    <td style={{ color: "#D0DFF0", fontWeight: 500 }}>
                      {j.requiredSkills && <span style={{ fontSize: 10, color: "#3A5070", marginRight: 6 }}>{expandedId === j.id ? "▾" : "▸"}</span>}
                      {j.title}
                    </td>
                    <td>{j.dept}</td>
                    <td>{j.location}</td>
                    <td>{j.experience}</td>
                    <td>{j.salary}</td>
                    <td>
                      <div className="tags-r">
                        {j.requiredSkills?.slice(0, 3).map(s => <span key={s} className="tag" style={{ fontSize: 10 }}>{s}</span>)}
                        {j.requiredSkills?.length > 3 && <span className="tag" style={{ fontSize: 10 }}>+{j.requiredSkills.length - 3}</span>}
                        {!j.requiredSkills && <span style={{ color: "#2A4060", fontSize: 12 }}>—</span>}
                      </div>
                    </td>
                    <td><span style={{ color: "#4A9EFF", fontWeight: 600 }}>{candidates.filter(c => c.jobId === j.id).length}</span></td>
                    <td><SBadge status={j.status} /></td>
                  </tr>
                  {expandedId === j.id && j.requiredSkills && (
                    <tr key={`${j.id}-detail`}>
                      <td colSpan={8} style={{ background: "#070D1A", padding: "14px 18px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <div>
                            <div style={{ fontSize: 11, color: "#3A5070", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Required Skills</div>
                            <div className="tags-r">
                              {j.requiredSkills.map(s => <span key={s} className="tag" style={{ color: "#00C9A7", borderColor: "#0A3A28" }}>{s}</span>)}
                            </div>
                          </div>
                          {j.preferredSkills?.length > 0 && (
                            <div>
                              <div style={{ fontSize: 11, color: "#3A5070", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Preferred Skills</div>
                              <div className="tags-r">
                                {j.preferredSkills.map(s => <span key={s} className="tag">{s}</span>)}
                              </div>
                            </div>
                          )}
                          {j.summary && (
                            <div style={{ gridColumn: "1 / -1" }}>
                              <div style={{ fontSize: 11, color: "#3A5070", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Role Summary</div>
                              <div style={{ fontSize: 12.5, color: "#8AAAC8", lineHeight: 1.65 }}>{j.summary}</div>
                            </div>
                          )}
                          {j.responsibilities?.length > 0 && (
                            <div style={{ gridColumn: "1 / -1" }}>
                              <div style={{ fontSize: 11, color: "#3A5070", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Key Responsibilities</div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {j.responsibilities.map((r, i) => (
                                  <div key={i} style={{ fontSize: 12.5, color: "#8AAAC8", display: "flex", gap: 8 }}>
                                    <span style={{ color: "#1E3A5F", flexShrink: 0 }}>▸</span>{r}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {j.fileName && (
                            <div style={{ gridColumn: "1 / -1" }}>
                              <span style={{ fontSize: 11, color: "#2A4060" }}>📄 Source: {j.fileName}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── RESUME PARSER ──
function Parser({ jobs, setCandidates, setToast }) {
  const [text, setText] = useState("");
  const [jobId, setJobId] = useState(String(jobs[0]?.id || ""));
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(""); // "auditing" | "scoring"
  const [parsed, setParsed] = useState(null);
  const [drag, setDrag] = useState(false);
  const fRef = useRef();

  async function parse() {
    if (!text.trim()) return;
    setLoading(true); setParsed(null);
    try {
      const job = jobs.find(j => String(j.id) === String(jobId));
      const resumeSnip = text.slice(0, 2500);
      const jobDesc = job?.title || "Not specified";
      const requiredSkillsLine = job?.requiredSkills?.length
        ? `\nRequired skills from JD: ${job.requiredSkills.join(", ")}`
        : "";
      const preferredSkillsLine = job?.preferredSkills?.length
        ? `\nPreferred skills from JD: ${job.preferredSkills.join(", ")}`
        : "";

      // ── STAGE 1: Extract facts + audit gaps (chain-of-thought, NO scores yet) ──
      setStage("auditing");
      const auditRaw = await callClaude(
        `You are a strict recruitment analyst. Your job is to EXTRACT facts from this resume and identify GAPS vs the job.

JOB: ${jobDesc}${requiredSkillsLine}${preferredSkillsLine}
RESUME:
${resumeSnip}

Return ONLY valid JSON:
{
  "name": "Full Name",
  "email": "email or unknown",
  "phone": "phone or unknown",
  "role": "candidate's current/most recent role",
  "experience": "X years total",
  "education": "Degree, Institution",
  "skills": ["verified skill 1", "verified skill 2", "...up to 8 skills ACTUALLY mentioned in resume"],
  "currentEmployer": "company name or unknown",
  "currentSalary": "salary if mentioned or unknown",
  "noticePeriod": "notice period if mentioned or unknown",
  "summary": "2 factual sentences about their background — no spin",
  "gapAnalysis": {
    "missingRequiredSkills": ["skill that job needs but resume lacks"],
    "experienceGap": "e.g. job wants 4-6 yrs, candidate has 2 yrs — or 'none'",
    "seniorityMismatch": "over/under-qualified or 'none'",
    "industryMismatch": "different industry background or 'none'",
    "redFlags": ["e.g. job hopping (3 jobs in 2 yrs)", "unexplained gap", "or empty array"]
  }
}

IMPORTANT: Only list skills explicitly mentioned in the resume. Do not infer or assume.`,
        "You are a precise, skeptical recruitment analyst. Extract only what is actually stated. Return ONLY valid JSON."
      );

      const audit = JSON.parse(auditRaw.replace(/```json|```/g, "").trim());

      // ── STAGE 2: Score using audit as input — strict rubric, conservative baseline ──
      setStage("scoring");
      const scoreRaw = await callClaude(
        `You are a calibrated scoring engine. Score this candidate using STRICT rubrics. Scores cluster around 60–75 for average matches. Only exceptional candidates score above 85. Mediocre matches score below 55.

JOB: ${jobDesc}${requiredSkillsLine}${preferredSkillsLine}
CANDIDATE AUDIT:
${JSON.stringify(audit, null, 2)}

SCORING RUBRICS (start each score at 50, adjust up/down):

FIT SCORE — measures skill + experience match:
  +20 if all required skills present
  +10 if experience range matches exactly
  +5 if education is relevant
  -15 for each missing critical skill
  -10 if experience is under required minimum
  -5 for seniority mismatch
  -5 per red flag

RETENTION SCORE — likelihood candidate stays 18+ months:
  Start at 65
  +15 if current employer is smaller/less prestigious (likely to stay)
  +10 if notice period suggests commitment
  -20 if 3+ jobs in 4 years (job hopper)
  -10 if overqualified (likely to leave for better role)
  -10 if coming from much larger company (culture shock risk)
  -5 per unexplained gap

SALARY ALIGNMENT — does their expectation match the JD range:
  Start at 70
  +20 if current salary or expectation matches JD range
  -25 if likely earning significantly more than JD offers
  -15 if unclear but seniority suggests mismatch
  0 if unknown (leave at 65)

BACKOFF CHANCE — probability they decline our offer (0=very likely to accept, 100=very likely to decline):
  Start at 20
  +25 if currently at a top-tier company (competing offers likely)
  +20 if overqualified
  +15 if no mention of job search urgency
  +10 per competing red flag
  -15 if unemployed or on short notice
  -10 if explicitly seeking change

Return ONLY valid JSON:
{
  "fitScore": <integer 0-100>,
  "retentionScore": <integer 0-100>,
  "salaryAlignment": <integer 0-100>,
  "backoffChance": <integer 0-100>,
  "fitReason": "specific 1-sentence reason citing actual gaps or strengths",
  "backoffReason": "specific 1-sentence reason for accept/decline risk",
  "confidenceNote": "1 sentence on data quality — e.g. 'Salary unknown, alignment estimated'"
}`,
        "You are a calibrated, strict scoring engine. Never inflate scores. Return ONLY valid JSON."
      );

      const scores = JSON.parse(scoreRaw.replace(/```json|```/g, "").trim());

      setParsed({
        ...audit,
        ...scores,
        jobId: Number(jobId),
        id: Date.now(),
        status: "reviewing",
        parsed: true,
        gapAnalysis: audit.gapAnalysis,
      });
    } catch (e) {
      setToast("Parse failed — check resume text and retry");
    }
    setLoading(false);
    setStage("");
  }

  function addToPool() {
    setCandidates(p => [...p, parsed]);
    setToast(`${parsed.name} added to candidate pool`);
    setParsed(null); setText("");
  }

  return (
    <div className="grid2" style={{ alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card">
          <div className="card-ttl" style={{ marginBottom: 14 }}>Upload Resume</div>
          <div className={`dz ${drag ? "on" : ""}`}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); const r = new FileReader(); r.onload = ev => setText(ev.target.result); r.readAsText(e.dataTransfer.files[0]); }}
            onClick={() => fRef.current.click()}>
            <div className="dz-ico">📄</div>
            <div className="dz-txt">Drop resume or click to browse</div>
            <div className="dz-sub">TXT files supported for parsing</div>
            <input ref={fRef} type="file" style={{ display: "none" }} accept=".txt"
              onChange={e => { const r = new FileReader(); r.onload = ev => setText(ev.target.result); r.readAsText(e.target.files[0]); }} />
          </div>
        </div>
        <div className="card">
          <div className="card-ttl" style={{ marginBottom: 12 }}>Paste Resume Text</div>
          <div className="form-g">
            <label className="form-lbl">Match Against Job</label>
            <select className="form-sel" value={jobId} onChange={e => setJobId(e.target.value)}>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>
          <div className="form-g">
            <label className="form-lbl">Resume Content</label>
            <textarea className="form-ta" rows={7} value={text} onChange={e => setText(e.target.value)} placeholder="Paste candidate's resume here..." />
          </div>
          <button className="btn btn-p" onClick={parse} disabled={loading || !text.trim()}>
            {loading ? "Parsing…" : "🤖 AI Parse & Match"}
          </button>
        </div>
      </div>

      <div>
        {loading && (
          <div className="card">
            <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: 12, padding: "8px 0" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#D0DFF0", marginBottom: 4 }}>
                Two-Stage Accuracy Pipeline
              </div>
              {[
                { key: "auditing", ico: "🔍", label: "Stage 1 — Fact extraction & gap audit", sub: "Identifying missing skills, red flags, experience gaps" },
                { key: "scoring", ico: "📊", label: "Stage 2 — Calibrated scoring", sub: "Applying strict rubrics from conservative baseline" },
              ].map(s => {
                const isDone = (s.key === "auditing" && stage === "scoring");
                const isActive = stage === s.key;
                const isPending = !isDone && !isActive;
                return (
                  <div key={s.key} style={{ display: "flex", gap: 12, padding: "12px 14px", borderRadius: 9, background: isActive ? "#071A10" : isDone ? "#060F08" : "#070D1A", border: `1px solid ${isActive ? "#0A3A28" : isDone ? "#083020" : "#131F35"}` }}>
                    <span style={{ fontSize: 18, opacity: isPending ? 0.3 : 1 }}>{s.ico}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: isActive ? "#00C9A7" : isDone ? "#4A7A60" : "#3A5070" }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: "#2A4060", marginTop: 3 }}>{s.sub}</div>
                    </div>
                    {isActive && <div className="spinner" style={{ flexShrink: 0, marginTop: 2 }} />}
                    {isDone && <span style={{ color: "#00C9A7", fontSize: 14 }}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {parsed ? (
          <div className="card">
            <div className="card-hdr">
              <span className="card-ttl">Parse Results</span>
              <span className="badge bg">✓ 2-Stage Analysis</span>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
              <Av name={parsed.name} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "Syne,sans-serif" }}>{parsed.name}</div>
                <div style={{ fontSize: 11, color: "#4A6580", marginTop: 2 }}>{parsed.email} · {parsed.phone}</div>
                <div style={{ fontSize: 11, color: "#4A6580" }}>{parsed.experience} · {parsed.education}</div>
              </div>
            </div>

            <div style={{ fontSize: 13, color: "#8AAAC8", marginBottom: 13, lineHeight: 1.65 }}>{parsed.summary}</div>

            <div className="tags-r" style={{ marginBottom: 14 }}>
              {parsed.skills?.map(s => <span key={s} className="tag">{s}</span>)}
            </div>

            {/* Gap Analysis */}
            {parsed.gapAnalysis && (
              <div style={{ background: "#070D1A", border: "1px solid #1A2E48", borderRadius: 9, padding: "12px 14px", marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#5A7A9A", textTransform: "uppercase", letterSpacing: 1, marginBottom: 9 }}>Gap Audit</div>
                {parsed.gapAnalysis.missingRequiredSkills?.length > 0 && (
                  <div style={{ marginBottom: 7 }}>
                    <span style={{ fontSize: 11, color: "#FF6B8A" }}>Missing skills: </span>
                    <span style={{ fontSize: 11, color: "#8AAAC8" }}>{parsed.gapAnalysis.missingRequiredSkills.join(", ")}</span>
                  </div>
                )}
                {parsed.gapAnalysis.experienceGap && parsed.gapAnalysis.experienceGap !== "none" && (
                  <div style={{ marginBottom: 7 }}>
                    <span style={{ fontSize: 11, color: "#F5A623" }}>Exp gap: </span>
                    <span style={{ fontSize: 11, color: "#8AAAC8" }}>{parsed.gapAnalysis.experienceGap}</span>
                  </div>
                )}
                {parsed.gapAnalysis.redFlags?.length > 0 && (
                  <div>
                    <span style={{ fontSize: 11, color: "#FF6B8A" }}>⚑ </span>
                    <span style={{ fontSize: 11, color: "#8AAAC8" }}>{parsed.gapAnalysis.redFlags.join(" · ")}</span>
                  </div>
                )}
                {parsed.gapAnalysis.missingRequiredSkills?.length === 0 && parsed.gapAnalysis.redFlags?.length === 0 && parsed.gapAnalysis.experienceGap === "none" && (
                  <div style={{ fontSize: 11, color: "#00C9A7" }}>✓ No significant gaps detected</div>
                )}
              </div>
            )}

            {[["Job Fit", parsed.fitScore], ["Retention", parsed.retentionScore], ["Salary Fit", parsed.salaryAlignment]].map(([lbl, v]) => (
              <div key={lbl} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: "#4A6580", marginBottom: 4 }}>{lbl}</div>
                <SBar value={v} />
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "10px 0 12px", padding: "9px 13px", background: "#070D1A", borderRadius: 8, border: "1px solid #1A2E48" }}>
              <span style={{ fontSize: 12, color: "#6B87A8" }}>Backoff Risk</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: BC(parsed.backoffChance) }}>{parsed.backoffChance}%</span>
            </div>

            {parsed.fitReason && <div style={{ fontSize: 11.5, color: "#5A7A9A", marginBottom: 5 }}>💡 {parsed.fitReason}</div>}
            {parsed.backoffReason && <div style={{ fontSize: 11.5, color: "#5A7A9A", marginBottom: 5 }}>⚠️ {parsed.backoffReason}</div>}
            {parsed.confidenceNote && <div style={{ fontSize: 11, color: "#3A5070", marginBottom: 14, fontStyle: "italic" }}>ℹ {parsed.confidenceNote}</div>}

            <div style={{ display: "flex", gap: 7 }}>
              <button className="btn btn-p" onClick={addToPool}>+ Add to Pool</button>
              <button className="btn btn-g btn-s" onClick={() => setParsed(null)}>Discard</button>
            </div>
          </div>
        ) : !loading ? (
          <div className="card"><div className="empty">
            <div className="empty-ico">🤖</div>
            <div className="empty-txt">Two-Stage Scoring Ready</div>
            <div className="empty-sub">Stage 1 audits facts and gaps. Stage 2 applies strict rubrics from a conservative baseline — no score inflation.</div>
          </div></div>
        ) : null}
      </div>
    </div>
  );
}

// ── SHORTLIST ──
function Shortlist({ candidates, setCandidates, jobs, setToast }) {
  const [jobFilter, setJobFilter] = useState("all");
  const [sortBy, setSortBy] = useState("fitScore");
  const [insight, setInsight] = useState(null);
  const [loadIns, setLoadIns] = useState(false);

  const filtered = candidates
    .filter(c => jobFilter === "all" || c.jobId === Number(jobFilter))
    .sort((a, b) => sortBy === "fitScore" ? b.fitScore - a.fitScore : sortBy === "backoffChance" ? a.backoffChance - b.backoffChance : b.retentionScore - a.retentionScore);

  function upd(id, status) {
    setCandidates(p => p.map(c => c.id === id ? { ...c, status } : c));
    setToast(`Status → ${status}`);
  }

  async function getInsight(c) {
    setLoadIns(true); setInsight(null);
    try {
      const txt = await callClaude(`Give a 3-sentence strategic hiring recommendation for: ${c.name}, ${c.experience}, skills: ${c.skills?.join(", ")}. Fit: ${c.fitScore}%, Retention: ${c.retentionScore}%, Backoff Risk: ${c.backoffChance}%. ${c.summary} Focus on: hire/pass recommendation, retention tip, risk.`);
      setInsight({ txt, name: c.name });
    } catch { setInsight({ txt: "Could not generate insight.", name: c.name }); }
    setLoadIns(false);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <select className="form-sel" style={{ width: "auto" }} value={jobFilter} onChange={e => setJobFilter(e.target.value)}>
          <option value="all">All Roles</option>
          {jobs.filter(j => candidates.some(c => c.jobId === j.id)).map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
        <select className="form-sel" style={{ width: "auto" }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="fitScore">Sort: Fit Score</option>
          <option value="backoffChance">Sort: Lowest Backoff</option>
          <option value="retention">Sort: Retention</option>
        </select>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#3A5070", alignSelf: "center" }}>{filtered.length} candidates</span>
      </div>

      {insight && (
        <div style={{ background: "#071A10", border: "1px solid #0A3A28", borderRadius: 10, padding: "15px 18px", marginBottom: 18 }}>
          <div style={{ fontSize: 11.5, color: "#00C9A7", fontWeight: 600, marginBottom: 6 }}>🤖 AI Insight — {insight.name}</div>
          <div style={{ fontSize: 13, color: "#8AAAC8", lineHeight: 1.7 }}>{insight.txt}</div>
          <button className="btn btn-g btn-s" style={{ marginTop: 9 }} onClick={() => setInsight(null)}>Dismiss</button>
        </div>
      )}
      {loadIns && <div className="ai-box"><div className="spinner" />Generating AI insight…</div>}

      {filtered.length === 0 ? (
        <div className="card"><div className="empty"><div className="empty-ico">👥</div><div className="empty-txt">No candidates yet</div><div className="empty-sub">Parse resumes to populate the candidate pool</div></div></div>
      ) : (
        <div className="grid-cards">
          {filtered.map(c => (
            <div key={c.id} className={`ccard ${c.status === "shortlisted" ? "sl" : ""}`}>
              <div className="chdr">
                <div style={{ display: "flex", gap: 11 }}>
                  <Av name={c.name} />
                  <div>
                    <div className="cname">{c.name}</div>
                    <div className="crole">{c.role} · {c.experience}</div>
                    <div style={{ fontSize: 10, color: "#2A4060", marginTop: 2 }}>{c.email}</div>
                  </div>
                </div>
                <SBadge status={c.status} />
              </div>
              <div className="tags-r" style={{ marginBottom: 11 }}>
                {c.skills?.slice(0, 4).map(s => <span key={s} className="tag">{s}</span>)}
                {c.skills?.length > 4 && <span className="tag">+{c.skills.length - 4}</span>}
              </div>
              <div className="cscores">
                {[["Job Fit", c.fitScore], ["Retention", c.retentionScore], ["Salary Fit", c.salaryAlignment]].map(([lbl, v]) => (
                  <div key={lbl} className="score-row">
                    <span className="score-row-lbl">{lbl}</span>
                    <SBar value={v} />
                  </div>
                ))}
                <div className="score-row">
                  <span className="score-row-lbl">Backoff Risk</span>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 7 }}>
                    <div className="sbar-bg"><div className="sbar-fill" style={{ width: `${c.backoffChance}%`, background: BC(c.backoffChance) }} /></div>
                    <span className="sbar-lbl" style={{ color: BC(c.backoffChance) }}>{c.backoffChance}%</span>
                  </div>
                </div>
              </div>
              <div className="cactions">
                {c.status !== "shortlisted" && <button className="btn btn-p btn-s" onClick={() => upd(c.id, "shortlisted")}>✦ Shortlist</button>}
                {c.status !== "offered" && <button className="btn btn-g btn-s" onClick={() => upd(c.id, "offered")}>★ Offered</button>}
                <button className="btn btn-g btn-s" onClick={() => getInsight(c)} title="AI Insight">🤖</button>
                <button className="btn btn-d btn-s" onClick={() => upd(c.id, "rejected")}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ATS ──
function ATS({ candidates, jobs, setToast }) {
  const [tab, setTab] = useState("endpoints");
  const [webhook, setWebhook] = useState("https://your-ats.com/webhooks/vayuz");
  const apiKey = "vayuz_live_sk_" + "x".repeat(20);
  const eps = [
    { m: "GET", p: "/api/v1/candidates", d: "List all candidates with scores" },
    { m: "GET", p: "/api/v1/candidates/:id", d: "Get single candidate" },
    { m: "POST", p: "/api/v1/candidates/import", d: "Import from ATS" },
    { m: "POST", p: "/api/v1/parse", d: "AI parse & score resume" },
    { m: "GET", p: "/api/v1/jobs", d: "List job descriptions" },
    { m: "POST", p: "/api/v1/jobs", d: "Create a new JD" },
    { m: "GET", p: "/api/v1/shortlist/:jobId", d: "Ranked shortlist for JD" },
    { m: "DELETE", p: "/api/v1/candidates/:id", d: "Remove candidate" },
  ];
  const mc = { GET: "mg", POST: "mp", DELETE: "md" };
  const sl = candidates.filter(c => c.status === "shortlisted");

  function exportJSON() {
    const blob = new Blob([JSON.stringify(sl.map(c => ({ id: c.id, name: c.name, email: c.email, scores: { fit: c.fitScore, retention: c.retentionScore, backoffRisk: c.backoffChance } })), null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "vayuz_shortlist.json"; a.click();
    setToast(`${sl.length} candidates exported`);
  }

  return (
    <div>
      <div className="tabs">
        {["endpoints", "webhooks", "export"].map(t => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {{ endpoints: "API Endpoints", webhooks: "Webhooks", export: "Export" }[t]}
          </button>
        ))}
      </div>
      {tab === "endpoints" && (
        <div className="card">
          <div className="card-hdr"><span className="card-ttl">REST API Endpoints</span><span className="badge bb">Base: api.vayuz.com</span></div>
          <div className="form-g">
            <label className="form-lbl">API Key</label>
            <div style={{ display: "flex", gap: 7 }}>
              <input className="form-inp" value={apiKey} readOnly style={{ fontFamily: "monospace", fontSize: 11 }} />
              <button className="btn btn-g btn-s" onClick={() => { navigator.clipboard?.writeText(apiKey); setToast("Copied"); }}>Copy</button>
            </div>
          </div>
          <hr className="divider" />
          {eps.map((ep, i) => (
            <div key={i} className="ats-ep">
              <span className={`mtag ${mc[ep.m]}`}>{ep.m}</span>
              <code style={{ flex: 1, color: "#C5D4E8" }}>{ep.p}</code>
              <span style={{ fontSize: 11, color: "#3A5070" }}>{ep.d}</span>
            </div>
          ))}
        </div>
      )}
      {tab === "webhooks" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <div className="card-ttl" style={{ marginBottom: 14 }}>Webhook Configuration</div>
            <div className="form-g">
              <label className="form-lbl">Webhook URL</label>
              <input className="form-inp" value={webhook} onChange={e => setWebhook(e.target.value)} />
            </div>
            <div className="form-g">
              <label className="form-lbl">Subscribe to Events</label>
              {["candidate.shortlisted","candidate.offered","candidate.rejected","resume.parsed","job.created"].map(ev => (
                <label key={ev} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer" }}>
                  <input type="checkbox" defaultChecked={ev.includes("shortlisted") || ev.includes("parsed")} />
                  <span style={{ fontSize: 12.5, color: "#8AAAC8", fontFamily: "monospace" }}>{ev}</span>
                </label>
              ))}
            </div>
            <button className="btn btn-p" onClick={() => setToast("Webhook saved")}>Save Webhook</button>
          </div>
          <div className="card">
            <div className="card-ttl" style={{ marginBottom: 12 }}>Sample Payload</div>
            <pre style={{ background: "#070D1A", borderRadius: 8, padding: 14, fontSize: 11, color: "#8AAAC8", fontFamily: "monospace", overflow: "auto", lineHeight: 1.6 }}>
{`{
  "event": "candidate.shortlisted",
  "timestamp": "${new Date().toISOString()}",
  "candidate": {
    "id": 1001, "name": "Aryan Mehta",
    "scores": { "fit": 94, "backoff_risk": 8 }
  }
}`}
            </pre>
          </div>
        </div>
      )}
      {tab === "export" && (
        <div className="card">
          <div className="card-ttl" style={{ marginBottom: 14 }}>Export & Sync</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
            {[
              { ico: "📦", lbl: "Export Shortlist JSON", desc: `${sl.length} shortlisted candidates`, fn: exportJSON },
              { ico: "📊", lbl: "Export to CSV", desc: "All candidates with scores", fn: () => setToast("CSV export coming soon") },
              { ico: "🌿", lbl: "Sync to Greenhouse", desc: "Push shortlist to Greenhouse ATS", fn: () => setToast("Greenhouse sync initiated…") },
              { ico: "🔗", lbl: "Sync to Lever", desc: "Push shortlist to Lever", fn: () => setToast("Lever sync initiated…") },
              { ico: "☁️", lbl: "Sync to Workday", desc: "Export to Workday Recruiting", fn: () => setToast("Workday sync initiated…") },
              { ico: "✉️", lbl: "Email Report", desc: "Send shortlist to client", fn: () => setToast("Report emailed to client") },
            ].map((item, i) => (
              <button key={i} onClick={item.fn} style={{ textAlign: "left", cursor: "pointer", background: "#0C1524", border: "1px solid #131F35", borderRadius: 11, padding: 16 }}>
                <div style={{ fontSize: 19, marginBottom: 7 }}>{item.ico}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#D0DFF0", marginBottom: 3 }}>{item.lbl}</div>
                <div style={{ fontSize: 11, color: "#3A5070" }}>{item.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ── AI SCREENING (Voice-Enabled) ──────────────────────────────────────────────
function Screening({ candidates, setCandidates, jobs, setToast }) {
  const [subview, setSubview] = useState("rounds");
  const [rounds, setRounds] = useState([]);
  const [activeRound, setActiveRound] = useState(null);
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [screeningSession, setScreeningSession] = useState(null);
  const [report, setReport] = useState(null);

  // Setup state
  const [setupJobId, setSetupJobId] = useState(String(jobs[0]?.id || ""));
  const [setupQuestions, setSetupQuestions] = useState("");
  const [setupThreshold, setSetupThreshold] = useState(70);
  const [generatingQs, setGeneratingQs] = useState(false);

  // Live session state
  const [messages, setMessages] = useState([]);
  const [sessionDone, setSessionDone] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [recording, setRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [voiceError, setVoiceError] = useState("");

  const chatRef = useRef();
  const recognitionRef = useRef(null);
  const sessionRef = useRef(null); // keep latest session in ref for async callbacks

  const shortlisted = candidates.filter(c => c.status === "shortlisted");

  const scrollChat = () =>
    setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }), 80);

  // ── TTS: AI speaks ──
  function speak(text, onEnd) {
    if (!window.speechSynthesis) { onEnd?.(); return; }
    window.speechSynthesis.cancel();
    const clean = text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/#{1,3} /g, "");
    const utt = new SpeechSynthesisUtterance(clean);
    utt.rate = 0.95; utt.pitch = 1.05; utt.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes("Samantha") || v.name.includes("Google UK") || v.name.includes("Karen") || v.lang === "en-US");
    if (preferred) utt.voice = preferred;
    utt.onend = () => { setAiSpeaking(false); onEnd?.(); };
    utt.onerror = () => { setAiSpeaking(false); onEnd?.(); };
    setAiSpeaking(true);
    window.speechSynthesis.speak(utt);
  }

  // ── STT: Candidate records voice ──
    const _accRef = useRef("");

  function startRecording() {
    setVoiceError("");
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setVoiceError("Use Chrome or Edge for voice recording."); return; }
    _accRef.current = "";
    setFinalTranscript(""); setLiveTranscript("");
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-IN";
    recognitionRef.current = rec;
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) _accRef.current += t + " ";
        else interim = t;
      }
      setFinalTranscript(_accRef.current);
      setLiveTranscript(interim);
    };
    rec.onerror = (e) => {
      setRecording(false);
      if (e.error === "not-allowed") setVoiceError("Mic blocked — click the camera/mic icon in your browser bar and Allow, then retry.");
      else if (e.error === "no-speech") setVoiceError("No speech detected. Check your mic and try again.");
      else setVoiceError("Voice error: " + e.error);
    };
    rec.onend = () => setRecording(false);
    rec.start();
    setRecording(true);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setRecording(false);
    setLiveTranscript("");
    if (_accRef.current) setFinalTranscript(f => f || _accRef.current);
  }

  // ── GENERATE Qs FROM JD ──
  async function generateQuestions() {
    const job = jobs.find(j => String(j.id) === String(setupJobId));
    if (!job) return;
    setGeneratingQs(true);
    try {
      const raw = await callClaude(
        `You are a senior technical recruiter. Generate a focused telephonic screening questionnaire for this role.

Role: ${job.title}
Required Skills: ${job.requiredSkills?.join(", ") || "Not specified"}
Experience: ${job.experience || "Not specified"}

Generate exactly 6 questions covering:
- 1 question on motivation / reason for change
- 2-3 questions on core technical skills from the JD
- 1 question on a past project or achievement
- 1 question on availability / notice period

Return ONLY a plain list, one question per line, no numbering, no JSON.`,
        "You are a senior recruiter. Return ONLY plain text questions, one per line."
      );
      setSetupQuestions(raw.trim());
      setToast(`Questions generated for ${job.title}`);
    } catch(err) { console.error("generateQuestions error:", err); setToast("Generation failed: " + (err?.message || "try again")); }
    setGeneratingQs(false);
  }

  // ── SAVE ROUND ──
  async function saveRound() {
    const job = jobs.find(j => String(j.id) === String(setupJobId));
    const validLines = setupQuestions.trim().split("\n").filter(q => q.trim().length > 5);
    if (!job || validLines.length === 0) { setToast("Add at least one question first"); return; }
    const qs = validLines
      .map((q, i) => ({ id: i + 1, question: q.replace(/^\d+[\.\)\-]\s*/, "").trim(), weight: 0 }));
    const base = Math.floor(100 / qs.length);
    qs.forEach((q, i) => q.weight = i === qs.length - 1 ? 100 - base * (qs.length - 1) : base);

    const roundId = String(Date.now());
    const round = {
      id: roundId,
      jobId: Number(setupJobId),
      jobTitle: job?.title || "Unknown",
      questions: qs,
      passThreshold: Number(setupThreshold),
      createdAt: new Date().toISOString(),
      screened: [],
    };

    // Persist to shared storage so candidate link works across sessions
    try { await window.storage.set("round_" + roundId, JSON.stringify(round), true); }
    catch(e) { console.warn("Storage unavailable:", e); }

    setRounds(p => [...p, round]);
    setToast("Screening round saved for " + (job?.title || "role"));
    setSubview("rounds");
  }

  function copyLink(roundId, doPreview) {
    const base = window.location.href.split("#")[0];
    const link = base + "#screen-" + roundId;
    if (doPreview) {
      // Preview candidate portal in-app (for demo/artifact environment)
      window.location.hash = "#screen-" + roundId;
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link)
        .then(() => setToast("Candidate link copied to clipboard!"))
        .catch(() => setToast("Link: " + link));
    } else {
      setToast("Link: " + link);
    }
  }

  // ── START SCREENING ──
  function startScreening(round, candidate) {
    setActiveRound(round);
    setActiveCandidate(candidate);
    setMessages([]);
    setSessionDone(false);
    setScoring(false);
    setFinalTranscript("");
    setLiveTranscript("");
    setVoiceError("");
    const session = { qIndex: 0, answers: [], startTime: Date.now(), transcript: [] };
    setScreeningSession(session);
    sessionRef.current = session;
    setSubview("live");

    const openingText = `Hi ${candidate.name}! Welcome to your screening interview for the ${round.jobTitle} role at VAYUZ Technologies. I'll be your AI interviewer today. We have ${round.questions.length} questions — please answer each one clearly after I finish speaking. Click the microphone button to start recording your answer, then click Stop when you're done. Let's begin. ${round.questions[0]?.question}`;

    const openingMsg = { role: "ai", text: `Hi **${candidate.name}**! 👋 Welcome to your screening for **${round.jobTitle}**.\n\nI have **${round.questions.length} questions** for you. After I ask each question, click **🎙 Record** to answer by voice. Click **⏹ Stop** when done.\n\n**Q1 of ${round.questions.length}:** ${round.questions[0]?.question}`, ts: Date.now() };
    setMessages([openingMsg]);
    scrollChat();
    setTimeout(() => speak(openingText, null), 400);
  }

  // ── SUBMIT VOICE ANSWER ──
  async function submitAnswer() {
    // Read from ref (not state) to avoid race condition after stopRecording
    const answer = (accumulatedRef.current + " " + liveTranscript).trim() || finalTranscript.trim();
    if (!answer || answer.length < 3) { setVoiceError("No speech detected. Click Record, speak your answer, then click Stop."); return; }

    stopRecording();
    window.speechSynthesis?.cancel();

    const session = sessionRef.current;
    const qIndex = session.qIndex;
    const currentQ = activeRound.questions[qIndex];
    const nextIndex = qIndex + 1;
    const isLast = nextIndex >= activeRound.questions.length;

    // Add candidate voice answer to chat
    const answerMsg = { role: "candidate", text: answer, ts: Date.now(), isVoice: true };
    setMessages(p => [...p, answerMsg]);
    setFinalTranscript("");
    setLiveTranscript("");
    scrollChat();

    const updatedAnswers = [...session.answers, {
      questionId: currentQ.id, question: currentQ.question,
      answer, weight: currentQ.weight
    }];
    const updatedTranscript = [...(session.transcript || []),
      `Q${qIndex + 1}: ${currentQ.question}`, `A: ${answer}`
    ];

    const newSession = { ...session, qIndex: nextIndex, answers: updatedAnswers, transcript: updatedTranscript };
    setScreeningSession(newSession);
    sessionRef.current = newSession;

    if (isLast) {
      const closeText = "Thank you for completing the screening. Your responses have been recorded and will be reviewed by our team. We'll be in touch soon.";
      const closeMsg = { role: "ai", text: `✅ **Screening complete!** Thank you **${activeCandidate.name}** — all ${activeRound.questions.length} questions answered.\n\nYour responses are being scored. We'll be in touch soon.`, ts: Date.now() };
      setMessages(p => [...p, closeMsg]);
      setSessionDone(true);
      speak(closeText, null);
      scrollChat();
      return;
    }

    // AI transition + next question
    setAiSpeaking(true);
    try {
      const transitionRaw = await callClaude(
        `You are a professional AI interviewer. The candidate just answered a screening question.
Question: "${currentQ.question}"
Answer (transcribed voice): "${answer.slice(0, 300)}"
Next question: "${activeRound.questions[nextIndex].question}"

Write ONE short natural transition sentence (max 12 words), then ask the next question verbatim. No evaluation, no scoring, just a smooth handoff. Return plain text only.`,
        "You are a professional interviewer. Return plain text only, no formatting."
      );

      const fullText = `${transitionRaw}`;
      const aiMsg = { role: "ai", text: `**Q${nextIndex + 1} of ${activeRound.questions.length}:** ${activeRound.questions[nextIndex].question}`, ts: Date.now(), transition: transitionRaw };
      setMessages(p => [...p, aiMsg]);
      scrollChat();
      speak(fullText, null);
    } catch {
      const fallbackText = `${activeRound.questions[nextIndex].question}`;
      setMessages(p => [...p, { role: "ai", text: `**Q${nextIndex + 1}:** ${fallbackText}`, ts: Date.now() }]);
      speak(fallbackText, null);
      scrollChat();
    }
  }

  // ── SCORE SESSION ──
  async function scoreSession() {
    if (scoring) return;
    setScoring(true);
    const session = sessionRef.current;
    try {
      const raw = await callClaude(
        `You are a strict recruitment evaluator. Score this telephonic screening session.

Role: ${activeRound.jobTitle}
Pass Threshold: ${activeRound.passThreshold}%
Candidate: ${activeCandidate.name}
Resume Fit Score (from earlier AI analysis): ${activeCandidate.fitScore}%
Resume Retention Score: ${activeCandidate.retentionScore}%
Resume Backoff Risk: ${activeCandidate.backoffChance}%

Q&A Transcript (voice-transcribed):
${session.answers.map((a, i) => `Q${i + 1} [weight ${a.weight}%]: ${a.question}\nAnswer: ${a.answer}`).join("\n\n")}

SCORING RULES — be STRICT:
- Vague or very short answers: 30-50
- Adequate but generic: 50-65  
- Specific, confident, relevant: 70-85
- Exceptional, detailed, impressive: 85-100
Weight communication quality separately (clarity, fluency, structure).

Return ONLY valid JSON:
{
  "scores": [{"questionId":1,"question":"...","answer":"...","score":72,"weight":15,"feedback":"specific 1-sentence feedback on the voice answer"}],
  "overallScore": 71,
  "communicationScore": 78,
  "technicalScore": 65,
  "motivationScore": 74,
  "verdict": "PASS",
  "strengths": ["strength 1","strength 2"],
  "concerns": ["concern 1"],
  "aiSummary": "3-sentence executive summary of the candidate's screening performance — objective, specific, client-ready",
  "recommendation": "1-sentence concrete hiring recommendation"
}
verdict = PASS if overallScore >= ${activeRound.passThreshold}, else FAIL.`,
        "You are a strict calibrated evaluator. Return ONLY valid JSON."
      );

      const result = JSON.parse(raw.replace(/```json|```/g, "").trim());
      const newStatus = result.verdict === "PASS" ? "screening_passed" : "screening_failed";

      // Full report object — includes everything for client forward
      const fullReport = {
        ...result,
        candidateName: activeCandidate.name,
        candidateEmail: activeCandidate.email,
        candidatePhone: activeCandidate.phone,
        jobTitle: activeRound.jobTitle,
        passThreshold: activeRound.passThreshold,
        duration: Math.round((Date.now() - session.startTime) / 60000) || 1,
        transcript: session.transcript,
        resumeFitScore: activeCandidate.fitScore,
        resumeRetentionScore: activeCandidate.retentionScore,
        resumeBackoffRisk: activeCandidate.backoffChance,
        resumeSkills: activeCandidate.skills,
        resumeExperience: activeCandidate.experience,
        resumeEducation: activeCandidate.education,
        resumeSummary: activeCandidate.summary,
        screenedAt: new Date().toISOString(),
      };

      setCandidates(p => p.map(c => c.id === activeCandidate.id
        ? { ...c, status: newStatus, screeningScore: result.overallScore, screeningVerdict: result.verdict, screeningReport: fullReport }
        : c
      ));
      setRounds(p => p.map(r => r.id === activeRound.id
        ? { ...r, screened: [...(r.screened || []), { candidateId: activeCandidate.id, name: activeCandidate.name, score: result.overallScore, verdict: result.verdict }] }
        : r
      ));
      setReport(fullReport);
      setSubview("report");
    } catch { setToast("Scoring failed — try again"); }
    setScoring(false);
  }

  // ── FORWARD TO CLIENT ──
  function forwardToClient(rep) {
    const divider = "─".repeat(50);
    const txt = [
      "VAYUZ TECHNOLOGIES — AI SCREENING REPORT",
      "==========================================",
      `Candidate:  ${rep.candidateName}`,
      `Email:      ${rep.candidateEmail || "N/A"}`,
      `Phone:      ${rep.candidatePhone || "N/A"}`,
      `Role:       ${rep.jobTitle}`,
      `Date:       ${new Date(rep.screenedAt).toLocaleString()}`,
      `Duration:   ${rep.duration} min`,
      "",
      divider,
      `SCREENING VERDICT: ${rep.verdict}`,
      `Overall Score:   ${rep.overallScore}%  (Pass threshold: ${rep.passThreshold}%)`,
      divider,
      "",
      "SCORE BREAKDOWN",
      `  Communication:  ${rep.communicationScore}%`,
      `  Technical:      ${rep.technicalScore}%`,
      `  Motivation:     ${rep.motivationScore}%`,
      `  Overall:        ${rep.overallScore}%`,
      "",
      divider,
      "RESUME PROFILE (AI-Analysed)",
      divider,
      `  JD Fit Score:      ${rep.resumeFitScore}%`,
      `  Retention Score:   ${rep.resumeRetentionScore}%`,
      `  Backoff Risk:      ${rep.resumeBackoffRisk}%`,
      `  Experience:        ${rep.resumeExperience || "N/A"}`,
      `  Education:         ${rep.resumeEducation || "N/A"}`,
      `  Skills:            ${rep.resumeSkills?.join(", ") || "N/A"}`,
      "",
      rep.resumeSummary ? `  Background: ${rep.resumeSummary}` : "",
      "",
      divider,
      "AI SCREENING SUMMARY",
      divider,
      rep.aiSummary,
      "",
      "STRENGTHS",
      ...(rep.strengths?.map(s => `  ✦ ${s}`) || []),
      "",
      rep.concerns?.length ? "CONCERNS" : "",
      ...(rep.concerns?.map(c => `  ⚠ ${c}`) || []),
      "",
      `RECOMMENDATION: ${rep.recommendation}`,
      "",
      divider,
      "QUESTION-BY-QUESTION SCORES",
      divider,
      ...(rep.scores?.flatMap(s => [
        `Q${s.questionId}: ${s.question}`,
        `Score: ${s.score}%  |  Weight: ${s.weight}%`,
        `Feedback: ${s.feedback}`,
        `Answer: "${s.answer?.slice(0, 200)}${s.answer?.length > 200 ? "…" : ""}"`,
        "",
      ]) || []),
      divider,
      "FULL SCREENING TRANSCRIPT (Voice-Transcribed)",
      divider,
      ...(rep.transcript || ["Transcript not available"]),
      "",
      divider,
      "Generated by VAYUZ AI Screening Platform",
      `Report ID: ${Date.now()}`,
    ].filter(l => l !== undefined).join("\n");

    const blob = new Blob([txt], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${rep.candidateName?.replace(/ /g, "_")}_${rep.jobTitle?.replace(/ /g, "_")}_screening.txt`;
    a.click();
    setToast(`Report forwarded for ${rep.candidateName}`);
  }

  // ─── RENDER: ROUNDS LIST ───────────────────────────────────────────────────
  if (subview === "rounds") return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button className="btn btn-p" onClick={() => setSubview("setup")}>+ New Screening Round</button>
        {shortlisted.length > 0 && <span style={{ fontSize: 12, color: "#3A5070", alignSelf: "center" }}>{shortlisted.length} candidates shortlisted & ready to screen</span>}
      </div>

      {rounds.length === 0 && (
        <div className="card"><div className="empty">
          <div className="empty-ico">🎙️</div>
          <div className="empty-txt">No Screening Rounds Yet</div>
          <div className="empty-sub">Create a round, paste your questions, and let AI conduct voice interviews with shortlisted candidates.</div>
        </div></div>
      )}

      {rounds.map(round => {
        const roundCandidates = shortlisted.filter(c => c.jobId === round.jobId);
        const passed = round.screened?.filter(s => s.verdict === "PASS").length || 0;
        const failed = round.screened?.filter(s => s.verdict === "FAIL").length || 0;
        return (
          <div key={round.id} className="card" style={{ marginBottom: 16 }}>
            <div className="card-hdr">
              <div>
                <div className="card-ttl">{round.jobTitle}</div>
                <div style={{ fontSize: 11, color: "#3A5070", marginTop: 3 }}>
                  {round.questions.length} questions · Pass: {round.passThreshold}% · {round.screened?.length || 0} screened
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {passed > 0 && <span className="badge bg">✓ {passed} Passed</span>}
                {failed > 0 && <span className="badge br">✕ {failed} Failed</span>}
                <button className="btn btn-g btn-s" onClick={() => copyLink(round.id, false)}
                  style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}>
                  🔗 Copy Link
                </button>
                <button className="btn btn-p btn-s" onClick={() => copyLink(round.id, true)}
                  style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}>
                  ▶ Preview as Candidate
                </button>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#3A5070", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
              Shortlisted Candidates ({roundCandidates.length})
            </div>
            {roundCandidates.length === 0 && <div style={{ fontSize: 13, color: "#2A4060" }}>No shortlisted candidates for this role yet.</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {roundCandidates.map(c => {
                const screened = round.screened?.find(s => s.candidateId === c.id);
                return (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: "#070D1A", borderRadius: 9, border: "1px solid #131F35" }}>
                    <Av name={c.name} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#D0DFF0" }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "#3A5070" }}>{c.role} · Fit: {c.fitScore}%</div>
                    </div>
                    {screened ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: screened.verdict === "PASS" ? "#00C9A7" : "#FF6B8A" }}>
                          {screened.verdict} · {screened.score}%
                        </span>
                        <button className="btn btn-g btn-s" onClick={() => {
                          setReport(c.screeningReport);
                          setActiveCandidate(c);
                          setSubview("report");
                        }}>View Report</button>
                        <button className="btn btn-p btn-s" onClick={() => forwardToClient(c.screeningReport)}>⬆ Forward</button>
                      </div>
                    ) : (
                      <button className="btn btn-p btn-s" onClick={() => startScreening(round, c)}>▶ Start Voice Interview</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ─── RENDER: SETUP ─────────────────────────────────────────────────────────
  if (subview === "setup") return (
    <div style={{ maxWidth: 660 }}>
      <button className="btn btn-g btn-s" style={{ marginBottom: 18 }} onClick={() => setSubview("rounds")}>← Back</button>
      <div className="card">
        <div style={{ fontFamily: "Syne,sans-serif", fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 20 }}>Create Screening Round</div>

        <div className="form-g">
          <label className="form-lbl">Job Role</label>
          <select className="form-sel" value={setupJobId} onChange={e => setSetupJobId(e.target.value)}>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>

        <div className="form-g">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label className="form-lbl" style={{ margin: 0 }}>
              Screening Questions <span style={{ color: "#3A5070", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>— one per line</span>
            </label>
            <button className="btn btn-g btn-s" onClick={generateQuestions} disabled={generatingQs}>
              {generatingQs
                ? <span style={{ display: "flex", alignItems: "center", gap: 6 }}><div className="spinner" style={{ width: 12, height: 12 }} />Generating…</span>
                : "🤖 Generate from JD"}
            </button>
          </div>
          <textarea className="form-ta" rows={10} value={setupQuestions} onChange={e => setSetupQuestions(e.target.value)}
            placeholder={"Paste questions here or click 'Generate from JD'.\nOne question per line. Example:\n\nWhy are you looking for a change right now?\nCan you describe your experience with React and TypeScript?\nWhat's your current notice period?"} />
          <div style={{ fontSize: 11, color: "#2A4060", marginTop: 5 }}>
            {setupQuestions.trim().split("\n").filter(Boolean).length} questions · AI will ask these via voice, transcribe answers, and score each one
          </div>
        </div>

        <div className="form-g">
          <label className="form-lbl">Pass Threshold: <span style={{ color: "#00C9A7", fontWeight: 700 }}>{setupThreshold}%</span></label>
          <input type="range" min={40} max={90} step={5} value={setupThreshold} onChange={e => setSetupThreshold(e.target.value)}
            style={{ width: "100%", accentColor: "#00C9A7", marginTop: 6 }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#2A4060", marginTop: 4 }}>
            <span>40% Lenient</span><span>65% Standard</span><span>90% Strict</span>
          </div>
        </div>

        <div style={{ background: "#070D1A", border: "1px solid #0A3A28", borderRadius: 9, padding: "12px 16px", marginBottom: 18 }}>
          <div style={{ fontSize: 12, color: "#00C9A7", fontWeight: 600, marginBottom: 6 }}>🎙️ How Voice Screening Works</div>
          <div style={{ fontSize: 12, color: "#5A7A9A", lineHeight: 1.7 }}>
            1. AI reads each question aloud using text-to-speech<br />
            2. Candidate clicks <strong style={{ color: "#D0DFF0" }}>🎙 Record</strong> and speaks their answer<br />
            3. Speech-to-text transcribes the answer in real time<br />
            4. AI scores every answer and generates a full client report
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-p" onClick={saveRound} disabled={!setupQuestions.trim()}>Save Screening Round</button>
          <button className="btn btn-g" onClick={() => setSubview("rounds")}>Cancel</button>
        </div>
      </div>
    </div>
  );

  // ─── RENDER: LIVE VOICE SCREENING ─────────────────────────────────────────
  if (subview === "live") return (
    <div style={{ display: "flex", gap: 18, height: "calc(100vh - 130px)" }}>

      {/* Left info panel */}
      <div style={{ width: 210, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 10, color: "#3A5070", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Candidate</div>
          <Av name={activeCandidate?.name || ""} />
          <div style={{ fontSize: 13, fontWeight: 600, color: "#D0DFF0", marginTop: 8 }}>{activeCandidate?.name}</div>
          <div style={{ fontSize: 11, color: "#3A5070" }}>{activeCandidate?.role}</div>
          <div style={{ fontSize: 11, color: "#3A5070", marginTop: 4 }}>JD Fit: <span style={{ color: "#00C9A7" }}>{activeCandidate?.fitScore}%</span></div>
        </div>

        <div className="card" style={{ padding: 16, flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: 10, color: "#3A5070", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Progress</div>
          {activeRound?.questions.map((q, i) => {
            const done = sessionRef.current && i < sessionRef.current.qIndex;
            const current = sessionRef.current && i === sessionRef.current.qIndex && !sessionDone;
            return (
              <div key={q.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 9 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700,
                  background: done ? "#062A1E" : current ? "#0F2A4A" : "#0A1120",
                  color: done ? "#00C9A7" : current ? "#4A9EFF" : "#2A4060",
                  border: `1px solid ${done ? "#0A3A28" : current ? "#1E3D6A" : "#131F35"}`,
                }}>
                  {done ? "✓" : i + 1}
                </div>
                <div style={{ fontSize: 11, color: done ? "#4A7A60" : current ? "#8AAAC8" : "#2A4060", lineHeight: 1.5 }}>
                  {q.question.slice(0, 42)}{q.question.length > 42 ? "…" : ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main chat + voice panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>

          {/* Header */}
          <div style={{ padding: "12px 20px", borderBottom: "1px solid #131F35", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
              background: sessionDone ? "#F5A623" : aiSpeaking ? "#4A9EFF" : recording ? "#FF6B8A" : "#00C9A7",
              boxShadow: sessionDone ? "none" : aiSpeaking ? "0 0 8px rgba(74,158,255,0.5)" : recording ? "0 0 8px rgba(255,107,138,0.5)" : "0 0 8px rgba(0,201,167,0.4)",
            }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#D0DFF0" }}>
              {aiSpeaking ? "🔊 AI Speaking…" : recording ? "🔴 Recording…" : sessionDone ? "✅ Screening Complete" : `AI Screening — ${activeRound?.jobTitle}`}
            </span>
            <span style={{ fontSize: 11, color: "#3A5070", marginLeft: "auto" }}>
              {!sessionDone && `Q ${Math.min((sessionRef.current?.qIndex || 0) + 1, activeRound?.questions.length)} / ${activeRound?.questions.length}`}
            </span>
          </div>

          {/* Message thread */}
          <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "ai" ? "flex-start" : "flex-end" }}>
                <div style={{
                  maxWidth: "80%", padding: "12px 16px",
                  borderRadius: m.role === "ai" ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
                  background: m.role === "ai" ? "#0F1C2E" : "linear-gradient(135deg,#00C9A7,#00A88A)",
                  color: m.role === "ai" ? "#C5D4E8" : "#060E1A",
                  fontSize: 13.5, lineHeight: 1.7,
                  border: m.role === "ai" ? "1px solid #131F35" : "none",
                }}>
                  {m.role === "ai" && <div style={{ fontSize: 10, color: "#3A5070", marginBottom: 5, fontWeight: 600 }}>🤖 AI SCREENER</div>}
                  {m.role === "candidate" && <div style={{ fontSize: 10, color: "rgba(6,14,26,0.7)", marginBottom: 5, fontWeight: 600 }}>🎙 VOICE ANSWER</div>}
                  {m.text.split("**").map((seg, si) => si % 2 === 1 ? <strong key={si}>{seg}</strong> : seg)}
                </div>
              </div>
            ))}
            {aiSpeaking && (
              <div style={{ display: "flex", gap: 5, padding: "10px 14px", background: "#0F1C2E", borderRadius: "4px 14px 14px 14px", border: "1px solid #131F35", width: "fit-content" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#4A9EFF", animation: `bounce 1s ${i * 0.15}s infinite` }} />
                ))}
              </div>
            )}
          </div>

          {/* Voice controls */}
          <div style={{ padding: "16px 20px", borderTop: "1px solid #131F35", background: "#090E1A" }}>
            {voiceError && (
              <div style={{ fontSize: 12, color: "#FF6B8A", marginBottom: 10, padding: "8px 12px", background: "#2A0A15", borderRadius: 7, border: "1px solid #3A1025" }}>
                ⚠ {voiceError}
              </div>
            )}

            {!sessionDone ? (
              <div>
                {/* Live transcript display */}
                {(recording || finalTranscript) && (
                  <div style={{ marginBottom: 12, padding: "10px 14px", background: "#070D1A", border: "1px solid #1A2E48", borderRadius: 9, minHeight: 48 }}>
                    <div style={{ fontSize: 10, color: "#3A5070", fontWeight: 600, marginBottom: 5 }}>LIVE TRANSCRIPT</div>
                    <div style={{ fontSize: 13, color: "#C5D4E8", lineHeight: 1.6 }}>
                      <span>{finalTranscript}</span>
                      {liveTranscript && <span style={{ color: "#5A7A9A", fontStyle: "italic" }}>{liveTranscript}</span>}
                      {recording && !finalTranscript && !liveTranscript && <span style={{ color: "#3A5070", fontStyle: "italic" }}>Listening…</span>}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {!recording ? (
                    <button className="btn btn-p" onClick={startRecording} disabled={aiSpeaking}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", fontSize: 13 }}>
                      <span style={{ fontSize: 16 }}>🎙</span> Record Answer
                    </button>
                  ) : (
                    <button className="btn" onClick={stopRecording}
                      style={{ background: "#3A1020", color: "#FF6B8A", border: "1px solid #5A1530", display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", fontSize: 13 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: "#FF6B8A", display: "inline-block" }} /> Stop Recording
                    </button>
                  )}

                  {(finalTranscript || liveTranscript) && !recording && (
                    <button className="btn btn-p" onClick={submitAnswer}
                      style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      Submit Answer →
                    </button>
                  )}

                  {aiSpeaking && (
                    <button className="btn btn-g btn-s" onClick={() => { window.speechSynthesis?.cancel(); setAiSpeaking(false); }}>
                      ⏹ Skip TTS
                    </button>
                  )}

                  <span style={{ fontSize: 11, color: "#2A4060", marginLeft: "auto" }}>
                    {aiSpeaking ? "Wait for AI to finish…" : recording ? "Speak clearly into your mic" : "Click Record when ready"}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#5A7A9A", flex: 1 }}>All {activeRound?.questions.length} questions answered. Generate your scored report now.</span>
                <button className="btn btn-p" onClick={scoreSession} disabled={scoring}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {scoring
                    ? <><div className="spinner" style={{ width: 14, height: 14 }} />Scoring…</>
                    : "📊 Generate Score Report"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ─── RENDER: REPORT ────────────────────────────────────────────────────────
  if (subview === "report" && report) {
    const isPassed = report.verdict === "PASS";
    return (
      <div>
        <button className="btn btn-g btn-s" style={{ marginBottom: 18 }} onClick={() => setSubview("rounds")}>← Back to Rounds</button>

        {/* Verdict banner */}
        <div className="card" style={{ marginBottom: 16, border: `1px solid ${isPassed ? "#0A3A28" : "#3A1025"}`, background: isPassed ? "linear-gradient(135deg,#0C1524,#071D14)" : "linear-gradient(135deg,#0C1524,#1A0712)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ fontSize: 44 }}>{isPassed ? "✅" : "❌"}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "Syne,sans-serif", fontSize: 20, fontWeight: 800, color: "#fff" }}>{report.candidateName}</div>
              <div style={{ fontSize: 12, color: "#5A7A9A" }}>{report.jobTitle} · Voice Screening · {report.duration} min</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "Syne,sans-serif", fontSize: 40, fontWeight: 800, color: isPassed ? "#00C9A7" : "#FF6B8A" }}>{report.overallScore}%</div>
              <div style={{ fontSize: 11, color: "#3A5070" }}>Threshold: {report.passThreshold}%</div>
              <span className={`badge ${isPassed ? "bg" : "br"}`} style={{ marginTop: 6 }}>{report.verdict}</span>
            </div>
          </div>
        </div>

        <div className="grid2" style={{ marginBottom: 16 }}>
          {/* Screening scores */}
          <div className="card">
            <div className="card-ttl" style={{ marginBottom: 14 }}>Screening Scores</div>
            {[["Communication", report.communicationScore], ["Technical", report.technicalScore], ["Motivation", report.motivationScore], ["Overall", report.overallScore]].map(([lbl, v]) => (
              <div key={lbl} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: "#4A6580", marginBottom: 4 }}>{lbl}</div>
                <SBar value={v} />
              </div>
            ))}
          </div>

          {/* Resume profile */}
          <div className="card">
            <div className="card-ttl" style={{ marginBottom: 14 }}>Resume Profile (AI-Analysed)</div>
            {[["JD Fit Score", report.resumeFitScore], ["Retention Likelihood", report.resumeRetentionScore]].map(([lbl, v]) => (
              <div key={lbl} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: "#4A6580", marginBottom: 4 }}>{lbl}</div>
                <SBar value={v} />
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#070D1A", borderRadius: 8, border: "1px solid #1A2E48", marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: "#6B87A8" }}>Backoff Risk</span>
              <span style={{ fontWeight: 700, color: BC(report.resumeBackoffRisk) }}>{report.resumeBackoffRisk}%</span>
            </div>
            <div style={{ fontSize: 11, color: "#3A5070", marginBottom: 6 }}>{report.resumeExperience} · {report.resumeEducation}</div>
            <div className="tags-r">
              {report.resumeSkills?.slice(0, 6).map(s => <span key={s} className="tag">{s}</span>)}
            </div>
          </div>
        </div>

        <div className="grid2" style={{ marginBottom: 16 }}>
          {/* AI Summary */}
          <div className="card">
            <div className="card-ttl" style={{ marginBottom: 12 }}>AI Summary</div>
            <div style={{ fontSize: 13, color: "#8AAAC8", lineHeight: 1.75, marginBottom: 14 }}>{report.aiSummary}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#00C9A7", marginBottom: 8 }}>Strengths</div>
            {report.strengths?.map((s, i) => <div key={i} style={{ fontSize: 12.5, color: "#6B87A8", marginBottom: 5 }}>✦ {s}</div>)}
            {report.concerns?.length > 0 && <>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#F5A623", marginTop: 12, marginBottom: 8 }}>Concerns</div>
              {report.concerns.map((s, i) => <div key={i} style={{ fontSize: 12.5, color: "#6B87A8", marginBottom: 5 }}>⚠ {s}</div>)}
            </>}
            <div style={{ marginTop: 14, padding: "10px 14px", background: "#070D1A", borderRadius: 8, border: "1px solid #1A2E48" }}>
              <div style={{ fontSize: 10, color: "#3A5070", marginBottom: 4 }}>RECOMMENDATION</div>
              <div style={{ fontSize: 13, color: "#C5D4E8" }}>{report.recommendation}</div>
            </div>
          </div>

          {/* Transcript */}
          <div className="card">
            <div className="card-ttl" style={{ marginBottom: 12 }}>Voice Transcript</div>
            <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {report.transcript?.length ? report.transcript.map((line, i) => (
                <div key={i} style={{
                  fontSize: 12, lineHeight: 1.6, padding: "6px 0",
                  borderBottom: i < report.transcript.length - 1 ? "1px solid #0F1C2E" : "none",
                  color: line.startsWith("Q") ? "#5A7A9A" : "#8AAAC8",
                  fontWeight: line.startsWith("Q") ? 600 : 400,
                }}>
                  {line}
                </div>
              )) : <div style={{ fontSize: 12, color: "#2A4060" }}>Transcript not available</div>}
            </div>
          </div>
        </div>

        {/* Per-question scores */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-ttl" style={{ marginBottom: 14 }}>Question-by-Question Scores</div>
          {report.scores?.map((s, i) => (
            <div key={i} style={{ padding: "13px 0", borderBottom: i < report.scores.length - 1 ? "1px solid #0F1C2E" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, gap: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#D0DFF0", flex: 1 }}>Q{i + 1}: {s.question}</div>
                <span style={{ fontSize: 14, fontWeight: 700, color: SC(s.score), flexShrink: 0 }}>{s.score}%</span>
              </div>
              <div style={{ fontSize: 12, color: "#4A6580", fontStyle: "italic", marginBottom: 5 }}>
                "{s.answer?.slice(0, 140)}{s.answer?.length > 140 ? "…" : ""}"
              </div>
              <div style={{ fontSize: 12, color: "#4A6580" }}>↳ {s.feedback}</div>
            </div>
          ))}
        </div>

        {/* Forward actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-p" onClick={() => forwardToClient(report)} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            ⬆ Forward to Client
          </button>
          <button className="btn btn-g" onClick={() => setSubview("rounds")}>Back to Rounds</button>
        </div>
      </div>
    );
  }

  return null;
}



// ── CANDIDATE PORTAL (standalone, no platform access) ────────────────────────
function CandidatePortal({ roundId, onExit }) {
  const [round, setRound] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("intro"); // intro | live | done
  const [candidateName, setCandidateName] = useState("");
  const [messages, setMessages] = useState([]);
  const [sessionDone, setSessionDone] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [recording, setRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [scoring, setScoring] = useState(false);
  const [result, setResult] = useState(null);

  const sessionRef = useRef({ qIndex: 0, answers: [], startTime: Date.now(), transcript: [] });
  const chatRef = useRef();
  const recRef = useRef();

  const scrollChat = () =>
    setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }), 80);

  // Load round from shared storage
  useEffect(() => {
    async function loadRound() {
      try {
        const res = await window.storage.get("round_" + roundId, true);
        if (res?.value) {
          setRound(JSON.parse(res.value));
        }
      } catch(e) { console.warn("Could not load round:", e); }
      setLoading(false);
    }
    if (roundId) loadRound();
    else setLoading(false);
  }, [roundId]);

  // TTS
  function speak(text, onEnd) {
    if (!window.speechSynthesis) { onEnd?.(); return; }
    window.speechSynthesis.cancel();
    const clean = text.replace(/\*\*/g, "").replace(/\*/g, "");
    const utt = new SpeechSynthesisUtterance(clean);
    utt.rate = 0.95; utt.pitch = 1.05; utt.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes("Samantha") || v.name.includes("Google UK") || v.lang === "en-US");
    if (preferred) utt.voice = preferred;
    utt.onend = () => { setAiSpeaking(false); onEnd?.(); };
    utt.onerror = () => { setAiSpeaking(false); onEnd?.(); };
    setAiSpeaking(true);
    window.speechSynthesis.speak(utt);
  }

  // STT
  const accumulatedRef = useRef("");

  function startRecording() {
    setVoiceError("");
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setVoiceError("Voice recording not supported. Please use Chrome or Edge."); return; }
    accumulatedRef.current = "";
    setFinalTranscript(""); setLiveTranscript("");
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-IN";
    recRef.current = rec;
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) { accumulatedRef.current += t + " "; }
        else interim = t;
      }
      setFinalTranscript(accumulatedRef.current);
      setLiveTranscript(interim);
    };
    rec.onerror = (e) => {
      setRecording(false);
      if (e.error === "not-allowed") setVoiceError("Microphone access denied. Click the mic icon in your browser address bar and allow access.");
      else if (e.error === "no-speech") setVoiceError("No speech detected. Make sure your microphone is working and try again.");
      else if (e.error === "network") setVoiceError("Network error during speech recognition. Check your internet connection.");
      else setVoiceError("Voice error: " + e.error + ". Try refreshing and allowing microphone access.");
    };
    rec.onend = () => { setRecording(false); };
    rec.start();
    setRecording(true);
  }

  function stopRecording() {
    recRef.current?.stop();
    setRecording(false);
    setLiveTranscript("");
    // Make sure accumulated is flushed to finalTranscript state
    if (accumulatedRef.current) setFinalTranscript(accumulatedRef.current);
  }

  // Start interview
  function startInterview() {
    if (!candidateName.trim()) return;
    const session = { qIndex: 0, answers: [], startTime: Date.now(), transcript: [] };
    sessionRef.current = session;
    setPhase("live");
    const openText = "Hi " + candidateName + "! Welcome to your AI screening interview for the " + round.jobTitle + " role. I have " + round.questions.length + " questions for you. After I ask each question, click the Record button and speak your answer clearly. Click Stop when done. Let's begin. " + round.questions[0]?.question;
    const openMsg = { role: "ai", text: "Hi **" + candidateName + "**! Welcome to your AI screening for **" + round.jobTitle + "**. I have **" + round.questions.length + " questions** — click Record after each question and speak your answer.\n\n**Q1 of " + round.questions.length + ":** " + round.questions[0]?.question, ts: Date.now() };
    setMessages([openMsg]);
    scrollChat();
    setTimeout(() => speak(openText, null), 400);
  }

  // Submit voice answer
  async function submitAnswer() {
    const answer = (_accRef.current + " " + liveTranscript).trim() || finalTranscript.trim();
    if (!answer || answer.length < 3) { setVoiceError("No speech detected. Click Record, speak, then click Stop before submitting."); return; }
    stopRecording();
    window.speechSynthesis?.cancel();

    const session = sessionRef.current;
    const qIndex = session.qIndex;
    const currentQ = round.questions[qIndex];
    const nextIndex = qIndex + 1;
    const isLast = nextIndex >= round.questions.length;

    const answerMsg = { role: "candidate", text: answer, ts: Date.now() };
    setMessages(p => [...p, answerMsg]);
    setFinalTranscript(""); setLiveTranscript("");
    scrollChat();

    const updatedAnswers = [...session.answers, { questionId: currentQ.id, question: currentQ.question, answer, weight: currentQ.weight }];
    const updatedTranscript = [...(session.transcript || []), "Q" + (qIndex+1) + ": " + currentQ.question, "A: " + answer];
    const newSession = { ...session, qIndex: nextIndex, answers: updatedAnswers, transcript: updatedTranscript };
    sessionRef.current = newSession;

    if (isLast) {
      const closeMsg = { role: "ai", text: "Thank you **" + candidateName + "**! You have completed all " + round.questions.length + " questions. Your responses have been recorded. Our team will review them and get back to you shortly.", ts: Date.now() };
      setMessages(p => [...p, closeMsg]);
      setSessionDone(true);
      speak("Thank you " + candidateName + "! You have completed all questions. Our team will review your responses and get back to you shortly.", null);
      scrollChat();

      // Score and store result
      setScoring(true);
      try {
        const raw = await callClaude(
          "Score this telephonic screening. Role: " + round.jobTitle + ". Pass threshold: " + round.passThreshold + "%.\n\nQ&A:\n" +
          updatedAnswers.map((a, i) => "Q" + (i+1) + " [weight " + a.weight + "%]: " + a.question + "\nAnswer: " + a.answer).join("\n\n") +
          "\n\nBe STRICT — vague answers score 30-50, good answers 70-85, exceptional 85-100.\nReturn ONLY valid JSON: {" +
          '"scores":[{"questionId":1,"question":"...","answer":"...","score":72,"weight":15,"feedback":"..."}],' +
          '"overallScore":71,"communicationScore":78,"technicalScore":65,"motivationScore":74,' +
          '"verdict":"PASS","strengths":["..."],"concerns":["..."],' +
          '"aiSummary":"3-sentence executive summary","recommendation":"1-sentence recommendation"}\n' +
          "verdict=PASS if overallScore>=" + round.passThreshold + ", else FAIL.",
          "You are a strict calibrated evaluator. Return ONLY valid JSON."
        );
        const scored = JSON.parse(raw.replace(/```json|```/g, "").trim());
        const fullResult = {
          ...scored,
          candidateName,
          jobTitle: round.jobTitle,
          passThreshold: round.passThreshold,
          duration: Math.round((Date.now() - session.startTime) / 60000) || 1,
          transcript: updatedTranscript,
          screenedAt: new Date().toISOString(),
          roundId,
        };
        setResult(fullResult);
        // Save result to shared storage for recruiter to pick up
        try {
          await window.storage.set("result_" + roundId + "_" + Date.now(), JSON.stringify(fullResult), true);
        } catch(e) { console.warn("Could not save result:", e); }
      } catch(e) { console.warn("Scoring error:", e); }
      setScoring(false);
      return;
    }

    // Next question
    setAiSpeaking(true);
    try {
      const transRaw = await callClaude(
        "You are an AI interviewer. Candidate answered: \"" + answer.slice(0, 200) + "\". Give a 1-sentence natural acknowledgement then ask: \"" + round.questions[nextIndex].question + "\". Return plain text only.",
        "You are a professional interviewer. Return plain text only."
      );
      const aiMsg = { role: "ai", text: "**Q" + (nextIndex+1) + " of " + round.questions.length + ":** " + round.questions[nextIndex].question, ts: Date.now() };
      setMessages(p => [...p, aiMsg]);
      speak(transRaw, null);
      scrollChat();
    } catch {
      const aiMsg = { role: "ai", text: "**Q" + (nextIndex+1) + ":** " + round.questions[nextIndex].question, ts: Date.now() };
      setMessages(p => [...p, aiMsg]);
      speak(round.questions[nextIndex].question, null);
      scrollChat();
    }
  }

  // Portal styles (isolated, no platform chrome)
  const P = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'DM Sans',sans-serif;background:#070B14;color:#E8EDF5;min-height:100vh}
    .portal{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:32px 20px}
    .portal-logo{font-family:'Syne',sans-serif;font-weight:800;font-size:22px;color:#fff;letter-spacing:-0.5px;margin-bottom:4px}
    .portal-sub{font-size:10px;color:#00C9A7;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-bottom:40px;text-align:center}
    .portal-card{background:#0C1524;border:1px solid #1A2E48;border-radius:16px;padding:32px;width:100%;max-width:600px}
    .portal-title{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:#fff;margin-bottom:8px}
    .portal-role{font-size:13px;color:#5A7A9A;margin-bottom:24px}
    .p-label{display:block;font-size:11px;font-weight:600;color:#5A7A9A;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
    .p-input{width:100%;background:#070D1A;border:1px solid #1A2E48;border-radius:8px;padding:12px 16px;color:#C5D4E8;font-family:'DM Sans',sans-serif;font-size:14px;outline:none}
    .p-input:focus{border-color:#00C9A7;box-shadow:0 0 0 3px rgba(0,201,167,0.08)}
    .p-btn{padding:12px 28px;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;border:none;transition:all 0.15s}
    .p-btn-p{background:linear-gradient(135deg,#00C9A7,#00A88A);color:#060E1A;width:100%;margin-top:20px}
    .p-btn-p:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,201,167,0.3)}
    .p-btn-p:disabled{opacity:0.5;cursor:not-allowed;transform:none}
    .p-btn-g{background:transparent;color:#6B87A8;border:1px solid #1A2E48;padding:9px 18px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:13px;cursor:pointer}
    .p-btn-stop{background:#2A1020;color:#FF6B8A;border:1px solid #5A1530;padding:9px 18px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:8px}
    .p-chat{height:360px;overflow-y:auto;display:flex;flex-direction:column;gap:14px;padding:18px 0;margin-bottom:16px}
    .p-bubble-ai{background:#0F1C2E;border:1px solid #131F35;border-radius:4px 14px 14px 14px;padding:12px 16px;font-size:13.5px;color:#C5D4E8;line-height:1.7;max-width:88%}
    .p-bubble-me{background:linear-gradient(135deg,#00C9A7,#00A88A);border-radius:14px 4px 14px 14px;padding:12px 16px;font-size:13.5px;color:#060E1A;line-height:1.65;max-width:88%;align-self:flex-end}
    .p-transcript{background:#070D1A;border:1px solid #1A2E48;border-radius:9px;padding:12px 16px;margin-bottom:14px;min-height:52px;font-size:13px;color:#C5D4E8;line-height:1.6}
    .p-hint{font-size:11px;color:#2A4060;margin-top:6px;text-align:center}
    .p-error{font-size:12px;color:#FF6B8A;background:#2A0A15;border:1px solid #3A1025;border-radius:7px;padding:8px 12px;margin-bottom:10px}
    .p-progress{display:flex;gap:6px;margin-bottom:20px;flex-wrap:wrap}
    .p-dot{width:28px;height:4px;border-radius:2px;transition:all 0.3s}
    .done-ico{font-size:56px;text-align:center;margin-bottom:16px}
    .done-title{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#fff;text-align:center;margin-bottom:8px}
    .done-sub{font-size:14px;color:#5A7A9A;text-align:center;line-height:1.7}
    .verdict-box{text-align:center;padding:20px;background:#070D1A;border-radius:12px;margin:20px 0;border:1px solid #1A2E48}
    .verdict-pct{font-family:'Syne',sans-serif;font-size:48px;font-weight:800}
    @keyframes si{from{transform:translateX(16px);opacity:0}}
    @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
    ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#0D1525}::-webkit-scrollbar-thumb{background:#1E3A5F;border-radius:2px}
  `;

  if (loading) return (
    <>
      <style>{P}</style>
      <div className="portal">
        <div className="portal-logo">VAYUZ</div>
        <div className="portal-sub">AI Recruit</div>
        <div style={{ color: "#3A5070", fontSize: 14 }}>Loading screening round...</div>
      </div>
    </>
  );

  if (!round) return (
    <>
      <style>{P}</style>
      <div className="portal">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: 600, marginBottom: 4 }}>
          <div className="portal-logo">VAYUZ</div>
          {onExit && <button onClick={onExit} style={{ background: "none", border: "1px solid #1A2E48", borderRadius: 7, padding: "5px 12px", color: "#5A7A9A", fontSize: 12, cursor: "pointer" }}>← Back to Platform</button>}
        </div>
        <div className="portal-sub">AI Recruit</div>
        <div className="portal-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>
          <div className="portal-title">Invalid Link</div>
          <div style={{ color: "#5A7A9A", fontSize: 14, marginTop: 8 }}>This screening link is invalid or has expired. Please contact the recruiter for a new link.</div>
        </div>
      </div>
    </>
  );

  const qIndex = sessionRef.current?.qIndex || 0;

  // ── INTRO SCREEN ──
  if (phase === "intro") return (
    <>
      <style>{P}</style>
      <div className="portal">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: 600, marginBottom: 4 }}>
          <div className="portal-logo">VAYUZ</div>
          {onExit && <button onClick={onExit} style={{ background: "none", border: "1px solid #1A2E48", borderRadius: 7, padding: "5px 12px", color: "#5A7A9A", fontSize: 12, cursor: "pointer" }}>← Back to Platform</button>}
        </div>
        <div className="portal-sub">AI Screening Interview</div>
        <div className="portal-card">
          <div className="portal-title">Welcome to your AI Interview</div>
          <div className="portal-role">{round.jobTitle} &nbsp;·&nbsp; {round.questions.length} Questions</div>

          <div style={{ background: "#070D1A", border: "1px solid #1A2E48", borderRadius: 10, padding: "16px 18px", marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#00C9A7", marginBottom: 10 }}>How This Works</div>
            {["AI will ask you questions one by one via voice",
              "Click Record and speak your answer clearly",
              "Click Stop when you finish each answer",
              "Your responses will be scored by AI and shared with the hiring team"].map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 13, color: "#8AAAC8" }}>
                <span style={{ color: "#1E3A5F", fontWeight: 700 }}>{i+1}.</span>{t}
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="p-label">Your Full Name</label>
            <input className="p-input" placeholder="Enter your full name to begin"
              value={candidateName} onChange={e => setCandidateName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && candidateName.trim() && startInterview()} />
          </div>

          <div style={{ fontSize: 12, color: "#2A4060", marginBottom: 16, textAlign: "center" }}>
            Use Chrome for best voice experience &nbsp;·&nbsp; Allow microphone access when prompted
          </div>

          <button className="p-btn p-btn-p" onClick={startInterview} disabled={!candidateName.trim()}>
            Start Interview
          </button>
        </div>
      </div>
    </>
  );

  // ── LIVE INTERVIEW ──
  if (phase === "live") return (
    <>
      <style>{P}</style>
      <div className="portal">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: 600, marginBottom: 4 }}>
          <div className="portal-logo">VAYUZ</div>
          {onExit && <button onClick={onExit} style={{ background: "none", border: "1px solid #1A2E48", borderRadius: 7, padding: "5px 12px", color: "#5A7A9A", fontSize: 12, cursor: "pointer" }}>← Back to Platform</button>}
        </div>
        <div className="portal-sub">AI Screening Interview &nbsp;·&nbsp; {round.jobTitle}</div>
        <div className="portal-card">
          {/* Progress bar */}
          <div className="p-progress">
            {round.questions.map((_, i) => (
              <div key={i} className="p-dot" style={{
                background: i < qIndex ? "#00C9A7" : i === qIndex && !sessionDone ? "#4A9EFF" : "#131F35",
                flex: 1
              }} />
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: "#5A7A9A" }}>
              {sessionDone ? "Complete" : "Question " + Math.min(qIndex + 1, round.questions.length) + " of " + round.questions.length}
            </span>
            <span style={{ fontSize: 12, color: aiSpeaking ? "#4A9EFF" : recording ? "#FF6B8A" : "#2A4060" }}>
              {aiSpeaking ? "AI speaking..." : recording ? "Recording..." : sessionDone ? scoring ? "Scoring..." : "" : "Ready"}
            </span>
          </div>

          {/* Chat thread */}
          <div className="p-chat" ref={chatRef}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "ai" ? "flex-start" : "flex-end" }}>
                <div className={m.role === "ai" ? "p-bubble-ai" : "p-bubble-me"}>
                  {m.role === "ai" && <div style={{ fontSize: 10, color: "#3A5070", marginBottom: 5, fontWeight: 600 }}>AI INTERVIEWER</div>}
                  {m.role === "candidate" && <div style={{ fontSize: 10, color: "rgba(6,14,26,0.6)", marginBottom: 5, fontWeight: 600 }}>YOUR ANSWER</div>}
                  {m.text.split("**").map((seg, si) => si % 2 === 1 ? <strong key={si}>{seg}</strong> : seg)}
                </div>
              </div>
            ))}
            {aiSpeaking && (
              <div style={{ display: "flex", gap: 5, padding: "10px 14px", background: "#0F1C2E", border: "1px solid #131F35", borderRadius: "4px 14px 14px 14px", width: "fit-content" }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#4A9EFF", animation: "bounce 1s " + (i*0.15) + "s infinite" }} />)}
              </div>
            )}
          </div>

          {/* Controls */}
          {!sessionDone ? (
            <div>
              {voiceError && <div className="p-error">{voiceError}</div>}
              {(recording || finalTranscript) && (
                <div className="p-transcript">
                  <div style={{ fontSize: 10, color: "#3A5070", fontWeight: 600, marginBottom: 5 }}>LIVE TRANSCRIPT</div>
                  <span>{finalTranscript}</span>
                  <span style={{ color: "#5A7A9A", fontStyle: "italic" }}>{liveTranscript}</span>
                  {recording && !finalTranscript && !liveTranscript && <span style={{ color: "#3A5070", fontStyle: "italic" }}>Listening...</span>}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {!recording ? (
                  <button className="p-btn p-btn-p" style={{ width: "auto", margin: 0, padding: "10px 22px" }}
                    onClick={startRecording} disabled={aiSpeaking}>
                    Record Answer
                  </button>
                ) : (
                  <button className="p-btn-stop" onClick={stopRecording}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: "#FF6B8A", display: "inline-block" }} /> Stop
                  </button>
                )}
                {finalTranscript && !recording && (
                  <button className="p-btn p-btn-p" style={{ width: "auto", margin: 0, padding: "10px 22px" }} onClick={submitAnswer}>
                    Submit
                  </button>
                )}
                {aiSpeaking && (
                  <button className="p-btn-g" onClick={() => { window.speechSynthesis?.cancel(); setAiSpeaking(false); }}>
                    Skip
                  </button>
                )}
              </div>
              <div className="p-hint">
                {aiSpeaking ? "Wait for AI to finish, then click Record" : recording ? "Speak your answer clearly, then click Stop" : "Click Record when you're ready to answer"}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", paddingTop: 8 }}>
              {scoring
                ? <div style={{ color: "#5A7A9A", fontSize: 14 }}>Scoring your responses...</div>
                : result
                  ? <div>
                      <div style={{ fontSize: 13, color: "#00C9A7", marginBottom: 8 }}>Screening complete! Scroll up to review the conversation.</div>
                      <button className="p-btn p-btn-p" style={{ width: "auto", margin: "0 auto" }} onClick={() => setPhase("done")}>View Result</button>
                    </div>
                  : <div style={{ color: "#5A7A9A", fontSize: 14 }}>All done! Your responses have been recorded.</div>
              }
            </div>
          )}
        </div>
      </div>
    </>
  );

  // ── DONE SCREEN ──
  if (phase === "done") {
    const isPassed = result?.verdict === "PASS";
    return (
      <>
        <style>{P}</style>
        <div className="portal">
          <div className="portal-logo">VAYUZ</div>
          <div className="portal-sub">Screening Complete</div>
          <div className="portal-card">
            <div className="done-ico">{isPassed ? "🎉" : "📋"}</div>
            <div className="done-title">{isPassed ? "Great job, " + candidateName + "!" : "Thank you, " + candidateName + "!"}</div>
            <div className="done-sub">Your AI screening for <strong style={{ color: "#D0DFF0" }}>{round.jobTitle}</strong> is complete. The VAYUZ team will review your responses and be in touch soon.</div>

            {result && (
              <div className="verdict-box">
                <div style={{ fontSize: 11, color: "#3A5070", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Your Score</div>
                <div className="verdict-pct" style={{ color: isPassed ? "#00C9A7" : "#F5A623" }}>{result.overallScore}%</div>
                <div style={{ fontSize: 12, color: "#3A5070", marginTop: 4 }}>Screening completed in {result.duration} min</div>
              </div>
            )}

            <div style={{ fontSize: 13, color: "#3A5070", textAlign: "center", marginTop: 16, lineHeight: 1.7 }}>
              You can now close this window. We appreciate your time and interest in joining VAYUZ Technologies.
            </div>
          </div>
        </div>
      </>
    );
  }
  return null;
}

// ── APP ROOT ──
export default function App() {
  const [view, setView] = useState("dashboard");
  const [jobs, setJobs] = useState(JOBS);
  const [candidates, setCandidates] = useState(CANDS);
  const [toast, setToastMsg] = useState(null);
  const [portalRoundId, setPortalRoundId] = useState(null); // candidate portal preview

  // ── Reactive hash-based routing — works on load AND on hashchange ──
  useEffect(() => {
    function handleHash() {
      const h = window.location.hash;
      if (h.startsWith("#screen-")) {
        setPortalRoundId(h.replace("#screen-", ""));
      } else {
        setPortalRoundId(null);
      }
    }
    handleHash(); // run on mount
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  if (portalRoundId) return <CandidatePortal roundId={portalRoundId} onExit={() => { window.location.hash = ""; setPortalRoundId(null); }} />;

  function setToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  const nav = [
    { id: "dashboard", lbl: "Dashboard", ico: "◈" },
    { id: "jobs", lbl: "Job Descriptions", ico: "📋" },
    { id: "parse", lbl: "Parse Resume", ico: "🤖" },
    { id: "shortlist", lbl: "Candidates", ico: "👥" },
    { id: "screening", lbl: "AI Screening", ico: "🎙️" },
    { id: "ats", lbl: "ATS Integration", ico: "🔗" },
  ];

  const titles = {
    dashboard: "Dashboard", jobs: "Job Descriptions", parse: "AI Resume Parser",
    shortlist: "Candidate Shortlist", screening: "AI Telephonic Screening", ats: "ATS Integration"
  };
  const sl = candidates.filter(c => c.status === "shortlisted").length;
  const screened = candidates.filter(c => c.screeningVerdict).length;

  return (
    <>
      <style>{STYLES}</style>
      <div className="shell">
        <aside className="sidebar">
          <div className="logo-wrap">
            <div className="logo">VAYUZ</div>
            <div className="logo-sub">AI Recruit</div>
          </div>
          <nav className="nav">
            <div className="nav-lbl">Main</div>
            {nav.map(item => (
              <button key={item.id} className={`nav-btn ${view === item.id ? "active" : ""}`} onClick={() => setView(item.id)}>
                <span className="ni">{item.ico}</span>
                {item.lbl}
                {item.id === "shortlist" && sl > 0 && (
                  <span style={{ marginLeft: "auto", background: "#00C9A7", color: "#060E1A", borderRadius: 10, fontSize: 9.5, fontWeight: 700, padding: "1px 6px" }}>{sl}</span>
                )}
                {item.id === "screening" && screened > 0 && (
                  <span style={{ marginLeft: "auto", background: "#4A9EFF", color: "#060E1A", borderRadius: 10, fontSize: 9.5, fontWeight: 700, padding: "1px 6px" }}>{screened}</span>
                )}
              </button>
            ))}
            <div className="nav-lbl" style={{ marginTop: 10 }}>System</div>
            {[["⚙", "Settings"], ["?", "Help & Docs"]].map(([ico, lbl]) => (
              <button key={lbl} className="nav-btn" onClick={() => setToast(`${lbl} coming soon`)}>
                <span className="ni">{ico}</span>{lbl}
              </button>
            ))}
          </nav>
          <div className="sfooter">v1.1.0 · VAYUZ Technologies</div>
        </aside>

        <div className="main">
          <div className="topbar">
            <div className="page-title">{titles[view]}</div>
            <div className="topbar-right">
              <span style={{ fontSize: 11, color: "#2A4060" }}>{candidates.length} candidates · {jobs.filter(j => j.status === "active").length} active JDs</span>
              {view === "parse" && <button className="btn btn-p btn-s" onClick={() => setView("shortlist")}>View Shortlist →</button>}
              {view === "shortlist" && <button className="btn btn-p btn-s" onClick={() => setView("screening")}>🎙️ Screen Candidates</button>}
              {view === "screening" && sl > 0 && <span style={{ fontSize: 11, color: "#3A5070" }}>{sl} candidates ready to screen</span>}
            </div>
          </div>

          <div className="body">
            {view === "dashboard" && <Dashboard jobs={jobs} candidates={candidates} />}
            {view === "jobs" && <Jobs jobs={jobs} setJobs={setJobs} candidates={candidates} setToast={setToast} />}
            {view === "parse" && <Parser jobs={jobs} setCandidates={setCandidates} setToast={setToast} />}
            {view === "shortlist" && <Shortlist candidates={candidates} setCandidates={setCandidates} jobs={jobs} setToast={setToast} />}
            {view === "screening" && <Screening candidates={candidates} setCandidates={setCandidates} jobs={jobs} setToast={setToast} />}
            {view === "ats" && <ATS candidates={candidates} jobs={jobs} setToast={setToast} />}
          </div>
        </div>
      </div>
      {toast && <div className="toast">✓ {toast}</div>}
    </>
  );
}
