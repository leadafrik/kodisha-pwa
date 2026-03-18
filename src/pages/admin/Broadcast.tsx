import React, { useState, useEffect, useRef } from "react";
import { Mail, MessageSquare, Send, Users, CheckCircle, AlertCircle } from "lucide-react";
import { adminApiRequest } from "../../config/api";

type Audience = "all" | "verified" | "sellers" | "buyers" | "none";
type Channel = "email" | "sms" | "both";

interface BroadcastJob {
  jobId: string;
  total: number;
  sent: number;
  failed: number;
  failedEmails: string[];
  smsSent: number;
  smsFailed: number;
  emailTotal?: number;
  smsTotal?: number;
  status: "running" | "done" | "error";
}

const AUDIENCE_OPTIONS: { value: Audience; label: string; description: string }[] = [
  { value: "all", label: "All users", description: "Every registered user" },
  { value: "verified", label: "Verified users", description: "Users who confirmed their email" },
  { value: "sellers", label: "Sellers only", description: "Users registered as sellers" },
  { value: "buyers", label: "Buyers only", description: "Users registered as buyers" },
  { value: "none", label: "Extra contacts only", description: "Skip the user database" },
];

const CHANNEL_OPTIONS: { value: Channel; label: string; icon: React.ReactNode; description: string }[] = [
  { value: "email", label: "Email", icon: <Mail size={14} />, description: "Send to users with email addresses" },
  { value: "sms", label: "SMS", icon: <MessageSquare size={14} />, description: "Send to users with phone numbers via Africa's Talking" },
  { value: "both", label: "Both", icon: <Send size={14} />, description: "Email where available, SMS where available" },
];

