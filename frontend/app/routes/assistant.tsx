import {
  Form,
  useActionData,
  useNavigation,
  useLoaderData,
  useNavigate,
} from "react-router";
import type { Route } from "../+types/root";
import { Input } from "~/components/ui/input";
import { Field, FieldLabel } from "~/components/ui/field";
import { useEffect, useMemo, useRef, useState } from "react";

/* ================= TYPES ================= */

type LoaderData = { authorized: boolean; username?: string | null };
type ActionData = { answer?: string } | undefined;

type Message = {
  role: "user" | "ai";
  content: string;
  createdAt: number;
};

type ChatSession = {
  id: string;
  title: string;
  createdAt: number;
  context: {
    crop: string;
    cropOther?: string;
    location?: string;
    season?: string;
    soil?: string;
  };
  messages: Message[];
};

/* ================= CONSTANTS ================= */

const CROP_GROUPS: Record<string, string[]> = {
  Grains: ["Wheat", "Rice", "Maize (Corn)", "Barley"],
  Vegetables: ["Tomato", "Pepper (Chili / Capsicum)", "Potato", "Onion"],
  "Cash Crops": ["Sugarcane", "Cotton", "Tobacco"],
  Fruits: ["Banana", "Mango", "Apple", "Grapes"],
  Oilseeds: ["Soybean", "Sunflower", "Groundnut"],
};

const LOCATIONS = [
  "",
  "Tamil Nadu",
  "Karnataka",
  "Kerala",
  "Andhra Pradesh",
  "Telangana",
  "Maharashtra",
  "Punjab",
  "Haryana",
  "Uttar Pradesh",
  "Other",
];

const SEASONS = ["", "Kharif", "Rabi", "Zaid", "Perennial"];
const SOILS = ["", "Sandy", "Sandy loam", "Loam", "Clay loam", "Clay", "Black soil", "Red soil", "Alluvial"];

const SUGGESTIONS = [
  "When is my crop ready to harvest?",
  "What moisture level should wheat have before harvest?",
  "How do I check maturity in tomatoes or peppers?",
];

const ALL_KNOWN_CROPS = [
  "wheat", "rice", "maize", "corn", "barley",
  "tomato", "pepper", "potato", "onion",
  "sugarcane", "cotton", "tobacco",
  "banana", "mango", "apple", "grapes",
  "soybean", "sunflower", "groundnut",
];

function questionHasKnownCrop(q: string) {
  const t = q.toLowerCase();
  return ALL_KNOWN_CROPS.some((c) => t.includes(c));
}

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function storageKey(username?: string | null) {
  const safeUser = (username || "anonymous").trim() || "anonymous";
  return `harvest_chat_sessions__${safeUser}`;
}

/* ================= LOADER / ACTION ================= */

export async function clientLoader(): Promise<LoaderData> {
  const loggedIn = localStorage.getItem("isLoggedIn");
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");
  return { authorized: loggedIn === "true" && role === "farmer", username };
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const user_id = Number(localStorage.getItem("user_id") || "0");
  if (!user_id) return { answer: "Please login again." };

  const question = String(formData.get("question") || "");
  const crop = String(formData.get("crop") || "");
  const cropOther = String(formData.get("cropOther") || "");
  const location = String(formData.get("location") || "");
  const season = String(formData.get("season") || "");
  const soil = String(formData.get("soil") || "");

  const res = await fetch("http://localhost:8000/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, question, crop, cropOther, location, season, soil }),

  });
    if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { answer: err?.detail || "Request failed." };}

  return res.json(); 
}

/* ================= COMPONENT ================= */

