import React, { useEffect, useMemo } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Fieldset } from "primereact/fieldset";
import { getEventTypes } from "@_src/services/event";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useUserStore } from '@_src/store/auth';
import { DecryptString } from "@_src/utils/helpers";
import { createForm2, updateForm2 } from "@_src/services/formservice";
import { useLocation } from "react-router-dom";

const Err = ({ message }) =>
  message ? <small className="p-error block mt-1">{message}</small> : null;

const REQUIRED = { required: "Required" };
const numberRules = {
  validate: (v) =>
    v === undefined || v === null || v === "" || Number(v) >= 0 || "Dapat hindi negative.",
};

const toYMD = (d) => {
    if (!d) return undefined;
    const dt = d instanceof Date ? d : new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};
const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));


export const Form2 = () => {
  const queryClient = useQueryClient()
  const location = useLocation()
  const { event, formdata } = location.state
  const { token } = useUserStore((state) => ({ token: state.token }));
  const decryptedToken = token && DecryptString(token)

  const { mutate: handleCreateForm2, isLoading: createForm2Loading } = useMutation({
        mutationFn: createForm2,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['project'] });
            toast(data.message, { type: "success" })
            reset()
            }, 
        onError: (error) => {
            toast(error?.response.data.message, { type: "warning" })

            console.log("@CPPE:", error)
        },
  });
  const { mutate: handleUpdateForm2, isLoading: updateForm2Loading } = useMutation({
      mutationFn: updateForm2,
      onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: ['project'] });
          toast(data.message, { type: "success" })
          }, 
      onError: (error) => {
          toast(error?.response.data.message, { type: "warning" })

          console.log("@UPPE:", error)
      },
  });
      

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      // top-level
      event_type_id: "",
      proponents: "",
      collaborators: "",
      participants: null,
      partners: "",
      implementationDate: null ,
      area: "",
      budgetRequirement: null,
      budgetRequested: null,
      background: "",
      otherInfo: "",

      // arrays that match Laravel keys
      project_objectives: [{ objectives: "", strategies: "" }],
      project_impact_outcomes: [{ impact: "", outcome: "", linkage: "" }],
      project_risks: [{ risk_identification: "", risk_mitigation: "" }],
      project_staffings: [{ staff: "", responsibilities: "", contact: "" }],
      project_work_plans: [
        {
          phaseDate: "",
          activities: "",
          targets: "",
          indicators: "",
          personnel: "",
          resources: "",
          cost: null ,
        },
      ],
      project_detailed_budgets: [
        { item: "", description: "", quantity: null, amount: null , source: "" },
      ],
    },
    mode: "onSubmit",
  });


