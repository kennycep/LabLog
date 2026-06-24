"use client";

import { useState } from "react";
import { Field, Select, TextArea, TextInput } from "./Field";
import { TagSelector } from "./TagSelector";
import { ImageUploader } from "./ImageUploader";
import { Section } from "./Section";
import { SessionsEditor } from "./SessionsEditor";
import { CONFIDENCE_OPTIONS, LAB_MEMBERS, WORK_TAGS } from "@/lib/constants";
import { todayISO, fmtHours } from "@/lib/format";
import { calculateDailyLabHours, newSession } from "@/lib/time";
import type { ConfidenceLevel, DailyLog } from "@/lib/types";

export type DailyLogInput = Omit<DailyLog, "id" | "createdAt" | "updatedAt">;

function emptyLog(): DailyLogInput {
  return {
    date: todayISO(),
    sessions: [newSession()],
    hoursOnTask: 0,
    manualLabHoursOverride: null,
    focus: "",
    tags: [],
    workedFor: [],
    images: [],
    did: "",
    progress: "",
    filesTouched: "",
    blockers: "",
    tried: "",
    questions: "",
    nextSteps: "",
    confidence: "steady",
  };
}

export function DailyLogForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save log",
}: {
  initial?: Partial<DailyLogInput>;
  onSubmit: (data: DailyLogInput) => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [form, setForm] = useState<DailyLogInput>(() => ({
    ...emptyLog(),
    ...initial,
    sessions:
      initial?.sessions && initial.sessions.length > 0
        ? initial.sessions
        : [newSession()],
  }));
  const [overrideOn, setOverrideOn] = useState(
    initial?.manualLabHoursOverride != null
  );

  function set<K extends keyof DailyLogInput>(key: K, value: DailyLogInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addMember(name: string) {
    if (!name || form.workedFor.includes(name)) return;
    set("workedFor", [...form.workedFor, name]);
  }
  function removeMember(name: string) {
    set("workedFor", form.workedFor.filter((m) => m !== name));
  }

  const sessionLabHours = calculateDailyLabHours(form.sessions, null);
  const effectiveLabHours = overrideOn
    ? form.manualLabHoursOverride ?? 0
    : sessionLabHours;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      ...form,
      focus: form.focus.trim(),
      hoursOnTask: Number(form.hoursOnTask) || 0,
      manualLabHoursOverride: overrideOn
        ? Number(form.manualLabHoursOverride) || 0
        : null,
      // Drop empty/untouched sessions so a blank one doesn't persist.
      sessions: form.sessions.filter(
        (s) => s.timeIn || s.timeOut || s.notes.trim()
      ),
    });
  }

  const availableMembers = LAB_MEMBERS.filter(
    (m) => !form.workedFor.includes(m)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Entry header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Field label="Entry date">
          <TextInput
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            required
            className="w-auto"
          />
        </Field>
        <div className="text-right text-xs text-muted">
          <div>
            Lab time today:{" "}
            <span className="font-semibold text-fg">
              {fmtHours(effectiveLabHours)} h
            </span>
          </div>
          {form.hoursOnTask > 0 && (
            <div>
              Focused:{" "}
              <span className="font-semibold text-fg">
                {fmtHours(form.hoursOnTask)} h
              </span>
            </div>
          )}
        </div>
      </div>

      {/* A — Session time */}
      <Section step="A" title="Session time" hint="time in / out per session">
        <SessionsEditor
          sessions={form.sessions}
          onChange={(sessions) => set("sessions", sessions)}
        />

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Focused task hours"
            hint="Of your lab time, how much was focused task work"
          >
            <TextInput
              type="number"
              inputMode="decimal"
              min={0}
              step={0.5}
              value={form.hoursOnTask || ""}
              onChange={(e) => set("hoursOnTask", Number(e.target.value))}
              placeholder="e.g. 3.5"
            />
          </Field>
          <Field label="Lab hours">
            <div className="flex items-center gap-2">
              {overrideOn ? (
                <TextInput
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.5}
                  value={form.manualLabHoursOverride ?? ""}
                  onChange={(e) =>
                    set("manualLabHoursOverride", Number(e.target.value))
                  }
                  placeholder="0"
                />
              ) : (
                <div className="field flex items-center bg-surface-2/60 text-muted">
                  {fmtHours(sessionLabHours)} h (from sessions)
                </div>
              )}
            </div>
            <label className="mt-1.5 flex cursor-pointer items-center gap-1.5 text-xs text-muted">
              <input
                type="checkbox"
                checked={overrideOn}
                onChange={(e) => {
                  setOverrideOn(e.target.checked);
                  if (e.target.checked && form.manualLabHoursOverride == null)
                    set("manualLabHoursOverride", sessionLabHours);
                }}
                className="h-3.5 w-3.5 rounded border-border accent-[rgb(var(--accent))]"
              />
              Enter lab hours manually
            </label>
          </Field>
        </div>
      </Section>

      {/* B — Main work */}
      <Section step="B" title="Main work">
        <div className="space-y-4">
          <Field label="What are you working on?">
            <TextInput
              value={form.focus}
              onChange={(e) => set("focus", e.target.value)}
              placeholder="e.g. Tracking CounterCuing-01 coder file mismatches"
              autoFocus
            />
          </Field>

          <Field label="Work categories">
            <TagSelector
              options={WORK_TAGS}
              selected={form.tags}
              onChange={(tags) => set("tags", tags)}
            />
          </Field>

          <Field
            label="Worked for (optional)"
            hint="If today's work was for a specific lab member"
          >
            <div className="space-y-2">
              {form.workedFor.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.workedFor.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => removeMember(m)}
                      className="group inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-white"
                    >
                      {m}
                      <span className="opacity-70 group-hover:opacity-100">
                        ×
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {availableMembers.length > 0 && (
                <Select
                  value=""
                  onChange={(e) => {
                    addMember(e.target.value);
                    e.target.value = "";
                  }}
                  options={[
                    { value: "", label: "+ Add a lab member…" },
                    ...availableMembers.map((m) => ({ value: m, label: m })),
                  ]}
                />
              )}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Session notes — what I did">
              <TextArea
                value={form.did}
                onChange={(e) => set("did", e.target.value)}
                placeholder="Concrete actions taken today…"
              />
            </Field>
            <Field label="Progress made">
              <TextArea
                value={form.progress}
                onChange={(e) => set("progress", e.target.value)}
                placeholder="What moved forward…"
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* C — Evidence & files */}
      <Section step="C" title="Evidence & files" collapsible>
        <div className="space-y-4">
          <Field label="Files / datasets / code touched">
            <TextArea
              value={form.filesTouched}
              onChange={(e) => set("filesTouched", e.target.value)}
              className="min-h-[60px]"
              placeholder="e.g. CounterCuing-01/P014_gaze.csv, analysis/flash_count.py"
            />
          </Field>
          <ImageUploader
            value={form.images}
            onChange={(images) => set("images", images)}
            label="Screenshots / photos (optional)"
          />
        </div>
      </Section>

      {/* D — Problems & questions */}
      <Section step="D" title="Problems & open questions" collapsible>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Errors / blockers">
              <TextArea
                value={form.blockers}
                onChange={(e) => set("blockers", e.target.value)}
                placeholder="What got in the way…"
              />
            </Field>
            <Field label="What I tried">
              <TextArea
                value={form.tried}
                onChange={(e) => set("tried", e.target.value)}
                placeholder="Approaches attempted…"
              />
            </Field>
          </div>
          <Field label="Questions for Cameron">
            <TextArea
              value={form.questions}
              onChange={(e) => set("questions", e.target.value)}
              className="min-h-[60px]"
              placeholder="Things to raise with your PI…"
            />
          </Field>
        </div>
      </Section>

      {/* E — Next steps */}
      <Section step="E" title="Wrap-up & next steps">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <Field label="Next steps">
            <TextArea
              value={form.nextSteps}
              onChange={(e) => set("nextSteps", e.target.value)}
              className="min-h-[60px]"
              placeholder="What you'll pick up next…"
            />
          </Field>
          <Field label="How did it go?">
            <Select
              options={CONFIDENCE_OPTIONS}
              value={form.confidence}
              onChange={(e) =>
                set("confidence", e.target.value as ConfidenceLevel)
              }
            />
          </Field>
        </div>
      </Section>

      {/* Sticky action bar — stays reachable on mobile */}
      <div className="sticky bottom-[76px] z-10 -mx-5 flex items-center gap-2 border-t border-border bg-surface/95 px-5 py-3 backdrop-blur sm:bottom-0 sm:mx-0 sm:rounded-none sm:px-0">
        <button type="submit" className="btn-primary flex-1 sm:flex-none">
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
