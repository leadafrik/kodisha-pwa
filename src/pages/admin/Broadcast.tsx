import React, { useState } from "react";
import { Mail, Send, Users, CheckCircle, AlertCircle } from "lucide-react";
import { adminApiRequest } from "../../config/api";

type Audience = "all" | "verified" | "sellers" | "buyers";

const AUDIENCE_OPTIONS: { value: Audience; label: string; description: string }[] = [
  { value: "all", label: "All users", description: "Every registered user with an email address" },
  { value: "verified", label: "Verified users", description: "Users who have confirmed their email" },
  { value: "sellers", label: "Sellers only", description: "Users registered as sellers" },
  { value: "buyers", label: "Buyers only", description: "Users registered as buyers" },
];

const AdminBroadcast: React.FC = () => {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      setError("Subject and body are required.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await adminApiRequest("/api/admin/broadcast", {
        method: "POST",
        body: JSON.stringify({ subject, body, audience }),
      });
      setResult(data.data);
    } catch (err: any) {
      setError(err.message || "Broadcast failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FDF5F3] text-[#A0452E]">
            <Mail size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Email broadcast</h1>
            <p className="text-sm text-slate-500">Send a message to your user base</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          {/* Audience */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              <Users size={14} className="mr-1 inline" /> Audience
            </label>
            <div className="grid grid-cols-2 gap-3">
              {AUDIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAudience(opt.value)}
                  className={`rounded-2xl border p-3 text-left text-sm transition ${
                    audience === opt.value
                      ? "border-[#A0452E] bg-[#FDF5F3] text-[#A0452E]"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <p className="font-semibold">{opt.label}</p>
                  <p className="mt-0.5 text-xs opacity-70">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Try the Agrisoko Android app"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#A0452E] focus:ring-2 focus:ring-[#F3C9BE]"
            />
          </div>

          {/* Body */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Message body</label>
            <textarea
              rows={10}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={"Hi,\n\nWrite your message here...\n\nThe Agrisoko Team"}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#A0452E] focus:ring-2 focus:ring-[#F3C9BE]"
            />
            <p className="mt-1 text-xs text-slate-400">
              Plain text only. If the message starts with "Hi," it will be personalised with each user's first name automatically.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Success */}
          {result && (
            <div className="flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>
                Sent to <strong>{result.sent}</strong> of <strong>{result.total}</strong> recipients.
                {result.failed > 0 && ` ${result.failed} failed.`}
              </span>
            </div>
          )}

          {/* Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !subject.trim() || !body.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#A0452E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8B3525] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <Send size={16} />
            )}
            {loading ? "Sending…" : "Send broadcast"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminBroadcast;