useEffect(() => {
  if (formdata && formdata.length > 0) {
    const fd = formdata[0];
    console.log(fd)

    reset({
      event_type_id: fd.event_type_id || "",
      proponents: fd.proponents || "",
      collaborators: fd.collaborators || "",
      participants: fd.participants ?? null,
      partners: fd.partners || "",
      implementationDate: fd.implementationDate ? new Date(fd.implementationDate) : null,
      area: fd.area || "",
      budgetRequirement: fd.budgetRequirement ?? null,
      budgetRequested: fd.budgetRequested ?? null,
      background: fd.background || "",
      otherInfo: fd.otherInfo || "",
      project_objectives: fd.objectives?.length
        ? fd.objectives
        : [{ objectives: "", strategies: "" }],
      project_impact_outcomes: fd.impact_outcomes?.length
        ? fd.impact_outcomes
        : [{ impact: "", outcome: "", linkage: "" }],
      project_risks: fd.risks?.length
        ? fd.risks
        : [{ risk_identification: "", risk_mitigation: "" }],
      project_staffings: fd.staffings?.length
        ? fd.staffings
        : [{ staff: "", responsibilities: "", contact: "" }],
      project_work_plans: fd.work_plans?.length
        ? fd.work_plans
        : [{
            phaseDate: "",
            activities: "",
            targets: "",
            indicators: "",
            personnel: "",
            resources: "",
            cost: null,
          }],
      project_detailed_budgets: fd.detailed_budgets?.length
        ? fd.detailed_budgets
        : [{ item: "", description: "", quantity: null, amount: null, source: "" }],
    });
  }
}, [formdata, reset]);


  // ---------- event types (from API) ----------
  const {
    data: eventTypeData,
    isLoading: etLoading,
    isError: etError,
  } = getEventTypes();

  // normalize to {label, value}
  const eventTypeOptions = useMemo(() => {
    const src = Array.isArray(eventTypeData) ? eventTypeData : [];
    const normalized = src.map((it) => ({
      label: it?.label ?? it?.name ?? it?.title ?? String(it?.value ?? it?.id ?? ""),
      value: it?.value ?? it?.id ?? "",
    }));
    return [...normalized];
  }, [eventTypeData]);
  // -------------------------------------------

  // Field arrays
  const objectivesFA = useFieldArray({ control, name: "project_objectives" });
  const impactFA = useFieldArray({ control, name: "project_impact_outcomes" });
  const risksFA = useFieldArray({ control, name: "project_risks" });
  const staffingFA = useFieldArray({ control, name: "project_staffings" });
  const workPlanFA = useFieldArray({ control, name: "project_work_plans" });
  const budgetsFA = useFieldArray({ control, name: "project_detailed_budgets" });

  const onSubmit = (data) => {
    const payload = {
    ...(formdata?.[0]?.id && { id: formdata[0].id }),
    event_id: event?.id,
    event_type_id: data.event_type_id,
    proponents: data.proponents,
    collaborators: data.collaborators,
    participants: data.participants,
    partners: data.partners,
    implementationDate: toYMD(data.implementationDate),
    area: data.area,
    budgetRequested: num(data.budgetRequested),
    budgetRequirement: num(data.budgetRequirement),
    background: data.background,
    otherInfo: data.otherInfo,
    project_objectives: (data.project_objectives ?? []).map((r) => ({
      objectives: r.objectives,
      strategies: r.strategies,
    })),
    project_impact_outcomes: (data.project_impact_outcomes ?? []).map((r) => ({
      impact: r.impact,
      linkage: r.linkage,
      outcome: r.outcome,
    })),
    project_risks: (data.project_risks ?? []).map((r) => ({
      risk_identification: r.risk_identification,
      risk_mitigation: r.risk_mitigation,
    })),
    project_staffings: (data.project_staffings ?? []).map((r) => ({
      staff: r.staff,
      contact: r.contact,
      responsibilities: r.responsibilities,
    })),
    project_work_plans: (data.project_work_plans ?? []).map((r) => ({
      phaseDate: r.phaseDate,
      activities: r.activities,
      targets: r.targets,
      indicators: r.indicators,
      personnel: r.personnel,
      resources: r.resources,
      cost: num(r.cost),   // 👈 normalize
    })),
    project_detailed_budgets: (data.project_detailed_budgets ?? []).map((r) => ({
      item: r.item,
      description: r.description,
      quantity: r.quantity,
      amount: num(r.amount),
      source: r.source,
    })),
  };

    if(formdata) {
        handleUpdateForm2({
            token: decryptedToken,
            ...payload
        })
    } else {
        handleCreateForm2({
        token: decryptedToken,
        ...payload
    })
    }
  };

  return (
    <div className="form2-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-12 w-full max-w-6xl px-4">
        <Card title={<div className="text-2xl font-bold">Project Proposal Form</div>} className="shadow-2 rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* event_type_id (required) */}
            <div>
              <label className="block mb-2">Type of Project</label>
              <Controller
                control={control}
                name="event_type_id"
                rules={REQUIRED}
                render={({ field }) => (
                  <Dropdown
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={eventTypeOptions}
                    optionLabel="label"
                    optionValue="value"
                    placeholder={etLoading ? "Loading types..." : "Select type"}
                    className={`w-full ${errors.event_type_id ? "p-invalid" : ""}`}
                    disabled={etLoading}
                    loading={etLoading}
                  />
                )}
              />
              <Err message={errors.event_type_id?.message} />
              {etError && <small className="p-error block mt-1">Failed to load event types.</small>}
            </div>

            {/* proponents (required) */}
            <div>
              <label className="block mb-2">Project Proponents</label>
              <InputText
                {...register("proponents", REQUIRED)}
                className={`w-full py-1 px-4 border ${errors.proponents ? "p-invalid border-red-300" : "border-gray-300"}`}
              />
              <Err message={errors.proponents?.message} />
            </div>

            {/* collaborators (required) */}
            <div>
              <label className="block mb-2">Project Collaborators</label>
              <InputText
                {...register("collaborators", REQUIRED)}
                className={`w-full py-1 px-4 border ${errors.collaborators ? "p-invalid border-red-300" : "border-gray-300"}`}
              />
              <Err message={errors.collaborators?.message} />
            </div>

            {/* participants (numberRules) */}
            <div>
              <label className="block mb-2">Number of Participants</label>
              <Controller
                control={control}
                name="participants"
                rules={numberRules}
                render={({ field }) => (
                  <InputNumber
                    value={field.value ?? null}                 // never undefined
                    onValueChange={(e) => field.onChange(e.value ?? null)}
                    inputClassName="px-4 py-1 border border-gray-300"
                    className={`w-full ${errors.participants ? "p-invalid" : ""}`}
                  />
                )}
              />
              <Err message={errors.participants?.message} />
            </div>

            {/* partners (optional) */}
            <div>
              <label className="block mb-2">Project Partners</label>
              <InputText
                {...register("partners")}
                className="w-full py-1 px-4 border border-gray-300"
              />
            </div>

            {/* implementationDate (required) */}
            <div>
              <label className="block mb-2">Date of Implementation</label>
              <Controller
                control={control}
                name="implementationDate"
                rules={REQUIRED}
                render={({ field }) => (
                  <Calendar
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    dateFormat="mm/dd/yy"
                    showIcon
                    className={`w-full ${errors.implementationDate ? "p-invalid" : ""}`}
                  />
                )}
              />
              <Err message={errors.implementationDate?.message} />
            </div>

            {/* area (required) */}
            <div className="md:col-span-2">
              <label className="block mb-2">Area of Project Implementation</label>
              <InputTextarea
                rows={2}
                autoResize
                {...register("area", REQUIRED)}
                className={`w-full py-1 px-4 border ${errors.area ? "p-invalid border-red-300" : "border-gray-300"}`}
              />
              <Err message={errors.area?.message} />
            </div>

            {/* budgetRequirement (numberRules) */}
            <div>
              <label className="block mb-2">Budget Requirement</label>
              <Controller
                control={control}
                name="budgetRequirement"
                rules={numberRules}
                render={({ field }) => (
                  <InputNumber
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="currency"
                    currency="PHP"
                    locale="en-PH"
                    placeholder="0.00"
                    inputClassName="px-4 py-1 border border-gray-300"
                    className={`w-full ${errors.budgetRequirement ? "p-invalid" : ""}`}
                  />
                )}
              />
              <Err message={errors.budgetRequirement?.message} />
            </div>

            {/* budgetRequested (numberRules) */}
            <div>
              <label className="block mb-2">Budget Requested</label>
              <Controller
                control={control}
                name="budgetRequested"
                rules={numberRules}
                render={({ field }) => (
                  <InputNumber
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="currency"
                    currency="PHP"
                    locale="en-PH"
                    placeholder="0.00"
                    inputClassName="px-4 py-1 border border-gray-300"
                    className={`w-full ${errors.budgetRequested ? "p-invalid" : ""}`}
                  />
                )}
              />
              <Err message={errors.budgetRequested?.message} />
            </div>

            {/* background (required) */}
            <div className="md:col-span-2">
              <label className="block mb-2">Background / Situation Analysis</label>
              <InputTextarea
                rows={3}
                autoResize
                {...register("background", REQUIRED)}
                className={`w-full py-1 px-4 border ${errors.background ? "p-invalid border-red-300" : "border-gray-300"}`}
              />
              <Err message={errors.background?.message} />
            </div>
          </div>
        </Card>

        {/* Objectives & Strategies */}
        <Fieldset legend="Project Objectives & Strategies">
          <div className="space-y-8">
            {objectivesFA.fields.map((field, idx) => (
              <Card key={field.id} className="shadow-1 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block mb-2">Objective</label>
                    <InputTextarea
                      rows={2}
                      autoResize
                      {...register(`project_objectives.${idx}.objectives`, REQUIRED)}
                      className={`w-full py-1 px-4 border ${errors?.project_objectives?.[idx]?.objectives ? "p-invalid border-red-300" : "border-gray-300"}`}
                    />
                    <Err message={errors?.project_objectives?.[idx]?.objectives?.message} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-2">Strategies</label>
                    <InputTextarea
                      rows={2}
                      autoResize
                      {...register(`project_objectives.${idx}.strategies`, REQUIRED)}
                      className={`w-full py-1 px-4 border ${errors?.project_objectives?.[idx]?.strategies ? "p-invalid border-red-300" : "border-gray-300"}`}
                    />
                    <Err message={errors?.project_objectives?.[idx]?.strategies?.message} />
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    icon="pi pi-plus"
                    label="Add"
                    onClick={() => objectivesFA.append({ objectives: "", strategies: "" })}
                  />
                  {objectivesFA.fields.length > 1 && (
                    <Button
                      type="button"
                      icon="pi pi-trash"
                      label="Remove"
                      severity="danger"
                      onClick={() => objectivesFA.remove(idx)}
                    />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Fieldset>

        {/* Impact & Outcomes */}
        <Fieldset legend="Desired Impact & Outcomes">
          <div className="space-y-8">
            {impactFA.fields.map((field, idx) => (
              <Card key={field.id} className="shadow-1 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block mb-2">Impact</label>
                    <InputTextarea
                      rows={2}
                      autoResize
                      {...register(`project_impact_outcomes.${idx}.impact`, REQUIRED)}
                      className={`w-full py-1 px-4 border ${errors?.project_impact_outcomes?.[idx]?.impact ? "p-invalid border-red-300" : "border-gray-300"}`}
                    />
                    <Err message={errors?.project_impact_outcomes?.[idx]?.impact?.message} />
                  </div>
                  <div>
                    <label className="block mb-2">Outcome</label>
                    <InputTextarea
                      rows={2}
                      autoResize
                      {...register(`project_impact_outcomes.${idx}.outcome`, REQUIRED)}
                      className={`w-full py-1 px-4 border ${errors?.project_impact_outcomes?.[idx]?.outcome ? "p-invalid border-red-300" : "border-gray-300"}`}
                    />
                    <Err message={errors?.project_impact_outcomes?.[idx]?.outcome?.message} />
                  </div>
                  <div>
                    <label className="block mb-2">Linkage</label>
                    <InputTextarea
                      rows={2}
                      autoResize
                      {...register(`project_impact_outcomes.${idx}.linkage`)}
                      className="w-full py-1 px-4 border border-gray-300"
                    />
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    icon="pi pi-plus"
                    label="Add"
                    onClick={() => impactFA.append({ impact: "", outcome: "", linkage: "" })}
                  />
                  {impactFA.fields.length > 1 && (
                    <Button
                      type="button"
                      icon="pi pi-trash"
                      label="Remove"
                      severity="danger"
                      onClick={() => impactFA.remove(idx)}
                    />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Fieldset>

        {/* Risk Management */}
        <Fieldset legend="Risk Management">
          <div className="space-y-8">
            {risksFA.fields.map((field, idx) => (
              <Card key={field.id} className="shadow-1 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2">Risk Identification</label>
                    <InputTextarea
                      rows={2}
                      autoResize
                      {...register(`project_risks.${idx}.risk_identification`, REQUIRED)}
                      className={`w-full py-1 px-4 border ${errors?.project_risks?.[idx]?.risk_identification ? "p-invalid border-red-300" : "border-gray-300"}`}
                    />
                    <Err message={errors?.project_risks?.[idx]?.risk_identification?.message} />
                  </div>
                  <div>
                    <label className="block mb-2">Risk Mitigation</label>
                    <InputTextarea
                      rows={2}
                      autoResize
                      {...register(`project_risks.${idx}.risk_mitigation`, REQUIRED)}
                      className={`w-full py-1 px-4 border ${errors?.project_risks?.[idx]?.risk_mitigation ? "p-invalid border-red-300" : "border-gray-300"}`}
                    />
                    <Err message={errors?.project_risks?.[idx]?.risk_mitigation?.message} />
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    icon="pi pi-plus"
                    label="Add"
                    onClick={() => risksFA.append({ risk_identification: "", risk_mitigation: "" })}
                  />
                  {risksFA.fields.length > 1 && (
                    <Button
                      type="button"
                      icon="pi pi-trash"
                      label="Remove"
                      severity="danger"
                      onClick={() => risksFA.remove(idx)}
                    />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Fieldset>

        {/* Project Organization & Staffing */}
        <Fieldset legend="Project Organization & Staffing">
          <div className="space-y-8">
            {staffingFA.fields.map((field, idx) => (
              <Card key={field.id} className="shadow-1 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block mb-2">Office Staff Designated</label>
                    <InputText
                      {...register(`project_staffings.${idx}.staff`, REQUIRED)}
                      className={`w-full py-1 px-4 border ${errors?.project_staffings?.[idx]?.staff ? "p-invalid border-red-300" : "border-gray-300"}`}
                    />
                    <Err message={errors?.project_staffings?.[idx]?.staff?.message} />
                  </div>
                  <div>
                    <label className="block mb-2">Responsibilities</label>
                    <InputTextarea
                      rows={2}
                      autoResize
                      {...register(`project_staffings.${idx}.responsibilities`, REQUIRED)}
                      className={`w-full py-1 px-4 border ${errors?.project_staffings?.[idx]?.responsibilities ? "p-invalid border-red-300" : "border-gray-300"}`}
                    />
                    <Err message={errors?.project_staffings?.[idx]?.responsibilities?.message} />
                  </div>
                  <div>
                    <label className="block mb-2">Contact Details</label>
                    <InputTextarea
                      rows={2}
                      autoResize
                      {...register(`project_staffings.${idx}.contact`)}
                      className="w-full py-1 px-4 border border-gray-300"
                    />
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    icon="pi pi-plus"
                    label="Add"
                    onClick={() => staffingFA.append({ staff: "", responsibilities: "", contact: "" })}
                  />
                  {staffingFA.fields.length > 1 && (
                    <Button
                      type="button"
                      icon="pi pi-trash"
                      label="Remove"
                      severity="danger"
                      onClick={() => staffingFA.remove(idx)}
                    />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Fieldset>

        {/* Work Plan */}
        <Fieldset legend="Project Work Plan">
          <div className="space-y-8">
            {workPlanFA.fields.map((field, idx) => (
              <Card key={field.id} className="shadow-1 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block mb-2">Phase of Project and Date</label>
                    <InputText
                      {...register(`project_work_plans.${idx}.phaseDate`, REQUIRED)}
                      className={`w-full py-1 px-4 border ${errors?.project_work_plans?.[idx]?.phaseDate ? "p-invalid border-red-300" : "border-gray-300"}`}
                    />
                    <Err message={errors?.project_work_plans?.[idx]?.phaseDate?.message} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-2">Activities</label>
                    <InputTextarea
                      rows={2}
                      autoResize
                      {...register(`project_work_plans.${idx}.activities`, REQUIRED)}
                      className={`w-full py-1 px-4 border ${errors?.project_work_plans?.[idx]?.activities ? "p-invalid border-red-300" : "border-gray-300"}`}
                    />
                    <Err message={errors?.project_work_plans?.[idx]?.activities?.message} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-2">Targets & Outputs</label>
                    <InputTextarea
                      rows={2}
                      autoResize
                      {...register(`project_work_plans.${idx}.targets`, REQUIRED)}
                      className={`w-full py-1 px-4 border ${errors?.project_work_plans?.[idx]?.targets ? "p-invalid border-red-300" : "border-gray-300"}`}
                    />
                    <Err message={errors?.project_work_plans?.[idx]?.targets?.message} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-2">Indicators & Outcome</label>
                    <InputTextarea
                      rows={2}
                      autoResize
                      {...register(`project_work_plans.${idx}.indicators`, REQUIRED)}
                      className={`w-full py-1 px-4 border ${errors?.project_work_plans?.[idx]?.indicators ? "p-invalid border-red-300" : "border-gray-300"}`}
                    />
                    <Err message={errors?.project_work_plans?.[idx]?.indicators?.message} />
                  </div>
                  <div>
                    <label className="block mb-2">Personnel in Charge (optional)</label>
                    <InputText
                      {...register(`project_work_plans.${idx}.personnel`)}
                      className="w-full py-1 px-4 border border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block mb-2">Resources Needed</label>
                    <InputTextarea
                      rows={2}
                      autoResize
                      {...register(`project_work_plans.${idx}.resources`, REQUIRED)}
                      className={`w-full py-1 px-4 border ${errors?.project_work_plans?.[idx]?.resources ? "p-invalid border-red-300" : "border-gray-300"}`}
                    />
                    <Err message={errors?.project_work_plans?.[idx]?.resources?.message} />
                  </div>
                  <div>
                    <label className="block mb-2">Cost</label>
                    <Controller
                      control={control}
                      name={`project_work_plans.${idx}.cost`}
                      rules={numberRules}
                      render={({ field }) => (
                        <InputNumber
                          value={field.value}
                          onValueChange={(e) => field.onChange(e.value)}
                          mode="currency"
                          currency="PHP"
                          locale="en-PH"
                          placeholder="0.00"
                          inputClassName="px-4 py-1 border border-gray-300"
                          className={`w-full ${errors?.project_work_plans?.[idx]?.cost ? "p-invalid" : ""}`}
                        />
                      )}
                    />
                    <Err message={errors?.project_work_plans?.[idx]?.cost?.message } />
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    icon="pi pi-plus"
                    label="Add"
                    onClick={() =>
                      workPlanFA.append({
                        phaseDate: "",
                        activities: "",
                        targets: "",
                        indicators: "",
                        personnel: "",
                        resources: "",
                        cost: undefined,
                      })
                    }
                  />
                  {workPlanFA.fields.length > 1 && (
                    <Button
                      type="button"
                      icon="pi pi-trash"
                      label="Remove"
                      severity="danger"
                      onClick={() => workPlanFA.remove(idx)}
                    />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Fieldset>

        {/* Detailed Budget Requirement */}
        <Fieldset legend="Detailed Budget Requirement">
          <div className="space-y-8">
            {budgetsFA.fields.map((field, idx) => (
              <Card key={field.id} className="shadow-1 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block mb-2">Budget Item</label>
                    <InputText
                      {...register(`project_detailed_budgets.${idx}.item`, REQUIRED)}
                      className={`w-full py-1 px-4 border ${errors?.project_detailed_budgets?.[idx]?.item ? "p-invalid border-red-300" : "border-gray-300"}`}
                    />
                    <Err message={errors?.project_detailed_budgets?.[idx]?.item?.message} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-2">Description</label>
                    <InputTextarea
                      rows={2}
                      autoResize
                      {...register(`project_detailed_budgets.${idx}.description`)}
                      className="w-full py-1 px-4 border border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block mb-2">Quantity</label>
                    <Controller
                      control={control}
                      name={`project_detailed_budgets.${idx}.quantity`}
                      rules={numberRules}
                      render={({ field }) => (
                        <InputNumber
                          value={field.value}
                          onValueChange={(e) => field.onChange(e.value)}
                          inputClassName="px-4 py-1 border border-gray-300"
                          className={`w-full ${errors?.project_detailed_budgets?.[idx]?.quantity ? "p-invalid" : ""}`}
                        />
                      )}
                    />
                    <Err message={errors?.project_detailed_budgets?.[idx]?.quantity?.message} />
                  </div>
                  <div>
                    <label className="block mb-2">Amount</label>
                    <Controller
                      control={control}
                      name={`project_detailed_budgets.${idx}.amount`}
                      rules={numberRules}
                      render={({ field }) => (
                        <InputNumber
                          value={field.value}
                          onValueChange={(e) => field.onChange(e.value)}
                          mode="currency"
                          currency="PHP"
                          locale="en-PH"
                          placeholder="0.00"
                          inputClassName="px-4 py-1 border border-gray-300"
                          className={`w-full ${errors?.project_detailed_budgets?.[idx]?.amount ? "p-invalid" : ""}`}
                        />
                      )}
                    />
                    <Err message={errors?.project_detailed_budgets?.[idx]?.amount?.message} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-2">Proposed Source</label>
                    <InputText
                      {...register(`project_detailed_budgets.${idx}.source`)}
                      className="w-full py-1 px-4 border border-gray-300"
                    />
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    icon="pi pi-plus"
                    label="Add"
                    onClick={() =>
                      budgetsFA.append({
                        item: "",
                        description: "",
                        quantity: undefined,
                        amount: undefined,
                        source: "",
                      })
                    }
                  />
                  {budgetsFA.fields.length > 1 && (
                    <Button
                      type="button"
                      icon="pi pi-trash"
                      label="Remove"
                      severity="danger"
                      onClick={() => budgetsFA.remove(idx)}
                    />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Fieldset>

        {/* Other Info */}
        <Card title="Other Relevant Information" className="shadow-2 rounded-2xl">
          <InputTextarea
            rows={3}
            autoResize
            {...register("otherInfo")}
            className="w-full py-1 px-4 border border-gray-300"
          />
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button disabled={createForm2Loading || updateForm2Loading} type="submit" label={`${createForm2Loading || updateForm2Loading ? 'Submitting...' : 'Submit'}`}  className="text-green-600" icon="pi pi-check" />
          <Button
            type="reset"
            className="text-red-400"
            icon="pi pi-refresh"
            label="Reset"
            severity="secondary"
            onClick={() => reset()}
          />
        </div>

        {/* Dev Preview */}
        <details className="mt-6">
          <summary className="cursor-pointer select-none">Preview JSON (dev)</summary>
          <pre className="bg-gray-50 p-3 rounded overflow-auto text-sm">
            {JSON.stringify(watch(), null, 2)}
          </pre>
        </details>
      </form>
    </div>
  );
};
