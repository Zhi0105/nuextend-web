import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { Tooltip } from "primereact/tooltip";
import { FloatLabel } from "primereact/floatlabel";
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

  const { control, handleSubmit, register, reset, formState: { isSubmitting } } = useForm({
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

  const { fields, append, remove } = useFieldArray({
    control,
    name: "budget_summaries",
  });

  useEffect(() => {
    if (isEditMode && report) {
      const formData = {
        ...report,
        budget_summaries: report.budget_summaries || []
      };
      reset(formData);
    }
  }, [isEditMode, report, reset]);

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

  const formFields = [
    { 
      label: "Objectives", 
      name: "objectives", 
      type: "textarea",
      description: "What were the main goals and objectives of this activity?",
      rows: 4
    },
    { 
      label: "Target Group", 
      name: "target_group", 
      type: "textarea", // Changed from "input" to "textarea"
      description: "Who was the intended audience or beneficiaries? Provide detailed information about the target participants, demographics, or groups.",
      rows: 3 // Added rows for better visibility
    },
    { 
      label: "Activity Description", 
      name: "description", 
      type: "textarea",
      description: "Detailed description of what took place during the activity",
      rows: 4
    },
    { 
      label: "Achievements", 
      name: "achievements", 
      type: "textarea",
      description: "What was successfully accomplished?",
      rows: 4
    },
    { 
      label: "Challenges & Lessons Learned", 
      name: "challenges", 
      type: "textarea",
      description: "Any difficulties encountered and key takeaways",
      rows: 4
    },
    { 
      label: "Feedback & Recommendations", 
      name: "feedback", 
      type: "textarea",
      description: "Suggestions for improvement and future activities",
      rows: 4
    },
    { 
      label: "Acknowledgements", 
      name: "acknowledgements", 
      type: "textarea",
      description: "Recognize individuals or groups who contributed",
      rows: 3
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 w-full flex flex-col items-center pt-20 px-4 pb-8">
      <div className="w-full max-w-4xl">
        {/* Header Section */}
        <Card className="shadow-lg border-0 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <i className={`pi ${isEditMode ? 'pi-file-edit' : 'pi-file-plus'} text-white text-lg`}></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {isEditMode ? "Edit Progress Report" : "Create Progress Report"}
              </h1>
              <p className="text-gray-600">
                {isEditMode 
                  ? "Update your activity progress report details" 
                  : "Document the progress and outcomes of your activity"
                }
              </p>
            </div>
          </div>
          <Divider />
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <i className="pi pi-info-circle"></i>
            <span>Please fill in all required sections to complete your progress report</span>
          </div>
        </Card>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Main Form Sections */}
          <Card className="shadow-lg border-0">
            <div className="space-y-6">
              {formFields.map((field, index) => (
                <div key={field.name} className="field">
                  <div className="flex items-center gap-2 mb-3">
                    <label className="font-semibold text-gray-700 text-lg">
                      {field.label}
                    </label>
                    <Tooltip target={`.tooltip-${field.name}`} />
                    <i 
                      className={`pi pi-question-circle text-gray-400 text-sm tooltip-${field.name}`}
                      data-pr-tooltip={field.description}
                    ></i>
                  </div>
                  
                  <Controller
                    control={control}
                    name={field.name}
                    render={({ field: f }) => (
                      <InputTextarea 
                        {...f} 
                        rows={field.rows || 4}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                      />
                    )}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Budget Summary Section */}
          <Card className="shadow-lg border-0">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Budget Summary</h2>
                <p className="text-gray-600">Track expenses and budget allocations</p>
              </div>
              <Button
                type="button"
                label="Add Budget Item"
                icon="pi pi-plus"
                className="bg-blue-600 hover:bg-blue-700 border-blue-600"
                onClick={() => append({ 
                  description: "", 
                  item: "", 
                  quantity: 0, 
                  cost: 0, 
                  personnel: "" 
                })}
              />
            </div>

            <Divider />

            {fields.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <i className="pi pi-wallet text-4xl text-gray-400 mb-3"></i>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Budget Items Added</h3>
                <p className="text-gray-500 mb-4">Start by adding your first budget item</p>
                <Button
                  type="button"
                  label="Add First Item"
                  icon="pi pi-plus"
                  className="bg-blue-600 hover:bg-blue-700 border-blue-600"
                  onClick={() => append({ 
                    description: "", 
                    item: "", 
                    quantity: 0, 
                    cost: 0, 
                    personnel: "" 
                  })}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((item, index) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-700">Budget Item #{index + 1}</h4>
                      <Button
                        type="button"
                        icon="pi pi-trash"
                        severity="danger"
                        className="p-button-text p-button-danger p-button-sm"
                        onClick={() => remove(index)}
                        tooltip="Remove this item"
                        tooltipOptions={{ position: 'top' }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-3">
                      <div className="field">
                        <FloatLabel>
                          <InputText
                            id={`description-${index}`}
                            {...register(`budget_summaries.${index}.description`)}
                            className="w-full"
                          />
                          <label htmlFor={`description-${index}`}>Description</label>
                        </FloatLabel>
                      </div>

                      <div className="field">
                        <FloatLabel>
                          <InputText
                            id={`item-${index}`}
                            {...register(`budget_summaries.${index}.item`)}
                            className="w-full"
                          />
                          <label htmlFor={`item-${index}`}>Item</label>
                        </FloatLabel>
                      </div>

                      <div className="field">
                        <FloatLabel>
                          <InputText
                            id={`quantity-${index}`}
                            type="number"
                            {...register(`budget_summaries.${index}.quantity`, { valueAsNumber: true })}
                            className="w-full"
                          />
                          <label htmlFor={`quantity-${index}`}>Quantity</label>
                        </FloatLabel>
                      </div>

                      <div className="field">
                        <FloatLabel>
                          <InputText
                            id={`cost-${index}`}
                            type="number"
                            {...register(`budget_summaries.${index}.cost`, { valueAsNumber: true })}
                            className="w-full"
                          />
                          <label htmlFor={`cost-${index}`}>Cost</label>
                        </FloatLabel>
                      </div>

                      <div className="field">
                        <FloatLabel>
                          <InputText
                            id={`personnel-${index}`}
                            {...register(`budget_summaries.${index}.personnel`)}
                            className="w-full"
                          />
                          <label htmlFor={`personnel-${index}`}>Personnel</label>
                        </FloatLabel>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {fields.length > 0 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                <span className="text-gray-600 font-medium">
                  Total Items: <span className="text-blue-600">{fields.length}</span>
                </span>
                <Button
                  type="button"
                  label="Add Another Item"
                  icon="pi pi-plus"
                  className="bg-green-600 hover:bg-green-700 border-green-600"
                  onClick={() => append({ 
                    description: "", 
                    item: "", 
                    quantity: 0, 
                    cost: 0, 
                    personnel: "" 
                  })}
                />
              </div>
            )}
          </Card>

          {/* Action Buttons */}
          <Card className="shadow-lg border-0">
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <Button
                type="button"
                label="Cancel"
                icon="pi pi-arrow-left"
                className="p-button-text p-button-secondary"
                severity="secondary"
                onClick={() => navigate(-1)}
              />
              <div className="flex gap-3">
                <Button
                  type="submit"
                  label={isEditMode ? "Update Report" : "Submit Report"}
                  icon={isEditMode ? "pi pi-check" : "pi pi-send"}
                  loading={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 border-green-600"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
};