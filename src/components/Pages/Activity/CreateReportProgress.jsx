import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { useUserStore } from "@_src/store/auth";
import { DecryptString } from "@_src/utils/helpers";
import { toast } from "react-toastify";
import { createForm14, updateForm14 } from "@_src/services/form14";
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';

export const CreateReportProgress = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activities_id, report } = location.state || {};
  const isEditMode = Boolean(report);

  const { token } = useUserStore((s) => ({ token: s.token }));
  const decryptedToken = token && DecryptString(token);

  const { control, handleSubmit, register, reset } = useForm({
    defaultValues: {
      objectives: "",
      target_group: "",
      description: "",
      achievements: "",
      challenges: "",
      feedback: "",
      acknowledgements: "",
      budget_summaries: [],
    },
  });

  useEffect(() => {
    if (isEditMode) {
      reset(report); // pre-fill when editing
    }
  }, [isEditMode, report, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "budget_summaries",
  });

  const onSubmit = async (formValues) => {
    if (!activities_id) {
      toast.warning("Activities ID is missing.");
      return;
    }

    const payload = {
      token: decryptedToken,
      activities_id,
      ...formValues,
    };

    try {
      if (isEditMode) {
        await updateForm14({ ...payload, id: report.form14_id });
        toast.success("Progress report updated successfully!");
        navigate(-2);
      } else {
        await createForm14({ ...payload, event_status_id: 3 });
        toast.success("Progress report created successfully!");
        navigate(-1);
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to submit report");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center pt-20 px-4">
      <h1 className="text-2xl font-semibold mb-6">
        {isEditMode ? "Edit Progress Report" : "Create Progress Report"}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-3xl flex flex-col gap-4">
        {[
          { label: "Objectives", name: "objectives" },
          { label: "Target Group", name: "target_group", type: "input" },
          { label: "Description", name: "description" },
          { label: "Achievements", name: "achievements" },
          { label: "Challenges / Lessons Learned", name: "challenges" },
          { label: "Feedback / Recommendations", name: "feedback" },
          { label: "Acknowledgements", name: "acknowledgements" },
        ].map((field, i) => (
          <div key={i}>
            <label className="font-bold">{field.label}</label>
            <Controller
              control={control}
              name={field.name}
              render={({ field: f }) =>
                field.type === "input" ? (
                  <InputText {...f} className="w-full border p-2 rounded" />
                ) : (
                  <InputTextarea {...f} rows={3} className="w-full border p-2 rounded" />
                )
              }
            />
          </div>
        ))}

<div className="mt-4">
  <h2 className="font-bold text-lg mb-2">Budget Summary</h2>
  {fields.map((item, index) => (
    <div key={item.id} className="flex gap-2 mb-2 items-center">

      <input
        type="text"
        placeholder="Description"
        {...register(`budget_summaries.${index}.description`)}
        className="border p-2 rounded flex-1"
      />

      <input
        type="text"
        placeholder="Item"
        {...register(`budget_summaries.${index}.item`)}
        className="border p-2 rounded flex-1"
      />

      <input
        type="number"
        placeholder="Quantity"
        {...register(`budget_summaries.${index}.quantity`, { valueAsNumber: true })}
        className="border p-2 rounded w-24"
      />

      <input
        type="number"
        placeholder="Cost"
        {...register(`budget_summaries.${index}.cost`, { valueAsNumber: true })}
        className="border p-2 rounded w-24"
      />

      <input
        type="text"
        placeholder="Personnel"
        {...register(`budget_summaries.${index}.personnel`)}
        className="border p-2 rounded flex-1"
      />

      <Button
        type="button"
        label="Remove"
        className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 shrink-0"
        onClick={() => remove(index)}
      />
    </div>
  ))}

  <Button
    type="button"
    label="Add Budget Item"
    className="bg-[#2211cc] mr-2"
    onClick={() => append({ cost: 0 })}
  />
</div>

        <Button type="submit" label={isEditMode ? "Update Report" : "Submit Report"} className="bg-green-600 mt-4" />
      </form>
    </div>
  );
};
