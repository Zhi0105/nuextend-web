import React, { useEffect, useMemo } from "react";
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
import { useLocation } from "react-router-dom";

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
  const { event, formdata } = location.state || {};

  const { token } = useUserStore((s) => ({ token: s.token }));
  const decryptedToken = useMemo(() => token && DecryptString(token), [token]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues, mode: "onBlur" });

  useEffect(() => {
    if (formdata?.[0]) {
      const rest = { ...formdata[0] };
      delete rest.event_id;
      reset(rest);
    }
  }, [formdata, reset]);

  const { mutate: createMut, isLoading: creating } = useMutation({
    mutationFn: createForm6,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form6"] });
      toast(data?.message || "Form6 created", { type: "success" });
      reset(defaultValues);
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

    if (formdata?.[0]) {
      updateMut({ token: decryptedToken, ...payload });
    } else {
      createMut({ token: decryptedToken, ...payload });
    }
  };

  const disabled = creating || updating || isSubmitting;

  return (
    <div className="min-h-screen bg-white w-full flex flex-col items-center sm:pl-[200px] py-20">
      <form onSubmit={handleSubmit(submit)} className="max-w-4xl w-full px-4 space-y-8">
        <Card title="Manifestation Of Consent & Cooperation — Web Form" className={TW_CARD}>
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

        <details className="mt-6">
          <summary className="cursor-pointer select-none">Preview JSON (dev)</summary>
          <pre className="bg-gray-50 p-3 rounded overflow-auto text-sm">
            {JSON.stringify({ event_id: event?.id, ...watch() }, null, 2)}
          </pre>
        </details>
      </form>
    </div>
  );
};
