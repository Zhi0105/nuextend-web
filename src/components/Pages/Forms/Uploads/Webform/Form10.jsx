// src/features/forms/Form10.jsx
import React, { useEffect, useMemo } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Card } from "primereact/card";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useUserStore } from "@_src/store/auth";
import { DecryptString } from "@_src/utils/helpers";
import { createForm10, updateForm10 } from "@_src/services/formservice";
import { useLocation, useNavigate } from "react-router-dom";

const TW_CARD = "shadow-sm rounded-2xl border border-gray-200";
const TW_BTN =
  "px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition";
const TW_ERR = "text-[11px] text-red-600 px-2 pb-2";

const defaultValues = {
  discussion: "",
  oaopb: [{ objectives: "", activities: "", outputs: "", personnel: "", budget: null }],
};

// shared required validator (rejects whitespace-only)
const req = (label) => ({
  required: `${label} is required`,
  validate: (v) => {
    if (label === "Budget") {
      return v !== null && v !== undefined && Number(v) > 0
        ? true
        : "Budget must be greater than 0";
    }
    return v && String(v).trim().length ? true : `${label} is required`;
  },
});

// convert any formatted money string to number (for edit mode)
const toNum = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

export const Form10 = ({ onSubmit }) => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
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
    name: "oaopb",
    keyName: "keyId",
  });

  // Normalize incoming data for edit mode
  useEffect(() => {
    const srcData = Array.isArray(formdata) ? formdata?.[0] : formdata;
    if (!srcData) return;

    const rest = { ...srcData };
    delete rest.event_id;

    const incoming = Array.isArray(rest.oaopb) ? rest.oaopb : [];
    const normalized =
      incoming.length === 0
        ? [{ objectives: "", activities: "", outputs: "", personnel: "", budget: null }]
        : incoming.map((r) => ({
            objectives: r?.objectives ?? r?.objective ?? "",
            activities: r?.activities ?? "",
            outputs: r?.outputs ?? "",
            personnel: r?.personnel ?? "",
            budget: toNum(r?.budget),
          }));

    rest.oaopb = normalized;
    rest.discussion = rest.discussion ?? "";

    reset(rest);
    replace(normalized);
  }, [formdata, reset, replace]);

  // Mutations
  const { mutate: createMut, isLoading: creating } = useMutation({
    mutationFn: createForm10,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form10"] });
      toast(data?.message || "Form10 created", { type: "success" });
      reset(defaultValues);
      replace(defaultValues.oaopb);
      navigate("/event/view");
    },
    onError: (err) => {
      toast(err?.response?.data?.message || "Error creating Form10", { type: "error" });
    },
  });

  const { mutate: updateMut, isLoading: updating } = useMutation({
    mutationFn: updateForm10,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form10"] });
      toast(data?.message || "Form10 updated", { type: "success" });
      navigate("/event/view");
    },
    onError: (err) => {
      toast(err?.response?.data?.message || "Error updating Form10", { type: "error" });
    },
  });

  const disabled = creating || updating || isSubmitting;

  const submit = (data) => {
    const rows = Array.isArray(data.oaopb) ? data.oaopb : [];
    const cleanedRows = rows.map((r) => {
      const n =
        r?.budget === null || r?.budget === undefined ? NaN : Number(r.budget);
      return {
        objectives: (r?.objectives ?? "").trim(),
        activities: (r?.activities ?? "").trim(),
        outputs: (r?.outputs ?? "").trim(),
        personnel: (r?.personnel ?? "").trim(),
        // send as "1234.00" so backend gets a clean numeric string
        budget: Number.isFinite(n) ? n.toFixed(2) : "",
      };
    });

    const srcData = Array.isArray(formdata) ? formdata?.[0] : formdata;

    const payload = {
      ...(srcData?.id && { id: srcData.id }),
      event_id: event?.id, // required by backend
      discussion: (data.discussion ?? "").trim(),
      oaopb: cleanedRows,
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
      discussion: w.discussion,
      oaopb: w.oaopb,
    };
  })();

  return (
    <div className="min-h-screen bg-white w-full flex flex-col items-center sm:pl-[200px] py-20">
      <form onSubmit={handleSubmit(submit)} className="max-w-5xl w-full px-4 space-y-8">
        <Card title="Outreach Project Evaluation and Documentation Report" className={TW_CARD}>
          {/* A. Objectives, Activities, Outputs, Personnel and Budget */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                A. Objectives, Activities, Outputs, Personnel and Budget
              </h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  label="Add Row"
                  icon="pi pi-plus"
                  className={TW_BTN}
                  onClick={() =>
                    append({
                      objectives: "",
                      activities: "",
                      outputs: "",
                      personnel: "",
                      budget: null,
                    })
                  }
                />
                <Button
                  type="button"
                  label="Clear All"
                  icon="pi pi-times"
                  className={TW_BTN}
                  onClick={() =>
                    replace([
                      {
                        objectives: "",
                        activities: "",
                        outputs: "",
                        personnel: "",
                        budget: null,
                      },
                    ])
                  }
                />
              </div>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-5 text-xs font-medium bg-gray-50 border border-gray-200 rounded-t-lg">
              {["Objectives", "Activities", "Outputs", "Personnel", "Budget"].map((h) => (
                <div key={h} className="p-2 border-r last:border-r-0">
                  {h}
                </div>
              ))}
            </div>

            {/* Rows */}
            <div className="border border-t-0 border-gray-200 rounded-b-lg divide-y">
              {fields.map((row, idx) => {
                const rowErrors = errors?.oaopb?.[idx] || {};
                return (
                  <div key={row.keyId} className="grid grid-cols-5 items-stretch">
                    {/* Objectives */}
                    <div className="flex flex-col">
                      <Controller
                        name={`oaopb.${idx}.objectives`}
                        control={control}
                        rules={req("Objectives")}
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

                    {/* Activities */}
                    <div className="flex flex-col">
                      <Controller
                        name={`oaopb.${idx}.activities`}
                        control={control}
                        rules={req("Activities")}
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
                        name={`oaopb.${idx}.outputs`}
                        control={control}
                        rules={req("Outputs")}
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

                    {/* Personnel */}
                    <div className="flex flex-col">
                      <Controller
                        name={`oaopb.${idx}.personnel`}
                        control={control}
                        rules={req("Personnel")}
                        render={({ field }) => (
                          <InputTextarea
                            {...field}
                            autoResize
                            rows={3}
                            className="p-2 m-1"
                            aria-invalid={!!rowErrors.personnel}
                          />
                        )}
                      />
                      {rowErrors.personnel && (
                        <span className={TW_ERR}>{rowErrors.personnel.message}</span>
                      )}
                    </div>

                    {/* Budget + delete */}
                    <div className="flex flex-col">
                      <div className="flex">
                        <Controller
                          name={`oaopb.${idx}.budget`}
                          control={control}
                          rules={req("Budget")}
                          render={({ field }) => (
                            <InputNumber
                              inputId={`budget-${idx}`}
                              value={field.value}
                              onValueChange={(e) => field.onChange(e.value)} // raw number
                              mode="currency"
                              currency="PHP"
                              locale="en-PH"
                              minFractionDigits={2}
                              maxFractionDigits={2}
                              useGrouping
                              className="p-inputtext p-component p-2 m-1 flex-1"
                              inputClassName="w-full"
                              aria-invalid={!!rowErrors.budget}
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
                      {rowErrors.budget && (
                        <span className={TW_ERR}>{rowErrors.budget.message}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* B. Discussion */}
          <div className="mt-8 flex flex-col">
            <label className="text-sm font-medium">B. Discussion</label>
            <Controller
              name="discussion"
              control={control}
              rules={req("Discussion")}
              render={({ field }) => (
                <InputTextarea
                  {...field}
                  autoResize
                  rows={8}
                  placeholder="Discuss project implementation, issues, suggestions, etc."
                  className="p-2 m-1"
                  aria-invalid={!!errors.discussion}
                />
              )}
            />
            {errors.discussion && (
              <span className="text-xs text-red-600 mt-1">
                {errors.discussion.message}
              </span>
            )}
          </div>
        </Card>

        {/* Actions */}
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
              replace(defaultValues.oaopb);
            }}
          />
        </div>

        {/* Dev preview */}
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
