import React, { useState, useEffect, useRef } from "react";
import { Mail, Send, Users, CheckCircle, AlertCircle } from "lucide-react";
import { adminApiRequest } from "../../config/api";

type Audience = "all" | "verified" | "sellers" | "buyers" | "none";

interface BroadcastJob {
  jobId: string;
  total: number;
  sent: number;
  failed: number;
  failedEmails: string[];
  status: "running" | "done" | "error";
}

const AUDIENCE_OPTIONS: { value: Audience; label: string; description: string }[] = [
  { value: "all", label: "All users", description: "Every registered user with an email address" },
  { value: "verified", label: "Verified users", description: "Users who have confirmed their email" },
  { value: "sellers", label: "Sellers only", description: "Users registered as sellers" },
  { value: "buyers", label: "Buyers only", description: "Users registered as buyers" },
  { value: "none", label: "Extra emails only", description: "Skip the user database — send to the addresses below only" },
];

const AdminBroadcast: React.FC = () => {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  const [extraEmailsRaw, setExtraEmailsRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState<BroadcastJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stop polling when job is done
  useEffect(() => {
    if (job?.status === "done" || job?.status === "error") {
      if (pollRef.current) clearInterval(pollRef.current);
      setLoading(false);
    }
  }, [job?.status]);

  // Clean up on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const parseExtraEmails = (raw: string): string[] =>
    raw
      .split(/[,\n;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.includes("@"));

  const startPolling = (jobId: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await adminApiRequest(`/admin/broadcast/${jobId}`);
        setJob(res.data);
      } catch {
        // ignore transient poll errors
      }
    }, 2000);
  };

  const handleSend = async () => {
    const extraEmails = parseExtraEmails(extraEmailsRaw);
    if (!subject.trim() || !body.trim()) {
      setError("Subject and body are required.");
      return;
    }
    if (audience === "none" && extraEmails.length === 0) {
      setError("Add at least one email address in the extra emails field.");
      return;
    }
    setLoading(true);
    setError(null);
    setJob(null);
    try {
      const data = await adminApiRequest("/admin/broadcast", {
        method: "POST",
        body: JSON.stringify({ subject, body, audience, extraEmails }),
      });
      const { jobId, total } = data.data;
      setJob({ jobId, total, sent: 0, failed: 0, status: "running" });
      startPolling(jobId);
    } catch (err: any) {
      setError(err.message || "Broadcast failed.");
      setLoading(false);
    }
  };

  const pct = job ? Math.round(((job.sent + job.failed) / job.total) * 100) : 0;
  const isDone = job?.status === "done";
  const isRunning = job?.status === "running";

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
                  disabled={loading}
                  className={`rounded-2xl border p-3 text-left text-sm transition ${
                    audience === opt.value
                      ? "border-[#A0452E] bg-[#FDF5F3] text-[#A0452E]"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  } disabled:opacity-50`}
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
              disabled={loading}
              placeholder="e.g. Try the Agrisoko Android app"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#A0452E] focus:ring-2 focus:ring-[#F3C9BE] disabled:opacity-50"
            />
          </div>

          {/* Body */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Message body</label>
            <textarea
              rows={10}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={loading}
              placeholder={"Hi,\n\nWrite your message here...\n\nThe Agrisoko Team"}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#A0452E] focus:ring-2 focus:ring-[#F3C9BE] disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-slate-400">
              Plain text only. If the message starts with "Hi," it will be personalised with each user's first name automatically.
            </p>
          </div>

          {/* Extra emails */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Additional email addresses <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              rows={4}
              value={extraEmailsRaw}
              onChange={(e) => setExtraEmailsRaw(e.target.value)}
              disabled={loading}
              placeholder={"Paste extra addresses here, one per line or comma-separated:\njohn@example.com\njane@example.com, someone@gmail.com"}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#A0452E] focus:ring-2 focus:ring-[#F3C9BE] disabled:opacity-50"
            />
            {extraEmailsRaw.trim() && (
              <p className="mt-1 text-xs text-[#A0452E] font-medium">
                {parseExtraEmails(extraEmailsRaw).length} valid address{parseExtraEmails(extraEmailsRaw).length === 1 ? "" : "es"} detected
              </p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              These will be merged with the audience above. Duplicates are removed automatically.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Live progress */}
          {job && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">
                  {isDone ? "Done" : `Sending… ${job.sent + job.failed} / ${job.total}`}
                </span>
                <span className="text-slate-400">{pct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isDone ? "bg-emerald-500" : "bg-[#A0452E]"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {isDone && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 pt-1 text-sm text-emerald-700">
                    <CheckCircle size={15} className="flex-shrink-0" />
                    <span>
                      Sent to <strong>{job.sent}</strong> of <strong>{job.total}</strong> recipients.
                      {job.failed > 0 && ` ${job.failed} failed.`}
                    </span>
                  </div>
                  {job.failedEmails?.length > 0 && (
                    <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-rose-700">{job.failedEmails.length} failed addresses — paste these into the extra emails field to retry</p>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(job.failedEmails.join('\n'));
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition"
                        >
                          {copied ? "Copied!" : "Copy all"}
                        </button>
                      </div>
                      <pre className="max-h-40 overflow-y-auto text-xs text-rose-700 whitespace-pre-wrap break-all">
                        {job.failedEmails.join('\n')}
                      </pre>
                    </div>
                  )}
                </div>
              )}
              {isRunning && (
                <p className="text-xs text-slate-400">The page is safe to leave — sending continues in the background.</p>
              )}
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
            {loading ? "Sending in background…" : "Send broadcast"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminBroadcast;
