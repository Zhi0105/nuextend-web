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
import { createForm4, updateForm4 } from "@_src/services/formservice";
import { useLocation, useNavigate } from "react-router-dom";
import { Dialog } from "primereact/dialog";

const defaultValues = {
  a: false, b: false, c: false,
  d: false, e: false, f: false, g: false,
  h: false,
  i: false, j: false, k: false, l: false, m: false,
  n: false, o: false, p: false,
};

const InputLabel = ({ children }) => (
  <label className="text-sm font-medium text-gray-700">{children}</label>
);

const TW_CARD = "shadow-sm rounded-2xl border border-gray-200";
const TW_BTN = "px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition";

export const Form4 = ({ onSubmit }) => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const { event, formdata } = location.state;
  const { token } = useUserStore((state) => ({ token: state.token }));
  const decryptedToken = token && DecryptString(token);
  const [submitDialogVisible, setSubmitDialogVisible] = useState(false);
  const [formDataToSubmit, setFormDataToSubmit] = useState(null);

  const { mutate: handleCreateForm4, isLoading: createLoading } = useMutation({
    mutationFn: createForm4,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form4"] });
      toast(data.message, { type: "success" });
      reset();
      navigate("/event/view");
    },
    onError: (error) => {
      toast(error?.response?.data?.message || "Error creating form", { type: "error" });
    },
  });

  const { mutate: handleUpdateForm4, isLoading: updateLoading } = useMutation({
    mutationFn: updateForm4,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form4"] });
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
      reset(formdata || defaultValues);
    }
  }, [formdata, reset]);

  const submit = (data) => {
    const payload = {
      ...(formdata?.[0]?.id && { id: formdata[0].id }),
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
      handleUpdateForm4({ token: decryptedToken, ...formDataToSubmit });
    } else {
      handleCreateForm4({ token: decryptedToken, ...formDataToSubmit });
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
      title: "I. Relevance to Academic and Research Programs",
      fields: [
        { key: "a", label: "Is the program strongly linked to teaching and research?" },
        { key: "b", label: "Is it based on existing academic or research programs?" },
        { key: "c", label: "Is it relevant to the core competencies of the School/Department?" },
      ],
    },
    {
      title: "II. Collaborative and Participatory",
      fields: [
        { key: "d", label: "Does it involve collaboration with the target group?" },
        { key: "e", label: "Is the target group willing to monitor and evaluate?" },
        { key: "f", label: "Are there assurances of cooperation?" },
        { key: "g", label: "Is it done within a community with MOA?" },
      ],
    },
    {
      title: "III. Value(s) Oriented",
      fields: [{ key: "h", label: "Does the program promote social transformation in line with NU values?" }],
    },
    {
      title: "IV. Financing and Sustainability",
      fields: [
        { key: "i", label: "Not financially draining?" },
        { key: "j", label: "Enough personnel available?" },
        { key: "k", label: "Is there external funding agency support?" },
        { key: "l", label: "Capable of managing sustainably?" },
        { key: "m", label: "Will it contribute to holistic growth?" },
      ],
    },
    {
      title: "V. Evidence-Based Need and Significance",
      fields: [
        { key: "n", label: "Clearly stated background, outcomes, and projects?" },
        { key: "o", label: "Are there formal studies/assessments?" },
        { key: "p", label: "Specific and measurable results?" },
      ],
    },
  ];

  return (
    <div className="form4 min-h-screen bg-white w-full flex flex-col justify-center items-center sm:pl-[200px] py-20">
      <form onSubmit={handleSubmit(submit)} className="max-w-4xl mx-auto p-6 space-y-8">
        <Card title="Form 4 - Checklist of Criteria for Extension Program Proposal" className={TW_CARD}>
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
              Are you sure you want to {formdata ? 'update' : 'submit'} this extension program proposal checklist?
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
