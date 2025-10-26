import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useUserStore } from "@_src/store/auth";
import { DecryptString } from "@_src/utils/helpers";
import { createForm6, updateForm6 } from "@_src/services/formservice";
import { useLocation, useNavigate } from "react-router-dom";
import { Dialog } from "primereact/dialog";

const defaultValues = {
  designation: "",
  representing: "",
  partnership: "",
  entitled: "",
  conducted_on: "",
  behalf_of: "",
  organization: "",
  address: "",
  mobile_number: "",
  email: "",
};

const TW_CARD = "shadow-sm rounded-2xl border border-gray-200";
const TW_BTN =
  "px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition";

export const Form6 = ({ onSubmit }) => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const { event, formdata } = location.state || {};

  const { token } = useUserStore((s) => ({ token: s.token }));
  const decryptedToken = useMemo(() => token && DecryptString(token), [token]);
  const [submitDialogVisible, setSubmitDialogVisible] = useState(false);
  const [formDataToSubmit, setFormDataToSubmit] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    // eslint-disable-next-line no-unused-vars
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues, mode: "onBlur" });

  useEffect(() => {
    if (formdata) {
      const rest = { ...formdata};
      reset(rest);
    }
  }, [formdata, reset]);

  const { mutate: createMut, isLoading: creating } = useMutation({
    mutationFn: createForm6,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form6"] });
      toast(data?.message || "Form6 created", { type: "success" });
      reset(defaultValues);
      navigate("/event/view");
    },
    onError: (err) => {
      toast(err?.response?.data?.message || "Error creating Form6", {
        type: "error",
      });
    },
  });

  const { mutate: updateMut, isLoading: updating } = useMutation({
    mutationFn: updateForm6,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form6"] });
      toast(data?.message || "Form6 updated", { type: "success" });
      navigate("/event/view");
    },
    onError: (err) => {
      toast(err?.response?.data?.message || "Error updating Form6", {
        type: "error",
      });
    },
  });

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
      updateMut({ token: decryptedToken, ...formDataToSubmit });
    } else {
      createMut({ token: decryptedToken, ...formDataToSubmit });
    }
    
    setSubmitDialogVisible(false);
    setFormDataToSubmit(null);
  };

  // Function to cancel submission
  const handleCancelSubmit = () => {
    setSubmitDialogVisible(false);
    setFormDataToSubmit(null);
  };

  const disabled = creating || updating || isSubmitting;

  return (
    <div className="min-h-screen bg-white w-full flex flex-col items-center sm:pl-[200px] py-20">
      <form onSubmit={handleSubmit(submit)} className="max-w-4xl w-full px-4 space-y-8">
        <Card title="Manifestation of Consent & Cooperation for the Extension Program" className={TW_CARD}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Designation */}
            <div className="flex flex-col">
              <label className="text-sm font-medium">Designation</label>
              <InputText
                {...register("designation", {
                  required: "Designation is required",
                  maxLength: { value: 255, message: "Max 255 characters" },
                })}
                placeholder="e.g., Project Coordinator"
                className="p-2 m-1"
              />
              {errors.designation && (
                <span className="text-xs text-red-600 mt-1">{errors.designation.message}</span>
              )}
            </div>

            {/* Representing */}
            <div className="flex flex-col">
              <label className="text-sm font-medium">Representing</label>
              <InputText
                {...register("representing", {
                  required: "Representing is required",
                  maxLength: { value: 255, message: "Max 255 characters" },
                })}
                placeholder="e.g., College of XYZ"
                className="p-2 m-1"
              />
              {errors.representing && (
                <span className="text-xs text-red-600 mt-1">{errors.representing.message}</span>
              )}
            </div>

            {/* Partnership */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-medium">Partnership With (NU Unit)</label>
              <InputText
                {...register("partnership", {
                  required: "Partnership is required",
                  maxLength: { value: 255, message: "Max 255 characters" },
                })}
                placeholder="e.g., College of Education"
                className="p-2 m-1"
              />
              {errors.partnership && (
                <span className="text-xs text-red-600 mt-1">{errors.partnership.message}</span>
              )}
            </div>

            {/* Entitled */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-medium">Program Title (Entitled)</label>
              <InputText
                {...register("entitled", {
                  required: "Program title is required",
                  maxLength: { value: 255, message: "Max 255 characters" },
                })}
                placeholder="e.g., Community Literacy Program"
                className="p-2 m-1"
              />
              {errors.entitled && (
                <span className="text-xs text-red-600 mt-1">{errors.entitled.message}</span>
              )}
            </div>

            {/* Conducted On */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-medium">Conducted On (Date or Range)</label>
              <InputText
                {...register("conducted_on", {
                  required: "Conducted on (date or range) is required",
                })}
                placeholder="e.g., Jan–Mar 2025 or 2025-01-10 to 2025-03-30"
                className="p-2 m-1"
              />
              {errors.conducted_on && (
                <span className="text-xs text-red-600 mt-1">{errors.conducted_on.message}</span>
              )}
            </div>

            {/* Behalf Of */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-medium">On Behalf Of</label>
              <InputText
                {...register("behalf_of", {
                  required: "Behalf of is required",
                  maxLength: { value: 255, message: "Max 255 characters" },
                })}
                placeholder="e.g., Department of ABC"
                className="p-2 m-1"
              />
              {errors.behalf_of && (
                <span className="text-xs text-red-600 mt-1">{errors.behalf_of.message}</span>
              )}
            </div>

            {/* Organization */}
            <div className="flex flex-col">
              <label className="text-sm font-medium">Organization / Institution</label>
              <InputText
                {...register("organization", {
                  required: "Organization is required",
                  maxLength: { value: 255, message: "Max 255 characters" },
                })}
                placeholder="e.g., National University"
                className="p-2 m-1"
              />
              {errors.organization && (
                <span className="text-xs text-red-600 mt-1">{errors.organization.message}</span>
              )}
            </div>

            {/* Address */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-medium">Address</label>
              <Controller
                name="address"
                control={control}
                rules={{
                  required: "Address is required",
                  maxLength: { value: 255, message: "Max 255 characters" },
                }}
                render={({ field }) => (
                  <InputTextarea
                    {...field}
                    autoResize
                    rows={2}
                    placeholder="Complete address"
                    className="p-2 m-1"
                  />
                )}
              />
              {errors.address && (
                <span className="text-xs text-red-600 mt-1">{errors.address.message}</span>
              )}
            </div>

            {/* Mobile */}
            <div className="flex flex-col">
              <label className="text-sm font-medium">Mobile Number</label>
              <InputText
                {...register("mobile_number", {
                  required: "Mobile number is required",
                  maxLength: { value: 11, message: "Max 11 characters" },
                })}
                placeholder="09xxxxxxxxx"
                className="p-2 m-1"
              />
              {errors.mobile_number && (
                <span className="text-xs text-red-600 mt-1">{errors.mobile_number.message}</span>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col">
              <label className="text-sm font-medium">Email Address</label>
              <InputText
                type="email"
                {...register("email", {
                  required: "Email is required",
                  maxLength: { value: 255, message: "Max 255 characters" },
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email",
                  },
                })}
                placeholder="name@example.com"
                className="p-2 m-1"
              />
              {errors.email && (
                <span className="text-xs text-red-600 mt-1">{errors.email.message}</span>
              )}
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button
            disabled={disabled}
            type="submit"
            label={disabled ? "Submitting..." : "Submit"}
            icon="pi pi-check"
            className={TW_BTN}
          />
          <Button
            type="button"
            label="Reset"
            icon="pi pi-refresh"
            className={TW_BTN}
            onClick={() => reset(defaultValues)}
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
              disabled={disabled}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSubmit}
              disabled={disabled}
              className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {disabled ? (
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
            Are you sure you want to {formdata ? 'update' : 'submit'} this manifestation of consent & cooperation form?
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
