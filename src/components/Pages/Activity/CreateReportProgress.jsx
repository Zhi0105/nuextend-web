import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { Dialog } from "primereact/dialog";
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

  const [submitDialogVisible, setSubmitDialogVisible] = useState(false);
  const [formDataToSubmit, setFormDataToSubmit] = useState(null);

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

    setFormDataToSubmit(payload);
    setSubmitDialogVisible(true);
  };

  const handleConfirmSubmit = async () => {
    if (!formDataToSubmit) return;

    try {
      if (isEditMode) {
        await updateForm14({ ...formDataToSubmit, id: report.form14_id });
        toast.success("Progress report updated successfully!");
        navigate(-2);
      } else {
        await createForm14({ ...formDataToSubmit, event_status_id: 3 });
        toast.success("Progress report created successfully!");
        navigate(-1);
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to submit report");
    } finally {
      setSubmitDialogVisible(false);
      setFormDataToSubmit(null);
    }
  };

  const handleCancelSubmit = () => {
    setSubmitDialogVisible(false);
    setFormDataToSubmit(null);
  };

  const formFields = [
    { label: "Objectives", name: "objectives", rows: 4, placeholder: "Describe the main objectives of the activity..." },
    { label: "Target Group", name: "target_group", type: "input", placeholder: "Who is this activity for?" },
    { label: "Description", name: "description", rows: 4, placeholder: "Provide a detailed description of the activity..." },
    { label: "Achievements", name: "achievements", rows: 3, placeholder: "What was accomplished during this activity?" },
    { label: "Challenges / Lessons Learned", name: "challenges", rows: 3, placeholder: "Any difficulties encountered and lessons learned..." },
    { label: "Feedback / Recommendations", name: "feedback", rows: 3, placeholder: "Feedback received and recommendations for future activities..." },
    { label: "Acknowledgements", name: "acknowledgements", rows: 2, placeholder: "People or organizations to acknowledge..." },
  ];

  return (
    <div className="min-h-screen bg-gray-50 w-full flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {isEditMode ? "Edit Progress Report" : "Create Progress Report"}
          </h1>
          <p className="text-gray-600">
            {isEditMode ? "Update your existing progress report" : "Fill out the form below to create a new progress report"}
          </p>
        </div>

        <Card className="shadow-lg border-0 rounded-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-2">
            {/* Main Form Fields */}
            <div className="space-y-6">
              {formFields.map((field, index) => (
                <div key={index} className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    {field.label}
                  </label>
                  <Controller
                    control={control}
                    name={field.name}
                    render={({ field: f }) =>
                      field.type === "input" ? (
                        <InputText 
                          {...f} 
                          placeholder={field.placeholder}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      ) : (
                        <InputTextarea 
                          {...f} 
                          rows={field.rows} 
                          placeholder={field.placeholder}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
                        />
                      )
                    }
                  />
                </div>
              ))}
            </div>

            <Divider />

            {/* Budget Summary Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Budget Summary</h3>
                <Button
                  type="button"
                  icon="pi pi-plus"
                  label="Add Item"
                  className="bg-blue-600 hover:bg-blue-700 text-white border-0 px-4 py-2 rounded-lg transition-colors"
                  onClick={() => append({ 
                    description: "", 
                    item: "", 
                    quantity: 0, 
                    cost: 0, 
                    personnel: "" 
                  })}
                />
              </div>

              <div className="space-y-3">
                {fields.map((item, index) => (
                  <div key={item.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Description</label>
                        <input
                          type="text"
                          placeholder="Item description"
                          {...register(`budget_summaries.${index}.description`)}
                          className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Item</label>
                        <input
                          type="text"
                          placeholder="Item name"
                          {...register(`budget_summaries.${index}.item`)}
                          className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Quantity</label>
                        <input
                          type="number"
                          placeholder="0"
                          {...register(`budget_summaries.${index}.quantity`, { valueAsNumber: true })}
                          className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Cost (₱)</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          {...register(`budget_summaries.${index}.cost`, { valueAsNumber: true })}
                          className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="flex gap-2 items-end">
                        <div className="space-y-1 flex-1">
                          <label className="text-xs font-medium text-gray-600">Personnel</label>
                          <input
                            type="text"
                            placeholder="Responsible person"
                            {...register(`budget_summaries.${index}.personnel`)}
                            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <Button
                          type="button"
                          icon="pi pi-trash"
                          severity="danger"
                          className="p-2 h-10 w-10 bg-red-500 hover:bg-red-600 border-0 text-white rounded-lg transition-colors"
                          onClick={() => remove(index)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {fields.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <i className="pi pi-wallet text-3xl mb-2"></i>
                  <p>No budget items added yet</p>
                  <p className="text-sm">Click "Add Item" to start adding budget details</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                label="Cancel"
                icon="pi pi-times"
                severity="secondary"
                className="flex-1 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => navigate(-1)}
              />
              <Button
                type="submit"
                label={isEditMode ? "Update Report" : "Submit Report"}
                icon="pi pi-check"
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 border-0 text-white rounded-lg transition-colors"
              />
            </div>
          </form>
        </Card>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog
        header="Confirm Submission"
        visible={submitDialogVisible}
        style={{ width: '400px' }}
        onHide={handleCancelSubmit}
        footer={
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCancelSubmit}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200 shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSubmit}
              className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <span className="flex items-center gap-2">
                <i className="pi pi-check text-sm"></i>
                Yes, {isEditMode ? 'Update' : 'Submit'}
              </span>
            </button>
          </div>
        }
      >
        <div className="confirmation-content">
          <p className="text-gray-700 mb-4">
            Are you sure you want to {isEditMode ? 'update' : 'submit'} this progress report?
          </p>
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <i className="pi pi-info-circle text-blue-600"></i>
            <p className="text-sm text-blue-800">
              Please review all information before submitting.
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
};