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
import { useUserStore } from "@_src/store/auth";
import { DecryptString } from "@_src/utils/helpers";
import { createForm1, updateForm1 } from "@_src/services/formservice";
import { useLocation } from "react-router-dom";

/** ---------- Utils ---------- **/
const toYMD = (d) =>
  d ? new Date(d).toISOString().split("T")[0] : undefined;

const numOrNull = (v) =>
  v === null || v === undefined || v === "" ? null : v;

const toStringList = (arr, key = "name") =>
  (arr ?? [])
    .map((v) => (typeof v === "string" ? v : v?.[key] ?? ""))
    .filter(Boolean);

const DEFAULT_BUDGET = {
  activities: "",
  outputs: "",
  timeline: null,
  personnel: "",
  budget: null,
};

const DEFAULT_PROJECT = {
  title: "",
  teamLeader: "",
  teamMembers: [],
  objectives: "",
  budgetSummaries: [DEFAULT_BUDGET],
};

/** ---------- ProjectCard Component ---------- **/
const ProjectCard = memo(function ProjectCard({
  idx,
  control,
  register,
  errors,
  remove,
}) {
  const budgetFA = useFieldArray({
    control,
    name: `projects.${idx}.budgetSummaries`,
  });

  useEffect(() => {
    if (budgetFA.fields.length === 0) {
      budgetFA.append(DEFAULT_BUDGET);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="rounded-xl shadow-1">
      {/* Project Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Title */}
        <div>
          <label className="block mb-2">Title</label>
          <InputText
            {...register(`projects.${idx}.title`, { required: "Required" })}
            className={`w-full py-1 px-4 border ${
              errors?.projects?.[idx]?.title ? "p-invalid" : "border-gray-300"
            }`}
            placeholder="Project title"
          />
          {errors?.projects?.[idx]?.title && (
            <small className="p-error block mt-1">Required</small>
          )}
        </div>

        {/* Team Leader */}
        <div>
          <label className="block mb-2">Team Leader</label>
          <InputText
            {...register(`projects.${idx}.teamLeader`, { required: "Required" })}
            className={`w-full py-1 px-4 border ${
              errors?.projects?.[idx]?.teamLeader ? "p-invalid" : "border-gray-300"
            }`}
            placeholder="Name of team leader"
          />
          {errors?.projects?.[idx]?.teamLeader && (
            <small className="p-error block mt-1">Required</small>
          )}
        </div>

        {/* Team Members */}
        <div className="md:col-span-2">
          <label className="block mb-2">Team Members</label>
          <Controller
            control={control}
            name={`projects.${idx}.teamMembers`}
            rules={{
              validate: (v) => (v?.length ?? 0) > 0 || "Add at least one member",
            }}
            render={({ field }) => (
              <Chips
                {...field}
                separator=","
                placeholder="Type a name, press Enter"
                pt={{
                  input: { className: "w-full px-4" },
                  container: { className: "w-full border border-gray-400" },
                }}
                className={`w-full py-1 ${
                  errors?.projects?.[idx]?.teamMembers ? "p-invalid" : ""
                }`}
              />
            )}
          />
          {errors?.projects?.[idx]?.teamMembers && (
            <small className="p-error block mt-1">
              {errors.projects[idx].teamMembers.message}
            </small>
          )}
        </div>

        {/* Objectives */}
        <div className="md:col-span-2">
          <label className="block mb-2">Objectives</label>
          <InputTextarea
            autoResize
            rows={4}
            {...register(`projects.${idx}.objectives`, { required: "Required" })}
            className={`w-full py-1 px-4 border ${
              errors?.projects?.[idx]?.objectives ? "p-invalid" : "border-gray-300"
            }`}
            placeholder="Objectives of the project"
          />
          {errors?.projects?.[idx]?.objectives && (
            <small className="p-error block mt-1">Required</small>
          )}
        </div>
      </div>

      {/* Budget Summaries */}
      <Fieldset legend="Budget Summary (per project)" className="rounded-2xl mt-6">
        <div className="space-y-8">
          {budgetFA.fields.map((bf, bIdx) => (
            <Card key={bf.id} className="rounded-xl shadow-1">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Activities */}
                <div>
                  <label className="block mb-2">Activities</label>
                  <InputText
                    {...register(
                      `projects.${idx}.budgetSummaries.${bIdx}.activities`,
                      { required: "Required" }
                    )}
                    className={`w-full py-1 px-4 border ${
                      errors?.projects?.[idx]?.budgetSummaries?.[bIdx]?.activities
                        ? "p-invalid"
                        : "border-gray-300"
                    }`}
                    placeholder="Activities"
                  />
                </div>

                {/* Outputs */}
                <div>
                  <label className="block mb-2">Outputs</label>
                  <InputText
                    {...register(
                      `projects.${idx}.budgetSummaries.${bIdx}.outputs`,
                      { required: "Required" }
                    )}
                    className={`w-full py-1 px-4 border ${
                      errors?.projects?.[idx]?.budgetSummaries?.[bIdx]?.outputs
                        ? "p-invalid"
                        : "border-gray-300"
                    }`}
                    placeholder="Outputs"
                  />
                </div>

                {/* Timeline */}
                <div>
                  <label className="block mb-2">Timeline (M/D/Y)</label>
                  <Controller
                    control={control}
                    name={`projects.${idx}.budgetSummaries.${bIdx}.timeline`}
                    rules={{ required: "Required" }}
                    render={({ field }) => (
                      <Calendar
                        {...field}
                        dateFormat="mm/dd/yy"
                        className={`w-full ${
                          errors?.projects?.[idx]?.budgetSummaries?.[bIdx]?.timeline
                            ? "p-invalid"
                            : ""
                        }`}
                      />
                    )}
                  />
                </div>

                {/* Personnel */}
                <div>
                  <label className="block mb-2">Personnel</label>
                  <InputText
                    {...register(
                      `projects.${idx}.budgetSummaries.${bIdx}.personnel`,
                      { required: "Required" }
                    )}
                    className={`w-full py-1 px-4 border ${
                      errors?.projects?.[idx]?.budgetSummaries?.[bIdx]?.personnel
                        ? "p-invalid"
                        : "border-gray-300"
                    }`}
                    placeholder="Person in charge"
                  />
                </div>

                {/* Budget */}
                <div>
                  <label className="block mb-2">Budget (₱)</label>
                  <Controller
                    control={control}
                    name={`projects.${idx}.budgetSummaries.${bIdx}.budget`}
                    rules={{
                      validate: (v) =>
                        v === null || v === "" || Number(v) >= 0 || "Must be ≥ 0",
                    }}
                    render={({ field }) => (
                      <InputNumber
                        {...field}
                        mode="currency"
                        currency="PHP"
                        locale="en-PH"
                        placeholder="0.00"
                        inputClassName="px-4 py-1 border border-gray-400"
                        className={`w-full ${
                          errors?.projects?.[idx]?.budgetSummaries?.[bIdx]?.budget
                            ? "p-invalid"
                            : ""
                        }`}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Row Actions */}
              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  icon="pi pi-plus"
                  label="Add Row"
                  onClick={() => budgetFA.append(DEFAULT_BUDGET)}
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

      {/* Project Actions */}
      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          icon="pi pi-plus"
          label="Add Project Budget Row"
          onClick={() => budgetFA.append(DEFAULT_BUDGET)}
        />
        <Button
          type="button"
          icon="pi pi-trash"
          label="Remove Project"
          severity="danger"
          onClick={remove}
        />
      </div>
    </Card>
  );
});

export const Form1 = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { formdata } = location.state || {};
  const { token } = useUserStore((state) => ({ token: state.token }));
  const decryptedToken = token && DecryptString(token);

  /** ---------- Mutations ---------- **/
  const { mutate: handleCreateForm1, isLoading: createForm1Loading } = useMutation({
    mutationFn: createForm1,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["program"] });
      toast.success(data.message);
      reset();
    },
    onError: (error) => {
      toast.warn(error?.response?.data?.message ?? "Something went wrong");
      console.error("@CPPE:", error);
    },
  });

  const { mutate: handleUpdateForm1, isLoading: updateForm1Loading } = useMutation({
    mutationFn: updateForm1,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["program"] });
      toast.success(data.message);
    },
    onError: (error) => {
      toast.warn(error?.response?.data?.message ?? "Something went wrong");
      console.error("@UPPE:", error);
    },
  });

  /** ---------- Form ---------- **/
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    mode: "onSubmit",
    defaultValues: {
      duration: "",
      background: "",
      overallGoal: "",
      scholarlyConnection: "",
      programTeamMembers: [],
      cooperatingAgencies: [],
      componentProjects: [{ title: "", outcomes: "", budget: null }],
      projects: [DEFAULT_PROJECT],
    },
  });

  const componentProjectsFA = useFieldArray({ control, name: "componentProjects" });
  const projectsFA = useFieldArray({ control, name: "projects" });

  /** ---------- Prefill on Edit ---------- **/
  useEffect(() => {
    if (!formdata) return;
    const fd = formdata?.[0] ?? {};

    const mappedProjects =
      fd.projects?.map((p) => ({
        title: p.title ?? "",
        teamLeader: p.teamLeader ?? "",
        teamMembers: toStringList(p.team_members ?? p.teamMembers),
        objectives: p.objectives ?? "",
        budgetSummaries: (p.budget_summaries ?? p.budgetSummaries ?? []).map((b) => ({
          activities: b.activities ?? "",
          outputs: b.outputs ?? "",
          timeline: b.timeline ? new Date(b.timeline) : null,
          personnel: typeof b.personnel === "string" ? b.personnel : b.personnel?.name ?? "",
          budget: numOrNull(b.budget),
        })),
      })) ?? [];

    reset({
      duration: fd.duration ?? "",
      background: fd.background ?? "",
      overallGoal: fd.overall_goal ?? "",
      scholarlyConnection: fd.scholarly_connection ?? "",
      programTeamMembers: toStringList(fd.program_team_members ?? fd.team_members),
      cooperatingAgencies: toStringList(fd.cooperating_agencies),
      componentProjects:
        fd.component_projects?.map((p) => ({
          title: p.title ?? "",
          outcomes: p.outcomes ?? "",
          budget: numOrNull(p.budget),
        })) ?? [{ title: "", outcomes: "", budget: null }],
      projects: mappedProjects.length > 0 ? mappedProjects : [DEFAULT_PROJECT],
    });
  }, [formdata, reset]);

  /** ---------- Submit ---------- **/
  const onSubmit = (data) => {
    const payload = {
      event_id: location?.state?.event?.id,
      ...(formdata?.[0]?.id && { id: formdata[0].id }),
      duration: data.duration,
      background: data.background,
      overall_goal: data.overallGoal,
      scholarly_connection: data.scholarlyConnection,
      programTeamMembers: [...(data.programTeamMembers ?? [])],
      cooperatingAgencies: [...(data.cooperatingAgencies ?? [])],
      componentProjects: data.componentProjects.map((r) => ({
        title: r.title,
        outcomes: r.outcomes,
        budget: numOrNull(r.budget),
      })),
      projects: data.projects.map((r) => ({
        title: r.title,
        teamLeader: r.teamLeader,
        teamMembers: [...(r.teamMembers ?? [])],
        objectives: r.objectives,
        budgetSummaries: r.budgetSummaries.map((b) => ({
          activities: b.activities,
          outputs: b.outputs,
          timeline: toYMD(b.timeline),
          personnel: b.personnel,
          budget: numOrNull(b.budget),
        })),
      })),
    };

    if (formdata) {
      handleUpdateForm1({ token: decryptedToken, ...payload });
    } else {
      handleCreateForm1({ token: decryptedToken, ...payload });
    }
  };

  return (
    <div className="form1-main min-h-screen bg-white w-full flex flex-col justify-center items-center sm:pl-[200px] py-20">
      <form className="w-full max-w-5xl space-y-20 px-4" onSubmit={handleSubmit(onSubmit)}>
        {/* Header */}
        <Card
          title={<span className="text-2xl font-bold">Program Proposal Form</span>}
          className="rounded-2xl shadow-2"
        >
          {/* fields here (unchanged for brevity) */}
        </Card>

        {/* Component Projects */}
       <Fieldset legend="Component Projects" className="rounded-2xl">
  <div className="space-y-8">
    {componentProjectsFA.fields.map((field, idx) => (
      <Card key={field.id} className="rounded-xl shadow-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div>
            <label className="block mb-2">Title</label>
            <InputText
              {...register(`componentProjects.${idx}.title`, { required: "Required" })}
              className={`w-full py-1 px-4 border ${
                errors?.componentProjects?.[idx]?.title
                  ? "p-invalid"
                  : "border-gray-300"
              }`}
              placeholder="Component project title"
            />
            {errors?.componentProjects?.[idx]?.title && (
              <small className="p-error block mt-1">Required</small>
            )}
          </div>

          {/* Budget */}
          <div>
            <label className="block mb-2">Budget (₱)</label>
            <Controller
              control={control}
              name={`componentProjects.${idx}.budget`}
              rules={{
                validate: (v) =>
                  v === null || v === "" || Number(v) >= 0 || "Must be ≥ 0",
              }}
              render={({ field }) => (
                <InputNumber
                  {...field}
                  mode="currency"
                  currency="PHP"
                  locale="en-PH"
                  placeholder="0.00"
                  inputClassName="px-4 py-1 border border-gray-400"
                  className={`w-full ${
                    errors?.componentProjects?.[idx]?.budget ? "p-invalid" : ""
                  }`}
                />
              )}
            />
            {errors?.componentProjects?.[idx]?.budget && (
              <small className="p-error block mt-1">Required</small>
            )}
          </div>

          {/* Outcomes */}
          <div className="md:col-span-2">
            <label className="block mb-2">Outcomes</label>
            <InputTextarea
              autoResize
              rows={3}
              {...register(`componentProjects.${idx}.outcomes`, {
                required: "Required",
              })}
              className={`w-full py-1 px-4 border ${
                errors?.componentProjects?.[idx]?.outcomes
                  ? "p-invalid"
                  : "border-gray-300"
              }`}
              placeholder="Intended outcomes"
            />
            {errors?.componentProjects?.[idx]?.outcomes && (
              <small className="p-error block mt-1">Required</small>
            )}
          </div>
        </div>

        {/* Row Actions */}
        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            icon="pi pi-plus"
            label="Add"
            onClick={() =>
              componentProjectsFA.append({ title: "", outcomes: "", budget: null })
            }
          />
          {componentProjectsFA.fields.length > 1 && (
            <Button
              type="button"
              icon="pi pi-trash"
              label="Remove"
              severity="danger"
              onClick={() => componentProjectsFA.remove(idx)}
            />
          )}
        </div>
      </Card>
    ))}
  </div>
</Fieldset>

        {/* Projects */}
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
            <Button
              type="button"
              icon="pi pi-plus"
              label="Add Project"
              onClick={() => projectsFA.append(DEFAULT_PROJECT)}
            />
          </div>
        </Fieldset>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            disabled={createForm1Loading || updateForm1Loading}
            type="submit"
            icon="pi pi-check"
            label={`${
              createForm1Loading || updateForm1Loading ? "Submitting..." : "Submit"
            }`}
            className="p-button-success"
          />
          <Button
            type="button"
            icon="pi pi-refresh"
            label="Reset"
            severity="secondary"
            onClick={() => reset()}
          />
        </div>

        <Divider />

        {/* Live JSON Preview */}
        <Fieldset legend="Preview JSON" className="rounded-2xl">
          <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded-xl overflow-auto">
            {JSON.stringify(watch(), null, 2)}
          </pre>
        </Fieldset>
      </form>
    </div>
  );
};