const AdminBroadcast: React.FC = () => {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  const [channel, setChannel] = useState<Channel>("email");
  const [extraContactsRaw, setExtraContactsRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState<BroadcastJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (job?.status === "done" || job?.status === "error") {
      if (pollRef.current) clearInterval(pollRef.current);
      setLoading(false);
    }
  }, [job?.status]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const parseExtraContacts = (raw: string) => {
    const items = raw.split(/[,\n;]+/).map((s) => s.trim()).filter(Boolean);
    const emails = items.filter((s) => s.includes("@"));
    const phones = items.filter((s) => !s.includes("@"));
    return { emails, phones, all: items };
  };

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
    const { all: extraContacts } = parseExtraContacts(extraContactsRaw);
    const needsSubject = channel === "email" || channel === "both";
    if (needsSubject && !subject.trim()) {
      setError("Subject is required for email broadcasts.");
      return;
    }
    if (!body.trim()) {
      setError("Message body is required.");
      return;
    }
    if (audience === "none" && extraContacts.length === 0) {
      setError("Add at least one contact in the extra contacts field.");
      return;
    }
    setLoading(true);
    setError(null);
    setJob(null);
    try {
      const data = await adminApiRequest("/admin/broadcast", {
        method: "POST",
        body: JSON.stringify({
          subject,
          body,
          audience,
          channel,
          extraContacts: extraContacts.join("\n"),
        }),
      });
      const { jobId, total, emailTotal, smsTotal } = data.data;
      setJob({ jobId, total, sent: 0, failed: 0, failedEmails: [], smsSent: 0, smsFailed: 0, emailTotal, smsTotal, status: "running" });
      startPolling(jobId);
    } catch (err: any) {
      setError(err.message || "Broadcast failed.");
      setLoading(false);
    }
  };

  const { emails: detectedEmails, phones: detectedPhones } = parseExtraContacts(extraContactsRaw);
  const detectedCount = detectedEmails.length + detectedPhones.length;
  const pct = job ? Math.round(((job.sent + job.failed + job.smsSent + job.smsFailed) / job.total) * 100) : 0;
  const isDone = job?.status === "done";
  const isRunning = job?.status === "running";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FDF5F3] text-[#A0452E]">
            <Send size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Broadcast</h1>
            <p className="text-sm text-slate-500">Send a message to your user base via email or SMS</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">

          {/* Channel */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Channel</label>
            <div className="flex gap-2">
              {CHANNEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setChannel(opt.value)}
                  disabled={loading}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-2xl border p-3 text-sm transition ${
                    channel === opt.value
                      ? "border-[#A0452E] bg-[#FDF5F3] text-[#A0452E]"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  } disabled:opacity-50`}
                >
                  {opt.icon}
                  <span className="font-semibold">{opt.label}</span>
                  <span className="text-center text-xs opacity-70">{opt.description}</span>
                </button>
              ))}
            </div>
          </div>

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

          {/* Subject — only shown for email/both */}
          {(channel === "email" || channel === "both") && (
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
          )}

          {/* Body */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Message</label>
            <textarea
              rows={channel === "sms" ? 4 : 10}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={loading}
              placeholder={channel === "sms"
                ? "Keep it under 160 characters for a single SMS.\n\nYour Agrisoko Team"
                : "Hi,\n\nWrite your message here...\n\nThe Agrisoko Team"}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#A0452E] focus:ring-2 focus:ring-[#F3C9BE] disabled:opacity-50"
            />
            {channel === "sms" && (
              <p className={`mt-1 text-xs font-medium ${body.length > 160 ? "text-amber-600" : "text-slate-400"}`}>
                {body.length} characters{body.length > 160 ? ` — will send as ${Math.ceil(body.length / 153)} SMS parts` : " (single SMS)"}
              </p>
            )}
            {channel === "email" && (
              <p className="mt-1 text-xs text-slate-400">
                Plain text only. If the message starts with "Hi," it will be personalised with each user's first name automatically.
              </p>
            )}
          </div>

          {/* Extra contacts */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Additional contacts <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              rows={4}
              value={extraContactsRaw}
              onChange={(e) => setExtraContactsRaw(e.target.value)}
              disabled={loading}
              placeholder={"Emails and/or phone numbers, one per line or comma-separated:\njohn@example.com\n0712345678\njane@example.com, 0798765432"}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#A0452E] focus:ring-2 focus:ring-[#F3C9BE] disabled:opacity-50"
            />
            {extraContactsRaw.trim() && (
              <p className="mt-1 text-xs text-[#A0452E] font-medium">
                {detectedEmails.length > 0 && `${detectedEmails.length} email${detectedEmails.length !== 1 ? "s" : ""}`}
                {detectedEmails.length > 0 && detectedPhones.length > 0 && " · "}
                {detectedPhones.length > 0 && `${detectedPhones.length} phone number${detectedPhones.length !== 1 ? "s" : ""}`}
                {detectedCount > 0 && " detected"}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Emails are sent via email. Phone numbers are sent via SMS. Duplicates removed automatically.
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
                  {isDone ? "Done" : `Sending… ${job.sent + job.failed + job.smsSent + job.smsFailed} / ${job.total}`}
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
                      {job.sent > 0 && <><Mail size={12} className="inline mr-1" />Email: <strong>{job.sent}</strong> sent{job.failed > 0 ? `, ${job.failed} failed` : ""}. </>}
                      {job.smsSent > 0 && <><MessageSquare size={12} className="inline mr-1" />SMS: <strong>{job.smsSent}</strong> sent{job.smsFailed > 0 ? `, ${job.smsFailed} failed` : ""}.</>}
                    </span>
                  </div>
                  {job.failedEmails?.length > 0 && (
                    <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-rose-700">{job.failedEmails.length} failed emails — paste below to retry</p>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(job.failedEmails.join("\n"));
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition"
                        >
                          {copied ? "Copied!" : "Copy all"}
                        </button>
                      </div>
                      <pre className="max-h-40 overflow-y-auto text-xs text-rose-700 whitespace-pre-wrap break-all">
                        {job.failedEmails.join("\n")}
                      </pre>
                    </div>
                  )}
                </div>
              )}
              {isRunning && (
                <p className="text-xs text-slate-400">Safe to leave — sending continues in the background.</p>
              )}
            </div>
          )}

          {/* Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !body.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#A0452E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8B3525] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <Send size={16} />
            )}
            {loading ? "Sending in background…" : `Send ${channel === "both" ? "email + SMS" : channel} broadcast`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminBroadcast;
