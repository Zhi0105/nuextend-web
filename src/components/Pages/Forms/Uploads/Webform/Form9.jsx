// src/features/forms/Form9.jsx
import React, { useEffect, useMemo } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Card } from "primereact/card";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useUserStore } from "@_src/store/auth";
import { DecryptString } from "@_src/utils/helpers";
import { createForm9, updateForm9 } from "@_src/services/formservice";
import { useLocation } from "react-router-dom";

const TW_CARD = "shadow-sm rounded-2xl border border-gray-200";
const TW_BTN =
  "px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition";
const TW_ERR = "text-[11px] text-red-600 px-2 pb-2";

const defaultValues = {
  findings_discussion: "",
  conclusion_recommendations: "",
  logicModels: [{ objectives: "", inputs: "", activities: "", outputs: "", outcomes: "" }],
};

export const Form9 = ({ onSubmit }) => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { event, formdata } = location.state || {};

  const { token } = useUserStore((s) => ({ token: s.token }));
  const decryptedToken = useMemo(() => token && DecryptString(token), [token]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues, mode: "onBlur" });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "logicModels",
    // Avoid collision with any backend-provided `id` on rows
    keyName: "keyId",
  });

  // Normalize incoming data for edit mode
  useEffect(() => {
    const srcData = Array.isArray(formdata) ? formdata?.[0] : formdata;
    if (!srcData) return;

    const rest = { ...srcData };
    delete rest.event_id;

    // Normalize logicModels -> array of complete row objects
    const incoming = Array.isArray(rest.logic_models) ? rest.logic_models : [];
    const normalized =
      incoming.length === 0
        ? [{ objectives: "", inputs: "", activities: "", outputs: "", outcomes: "" }]
        : incoming.map((r) => ({
            // strip any backend row ids to avoid key collisions
            objectives: r?.objectives ?? r?.objective ?? "",
            inputs: r?.inputs ?? "",
            activities: r?.activities ?? "",
            outputs: r?.outputs ?? "",
            outcomes: r?.outcomes ?? "",
          }));

    rest.logicModels = normalized;
    rest.findings_discussion = rest.findings_discussion ?? "";
    rest.conclusion_recommendations = rest.conclusion_recommendations ?? "";

    // 1) reset form values
    reset(rest);
    // 2) refresh the field array so UI shows populated rows
    replace(normalized);
  }, [formdata, reset, replace]);

  // Mutations
  const { mutate: createMut, isLoading: creating } = useMutation({
    mutationFn: createForm9,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form9"] });
      toast(data?.message || "Form9 created", { type: "success" });
      reset(defaultValues);
      replace(defaultValues.logicModels);
    },
    onError: (err) => {
      toast(err?.response?.data?.message || "Error creating Form9", { type: "error" });
    },
  });

  const { mutate: updateMut, isLoading: updating } = useMutation({
    mutationFn: updateForm9,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form9"] });
      toast(data?.message || "Form9 updated", { type: "success" });
    },
    onError: (err) => {
      toast(err?.response?.data?.message || "Error updating Form9", { type: "error" });
    },
  });

  const disabled = creating || updating || isSubmitting;

  const submit = (data) => {
    // trim all cell strings for neat payload
    const rows = Array.isArray(data.logicModels) ? data.logicModels : [];
    const cleanedRows = rows.map((r) => ({
      objectives: (r?.objectives ?? "").trim(),
      inputs: (r?.inputs ?? "").trim(),
      activities: (r?.activities ?? "").trim(),
      outputs: (r?.outputs ?? "").trim(),
      outcomes: (r?.outcomes ?? "").trim(),
    }));

    const srcData = Array.isArray(formdata) ? formdata?.[0] : formdata;

    const payload = {
      ...(srcData?.id && { id: srcData.id }),
      event_id: event?.id, // required by backend
      findings_discussion: (data.findings_discussion ?? "").trim(),
      conclusion_recommendations: (data.conclusion_recommendations ?? "").trim(),
      logicModels: cleanedRows,
    };

    onSubmit?.(payload);

    if (srcData) {
      updateMut({ token: decryptedToken, ...payload });
    } else {
      createMut({ token: decryptedToken, ...payload });
    }
  };

  // Live preview
  const preview = (() => {
    const w = watch();
    return {
      event_id: event?.id,
      findings_discussion: w.findings_discussion,
      conclusion_recommendations: w.conclusion_recommendations,
      logicModels: w.logicModels,
    };
  })();

  return (
    <div className="min-h-screen bg-white w-full flex flex-col items-center sm:pl-[200px] py-20">
      <form onSubmit={handleSubmit(submit)} className="max-w-5xl w-full px-4 space-y-8">
        <Card title="Extension Program Evaluation and Terminal Report" className={TW_CARD}>
          {/* Program Logic Model */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">A. Program Logic Model</h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  label="Add Row"
                  icon="pi pi-plus"
                  className={TW_BTN}
                  onClick={() =>
                    append({ objectives: "", inputs: "", activities: "", outputs: "", outcomes: "" })
                  }
                />
                <Button
                  type="button"
                  label="Clear All"
                  icon="pi pi-times"
                  className={TW_BTN}
                  onClick={() => {
                    replace([
                      { objectives: "", inputs: "", activities: "", outputs: "", outcomes: "" },
                    ]);
                  }}
                />
              </div>
            </div>

            {/* Table-like grid */}
            <div className="grid grid-cols-5 text-xs font-medium bg-gray-50 border border-gray-200 rounded-t-lg">
              {["Objectives", "Inputs", "Activities", "Outputs", "Outcomes"].map((h) => (
                <div key={h} className="p-2 border-r last:border-r-0">
                  {h}
                </div>
              ))}
            </div>

            <div className="border border-t-0 border-gray-200 rounded-b-lg divide-y">
              {fields.map((row, idx) => {
                const rowErrors = errors?.logicModels?.[idx] || {};
                return (
                  <div key={row.keyId} className="grid grid-cols-5 items-stretch">
                    {/* Objectives */}
                    <div className="flex flex-col">
                      <Controller
                        name={`logicModels.${idx}.objectives`}
                        control={control}
                        rules={{ required: "Objectives is required" }}
                        render={({ field }) => (
                          <InputTextarea
                            {...field}
                            autoResize
                            rows={3}
                            className="p-2 m-1"
                            aria-invalid={!!rowErrors.objectives}
                          />
                        )}
                      />
                      {rowErrors.objectives && (
                        <span className={TW_ERR}>{rowErrors.objectives.message}</span>
                      )}
                    </div>

                    {/* Inputs */}
                    <div className="flex flex-col">
                      <Controller
                        name={`logicModels.${idx}.inputs`}
                        control={control}
                        rules={{ required: "Inputs is required" }}
                        render={({ field }) => (
                          <InputTextarea
                            {...field}
                            autoResize
                            rows={3}
                            className="p-2 m-1"
                            aria-invalid={!!rowErrors.inputs}
                          />
                        )}
                      />
                      {rowErrors.inputs && (
                        <span className={TW_ERR}>{rowErrors.inputs.message}</span>
                      )}
                    </div>

                    {/* Activities */}
                    <div className="flex flex-col">
                      <Controller
                        name={`logicModels.${idx}.activities`}
                        control={control}
                        rules={{ required: "Activities is required" }}
                        render={({ field }) => (
                          <InputTextarea
                            {...field}
                            autoResize
                            rows={3}
                            className="p-2 m-1"
                            aria-invalid={!!rowErrors.activities}
                          />
                        )}
                      />
                      {rowErrors.activities && (
                        <span className={TW_ERR}>{rowErrors.activities.message}</span>
                      )}
                    </div>

                    {/* Outputs */}
                    <div className="flex flex-col">
                      <Controller
                        name={`logicModels.${idx}.outputs`}
                        control={control}
                        rules={{ required: "Outputs is required" }}
                        render={({ field }) => (
                          <InputTextarea
                            {...field}
                            autoResize
                            rows={3}
                            className="p-2 m-1"
                            aria-invalid={!!rowErrors.outputs}
                          />
                        )}
                      />
                      {rowErrors.outputs && (
                        <span className={TW_ERR}>{rowErrors.outputs.message}</span>
                      )}
                    </div>

                    {/* Outcomes + delete */}
                    <div className="flex flex-col">
                      <div className="flex">
                        <Controller
                          name={`logicModels.${idx}.outcomes`}
                          control={control}
                          rules={{ required: "Outcomes is required" }}
                          render={({ field }) => (
                            <InputTextarea
                              {...field}
                              autoResize
                              rows={3}
                              className="p-2 m-1 flex-1"
                              aria-invalid={!!rowErrors.outcomes}
                            />
                          )}
                        />
                        <Button
                          type="button"
                          icon="pi pi-trash"
                          className={`${TW_BTN} m-2 shrink-0`}
                          onClick={() => remove(idx)}
                        />
                      </div>
                      {rowErrors.outcomes && (
                        <span className={TW_ERR}>{rowErrors.outcomes.message}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* B. Findings & Discussion */}
          <div className="mt-8 flex flex-col">
            <label className="text-sm font-medium">B. Findings and Discussion</label>
            <Controller
              name="findings_discussion"
              control={control}
              rules={{ required: "Findings and Discussion is required" }}
              render={({ field }) => (
                <InputTextarea
                  {...field}
                  autoResize
                  rows={8}
                  placeholder="Summarize key findings and discussion…"
                  className="p-2 m-1"
                  aria-invalid={!!errors.findings_discussion}
                />
              )}
            />
            {errors.findings_discussion && (
              <span className="text-xs text-red-600 mt-1">
                {errors.findings_discussion.message}
              </span>
            )}
          </div>

          {/* C. Conclusion & Recommendations */}
          <div className="mt-6 flex flex-col">
            <label className="text-sm font-medium">C. Conclusion and Recommendations</label>
            <Controller
              name="conclusion_recommendations"
              control={control}
              rules={{ required: "Conclusion and Recommendations is required" }}
              render={({ field }) => (
                <InputTextarea
                  {...field}
                  autoResize
                  rows={8}
                  placeholder="Conclusions drawn and recommended actions…"
                  className="p-2 m-1"
                  aria-invalid={!!errors.conclusion_recommendations}
                />
              )}
            />
            {errors.conclusion_recommendations && (
              <span className="text-xs text-red-600 mt-1">
                {errors.conclusion_recommendations.message}
              </span>
            )}
          </div>
        </Card>

        <div className="flex gap-3">
          <Button
            disabled={disabled}
            type="submit"
            label={
              disabled
                ? "Submitting..."
                : (Array.isArray(formdata) ? formdata?.[0] : formdata)
                ? "Update"
                : "Submit"
            }
            icon="pi pi-check"
            className={TW_BTN}
          />
          <Button
            type="button"
            label="Reset"
            icon="pi pi-refresh"
            className={TW_BTN}
            onClick={() => {
              reset(defaultValues);
              replace(defaultValues.logicModels);
            }}
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
