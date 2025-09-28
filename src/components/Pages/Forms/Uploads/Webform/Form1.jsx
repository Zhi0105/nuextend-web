import React, { useEffect, memo } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Card } from "primereact/card";
import { Fieldset } from "primereact/fieldset";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Chips } from "primereact/chips";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useUserStore } from '@_src/store/auth';
import { DecryptString } from "@_src/utils/helpers";
import { createForm1, updateForm1 } from "@_src/services/formservice";
import { useLocation } from "react-router-dom";

/** Utils **/
const toYMD = (d) => {
  if (!d) return undefined;
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// keep number or empty -> null (backend accepts nullable)
const numOrNull = (v) => (v === null || v === undefined || v === "" ? null : v);

const toStringList = (arr, key = "name") =>
  (arr ?? [])
    .map(v => (typeof v === "string" ? v : v?.[key] ?? ""))
    .filter(Boolean);

/**
 * Nested component so we can safely call useFieldArray per project
 */
const ProjectCard = memo(function ProjectCard({
  idx,
  control,
  register,
  errors,
  remove,
  
}) {
  // budgetSummaries per project
  const budgetFA = useFieldArray({ control, name: `projects.${idx}.budgetSummaries` });

  useEffect(() => {
    if (budgetFA.fields.length === 0) {
      budgetFA.append({ activities: "", outputs: "", timeline: null, personnel: "", budget: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="rounded-xl shadow-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block mb-2">Title</label>
          <InputText
            {...register(`projects.${idx}.title`, { required: "Required" })}
            className={`w-full py-1 px-4 border border-gray-300 ${errors?.projects?.[idx]?.title ? "p-invalid" : ""}`}
            placeholder="Project title"
          />
          {errors?.projects?.[idx]?.title && (
            <small className="p-error block mt-1">Required</small>
          )}
        </div>
        <div>
          <label className="block mb-2">Team Leader</label>
          <InputText
            {...register(`projects.${idx}.teamLeader`, { required: "Required" })}
            className={`w-full py-1 px-4 border border-gray-300 ${errors?.projects?.[idx]?.teamLeader ? "p-invalid" : ""}`}
            placeholder="Name of team leader"
          />
          {errors?.projects?.[idx]?.teamLeader && (
            <small className="p-error block mt-1">Required</small>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block mb-2">Team Members</label>
          <Controller
            control={control}
            name={`projects.${idx}.teamMembers`}
            rules={{ validate: (v) => (v?.length ?? 0) > 0 || "Add at least one member" }}
            render={({ field }) => (
              <Chips
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                separator="," placeholder="Type a name, press Enter"
                pt={{ input: { className: "w-full px-4" }, container: { className: "w-full border border-gray-400" } }}
                className={`w-full py-1 ${errors?.projects?.[idx]?.teamMembers ? "p-invalid" : ""}`}
              />
            )}
          />
          {errors?.projects?.[idx]?.teamMembers && (
            <small className="p-error block mt-1">{errors.projects[idx].teamMembers.message}</small>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block mb-2">Objectives</label>
          <InputTextarea
            autoResize rows={4}
            {...register(`projects.${idx}.objectives`, { required: "Required" })}
            className={`w-full py-1 px-4 border border-gray-300 ${errors?.projects?.[idx]?.objectives ? "p-invalid" : ""}`}
            placeholder="Objectives of the project"
          />
          {errors?.projects?.[idx]?.objectives && (
            <small className="p-error block mt-1">Required</small>
          )}
        </div>
      </div>

      {/* Nested Budget Summaries (now inside each project per new backend) */}
      <Fieldset legend="Budget Summary (per project)" className="rounded-2xl mt-6">
        <div className="space-y-8">
          {budgetFA.fields.map((bf, bIdx) => (
            <Card key={bf.id} className="rounded-xl shadow-1">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block mb-2">Activities</label>
                  <InputText
                    {...register(`projects.${idx}.budgetSummaries.${bIdx}.activities`, { required: "Required" })}
                    className={`w-full py-1 px-4 border border-gray-300 ${errors?.projects?.[idx]?.budgetSummaries?.[bIdx]?.activities ? "p-invalid" : ""}`}
                    placeholder="Activities"
                  />
                </div>
                <div>
                  <label className="block mb-2">Outputs</label>
                  <InputText
                    {...register(`projects.${idx}.budgetSummaries.${bIdx}.outputs`, { required: "Required" })}
                    className={`w-full py-1 px-4 border border-gray-300 ${errors?.projects?.[idx]?.budgetSummaries?.[bIdx]?.outputs ? "p-invalid" : ""}`}
                    placeholder="Outputs"
                  />
                </div>
                <div>
                  <label className="block mb-2">Timeline (M/D/Y)</label>
                  <Controller
                    control={control}
                    name={`projects.${idx}.budgetSummaries.${bIdx}.timeline`}
                    rules={{ required: "Required" }}
                    render={({ field }) => (
                      <Calendar
                        value={field.value}
                        onChange={(e) => field.onChange(e.value)}
                        dateFormat="mm/dd/yy"
                        className={`w-full ${errors?.projects?.[idx]?.budgetSummaries?.[bIdx]?.timeline ? "p-invalid" : ""}`}
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="block mb-2">Personnel</label>
                  <InputText
                    {...register(`projects.${idx}.budgetSummaries.${bIdx}.personnel`, { required: "Required" })}
                    className={`w-full py-1 px-4 border border-gray-300 ${errors?.projects?.[idx]?.budgetSummaries?.[bIdx]?.personnel ? "p-invalid" : ""}`}
                    placeholder="Person in charge"
                  />
                </div>
                <div>
                  <label className="block mb-2">Budget (₱)</label>
                  <Controller
                    control={control}
                    name={`projects.${idx}.budgetSummaries.${bIdx}.budget`}
                    rules={{ validate: (v) => (v === null || v === undefined || v === "" || Number(v) >= 0) || "Must be ≥ 0" }}
                    render={({ field }) => (
                      <InputNumber
                        value={field.value}
                        onValueChange={(e) => field.onChange(e.value)}
                        mode="currency" currency="PHP" locale="en-PH"
                        placeholder="0.00"
                        inputClassName="px-4 py-1 border border-gray-400"
                        className={`w-full ${errors?.projects?.[idx]?.budgetSummaries?.[bIdx]?.budget ? "p-invalid" : ""}`}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  icon="pi pi-plus"
                  label="Add Row"
                  onClick={() => budgetFA.append({ activities: "", outputs: "", timeline: null, personnel: "", budget: null })}
                />
                {budgetFA.fields.length > 1 && (
                  <Button
                    type="button"
                    icon="pi pi-trash"
                    label="Remove Row"
                    severity="danger"
                    onClick={() => budgetFA.remove(bIdx)}
                  />
                )}
              </div>
            </Card>
          ))}
        </div>
      </Fieldset>

      <div className="mt-4 flex gap-2">
        <Button type="button" icon="pi pi-plus" label="Add Project Budget Row" onClick={() => budgetFA.append({ activities: "", outputs: "", timeline: null, personnel: "", budget: null })} />
        <Button type="button" icon="pi pi-trash" label="Remove Project" severity="danger" onClick={remove} />
      </div>
    </Card>
  );
});

export const Form1 = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const {  formdata } = location.state || {};
  const { token } = useUserStore((state) => ({ token: state.token }));
  const decryptedToken = token && DecryptString(token);

  const { mutate: handleCreateForm1, isLoading: createForm1Loading } = useMutation({
    mutationFn: createForm1,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['program'] });
      toast(data.message, { type: "success" });
      reset();
    },
    onError: (error) => {
      toast(error?.response?.data?.message ?? 'Something went wrong', { type: "warning" });
      console.log("@CPPE:", error);
    },
  });

  const { mutate: handleUpdateForm1, isLoading: updateForm1Loading } = useMutation({
    mutationFn: updateForm1,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['program'] });
      toast(data.message, { type: "success" });
    },
    onError: (error) => {
      toast(error?.response?.data?.message ?? 'Something went wrong', { type: "warning" });
      console.log("@UPPE:", error);
    },
  });

  const { control, register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    mode: "onSubmit",
    defaultValues: {
      duration: "",
      background: "",
      overallGoal: "",
      scholarlyConnection: "",
      programTeamMembers: [],
      cooperatingAgencies: [],
      componentProjects: [ { title: "", outcomes: "", budget: null } ],
      projects: [
        {
          title: "",
          teamLeader: "",
          teamMembers: [],
          objectives: "",
          budgetSummaries: [ { activities: "", outputs: "", timeline: null, personnel: "", budget: null } ]
        }
      ]
    },
  });

  // Top-level repeatable groups
  const componentProjectsFA = useFieldArray({ control, name: "componentProjects" });
  const projectsFA = useFieldArray({ control, name: "projects" });

  useEffect(() => {

    const fd = formdata?.[0] ?? {};

    // Try to read nested per-project budget_summaries if already present in backend response
    const mappedProjects = (fd.projects ?? []).map((p) => ({
      title: p.title ?? "",
      teamLeader: p.teamLeader ?? "",
      teamMembers: toStringList(p.team_members ?? p.teamMembers, "name"),
      objectives: p.objectives ?? "",
      budgetSummaries: (p.budget_summaries ?? p.budgetSummaries ?? []).map((b) => ({
        activities: b.activities ?? "",
        outputs: b.outputs ?? "",
        timeline: b.timeline ? new Date(b.timeline) : null,
        personnel: typeof b.personnel === "string" ? b.personnel : (b.personnel?.name ?? ""),
        budget: numOrNull(b.budget)
      }))
    }));

    // If legacy top-level budget_summaries exist and there's exactly 1 project, attach them to that project
    if ((fd.budget_summaries?.length ?? 0) > 0) {
      if (mappedProjects.length === 1) {
        mappedProjects[0].budgetSummaries = fd.budget_summaries.map((b) => ({
          activities: b.activities ?? "",
          outputs: b.outputs ?? "",
          timeline: b.timeline ? new Date(b.timeline) : null,
          personnel: typeof b.personnel === "string" ? b.personnel : (b.personnel?.name ?? ""),
          budget: numOrNull(b.budget)
        }));
      }
    }

    reset({
      duration: fd.duration ?? "",
      background: fd.background ?? "",
      overallGoal: fd.overall_goal ?? "",
      scholarlyConnection: fd.scholarly_connection ?? "",
      programTeamMembers: toStringList(fd.program_team_members ?? fd.team_members, "name"),
      cooperatingAgencies: toStringList(fd.cooperating_agencies, "name"),
      componentProjects: (fd.component_projects ?? fd.componentProjects ?? []).map((p) => ({
        title: p.title ?? "",
        outcomes: p.outcomes ?? "",
        budget: numOrNull(p.budget),
      })) ?? [ { title: "", outcomes: "", budget: null } ],
      projects: mappedProjects.length > 0 ? mappedProjects : [ {
        title: "",
        teamLeader: "",
        teamMembers: [],
        objectives: "",
        budgetSummaries: [ { activities: "", outputs: "", timeline: null, personnel: "", budget: null } ]
      } ]
    });
  }, [formdata, reset]);

  const onSubmit = (data) => {
   
    const payload = {
      event_id: location?.state?.event?.id,
      ...(Array.isArray(formdata) && formdata[0]?.id ? { id: formdata[0].id } : {}),
      duration: data.duration,
      background: data.background,
      overall_goal: data.overallGoal,
      scholarly_connection: data.scholarlyConnection,

      // arrays of strings
      programTeamMembers: [...(data.programTeamMembers ?? [])],
      cooperatingAgencies: [...(data.cooperatingAgencies ?? [])],

      // component projects (proposal-level)
      componentProjects: (data.componentProjects ?? []).map((r) => ({
        title: r.title,
        outcomes: r.outcomes,
        // keep as number or null; backend accepts nullable + string/decimal
        budget: numOrNull(r.budget)
      })),

      // projects (proposal-level) + nested budgetSummaries
      projects: (data.projects ?? []).map((r) => ({
        title: r.title,
        teamLeader: r.teamLeader,
        teamMembers: [...(r.teamMembers ?? [])],
        objectives: r.objectives,
        budgetSummaries: (r.budgetSummaries ?? []).map((b) => ({
          activities: b.activities,
          outputs: b.outputs,
          timeline: toYMD(b.timeline),
          personnel: b.personnel,
          budget: numOrNull(b.budget)
        }))
      }))
    };

    if (formdata) {
      handleUpdateForm1({ token: decryptedToken, ...payload });
    } else {
      handleCreateForm1({ token: decryptedToken, ...payload });
    }
  };

  return (
    <div className="form1-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
      <form className="w-full max-w-5xl space-y-20 px-4" onSubmit={handleSubmit(onSubmit)}>
        {/* Header */}
        <Card title={<span className="text-2xl font-bold">Program Proposal Form</span>} className="rounded-2xl shadow-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2">Duration</label>
              <InputText
                {...register("duration", { required: "Duration is required" })}
                className={`w-full py-1 px-4 border border-gray-300 ${errors.duration ? "p-invalid" : ""}`}
                placeholder="e.g., 6 months"
              />
              {errors.duration && <small className="p-error block mt-1">Required</small>}
            </div>
            <div>
              <label className="block mb-2">Scholarly Connection</label>
              <InputTextarea
                autoResize rows={3}
                {...register("scholarlyConnection", { required: "Required" })}
                className={`w-full py-1 px-4 border border-gray-300 ${errors.scholarlyConnection ? "p-invalid" : ""}`}
                placeholder="Explain the scholarly basis/connection"
              />
              {errors.scholarlyConnection && <small className="p-error block mt-1">Required</small>}
            </div>
            <div className="md:col-span-2">
              <label className="block mb-2">Background & Problem Statement</label>
              <InputTextarea
                autoResize rows={5}
                {...register("background", { required: "Required" })}
                className={`w-full py-1 px-4 border border-gray-300 ${errors.background ? "p-invalid" : ""}`}
                placeholder="Context and problem statement"
              />
              {errors.background && <small className="p-error block mt-1">Required</small>}
            </div>
            <div className="md:col-span-2">
              <label className="block mb-2">Overall Goal</label>
              <InputTextarea
                autoResize rows={4}
                {...register("overallGoal", { required: "Required" })}
                className={`w-full py-1 px-4 border border-gray-300 ${errors.overallGoal ? "p-invalid" : ""}`}
                placeholder="High-level goal of the program"
              />
              {errors.overallGoal && <small className="p-error block mt-1">Required</small>}
            </div>
            <div className="md:col-span-2">
              <label className="block mb-2">Program Team Members</label>
              <Controller
                control={control}
                name="programTeamMembers"
                rules={{ validate: (v) => (v?.length ?? 0) > 0 || "Add at least one team member" }}
                render={({ field }) => (
                  <Chips
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    separator="," placeholder="Type a name, press Enter"
                    pt={{ input: { className: "w-full px-4" }, container: { className: "w-full border border-gray-400" } }}
                    className={`w-full py-1 ${errors.programTeamMembers ? "p-invalid" : ""}`}
                  />
                )}
              />
              {errors.programTeamMembers && (
                <small className="p-error block mt-1">{errors.programTeamMembers.message}</small>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block mb-2">Cooperating Agencies</label>
              <Controller
                control={control}
                name="cooperatingAgencies"
                rules={{ validate: (v) => (v?.length ?? 0) > 0 || "Add at least one agency" }}
                render={({ field }) => (
                  <Chips
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    separator="," placeholder="Type an agency, press Enter"
                    pt={{ input: { className: "w-full px-4" }, container: { className: "w-full border border-gray-400" } }}
                    className={`w-full py-1 ${errors.cooperatingAgencies ? "p-invalid" : ""}`}
                  />
                )}
              />
              {errors.cooperatingAgencies && (
                <small className="p-error block mt-1">{errors.cooperatingAgencies.message}</small>
              )}
            </div>
          </div>
        </Card>

        {/* Component Projects (proposal-level) */}
        <Fieldset legend="Component Projects" className="rounded-2xl">
          <div className="space-y-8">
            {componentProjectsFA.fields.map((field, idx) => (
              <Card key={field.id} className="rounded-xl shadow-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2">Title</label>
                    <InputText
                      {...register(`componentProjects.${idx}.title`, { required: "Required" })}
                      className={`w-full py-1 px-4 border border-gray-300 ${errors?.componentProjects?.[idx]?.title ? "p-invalid" : ""}`}
                      placeholder="Component project title"
                    />
                    {errors?.componentProjects?.[idx]?.title && <small className="p-error block mt-1">Required</small>}
                  </div>
                  <div>
                    <label className="block mb-2">Budget (₱)</label>
                    <Controller
                      control={control}
                      name={`componentProjects.${idx}.budget`}
                      rules={{ validate: (v) => (v === null || v === undefined || v === "" || Number(v) >= 0) || "Must be ≥ 0" }}
                      render={({ field }) => (
                        <InputNumber
                          value={field.value}
                          onValueChange={(e) => field.onChange(e.value)}
                          mode="currency" currency="PHP" locale="en-PH"
                          placeholder="0.00"
                          inputClassName="px-4 py-1 border border-gray-400"
                          className={`w-full ${errors?.componentProjects?.[idx]?.budget ? "p-invalid" : ""}`}
                        />
                      )}
                    />
                    {errors?.componentProjects?.[idx]?.budget && <small className="p-error block mt-1">Required</small>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-2">Outcomes</label>
                    <InputTextarea
                      autoResize rows={3}
                      {...register(`componentProjects.${idx}.outcomes`, { required: "Required" })}
                      className={`w-full py-1 px-4 border border-gray-300 ${errors?.componentProjects?.[idx]?.outcomes ? "p-invalid" : ""}`}
                      placeholder="Intended outcomes"
                    />
                    {errors?.componentProjects?.[idx]?.outcomes && <small className="p-error block mt-1">Required</small>}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button type="button" icon="pi pi-plus" label="Add" onClick={() => componentProjectsFA.append({ title: "", outcomes: "", budget: null })} />
                  {componentProjectsFA.fields.length > 1 && (
                    <Button type="button" icon="pi pi-trash" label="Remove" severity="danger" onClick={() => componentProjectsFA.remove(idx)} />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Fieldset>

        {/* Projects (each with nested Budget Summaries) */}
        <Fieldset legend="Projects" className="rounded-2xl">
          <div className="space-y-8">
            {projectsFA.fields.map((field, idx) => (
              <ProjectCard
                key={field.id}
                idx={idx}
                control={control}
                register={register}
                errors={errors}
                remove={() => projectsFA.remove(idx)}
              />
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="button" icon="pi pi-plus" label="Add Project" onClick={() => projectsFA.append({ title: "", teamLeader: "", teamMembers: [], objectives: "", budgetSummaries: [ { activities: "", outputs: "", timeline: null, personnel: "", budget: null } ] })} />
          </div>
        </Fieldset>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button disabled={createForm1Loading || updateForm1Loading} type="submit" icon="pi pi-check" label={`${createForm1Loading || updateForm1Loading ? 'Submitting...' : 'Submit'}`} className="p-button-success" />
          <Button type="button" icon="pi pi-refresh" label="Reset" severity="secondary" onClick={() => reset()} />
        </div>

        <Divider />

        {/* Live JSON preview */}
        <Fieldset legend="Preview JSON" className="rounded-2xl">
          <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded-xl overflow-auto">{JSON.stringify(watch(), null, 2)}</pre>
        </Fieldset>
      </form>
    </div>
  );
};