export default function Assistant() {
  const loader = useLoaderData() as LoaderData;
  const data = useActionData() as ActionData;
  const nav = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = nav.state === "submitting";

  // ✅ auth guard
  useEffect(() => {
    if (!loader.authorized) {
      navigate("/", { replace: true });
    }
  }, [loader.authorized, navigate]);

  // question input
  const [question, setQuestion] = useState("");

  // sessions
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // dropdown context
  const [crop, setCrop] = useState("");
  const [cropOther, setCropOther] = useState("");
  const [location, setLocation] = useState("");
  const [season, setSeason] = useState("");
  const [soil, setSoil] = useState("");

  const [systemMsg, setSystemMsg] = useState<string | null>(null);

  // keep latest activeSessionId
  const activeSessionIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  // in-flight request session id
  const pendingSessionIdRef = useRef<string | null>(null);

  /* ================= SAVE/LOAD CHAT HISTORY ================= */

  // load from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(loader.username));
      if (!raw) return;

      const parsed = JSON.parse(raw) as { sessions: ChatSession[]; activeSessionId?: string | null };
      if (Array.isArray(parsed.sessions)) setSessions(parsed.sessions);
      if (parsed.activeSessionId) setActiveSessionId(parsed.activeSessionId);
    } catch {
      // ignore corrupt storage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // save (debounced) whenever sessions / activeSessionId change
  const saveTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);

    saveTimerRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(
          storageKey(loader.username),
          JSON.stringify({ sessions, activeSessionId })
        );
      } catch {
        // ignore quota/storage errors
      }
    }, 250);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [sessions, activeSessionId, loader.username]);

  /* ================= SESSION HELPERS ================= */

  function ensureSession(questionSeed: string) {
    const existing = activeSessionIdRef.current;
    if (existing) return existing;

    const now = Date.now();
    const id = uid();

    const newSession: ChatSession = {
      id,
      title: questionSeed.slice(0, 40),
      createdAt: now,
      context: { crop, cropOther, location, season, soil },
      messages: [],
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(id);
    return id;
  }

  const filteredSessions = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return sessions;
    return sessions.filter((c) => c.title.toLowerCase().includes(s));
  }, [sessions, search]);

  const activeSession = useMemo(() => {
    if (!activeSessionId) return null;
    return sessions.find((s) => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  /* ================= APPLY ACTION ANSWER ================= */

  useEffect(() => {
    if (!data?.answer) return;

    const sid = pendingSessionIdRef.current || activeSessionIdRef.current;
    if (!sid) return;

    const now = Date.now();

    setSessions((prev) =>
      prev.map((s) =>
        s.id !== sid
          ? s
          : {
              ...s,
              messages: [...s.messages, { role: "ai", content: data.answer!, createdAt: now }],
            }
      )
    );

    pendingSessionIdRef.current = null;
  }, [data?.answer]);

  /* ================= BUTTONS ================= */

  function handleNewChat() {
    setActiveSessionId(null);
    pendingSessionIdRef.current = null;

    setQuestion("");
    setCrop("");
    setCropOther("");
    setLocation("");
    setSeason("");
    setSoil("");
    setSystemMsg(null);
  }

  async function handleCopy() {
    if (!activeSession) return;
    const lastAi = [...activeSession.messages].reverse().find((m) => m.role === "ai");
    if (!lastAi) return;
    await navigator.clipboard.writeText(lastAi.content);
    alert("Copied answer to clipboard.");
  }

  function handleExit() {
    const ok = window.confirm("Are you sure you want to exit?");
    if (!ok) return;

    // clear auth only (keep history or clear? you asked save history, so keep it)
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("role");

    navigate("/", { replace: true });
  }

  /* ================= RENDER ================= */

  return (
    <div className="h-screen flex bg-white">
      {/* Sidebar */}
      <aside className="w-80 border-r bg-gray-50 p-4 flex flex-col gap-3">
        <button
          onClick={handleNewChat}
          className="w-full rounded-md bg-black text-white py-2 text-sm hover:opacity-90"
          type="button"
        >
          + New chat
        </button>

        

        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search chats…" />

        <div className="text-xs text-gray-500 mt-1">Recent</div>

        <div className="flex-1 overflow-auto space-y-2">
          {filteredSessions.length === 0 ? (
            <div className="text-sm text-gray-500 mt-3">No previous chats yet.</div>
          ) : (
            filteredSessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setActiveSessionId(s.id);

                  // restore session context into dropdowns
                  setCrop(s.context.crop || "");
                  setCropOther(s.context.cropOther || "");
                  setLocation(s.context.location || "");
                  setSeason(s.context.season || "");
                  setSoil(s.context.soil || "");

                  setSystemMsg(null);
                }}
                className={[
                  "w-full text-left rounded-md border px-4 py-3 text-sm shadow-sm",
                  s.id === activeSessionId ? "bg-white border-black" : "bg-white/60 hover:bg-white",
                ].join(" ")}
              >
                <div className="font-medium truncate">{s.title}</div>
                <div className="text-xs text-gray-500">{new Date(s.createdAt).toLocaleString()}</div>
              </button>
            ))
          )}
        </div>

        <div className="text-xs text-gray-400">(History is saved locally in this browser)</div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-14 border-b px-6 flex items-center justify-between">
          <div className="font-semibold">Harvest Readiness Assistant</div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
              onClick={handleCopy}
              disabled={!activeSession}
              title="Copy / Share"
            >
              Share
            </button>
            <button
          type="button"
          onClick={handleExit}
                 className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">

          Exit
        </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-6">
          <div className="max-w-3xl mx-auto">
            {systemMsg && (
              <div className="mb-4 rounded-md border bg-yellow-50 px-4 py-2 text-sm text-yellow-900">
                {systemMsg}
              </div>
            )}

            {/* Dropdowns */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Crop *</label>
                <select
                  className="w-full border rounded-md px-2 py-2 text-sm bg-white"
                  value={crop}
                  onChange={(e) => {
                    setCrop(e.target.value);
                    setSystemMsg(null);
                    if (e.target.value !== "Other") setCropOther("");
                  }}
                >
                  <option value="">Select crop</option>
                  {Object.entries(CROP_GROUPS).map(([group, items]) => (
                    <optgroup key={group} label={group}>
                      {items.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="Other">Other</option>
                </select>

                {/* ✅ Other crop input */}
                {crop === "Other" && (
                  <div className="mt-2">
                    <Input
                      value={cropOther}
                      onChange={(e) => setCropOther(e.target.value)}
                      placeholder="Type crop name (e.g., Turmeric)"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-500">Location (optional)</label>
                <select
                  className="w-full border rounded-md px-2 py-2 text-sm bg-white"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  {LOCATIONS.map((l) => (
                    <option key={l} value={l}>
                      {l || "Select location (optional)"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500">Season (optional)</label>
                <select
                  className="w-full border rounded-md px-2 py-2 text-sm bg-white"
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                >
                  {SEASONS.map((s) => (
                    <option key={s} value={s}>
                      {s || "Select season (optional)"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500">Soil (optional)</label>
                <select
                  className="w-full border rounded-md px-2 py-2 text-sm bg-white"
                  value={soil}
                  onChange={(e) => setSoil(e.target.value)}
                >
                  {SOILS.map((s) => (
                    <option key={s} value={s}>
                      {s || "Select soil (optional)"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Chat or Welcome */}
            {!activeSession ? (
              <div className="rounded-xl border bg-gray-50 p-6">
                <h1 className="text-xl font-semibold mb-2">What can I help with?</h1>
                <p className="text-sm text-gray-600 mb-4">
                  Ask a harvest-readiness question. Try one of these:
                </p>

                <div className="flex flex-col gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setQuestion(s)}
                      className="w-full text-left rounded-md border bg-white px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {activeSession.messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
                  >
                    <div
                      className={[
                        "max-w-[80%] px-4 py-3 text-sm",
                        m.role === "user"
                          ? "rounded-md bg-black text-white"
                          : "rounded-md border bg-white shadow-sm",
                      ].join(" ")}
                    >
                      {m.role === "ai" ? (
                        <>
                          <div className="text-xs text-gray-500 mb-2">AI</div>
                          <pre className="whitespace-pre-wrap font-sans text-sm leading-6">
                            {m.content}
                          </pre>
                        </>
                      ) : (
                        m.content
                      )}
                    </div>
                  </div>
                ))}

                {isSubmitting && <div className="text-sm text-gray-600">Thinking…</div>}
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="border-t px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <Form
              method="post"
              className="flex gap-2 items-end"
              onSubmit={(e) => {
                setSystemMsg(null);

                const hasCropFromDropdown = !!crop && crop !== "Other";
                const hasOtherCrop = crop === "Other" && !!cropOther.trim();
                const hasCropInQuestion = questionHasKnownCrop(question);

                if (!hasCropFromDropdown && !hasOtherCrop && !hasCropInQuestion) {
                  e.preventDefault();
                  setSystemMsg(
                    "Please select a crop or choose Other and type the crop."
                  );
                  return;
                }

                const q = question.trim();
                if (!q) {
                  e.preventDefault();
                  return;
                }

                // create/activate session NOW so chat view stays visible
                const sid = ensureSession(q);
                pendingSessionIdRef.current = sid;

                // append user msg immediately
                const now = Date.now();
                setSessions((prev) =>
                  prev.map((s) =>
                    s.id !== sid
                      ? s
                      : {
                          ...s,
                          context: { crop, cropOther, location, season, soil },
                          messages: [
                            ...s.messages,
                            { role: "user", content: q, createdAt: now },
                          ],
                        }
                  )
                );

                // clear input right away
                setQuestion("");
              }}
            >
              <input type="hidden" name="crop" value={crop} />
              <input type="hidden" name="cropOther" value={cropOther} />
              <input type="hidden" name="location" value={location} />
              <input type="hidden" name="season" value={season} />
              <input type="hidden" name="soil" value={soil} />

              <Field className="flex-1">
                <FieldLabel htmlFor="question" className="sr-only">
                  User
                </FieldLabel>
                <Input
                  id="question"
                  name="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a harvest-readiness question…"
                  required
                />
              </Field>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 disabled:opacity-60"
              >
                {isSubmitting ? "..." : "Send"}
              </button>
            </Form>

            <div className="text-xs text-gray-500 mt-2">
              Tip: include what you want to check (moisture, maturity, readiness)for crops.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}





































































{
/* // import { Form, useActionData, useNavigation } from "react-router";
// import type { Route } from "../+types/root";
// import { Input } from "~/components/ui/input";
// import { Field, FieldLabel } from "~/components/ui/field";

// export async function clientAction({ request }: Route.ClientActionArgs) {
//   const formData = await request.formData();
//   const question = String(formData.get("question") || "");

//   const res = await fetch("http://localhost:8000/ask", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ question }),
//   });

//   return res.json(); 
// }

// export default function QuesAns() {
//   const data = useActionData() as { answer?: string } | undefined;
//   const nav = useNavigation();
//   const isSubmitting = nav.state === "submitting";

//   return (
//     <div className="max-w-xl mx-auto p-6">
//       <h1 className="text-xl font-semibold mb-4">Harvest Readiness Q&A</h1>

//       <Form method="post" className="space-y-4">
//         <Field>
//           <FieldLabel htmlFor="question">User</FieldLabel>
//           <Input
//             id="question"
//             name="question"
//             type="text"
//             placeholder="Ask a harvest-readiness question..."
//             required
//           />
//         </Field>

//         <button
//           type="submit"
//           disabled={isSubmitting}
//           className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700 disabled:opacity-60"
//         >
//           {isSubmitting ? "Submitting..." : "Submit"}
//         </button>
//       </Form>

//       <div className="mt-6">
//         <h2 className="font-medium mb-2">AI</h2>
//         <pre className="whitespace-pre-wrap">{data?.answer || ""}</pre>
//       </div>
//     </div>
//   );
// }
 */}
