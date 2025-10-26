import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Card } from "primereact/card";
import { Fieldset } from "primereact/fieldset";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useUserStore } from "@_src/store/auth";
import { DecryptString } from "@_src/utils/helpers";
import { createForm5, updateForm5 } from "@_src/services/formservice";
import { useLocation, useNavigate } from "react-router-dom";
import { Dialog } from "primereact/dialog";

const defaultValues = {
  a: false, b: false, c: false, d: false,
  e: false, f: false, g: false,
  h: false,
  i: false, j: false, k: false, l: false,
  m: false, n: false,
};

const InputLabel = ({ children }) => (
  <label className="text-sm font-medium text-gray-700">{children}</label>
);

const TW_CARD = "shadow-sm rounded-2xl border border-gray-200";
const TW_BTN = "px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition";

export const Form5 = ({ onSubmit }) => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const { event, formdata } = location.state;
  const { token } = useUserStore((state) => ({ token: state.token }));
  const decryptedToken = token && DecryptString(token);
  const [submitDialogVisible, setSubmitDialogVisible] = useState(false);
  const [formDataToSubmit, setFormDataToSubmit] = useState(null);

  const { mutate: handleCreateForm5, isLoading: createLoading } = useMutation({
    mutationFn: createForm5,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form5"] });
      toast(data.message, { type: "success" });
      reset();
      navigate("/event/view");
    },
    onError: (error) => {
      toast(error?.response?.data?.message || "Error creating form", { type: "error" });
    },
  });

  const { mutate: handleUpdateForm5, isLoading: updateLoading } = useMutation({
    mutationFn: updateForm5,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form5"] });
      toast(data.message, { type: "success" });
      navigate("/event/view");
    },
    onError: (error) => {
      toast(error?.response?.data?.message || "Error updating form", { type: "error" });
    },
  });

  // eslint-disable-next-line no-unused-vars
  const { control, handleSubmit, reset, watch } = useForm({ defaultValues });

  useEffect(() => {
    if (formdata) {
      // ✅ Handle both array and object responses
      const formDataToUse = Array.isArray(formdata) ? formdata[0] : formdata;
      reset(formDataToUse || defaultValues);
    }
  }, [formdata, reset]);

  const submit = (data) => {
  // ✅ Handle both array and object formats
    const formDataId = Array.isArray(formdata) ? formdata[0]?.id : formdata?.id;
    
    const payload = {
      ...(formDataId && { id: formDataId }),
      event_id: event?.id,
      ...data,
    };

    onSubmit?.(payload);
    
    setFormDataToSubmit(payload);
    setSubmitDialogVisible(true);
  };

  // Function to actually submit after confirmation
  const handleConfirmSubmit = () => {
    if (!formDataToSubmit) return;
    
    if (formdata) {
      handleUpdateForm5({ token: decryptedToken, ...formDataToSubmit });
    } else {
      handleCreateForm5({ token: decryptedToken, ...formDataToSubmit });
    }
    
    setSubmitDialogVisible(false);
    setFormDataToSubmit(null);
  };

  // Function to cancel submission
  const handleCancelSubmit = () => {
    setSubmitDialogVisible(false);
    setFormDataToSubmit(null);
  };
  const sections = [
    {
      title: "I. Relevance to Academic Extension Programs",
      fields: [
        { key: "a", label: "Is the project related to disaster response, rehabilitation, and recovery?" },
        { key: "b", label: "If it is a regular outreach project, is it going to be built and maintained on the basis of existing academic research programs of the school?" },
        { key: "c", label: "Can it be easily repackaged into an extension program for future purposes?" },
        { key: "d", label: "Is the project relevant to the core competencies of the School or Department?" },
      ],
    },
    {
      title: "II. Collaborative and Participatory",
      fields: [
        { key: "e", label: "Does it involve the input and collaboration of the target group?" },
        { key: "f", label: "Is the target group willing to take part in the implementation, monitoring, and evaluation of the project?" },
        { key: "g", label: "Is it to be done within a community that we have MOA with?" },
      ],
    },
    {
      title: "III. Value(s) Oriented",
      fields: [
        { key: "h", label: "Is the project in line with the ComEx’s value proposition?" },
      ],
    },
    {
      title: "IV. Financing and Sustainability",
      fields: [
        { key: "i", label: "Is the project not financially demanding so it cannot drain the financial resources?" },
        { key: "j", label: "Is the target group willing to share counterpart resources?" },
        { key: "k", label: "Is there any external funding agency that shall support the project?" },
        { key: "l", label: "Is there any related activity to support and finance the proposed project?" },
      ],
    },
    {
      title: "V. Significance",
      fields: [
        { key: "m", label: "Is it going to cater to pressing and legitimate community needs?" },
        { key: "n", label: "Are there formal studies, community assessments, and problem analyses conducted?" },
      ],
    },
  ];

  return (
    <div className="form5 min-h-screen bg-white w-full flex flex-col justify-center items-center sm:pl-[200px] py-20">
      <form onSubmit={handleSubmit(submit)} className="max-w-4xl mx-auto p-6 space-y-8">
        <Card title="Form 5 - Checklist of Criteria for Project Proposal" className={TW_CARD}>
          <div className="space-y-8">
            {sections.map((section, idx) => (
              <Fieldset key={idx} legend={section.title} className={TW_CARD}>
                <div className="space-y-4">
                  {section.fields.map((f) => (
                    <div key={f.key} className="flex items-center gap-3">
                      <Controller
                        control={control}
                        name={f.key}
                        render={({ field }) => (
                          <Checkbox
                            inputId={f.key}
                            onChange={(e) => field.onChange(e.checked)}
                            checked={field.value}
                          />
                        )}
                      />
                      <InputLabel>{f.label}</InputLabel>
                    </div>
                  ))}
                </div>
              </Fieldset>
            ))}
          </div>
        </Card>

        <div className="flex gap-3">
          <Button
            disabled={createLoading || updateLoading}
            type="submit"
            label={createLoading || updateLoading ? "Submitting..." : "Submit"}
            icon="pi pi-check"
            className={TW_BTN}
          />
          <Button type="reset" label="Reset" icon="pi pi-refresh" className={TW_BTN} onClick={() => reset(defaultValues)} />
        </div>
      </form>
      <Dialog
        header="Confirm Submission"
        visible={submitDialogVisible}
        style={{ width: '400px' }}
        onHide={handleCancelSubmit}
        footer={
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCancelSubmit}
              disabled={createLoading || updateLoading}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSubmit}
              disabled={createLoading || updateLoading}
              className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {(createLoading || updateLoading) ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <i className="pi pi-check text-sm"></i>
                  Yes, Submit
                </span>
              )}
            </button>
          </div>
        }
      >
        <div className="confirmation-content">
          <p className="text-gray-700 mb-4">
            Are you sure you want to {formdata ? 'update' : 'submit'} this project proposal checklist?
          </p>
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <i className="pi pi-info-circle text-blue-600"></i>
            <p className="text-sm text-blue-800">
              Please review all criteria before submitting.
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
