"use client";

import { useState } from "react";
import { Field, Select, TextArea, TextInput } from "./Field";
import { TagSelector } from "./TagSelector";
import { CONFIDENCE_OPTIONS, WORK_TAGS } from "@/lib/constants";
import { todayISO } from "@/lib/format";
import type { ConfidenceLevel, DailyLog } from "@/lib/types";

export type DailyLogInput = Omit<DailyLog, "id" | "createdAt" | "updatedAt">;

const EMPTY: DailyLogInput = {
  date: todayISO(),
  hours: 0,
  labHours: 0,
  focus: "",
  tags: [],
  did: "",
  progress: "",
  filesTouched: "",
  blockers: "",
  tried: "",
  questions: "",
  nextSteps: "",
  confidence: "steady",
};

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
  const [form, setForm] = useState<DailyLogInput>({ ...EMPTY, ...initial });

  function set<K extends keyof DailyLogInput>(key: K, value: DailyLogInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      ...form,
      focus: form.focus.trim(),
      hours: Number(form.hours) || 0,
      labHours: Number(form.labHours) || 0,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Top row — the essentials, fast to fill */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Date">
          <TextInput
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            required
          />
        </Field>
        <Field label="Hours on task" hint="Focused work">
          <TextInput
            type="number"
            min={0}
            step={0.5}
            value={form.hours || ""}
            onChange={(e) => set("hours", Number(e.target.value))}
            placeholder="0"
          />
        </Field>
        <Field label="Hours in lab" hint="Total present">
          <TextInput
            type="number"
            min={0}
            step={0.5}
            value={form.labHours || ""}
            onChange={(e) => set("labHours", Number(e.target.value))}
            placeholder="0"
          />
        </Field>
        <Field label="Confidence">
          <Select
            options={CONFIDENCE_OPTIONS}
            value={form.confidence}
            onChange={(e) => set("confidence", e.target.value as ConfidenceLevel)}
          />
        </Field>
      </div>

      <Field label="Main focus" hint="One line — what today was really about">
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="What I did">
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

      <Field label="Files / datasets / code touched">
        <TextArea
          value={form.filesTouched}
          onChange={(e) => set("filesTouched", e.target.value)}
          className="min-h-[60px]"
          placeholder="e.g. CounterCuing-01/P014_gaze.csv, analysis/flash_count.py"
        />
      </Field>

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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Questions for Cameron">
          <TextArea
            value={form.questions}
            onChange={(e) => set("questions", e.target.value)}
            placeholder="Things to ask your PI…"
          />
        </Field>
        <Field label="Next steps">
          <TextArea
            value={form.nextSteps}
            onChange={(e) => set("nextSteps", e.target.value)}
            placeholder="What you'll do next…"
          />
        </Field>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button type="submit" className="btn-primary">
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
