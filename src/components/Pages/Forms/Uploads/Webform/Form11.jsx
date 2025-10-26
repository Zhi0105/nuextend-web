// src/features/forms/Form11.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useUserStore } from "@_src/store/auth";
import { DecryptString } from "@_src/utils/helpers";
import { createForm11, updateForm11 } from "@_src/services/formservice";
import { useLocation, useNavigate } from "react-router-dom";
import { Dialog } from "primereact/dialog";

const TW_CARD = "shadow-sm rounded-2xl border border-gray-200";
const TW_BTN =
  "px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition";
const TW_ERR = "text-[11px] text-red-600 px-2 pb-2";

const defaultValues = {
  event_id: "",
  transportation_medium: "",
  driver: "",
  travelDetails: [
    {
      date: null,
      from: "",
      to: "",
      departure: null,
      arrival: null,
      purpose: "",
    },
  ],
};

const req = (label) => ({
  required: `${label} is required`,
  validate: (v) =>
    v && String(v).trim().length ? true : `${label} is required`,
});

export const Form11 = ({ onSubmit }) => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const { event, formdata } = location.state || {};
  const [submitDialogVisible, setSubmitDialogVisible] = useState(false);
  const [formDataToSubmit, setFormDataToSubmit] = useState(null);

  const { token } = useUserStore((s) => ({ token: s.token }));
  const decryptedToken = useMemo(
    () => token && DecryptString(token),
    [token]
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues, mode: "onBlur" });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "travelDetails",
    keyName: "keyId",
  });

  useEffect(() => {
    const srcData = Array.isArray(formdata) ? formdata?.[0] : formdata;
    if (!srcData) return;

    reset({
      ...srcData,
      travelDetails:
        srcData.travel_details?.map((t) => ({
          date: t.date ? new Date(t.date) : null,
          from: t.from || "",
          to: t.to || "",
          departure: t.departure ? new Date(t.departure) : null,
          arrival: t.arrival ? new Date(t.arrival) : null,
          purpose: t.purpose || "",
        })) || defaultValues.travelDetails,
    });

    replace(
      srcData.travel_details?.map((t) => ({
        date: t.date ? new Date(t.date) : null,
        from: t.from || "",
        to: t.to || "",
        departure: t.departure ? new Date(t.departure) : null,
        arrival: t.arrival ? new Date(t.arrival) : null,
        purpose: t.purpose || "",
      })) || defaultValues.travelDetails
    );
  }, [formdata, reset, replace]);

  const { mutate: createMut, isLoading: creating } = useMutation({
    mutationFn: createForm11,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form11"] });
      toast(data?.message || "Form11 created", { type: "success" });
      reset(defaultValues);
      replace(defaultValues.travelDetails);
      navigate("/event/view");
    },
    onError: (err) => {
      toast(err?.response?.data?.message || "Error creating Form11", {
        type: "error",
      });
    },
  });

  const { mutate: updateMut, isLoading: updating } = useMutation({
    mutationFn: updateForm11,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form11"] });
      toast(data?.message || "Form11 updated", { type: "success" });
      navigate("/event/view");
    },
    onError: (err) => {
      toast(err?.response?.data?.message || "Error updating Form11", {
        type: "error",
      });
    },
  });

  const disabled = creating || updating || isSubmitting;

  const submit = (data) => {
    const srcData = Array.isArray(formdata) ? formdata?.[0] : formdata;
    const payload = {
      ...(srcData?.id && { id: srcData.id }),
      event_id: event?.id || data.event_id,
      transportation_medium: data.transportation_medium ?? "",
      driver: data.driver ?? "",
      travelDetails: (data.travelDetails || []).map((t) => ({
        date: t?.date,
        from: t?.from ?? "",
        to: t?.to ?? "",
        departure: t?.departure,
        arrival: t?.arrival,
        purpose: t?.purpose ?? "",
      })),
    };

    onSubmit?.(payload);
    
    setFormDataToSubmit(payload);
    setSubmitDialogVisible(true);
  };

  // Function to actually submit after confirmation
  const handleConfirmSubmit = () => {
    if (!formDataToSubmit) return;
    
    const srcData = Array.isArray(formdata) ? formdata?.[0] : formdata;
    
    if (srcData) {
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

  return (
    <div className="min-h-screen bg-white w-full flex flex-col items-center sm:pl-[200px] py-20">
      <form
        onSubmit={handleSubmit(submit)}
        className="max-w-4xl w-full px-4 space-y-8"
      >
        <Card
          title="Extension Program & Project Itinerary of Travel"
          className={TW_CARD}
        >
          {/* Transportation + Driver */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium">Transportation Medium</label>
              <Controller
                name="transportation_medium"
                control={control}
                rules={req("Transportation Medium")}
                render={({ field }) => (
                  <InputText
                    {...field}
                    className="px-2 py-2 my-2"
                    placeholder="Bus, Van, etc."
                  />
                )}
              />
              {errors?.transportation_medium && (
                <span className={TW_ERR}>
                  {errors.transportation_medium.message}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium">Driver</label>
              <Controller
                name="driver"
                control={control}
                rules={req("Driver")}
                render={({ field }) => (
                  <InputText
                    {...field}
                    className="px-2 py-2 my-2"
                    placeholder="Driver name"
                  />
                )}
              />
              {errors?.driver && (
                <span className={TW_ERR}>{errors.driver.message}</span>
              )}
            </div>
          </div>

          {/* Travel Details */}
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Travel Details</h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  label="Add Row"
                  icon="pi pi-plus"
                  className={TW_BTN}
                  onClick={() =>
                    append({
                      date: null,
                      from: "",
                      to: "",
                      departure: null,
                      arrival: null,
                      purpose: "",
                    })
                  }
                />
                <Button
                  type="button"
                  label="Clear All"
                  icon="pi pi-times"
                  className={TW_BTN}
                  onClick={() => replace(defaultValues.travelDetails)}
                />
              </div>
            </div>

            {/* Vertical cards per travel detail */}
            <div className="space-y-6">
              {fields.map((row, idx) => (
                <div
                  key={row.keyId}
                  className="border border-gray-300 rounded-lg p-4 space-y-4 relative"
                >
                  <Button
                    type="button"
                    icon="pi pi-trash"
                    className="absolute top-2 right-2 text-red-600"
                    onClick={() => remove(idx)}
                  />

                  {/* Date */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium">Date</label>
                    <Controller
                      name={`travelDetails.${idx}.date`}
                      control={control}
                      rules={req("Date")}
                      render={({ field }) => (
                        <Calendar
                          {...field}
                          value={field.value}
                          onChange={(e) => field.onChange(e.value)}
                          dateFormat="yy-mm-dd"
                          showIcon
                          className="w-full"
                        />
                      )}
                    />
                    {errors?.travelDetails?.[idx]?.date && (
                      <span className={TW_ERR}>
                        {errors.travelDetails[idx].date.message}
                      </span>
                    )}
                  </div>

                  {/* From */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium">From</label>
                    <Controller
                      name={`travelDetails.${idx}.from`}
                      control={control}
                      rules={req("From")}
                      render={({ field }) => (
                        <InputText
                          {...field}
                          className="px-2 py-2 my-2"
                          placeholder="Origin place"
                        />
                      )}
                    />
                    {errors?.travelDetails?.[idx]?.from && (
                      <span className={TW_ERR}>
                        {errors.travelDetails[idx].from.message}
                      </span>
                    )}
                  </div>

                  {/* To */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium">To</label>
                    <Controller
                      name={`travelDetails.${idx}.to`}
                      control={control}
                      rules={req("To")}
                      render={({ field }) => (
                        <InputText
                          {...field}
                          className="px-2 py-2 my-2"
                          placeholder="Destination place"
                        />
                      )}
                    />
                    {errors?.travelDetails?.[idx]?.to && (
                      <span className={TW_ERR}>
                        {errors.travelDetails[idx].to.message}
                      </span>
                    )}
                  </div>

                  {/* Departure */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium">Departure</label>
                    <Controller
                      name={`travelDetails.${idx}.departure`}
                      control={control}
                      rules={req("Departure")}
                      render={({ field }) => (
                        <Calendar
                          {...field}
                          value={field.value}
                          onChange={(e) => field.onChange(e.value)}
                          dateFormat="yy-mm-dd"
                          showTime
                          hourFormat="24"
                          showIcon
                          className="w-full"
                        />
                      )}
                    />
                    {errors?.travelDetails?.[idx]?.departure && (
                      <span className={TW_ERR}>
                        {errors.travelDetails[idx].departure.message}
                      </span>
                    )}
                  </div>

                  {/* Arrival */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium">Arrival</label>
                    <Controller
                      name={`travelDetails.${idx}.arrival`}
                      control={control}
                      rules={req("Arrival")}
                      render={({ field }) => (
                        <Calendar
                          {...field}
                          value={field.value}
                          onChange={(e) => field.onChange(e.value)}
                          dateFormat="yy-mm-dd"
                          showTime
                          hourFormat="24"
                          showIcon
                          className="w-full"
                        />
                      )}
                    />
                    {errors?.travelDetails?.[idx]?.arrival && (
                      <span className={TW_ERR}>
                        {errors.travelDetails[idx].arrival.message}
                      </span>
                    )}
                  </div>

                  {/* Purpose */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium">Purpose</label>
                    <Controller
                    name={`travelDetails.${idx}.purpose`}
                    control={control}
                    rules={req("Purpose")}
                    render={({ field }) => (
                        <InputText
                        {...field}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="px-2 py-2 my-2"
                        placeholder="Purpose of travel"
                        />
                    )}
                    />
                    {errors?.travelDetails?.[idx]?.purpose && (
                      <span className={TW_ERR}>
                        {errors.travelDetails[idx].purpose.message}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            disabled={disabled}
            type="submit"
            label={
              disabled
                ? "Submitting..."
                : (Array.isArray(formdata) ? formdata?.[0] : formdata)
                ? "Update"
                : "Submit"
            }
            icon="pi pi-check"
            className={TW_BTN}
          />
          <Button
            type="button"
            label="Reset"
            icon="pi pi-refresh"
            className={TW_BTN}
            onClick={() => {
              reset(defaultValues);
              replace(defaultValues.travelDetails);
            }}
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
            Are you sure you want to {formdata ? 'update' : 'submit'} this travel itinerary?
          </p>
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <i className="pi pi-info-circle text-blue-600"></i>
            <p className="text-sm text-blue-800">
              Please review all travel details before submitting.
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
