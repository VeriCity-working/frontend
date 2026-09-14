import Link from "next/link";

const roles = [
  {
    href: "/citizen/login",
    tag: "Citizen",
    accent: "border-ink/20 hover:border-ink",
    dot: "bg-ink",
    title: "Report what needs fixing",
    body: "Snap a live, GPS-tagged photo of a pothole, a dark streetlight, an overflowing bin — and follow it until it's actually resolved.",
    cta: "File or track a complaint"
  },
  {
    href: "/authority/login",
    tag: "Authority",
    accent: "border-steel/30 hover:border-steel",
    dot: "bg-steel",
    title: "Route work, review proof",
    body: "See every complaint in your domain, assign it to the right officer, and sign off only once live evidence backs the fix.",
    cta: "Open the authority dashboard"
  },
  {
    href: "/officer/login",
    tag: "Officer",
    accent: "border-officer/30 hover:border-officer",
    dot: "bg-officer",
    title: "Do the work, prove it",
    body: "Accept assigned cases and submit a live after-photo as your evidence — attributed to you, not to a shared login.",
    cta: "Open the officer portal"
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <div className="flex items-center gap-2 text-sm text-ink-soft">
          <span className="h-2 w-2 rounded-full bg-signal" />
          Every resolution is hash-chained — edits after the fact are detectable
        </div>

        <h1 className="mt-6 max-w-2xl font-display text-4xl leading-tight text-ink sm:text-5xl">
          A pothole reported is easy.
          <br />
          <span className="italic">A pothole verified fixed</span> is the point.
        </h1>

        <p className="mt-5 max-w-xl text-base text-ink-soft">
          VeriCity routes civic complaints from citizen to authority to officer and back —
          with a live photo at filing, a live photo at completion, and the citizen who
          reported it getting the final word. Identity stays separated from the record at
          every step.
        </p>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {roles.map((role) => (
            <Link
              key={role.href}
              href={role.href}
              className={`group flex flex-col justify-between rounded-lg border bg-paper-raised p-6 shadow-card transition-colors ${role.accent}`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${role.dot}`} />
                  <span className="text-xs font-medium uppercase tracking-wide text-ink-soft">
                    {role.tag}
                  </span>
                </div>
                <p className="mt-3 font-display text-xl text-ink">{role.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{role.body}</p>
              </div>
              <p className="mt-6 text-sm font-medium text-ink underline decoration-paper-line underline-offset-4 group-hover:decoration-ink">
                {role.cta} →
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-20 grid gap-x-8 gap-y-6 border-t border-paper-line pt-10 text-sm text-ink-soft sm:grid-cols-4">
          <p><span className="font-medium text-ink">Filed → Assigned.</span> Complaints route automatically to whichever authority currently owns that domain.</p>
          <p><span className="font-medium text-ink">Assigned → Worked.</span> An authority admin picks the officer; the system only ever suggests.</p>
          <p><span className="font-medium text-ink">Worked → Reviewed.</span> Completion needs a live after-photo before an authority can sign off.</p>
          <p><span className="font-medium text-ink">Reviewed → Confirmed.</span> The citizen who filed it has the final say — confirm or reopen.</p>
        </div>
      </div>
    </div>
  );
}
