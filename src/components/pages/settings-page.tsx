import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AppHeader, PageBody } from "@/components/throttle/app-header";
import { TButton } from "@/components/throttle/button";
import { ConfirmDialog, Modal } from "@/components/throttle/dialogs";
import { FormField, TextAreaField } from "@/components/throttle/form-field";
import { Icon } from "@/components/throttle/icon";
import { Switch } from "@/components/ui/switch";
import { useProfile } from "@/hooks/use-profile";
import { useSocial } from "@/hooks/use-social";
import { useTheme } from "@/hooks/use-theme";
import { clearThrottleStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";
import type { FeedbackKind, ThemeMode } from "@/types";

function Section({ icon, title, sub, children }: { icon: string; title: string; sub: string; children: ReactNode }) {
  return (
    <section className="hairline-card min-w-0 p-4">
      <header className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-elevated text-primary">
          <Icon name={icon} className="text-[20px]" />
        </span>
        <div className="min-w-0">
          <h2 className="text-headline-md">{title}</h2>
          <p className="text-sm text-muted-foreground">{sub}</p>
        </div>
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function ToggleRow({ title, sub, checked, onChange, disabled }: { title: string; sub?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={cn("flex items-center justify-between gap-3", disabled && "opacity-50")}>
      <span className="min-w-0">
        <span className="block font-bold">{title}</span>
        {sub && <span className="block text-sm text-muted-foreground">{sub}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </label>
  );
}

function DisabledAction({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-inset p-3">
      <span className="min-w-0">
        <span className="block font-bold">{title}</span>
        <span className="block text-sm text-muted-foreground">{sub}</span>
      </span>
      <span className="shrink-0 rounded-sm bg-elevated px-2 py-1 text-mono-badge text-muted-foreground">Needs accounts</span>
    </div>
  );
}

const HELP_TOPICS: { q: string; a: string }[] = [
  {
    q: "Where is my data stored?",
    a: "Everything in this prototype — bikes, mileage, fuel, posts and settings — is stored in your browser on this device only. Clearing site data or using “Reset demo data” removes it.",
  },
  {
    q: "How is fuel economy calculated?",
    a: "MPG uses the full-to-full method: the miles between two full-tank fill-ups divided by the fuel added at the second fill, converted to UK gallons.",
  },
  {
    q: "How do maintenance reminders work?",
    a: "You set the interval (date or mileage) for each task. THROTTLE compares it with your bike's central odometer reading and flags tasks as upcoming, due soon or overdue.",
  },
  {
    q: "Can I use THROTTLE on another device?",
    a: "Not yet — that needs cloud sync with real accounts, which this prototype doesn't include. Your data stays on this device.",
  },
];

const TERMS_TEXT =
  "THROTTLE is a demonstration prototype. All riders, clubs, rides, prices and stations are fictional sample data. Nothing here constitutes advice; always follow your motorcycle's handbook and UK law. Do not rely on prototype reminders for safety-critical maintenance.";

const PRIVACY_TEXT =
  "This prototype stores all data locally in your browser on this device. Nothing is transmitted to a server, and no account, analytics or tracking is connected. Clearing your browser's site data permanently deletes your garage, community and profile information.";

export function SettingsPage() {
  const { state, updateEmail, setPrivacy, setNotifications, sendFeedback } = useProfile();
  const social = useSocial();
  const { mode, setMode } = useTheme();
  const [resetOpen, setResetOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState(state.profile.email);
  // Re-sync the draft once saved settings hydrate from localStorage.
  useEffect(() => {
    setEmailDraft(state.profile.email);
  }, [state.profile.email]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState<"terms" | "privacy" | null>(null);
  const [feedbackKind, setFeedbackKind] = useState<FeedbackKind>("feedback");
  const [feedbackDraft, setFeedbackDraft] = useState("");

  const blockedRiders = social.state.blockedIds
    .map((id) => social.state.riders.find((r) => r.id === id))
    .filter((r) => r != null);

  const saveEmail = () => {
    const error = updateEmail(emailDraft);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Email updated on this device.");
  };

  const submitFeedback = () => {
    const error = sendFeedback(feedbackKind, feedbackDraft);
    if (error) {
      toast.error(error);
      return;
    }
    setFeedbackDraft("");
    toast.success("Thanks — saved on this device. Nothing is sent in the prototype.");
  };

  return (
    <>
      <AppHeader title="Settings" />
      <PageBody>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Section icon="person" title="Account" sub="Email, password and sign-in">
            <FormField
              label="Email"
              type="email"
              value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
              hint="Stored on this device only — no account system is connected."
            />
            <div className="flex justify-end">
              <TButton variant="outline" onClick={saveEmail}>
                <Icon name="save" /> Save email
              </TButton>
            </div>
            <DisabledAction title="Change password" sub="Requires real accounts via Lovable Cloud." />
            <DisabledAction title="Sign out" sub="There is no session to sign out of in the prototype." />
          </Section>

          <Section icon="lock" title="Privacy" sub="Who can see your profile and activity">
            <ToggleRow
              title="Public profile"
              sub="When off, your profile is marked private."
              checked={state.privacy.publicProfile}
              onChange={(v) => setPrivacy({ publicProfile: v })}
            />
            <ToggleRow
              title="Show location"
              sub="Display your town or city on your profile."
              checked={state.privacy.showLocation}
              onChange={(v) => setPrivacy({ showLocation: v })}
            />
            <ToggleRow
              title="Show garage"
              sub="List your motorcycles on your profile."
              checked={state.privacy.showGarage}
              onChange={(v) => setPrivacy({ showGarage: v })}
            />
            <ToggleRow
              title="Show posts"
              sub="List your posts on your profile."
              checked={state.privacy.showPosts}
              onChange={(v) => setPrivacy({ showPosts: v })}
            />
            <div>
              <p className="mb-2 text-label-caps text-secondary">Blocked riders</p>
              {blockedRiders.length ? (
                <ul className="flex flex-col gap-2">
                  {blockedRiders.map((r) => (
                    <li key={r.id} className="flex items-center justify-between rounded-lg bg-inset p-3">
                      <span className="min-w-0">
                        <span className="block truncate font-bold">{r.name}</span>
                        <span className="block truncate text-sm text-muted-foreground">@{r.username}</span>
                      </span>
                      <TButton
                        variant="outline"
                        onClick={() => {
                          social.unblockRider(r.id);
                          toast.success(`${r.name} unblocked.`);
                        }}
                      >
                        Unblock
                      </TButton>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No blocked riders. Block someone from their post in Community.</p>
              )}
            </div>
          </Section>

          <Section icon="notifications" title="Notifications" sub="Saved preferences — no push in the prototype">
            <ToggleRow
              title="Enable notifications"
              sub="Master switch for all notification types."
              checked={state.notifications.enabled}
              onChange={(v) => setNotifications({ enabled: v })}
            />
            <ToggleRow title="Community" sub="Likes, comments and follows." checked={state.notifications.community} onChange={(v) => setNotifications({ community: v })} disabled={!state.notifications.enabled} />
            <ToggleRow title="Group rides" sub="Invites, updates and cancellations." checked={state.notifications.rides} onChange={(v) => setNotifications({ rides: v })} disabled={!state.notifications.enabled} />
            <ToggleRow title="Clubs" sub="Announcements and membership." checked={state.notifications.clubs} onChange={(v) => setNotifications({ clubs: v })} disabled={!state.notifications.enabled} />
            <ToggleRow title="Account" sub="Security and account notices." checked={state.notifications.account} onChange={(v) => setNotifications({ account: v })} disabled={!state.notifications.enabled} />
          </Section>

          <Section icon="palette" title="Appearance" sub="Racing Archive theme and display">
            <div>
              <p className="mb-2 text-label-caps text-secondary">Theme</p>
              <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-1 rounded-lg bg-elevated p-1">
                {(["light", "dark", "system"] as ThemeMode[]).map((m) => (
                  <button
                    key={m}
                    role="radio"
                    aria-checked={mode === m}
                    onClick={() => setMode(m)}
                    className={cn("h-9 rounded-md text-label-caps capitalize", mode === m ? "bg-background text-primary shadow-soft" : "text-muted-foreground")}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold">Units</span>
              <span className="text-data-md text-muted-foreground">Miles · mpg · GBP £</span>
            </div>
          </Section>

          <Section icon="shield" title="Security" sub="How this prototype handles your data">
            <p className="text-sm text-muted-foreground">
              THROTTLE is a local prototype: there are no accounts, sessions or servers. Every record lives in this
              browser's storage on this device. Real authentication, session management and secure account operations
              require Lovable Cloud.
            </p>
            <TButton variant="outline" onClick={() => setResetOpen(true)}>
              <Icon name="restart_alt" /> Reset demo data
            </TButton>
          </Section>

          <Section icon="support_agent" title="Support" sub="Help, feedback and legal">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <TButton variant="outline" onClick={() => setHelpOpen(true)}>
                <Icon name="help" /> Help centre
              </TButton>
              <TButton variant="outline" onClick={() => setLegalOpen("terms")}>
                <Icon name="gavel" /> Terms &amp; conditions
              </TButton>
              <TButton variant="outline" onClick={() => setLegalOpen("privacy")}>
                <Icon name="policy" /> Privacy policy
              </TButton>
            </div>
            <div>
              <p className="mb-2 text-label-caps text-secondary">Contact us</p>
              <div role="radiogroup" aria-label="Message type" className="mb-2 grid grid-cols-3 gap-1 rounded-lg bg-elevated p-1">
                {(
                  [
                    ["feedback", "Feedback"],
                    ["issue", "Report issue"],
                    ["support", "Support"],
                  ] as [FeedbackKind, string][]
                ).map(([k, label]) => (
                  <button
                    key={k}
                    role="radio"
                    aria-checked={feedbackKind === k}
                    onClick={() => setFeedbackKind(k)}
                    className={cn("h-9 rounded-md text-label-caps", feedbackKind === k ? "bg-background text-primary shadow-soft" : "text-muted-foreground")}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <TextAreaField
                label="Message"
                value={feedbackDraft}
                onChange={(e) => setFeedbackDraft(e.target.value)}
                placeholder="Tell us what's on your mind…"
              />
              <div className="mt-2 flex justify-end">
                <TButton variant="primary" onClick={submitFeedback}>
                  <Icon name="send" /> Send
                </TButton>
              </div>
              {state.feedback.length > 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {state.feedback.length} message{state.feedback.length === 1 ? "" : "s"} saved on this device.
                </p>
              )}
            </div>
          </Section>
        </div>

        <p className="text-center text-mono-badge text-muted-foreground">THROTTLE · Prototype v1</p>
      </PageBody>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset demo data?"
        description="Clears your bikes, mileage, fuel logs, posts, clubs, RSVPs, profile edits and settings on this device."
        confirmLabel="Reset"
        onConfirm={clearThrottleStorage}
      />

      <Modal open={helpOpen} onOpenChange={setHelpOpen} title="Help centre" description="Common questions about the prototype.">
        <ul className="flex flex-col gap-3">
          {HELP_TOPICS.map((t) => (
            <li key={t.q} className="rounded-lg bg-inset p-3">
              <p className="font-bold">{t.q}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t.a}</p>
            </li>
          ))}
        </ul>
      </Modal>

      <Modal
        open={legalOpen !== null}
        onOpenChange={(o) => !o && setLegalOpen(null)}
        title={legalOpen === "terms" ? "Terms & conditions" : "Privacy policy"}
      >
        <p className="text-sm text-muted-foreground">{legalOpen === "terms" ? TERMS_TEXT : PRIVACY_TEXT}</p>
      </Modal>
    </>
  );
}
