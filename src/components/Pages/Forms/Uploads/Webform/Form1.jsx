import React from "react";
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

/**
 * Payload shape (followed exactly):
 * {
 *   duration: "",
 *   background: "",
 *   overallGoal: "",
 *   scholarlyConnection: "",
 *   programTeamMembers: [],
 *   cooperatingAgencies: [],
 *   componentProjects: [ { title: "", outcomes: "", budget: null } ],
 *   projects: [ { title: "", teamLeader: "", teamMembers: [], objectives: "" } ],
 *   activityPlans: [ { activities: "", outputs: "", timeline: null, personnel: "" } ],
 * }
 */

export const Form1 = () => {
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
      componentProjects: [
        { title: "", outcomes: "", budget: null },
      ],
      projects: [
        { title: "", teamLeader: "", teamMembers: [], objectives: "" },
      ],
      activityPlans: [
        { activities: "", outputs: "", timeline: null, personnel: "" },
      ],
    },
  });

  // Repeatable groups
  const componentProjectsFA = useFieldArray({ control, name: "componentProjects" });
  const projectsFA = useFieldArray({ control, name: "projects" });
  const activityPlansFA = useFieldArray({ control, name: "activityPlans" });

  const onSubmit = (data) => {
    // Replace with your integration
    console.log("Submitted payload:", data);
    alert("Form submitted! Check console for payload.");
  };

  // Small helper for error text
  const Err = ({ name, msg }) => (
    <small className="p-error block mt-1">{msg || errors?.[name]?.message || "Required"}</small>
  );

  return (
    
    <div className="form1-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-5xl space-y-20 px-4">
        {/* Header */}
        <Card title={<span className="text-2xl font-bold">Program Proposal Form</span>} className="rounded-2xl shadow-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Duration */}
            <div>
              <label className="block mb-2">Duration</label>
              <InputText
                {...register("duration", { required: "Duration is required" })}
                className={`w-full py-1 px-4 border border-gray-300 ${errors.duration ? "p-invalid" : ""}`}
                placeholder="e.g., 6 months"
              />
              {errors.duration && <Err name="duration" />}
            </div>

            {/* Scholarly Connection */}
            <div>
              <label className="block mb-2">Scholarly Connection</label>
              <InputTextarea
                autoResize rows={3}
                {...register("scholarlyConnection", { required: "Required" })}
                className={`w-full py-1 px-4 border border-gray-300 ${errors.scholarlyConnection ? "p-invalid" : ""}`}
                placeholder="Explain the scholarly basis/connection"
              />
              {errors.scholarlyConnection && <Err name="scholarlyConnection" />}
            </div>

            {/* Background */}
            <div className="md:col-span-2">
              <label className="block mb-2">Background & Problem Statement</label>
              <InputTextarea
                autoResize rows={5}
                {...register("background", { required: "Required" })}
                className={`w-full py-1 px-4 border border-gray-300 ${errors.background ? "p-invalid" : ""}`}
                placeholder="Context and problem statement"
              />
              {errors.background && <Err name="background" />}
            </div>

            {/* Overall Goal */}
            <div className="md:col-span-2">
              <label className="block mb-2">Overall Goal</label>
              <InputTextarea
                autoResize rows={4}
                {...register("overallGoal", { required: "Required" })}
                className={`w-full py-1 px-4 border border-gray-300 ${errors.overallGoal ? "p-invalid" : ""}`}
                placeholder="High-level goal of the program"
              />
              {errors.overallGoal && <Err name="overallGoal" />}
            </div>

            {/* Program Team Members */}
            <div className="md:col-span-2">
              <label className="block mb-2">Program Team Members</label>
              <Controller
                control={control}
                name="programTeamMembers"
                rules={{
                  validate: (v) => (v?.length ?? 0) > 0 || "Add at least one team member",
                }}
                render={({ field }) => (
                  <Chips
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    separator="," placeholder="Type a name, press Enter"
                    pt={{
                        input: { className: "w-full px-4" }, // <-- force input width
                        container: { className: "w-full border border-gray-400" } // ensure container respects parent
                    }}
                    className={`w-full py-1 ${errors.programTeamMembers ? "p-invalid" : ""}`}
                  />
                )}
              />
              {errors.programTeamMembers && (
                <Err name="programTeamMembers" msg={errors.programTeamMembers.message} />
              )}
            </div>

            {/* Cooperating Agencies */}
            <div className="md:col-span-2">
              <label className="block mb-2">Cooperating Agencies</label>
              <Controller
                control={control}
                name="cooperatingAgencies"
                rules={{
                  validate: (v) => (v?.length ?? 0) > 0 || "Add at least one agency",
                }}
                render={({ field }) => (
                  <Chips
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    separator="," placeholder="Type an agency, press Enter"
                    pt={{
                        input: { className: "w-full px-4" }, // <-- force input width
                        container: { className: "w-full border border-gray-400" } // ensure container respects parent
                    }}
                    className={`w-full py-1 ${errors.cooperatingAgencies ? "p-invalid" : ""}`}
                  />
                )}
              />
              {errors.cooperatingAgencies && (
                <Err name="cooperatingAgencies" msg={errors.cooperatingAgencies.message} />
              )}
            </div>
          </div>
        </Card>

        {/* Component Projects */}
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
                    {errors?.componentProjects?.[idx]?.title && <Err name={`componentProjects.${idx}.title`} />}
                  </div>
                  <div>
                    <label className="block mb-2">Budget</label>
                    <Controller
                      control={control}
                      name={`componentProjects.${idx}.budget`}
                      rules={{
                        required: "Required",
                        validate: (v) => (v ?? 0) >= 0 || "Budget cannot be negative",
                      }}
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
                    {errors?.componentProjects?.[idx]?.budget && <Err name={`componentProjects.${idx}.budget`} />}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-2">Outcomes</label>
                    <InputTextarea
                      autoResize rows={3}
                      {...register(`componentProjects.${idx}.outcomes`, { required: "Required" })}
                      className={`w-full py-1 px-4 border border-gray-300 ${errors?.componentProjects?.[idx]?.outcomes ? "p-invalid" : ""}`}
                      placeholder="Intended outcomes"
                    />
                    {errors?.componentProjects?.[idx]?.outcomes && <Err name={`componentProjects.${idx}.outcomes`} />}
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

        {/* Projects */}
        <Fieldset legend="Projects" className="rounded-2xl">
          <div className="space-y-8">
            {projectsFA.fields.map((field, idx) => (
              <Card key={field.id} className="rounded-xl shadow-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2">Title</label>
                    <InputText
                      {...register(`projects.${idx}.title`, { required: "Required" })}
                      className={`w-full py-1 px-4 border border-gray-300 ${errors?.projects?.[idx]?.title ? "p-invalid" : ""}`}
                      placeholder="Project title"
                    />
                    {errors?.projects?.[idx]?.title && <Err name={`projects.${idx}.title`} />}
                  </div>
                  <div>
                    <label className="block mb-2">Team Leader</label>
                    <InputText
                      {...register(`projects.${idx}.teamLeader`, { required: "Required" })}
                      className={`w-full py-1 px-4 border border-gray-300 ${errors?.projects?.[idx]?.teamLeader ? "p-invalid" : ""}`}
                      placeholder="Name of team leader"
                    />
                    {errors?.projects?.[idx]?.teamLeader && <Err name={`projects.${idx}.teamLeader`} />}
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
                            pt={{
                                input: { className: "w-full px-4" }, // <-- force input width
                                container: { className: "w-full border border-gray-400" } // ensure container respects parent
                            }}
                          className={`w-full py-1 ${errors?.projects?.[idx]?.teamMembers ? "p-invalid" : ""}`}
                        />
                      )}
                    />
                    {errors?.projects?.[idx]?.teamMembers && (
                      <Err name={`projects.${idx}.teamMembers`} msg={errors.projects[idx].teamMembers.message} />
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
                    {errors?.projects?.[idx]?.objectives && <Err name={`projects.${idx}.objectives`} />}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button type="button" icon="pi pi-plus" label="Add" onClick={() => projectsFA.append({ title: "", teamLeader: "", teamMembers: [], objectives: "" })} />
                  {projectsFA.fields.length > 1 && (
                    <Button type="button" icon="pi pi-trash" label="Remove" severity="danger" onClick={() => projectsFA.remove(idx)} />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Fieldset>

        {/* Activity Plans */}
        <Fieldset legend="Activity Plans" className="rounded-2xl">
          <div className="space-y-8">
            {activityPlansFA.fields.map((field, idx) => (
              <Card key={field.id} className="rounded-xl shadow-1">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block mb-2">Activities</label>
                    <InputText
                      {...register(`activityPlans.${idx}.activities`, { required: "Required" })}
                      className={`w-full py-1 px-4 border border-gray-300 ${errors?.activityPlans?.[idx]?.activities ? "p-invalid" : ""}`}
                      placeholder="Activity"
                    />
                    {errors?.activityPlans?.[idx]?.activities && <Err name={`activityPlans.${idx}.activities`} />}
                  </div>
                  <div>
                    <label className="block mb-2">Outputs</label>
                    <InputText
                      {...register(`activityPlans.${idx}.outputs`, { required: "Required" })}
                      className={`w-full py-1 px-4 border border-gray-300 ${errors?.activityPlans?.[idx]?.outputs ? "p-invalid" : ""}`}
                      placeholder="Expected output"
                    />
                    {errors?.activityPlans?.[idx]?.outputs && <Err name={`activityPlans.${idx}.outputs`} />}
                  </div>
                  <div>
                    <label className="block mb-2">Timeline (M/D/Y)</label>
                    <Controller
                      control={control}
                      name={`activityPlans.${idx}.timeline`}
                      rules={{ required: "Required" }}
                      render={({ field }) => (
                        <Calendar
                          value={field.value}
                          onChange={(e) => field.onChange(e.value)}
                          dateFormat="mm/dd/yy"
                          className={`w-full ${errors?.activityPlans?.[idx]?.timeline ? "p-invalid" : ""}`}
                        />
                      )}
                    />
                    {errors?.activityPlans?.[idx]?.timeline && <Err name={`activityPlans.${idx}.timeline`} />}
                  </div>
                  <div>
                    <label className="block mb-2">Personnel</label>
                    <InputText
                      {...register(`activityPlans.${idx}.personnel`, { required: "Required" })}
                      className={`w-full py-1 px-4 border border-gray-300 ${errors?.activityPlans?.[idx]?.personnel ? "p-invalid" : ""}`}
                      placeholder="Person in charge"
                    />
                    {errors?.activityPlans?.[idx]?.personnel && <Err name={`activityPlans.${idx}.personnel`} />}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button type="button" icon="pi pi-plus" label="Add" onClick={() => activityPlansFA.append({ activities: "", outputs: "", timeline: null, personnel: "" })} />
                  {activityPlansFA.fields.length > 1 && (
                    <Button type="button" icon="pi pi-trash" label="Remove" severity="danger" onClick={() => activityPlansFA.remove(idx)} />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Fieldset>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" icon="pi pi-check" label="Submit" className="p-button-success" />
          <Button type="button" icon="pi pi-refresh" label="Reset" severity="secondary" onClick={() => reset()} />
        </div>

        <Divider />

        {/* Live JSON preview */}
        <Fieldset legend="Preview JSON" className="rounded-2xl">
          <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded-xl overflow-auto">
            {JSON.stringify(watch(), null, 2)}
          </pre>
        </Fieldset>
        </form>
    </div>
  );
};

