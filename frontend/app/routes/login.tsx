import { useState } from "react"; //useState is used to store and update the value on screen
import { useNavigate } from "react-router";//useNavigate is used to move from one page to another
import { Input } from "~/components/ui/input";

export default function Login() {
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [isFarmer, setIsFarmer] = useState<boolean | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleContinue() { // async- cause it call backend API
  setMsg(null);

  const username = name.trim();

  if (!username) {
    setMsg("Please enter your name.");
    return;
  }

  if (isFarmer === null) {
    setMsg("Please choose Yes or No.");
    return;
  }

  if (!isFarmer) {
    setMsg("This application is designed only for farmers seeking harvest-readiness guidance.");
    return;
  }

  try {
    const res = await fetch("http://localhost:8000/login", { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, is_farmer: true }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setMsg(err?.detail || "Login failed. Please try again.");
      return;
    }

    const data = await res.json();

    localStorage.setItem("user_id", String(data.user_id));
    localStorage.setItem("username", data.username);
    localStorage.setItem("role", data.role);
    localStorage.setItem("isLoggedIn", "true");

    nav("/assistant", { replace: true });
  } catch {
    setMsg("Backend not reachable. Please start FastAPI server.");
  }
}


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Harvest Readiness Assistant</h1>
        <p className="text-sm text-gray-600 mt-1">
          Please confirm you are a farmer to continue.
        </p>

        {msg && (
          <div className="mt-4 rounded-md border bg-yellow-50 px-4 py-2 text-sm text-yellow-900">
            {msg}
          </div>
        )}

        <div className="mt-5 space-y-3">
          <div>
            <label className="text-xs text-black-500">Your name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          <div className="pt-2">
            <div className="text-xs text-black-500 mb-2">Are you a farmer?</div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsFarmer(true)}
                className={[
                  "flex-1 rounded-md border px-4 py-2 text-sm",
                  isFarmer === true
                    ? "border-black bg-black text-white"
                    : "bg-white hover:bg-gray-50",
                ].join(" ")}
              >
                Yes
              </button>

              <button
                type="button"
                onClick={() => setIsFarmer(false)}
                className={[
                  "flex-1 rounded-md border px-4 py-2 text-sm",
                  isFarmer === false
                    ? "border-black bg-black text-white"
                    : "bg-white hover:bg-gray-50",
                ].join(" ")}
              >
                No
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleContinue}
            className="mt-3 w-full rounded-md bg-red-600 text-white py-2 text-sm hover:bg-red-700"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
