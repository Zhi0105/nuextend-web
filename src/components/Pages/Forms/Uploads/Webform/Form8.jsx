// src/features/forms/Form8.jsx
import React, { useEffect, useMemo } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useUserStore } from "@_src/store/auth";
import { DecryptString } from "@_src/utils/helpers";
import { createForm8, updateForm8 } from "@_src/services/formservice";
import { useLocation } from "react-router-dom";

const defaultValues = {
  proposed_title: "",
  introduction: "",
  method: "",
  findings_discussion: "",
  implication_intervention: "",
  // 👇 Use objects so inputs don't render [object Object]
  references: [{ ref: "" }], // at least one row, required
};

const TW_CARD = "shadow-sm rounded-2xl border border-gray-200";
const TW_BTN =
  "px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition";

export const Form8 = ({ onSubmit }) => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { event, formdata } = location.state || {};

  const { token } = useUserStore((s) => ({ token: s.token }));
  const decryptedToken = useMemo(() => token && DecryptString(token), [token]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues, mode: "onBlur" });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "references",
  });

  // Preload / normalize when editing
  useEffect(() => {
    const srcData = Array.isArray(formdata) ? formdata?.[0] : formdata;
    if (srcData) {
      const rest = { ...srcData };
      delete rest.event_id;

      // Normalize references -> array of { ref: string }
      const incoming = Array.isArray(rest.references) ? rest.references : [];
      const normalized =
        incoming.length === 0
          ? [{ ref: "" }]
          : incoming.map((r) => {
              if (typeof r === "string") return { ref: r };
              const candidate =
                r?.ref ??
                r?.reference ??
                r?.value ??
                r?.text ??
                r?.title ??
                (r ? JSON.stringify(r) : "");
              return { ref: `${candidate ?? ""}` };
            });

      rest.references = normalized;
      reset(rest);
    }
  }, [formdata, reset]);

  const { mutate: createMut, isLoading: creating } = useMutation({
    mutationFn: createForm8,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form8"] });
      toast(data?.message || "Form8 created", { type: "success" });
      reset(defaultValues);
    },
    onError: (err) => {
      toast(err?.response?.data?.message || "Error creating Form8", { type: "error" });
    },
  });

  const { mutate: updateMut, isLoading: updating } = useMutation({
    mutationFn: updateForm8,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form8"] });
      toast(data?.message || "Form8 updated", { type: "success" });
    },
    onError: (err) => {
      toast(err?.response?.data?.message || "Error updating Form8", { type: "error" });
    },
  });

  const submit = (data) => {
    // Flatten references to strings for API payload
    const list = Array.isArray(data.references) ? data.references : [];
    const flat = list
      .map((r) => (typeof r === "string" ? r : r?.ref ?? ""))
      .map((s) => (s ?? "").trim())
      .filter((s) => s.length > 0);

    if (flat.length === 0) {
      setError("references", {
        type: "manual",
        message: "At least one reference is required",
      });
      toast("At least one reference is required", { type: "warning" });
      return;
    } else {
      clearErrors("references");
    }

    const srcData = Array.isArray(formdata) ? formdata?.[0] : formdata;
    const payload = {
      ...(srcData?.id && { id: srcData.id }),
      event_id: event?.id,
      ...data,
      references: flat, // 👈 send strings to the API
    };

    onSubmit?.(payload);

    if (srcData) {
      updateMut({ token: decryptedToken, ...payload });
    } else {
      createMut({ token: decryptedToken, ...payload });
    }
  };

  const disabled = creating || updating || isSubmitting;

  // For the preview JSON, show already-flattened refs to avoid confusion
  const preview = (() => {
    const w = watch();
    const flatRefs = Array.isArray(w.references)
      ? w.references.map((r) => (typeof r === "string" ? r : r?.ref ?? ""))
      : [];
    return { event_id: event?.id, ...w, references: flatRefs };
  })();

  return (
    <div className="min-h-screen bg-white w-full flex flex-col items-center sm:pl-[200px] py-20">
      <form onSubmit={handleSubmit(submit)} className="max-w-4xl w-full px-4 space-y-8">
        <Card
          title="Target Group Needs Diagnosis Report (Needs Assessment Report)"
          className={TW_CARD}
        >
          <div className="grid grid-cols-1 gap-6">
            {/* Proposed Title */}
            <div className="flex flex-col">
              <label className="text-sm font-medium">Proposed Title</label>
              <InputText
                {...register("proposed_title", {
                  required: "Proposed Title is required",
                  maxLength: { value: 255, message: "Max 255 characters" },
                })}
                placeholder="Max 255 chars"
                className="p-2 m-1"
              />
              {errors.proposed_title && (
                <span className="text-xs text-red-600 mt-1">
                  {errors.proposed_title.message}
                </span>
              )}
            </div>

            {/* Introduction */}
            <div className="flex flex-col">
              <label className="text-sm font-medium">Introduction</label>
              <Controller
                name="introduction"
                control={control}
                rules={{ required: "Introduction is required" }}
                render={({ field }) => (
                  <InputTextarea
                    {...field}
                    autoResize
                    rows={6}
                    placeholder="Issue to be addressed; target group & reasons for choosing it…"
                    className="p-2 m-1"
                  />
                )}
              />
              {errors.introduction && (
                <span className="text-xs text-red-600 mt-1">
                  {errors.introduction.message}
                </span>
              )}
            </div>

            {/* Method */}
            <div className="flex flex-col">
              <label className="text-sm font-medium">Method</label>
              <Controller
                name="method"
                control={control}
                rules={{ required: "Method is required" }}
                render={({ field }) => (
                  <InputTextarea
                    {...field}
                    autoResize
                    rows={6}
                    placeholder="Data gathering techniques; dates, venues, timeline…"
                    className="p-2 m-1"
                  />
                )}
              />
              {errors.method && (
                <span className="text-xs text-red-600 mt-1">
                  {errors.method.message}
                </span>
              )}
            </div>

            {/* Findings & Discussion */}
            <div className="flex flex-col">
              <label className="text-sm font-medium">Findings and Discussion</label>
              <Controller
                name="findings_discussion"
                control={control}
                rules={{ required: "Findings & Discussion is required" }}
                render={({ field }) => (
                  <InputTextarea
                    {...field}
                    autoResize
                    rows={8}
                    placeholder="Key findings and analysis…"
                    className="p-2 m-1"
                  />
                )}
              />
              {errors.findings_discussion && (
                <span className="text-xs text-red-600 mt-1">
                  {errors.findings_discussion.message}
                </span>
              )}
            </div>

            {/* Implication for Intervention */}
            <div className="flex flex-col">
              <label className="text-sm font-medium">Implication for Intervention</label>
              <Controller
                name="implication_intervention"
                control={control}
                rules={{ required: "Implication for Intervention is required" }}
                render={({ field }) => (
                  <InputTextarea
                    {...field}
                    autoResize
                    rows={6}
                    placeholder="Recommended interventions based on findings…"
                    className="p-2 m-1"
                  />
                )}
              />
              {errors.implication_intervention && (
                <span className="text-xs text-red-600 mt-1">
                  {errors.implication_intervention.message}
                </span>
              )}
            </div>

            {/* References */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">References</label>
                <Button
                  type="button"
                  label="Add"
                  icon="pi pi-plus"
                  className={TW_BTN}
                  onClick={() => append({ ref: "" })}
                />
              </div>

              <div className="space-y-3 mt-2">
                {fields.map((f, idx) => (
                  <div key={f.id} className="flex gap-2 items-start">
                    <InputText
                      {...register(`references.${idx}.ref`, {
                        required: "Reference is required",
                        maxLength: { value: 255, message: "Max 255 characters" },
                        validate: (v) =>
                          (v ?? "").trim().length > 0 || "Reference is required",
                      })}
                      placeholder={`Reference #${idx + 1}`}
                      className="p-2 flex-1"
                    />
                    <Button
                      type="button"
                      icon="pi pi-trash"
                      className={TW_BTN}
                      onClick={() => {
                        if (fields.length > 1) {
                          remove(idx);
                        } else {
                          toast("At least one reference is required", { type: "info" });
                        }
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Per-item errors */}
              <div className="mt-1 space-y-1">
                {Array.isArray(errors.references) &&
                  errors.references.map((err, i) =>
                    err?.ref ? (
                      <div key={`ref-err-${i}`} className="text-xs text-red-600">
                        {err.ref.message}
                      </div>
                    ) : null
                  )}
              </div>

              {/* Top-level error from manual setError */}
              {errors?.references?.message && (
                <span className="text-xs text-red-600 mt-1">
                  {errors.references.message}
                </span>
              )}
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button
            disabled={disabled}
            type="submit"
            label={disabled ? "Submitting..." : (Array.isArray(formdata) ? formdata?.[0] : formdata) ? "Update" : "Submit"}
            icon="pi pi-check"
            className={TW_BTN}
          />
          <Button
            type="button"
            label="Reset"
            icon="pi pi-refresh"
            className={TW_BTN}
            onClick={() => reset(defaultValues)}
          />
        </div>

        <details className="mt-6">
          <summary className="cursor-pointer select-none">Preview JSON (dev)</summary>
          <pre className="bg-gray-50 p-3 rounded overflow-auto text-sm">
            {JSON.stringify(preview, null, 2)}
          </pre>
        </details>
      </form>
    </div>
  );
};
