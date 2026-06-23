"use client";

import { useState } from "react";
import { Field, Select, TextArea, TextInput } from "./Field";
import { TagSelector } from "./TagSelector";
import { ImageUploader } from "./ImageUploader";
import { CONFIDENCE_OPTIONS, LAB_MEMBERS, WORK_TAGS } from "@/lib/constants";
import { todayISO } from "@/lib/format";
import type { ConfidenceLevel, DailyLog } from "@/lib/types";

export type DailyLogInput = Omit<DailyLog, "id" | "createdAt" | "updatedAt">;

const EMPTY: DailyLogInput = {
  date: todayISO(),
  hours: 0,
  labHours: 0,
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

  function addMember(name: string) {
    if (!name || form.workedFor.includes(name)) return;
    set("workedFor", [...form.workedFor, name]);
  }
  function removeMember(name: string) {
    set(
      "workedFor",
      form.workedFor.filter((m) => m !== name)
    );
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

  const availableMembers = LAB_MEMBERS.filter(
    (m) => !form.workedFor.includes(m)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Essentials — fast to fill */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Field label="Date">
          <TextInput
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            required
          />
        </Field>
        <Field label="Hrs on task">
          <TextInput
            type="number"
            inputMode="decimal"
            min={0}
            step={0.5}
            value={form.hours || ""}
            onChange={(e) => set("hours", Number(e.target.value))}
            placeholder="0"
          />
        </Field>
        <Field label="Hrs in lab">
          <TextInput
            type="number"
            inputMode="decimal"
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

      <Field label="Main focus">
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

      {/* Worked for — optional */}
      <Field label="Worked for (optional)" hint="If today's work was for a specific lab member">
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
                  <span className="opacity-70 group-hover:opacity-100">×</span>
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

      <ImageUploader
        value={form.images}
        onChange={(images) => set("images", images)}
        label="Images / screenshots (optional)"
      />

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
