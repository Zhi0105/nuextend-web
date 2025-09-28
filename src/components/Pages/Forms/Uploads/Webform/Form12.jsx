// src/features/forms/Form12.jsx
import React, { useEffect, useMemo } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useUserStore } from "@_src/store/auth";
import { DecryptString } from "@_src/utils/helpers";
import { createForm12, updateForm12 } from "@_src/services/formservice";
import { useLocation } from "react-router-dom";
import { getPrograms } from "@_src/services/program";
import { getDepartments } from "@_src/services/department";

const TW_CARD = "shadow-sm rounded-2xl border border-gray-200 p-6";
const TW_BTN =
  "px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition";
const TW_ERR = "text-[11px] text-red-600 px-2 pb-2";

const defaultValues = {
  event_id: "",
  meeting_date: null,
  call_to_order: "",
  aomftlm: "",
  other_matters: "",
  adjournment: null,
  documentation: "",

  attendees: [
    { full_name: "", designation: "", department_id: "", programs_id: "" },
  ],

  new_items: [{ topic: "", discussion: "", resolution: "" }],
};

const req = (label) => ({
  required: `${label} is required`,
  validate: (v) =>
    v && String(v).trim().length ? true : `${label} is required`,
});

export const Form12 = ({ onSubmit }) => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { event, formdata } = location.state || {};

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

  const {
    fields: attendeeFields,
    append: addAttendee,
    remove: removeAttendee,
    replace: replaceAttendees,
  } = useFieldArray({ control, name: "attendees", keyName: "keyId" });

  const {
    fields: newItemFields,
    append: addNewItem,
    remove: removeNewItem,
    replace: replaceNewItems,
  } = useFieldArray({ control, name: "new_items", keyName: "keyId" });

  // Fetch Programs & Departments
  const { data: programs, isLoading: loadingPrograms } = getPrograms();
  const { data: departments, isLoading: loadingDepartments } = getDepartments();

  const programOptions =
    programs?.data.map((p) => ({ label: p.name, value: p.id })) || [];
  const departmentOptions =
    departments?.data.map((d) => ({ label: d.name, value: d.id })) || [];

  useEffect(() => {
    const srcData = Array.isArray(formdata) ? formdata?.[0] : formdata;
    if (!srcData) return;

    reset({
      ...srcData,
      meeting_date: srcData.meeting_date
        ? new Date(srcData.meeting_date)
        : null,
      adjournment: srcData.adjournment ? new Date(srcData.adjournment) : null,
      attendees: srcData.attendees || defaultValues.attendees,
      new_items: srcData.new_items || defaultValues.new_items,
    });

    replaceAttendees(srcData.attendees || defaultValues.attendees);
    replaceNewItems(srcData.new_items || defaultValues.new_items);
  }, [formdata, reset, replaceAttendees, replaceNewItems]);

  const { mutate: createMut, isLoading: creating } = useMutation({
    mutationFn: createForm12,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form12"] });
      toast(data?.message || "Form12 created", { type: "success" });
      reset(defaultValues);
      replaceAttendees(defaultValues.attendees);
      replaceNewItems(defaultValues.new_items);
    },
    onError: (err) => {
      toast(err?.response?.data?.message || "Error creating Form12", {
        type: "error",
      });
    },
  });

  const { mutate: updateMut, isLoading: updating } = useMutation({
    mutationFn: updateForm12,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form12"] });
      toast(data?.message || "Form12 updated", { type: "success" });
    },
    onError: (err) => {
      toast(err?.response?.data?.message || "Error updating Form12", {
        type: "error",
      });
    },
  });

  const disabled = creating || updating || isSubmitting;

  const formatDateForMysql = (date) => {
  if (!date) return null;
  return new Date(date).toISOString().slice(0, 19).replace("T", " ");
};

const submit = (data) => {
  const srcData = Array.isArray(formdata) ? formdata?.[0] : formdata;

  const payload = {
    ...(srcData?.id && { id: srcData.id }),
    event_id: event?.id || data.event_id,
    meeting_date: formatDateForMysql(data.meeting_date),
    call_to_order: data.call_to_order ?? "",
    aomftlm: data.aomftlm ?? "",
    other_matters: data.other_matters ?? "",
    adjournment: formatDateForMysql(data.adjournment),
    documentation: data.documentation ?? "",
    attendees: data.attendees || [],
    new_items: data.new_items || [],
  };

  onSubmit?.(payload);

  if (srcData) {
    updateMut({ token: decryptedToken, ...payload });
  } else {
    createMut({ token: decryptedToken, ...payload });
  }
};

  return (
    <div className="min-h-screen bg-white w-full flex flex-col items-center sm:pl-[200px] py-20">
      <form
        onSubmit={handleSubmit(submit)}
        className="max-w-5xl w-full px-4 space-y-8"
      >
        <Card title="Minutes of the Meeting" className={TW_CARD}>
          {/* Meeting Date */}
          <div className="flex flex-col mb-4">
            <label className="text-sm font-medium">Meeting Date</label>
            <Controller
              name="meeting_date"
              control={control}
              rules={req("Meeting Date")}
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
            {errors?.meeting_date && (
              <span className={TW_ERR}>{errors.meeting_date.message}</span>
            )}
          </div>

          {/* Call to Order */}
          <div className="flex flex-col">
            <label className="text-sm font-medium">Call to Order</label>
            <Controller
              name="call_to_order"
              control={control}
              rules={req("Call to Order")}
              render={({ field }) => (
                <InputText {...field} className="px-2 py-2 my-2" placeholder="Who called to order" />
              )}
            />
            {errors?.call_to_order && (
              <span className={TW_ERR}>{errors.call_to_order.message}</span>
            )}
          </div>

          {/* Approval of Minutes */}
          <div className="flex flex-col mt-4">
            <label className="text-sm font-medium">
              Approval of Minutes (Last Meeting)
            </label>
            <Controller
              name="aomftlm"
              control={control}
              rules={req("Approval of Minutes")}
              render={({ field }) => (
                <InputText {...field} className="px-2 py-2 my-2" placeholder="Details..." />
              )}
            />
            {errors?.aomftlm && (
              <span className={TW_ERR}>{errors.aomftlm.message}</span>
            )}
          </div>

          {/* Attendees (Vertical Layout) */}
          <div className="mt-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Attendees</h3>
              <Button
                type="button"
                label="Add Attendee"
                icon="pi pi-plus"
                className={TW_BTN}
                onClick={() =>
                  addAttendee({
                    full_name: "",
                    designation: "",
                    department_id: "",
                    programs_id: "",
                  })
                }
              />
            </div>
            {attendeeFields.map((row, idx) => (
              <div
                key={row.keyId}
                className="border border-gray-300 rounded-lg p-4 space-y-4 relative"
              >
                <Button
                  type="button"
                  icon="pi pi-trash"
                  className="absolute top-2 right-2 text-red-600"
                  onClick={() => removeAttendee(idx)}
                />

                {/* Full Name */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium">Full Name</label>
                  <Controller
                    name={`attendees.${idx}.full_name`}
                    control={control}
                    rules={req("Full Name")}
                    render={({ field }) => (
                      <InputText {...field} className="px-2 py-2 my-2" placeholder="Full Name" />
                    )}
                  />
                  {errors?.attendees?.[idx]?.full_name && (
                    <span className={TW_ERR}>
                      {errors.attendees[idx].full_name.message}
                    </span>
                  )}
                </div>

                {/* Designation */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium">Designation</label>
                  <Controller
                    name={`attendees.${idx}.designation`}
                    control={control}
                    rules={req("Designation")}
                    render={({ field }) => (
                      <InputText {...field} className="px-2 py-2 my-2" placeholder="Designation" />
                    )}
                  />
                  {errors?.attendees?.[idx]?.designation && (
                    <span className={TW_ERR}>
                      {errors.attendees[idx].designation.message}
                    </span>
                  )}
                </div>

                {/* Department Dropdown */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium">Department</label>
                  <Controller
                    name={`attendees.${idx}.department_id`}
                    control={control}
                    rules={req("Department")}
                    render={({ field }) => (
                      <Dropdown
                        {...field}
                        value={field.value}
                        options={departmentOptions}
                        onChange={(e) => field.onChange(e.value)}
                        placeholder={
                          loadingDepartments ? "Loading..." : "Select Department"
                        }
                        filter
                        className="w-full"
                      />
                    )}
                  />
                  {errors?.attendees?.[idx]?.department_id && (
                    <span className={TW_ERR}>
                      {errors.attendees[idx].department_id.message}
                    </span>
                  )}
                </div>

                {/* Program Dropdown */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium">Program</label>
                  <Controller
                    name={`attendees.${idx}.programs_id`}
                    control={control}
                    rules={req("Program")}
                    render={({ field }) => (
                      <Dropdown
                        {...field}
                        value={field.value}
                        options={programOptions}
                        onChange={(e) => field.onChange(e.value)}
                        placeholder={
                          loadingPrograms ? "Loading..." : "Select Program"
                        }
                        filter
                        className="w-full"
                      />
                    )}
                  />
                  {errors?.attendees?.[idx]?.programs_id && (
                    <span className={TW_ERR}>
                      {errors.attendees[idx].programs_id.message}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* New Items (Vertical Layout) */}
          <div className="mt-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">New Items</h3>
              <Button
                type="button"
                label="Add Item"
                icon="pi pi-plus"
                className={TW_BTN}
                onClick={() =>
                  addNewItem({ topic: "", discussion: "", resolution: "" })
                }
              />
            </div>
            {newItemFields.map((row, idx) => (
              <div
                key={row.keyId}
                className="border border-gray-300 rounded-lg p-4 space-y-4 relative"
              >
                <Button
                  type="button"
                  icon="pi pi-trash"
                  className="absolute top-2 right-2 text-red-600"
                  onClick={() => removeNewItem(idx)}
                />

                {/* Topic */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium">Topic</label>
                  <Controller
                    name={`new_items.${idx}.topic`}
                    control={control}
                    rules={req("Topic")}
                    render={({ field }) => (
                      <InputText {...field} className="px-2 py-2 my-2" placeholder="Topic" />
                    )}
                  />
                  {errors?.new_items?.[idx]?.topic && (
                    <span className={TW_ERR}>
                      {errors.new_items[idx].topic.message}
                    </span>
                  )}
                </div>

                {/* Discussion */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium">Discussion</label>
                  <Controller
                    name={`new_items.${idx}.discussion`}
                    control={control}
                    rules={req("Discussion")}
                    render={({ field }) => (
                      <InputText {...field} className="px-2 py-2 my-2" placeholder="Discussion" />
                    )}
                  />
                  {errors?.new_items?.[idx]?.discussion && (
                    <span className={TW_ERR}>
                      {errors.new_items[idx].discussion.message}
                    </span>
                  )}
                </div>

                {/* Resolution */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium">Resolution</label>
                  <Controller
                    name={`new_items.${idx}.resolution`}
                    control={control}
                    rules={req("Resolution")}
                    render={({ field }) => (
                      <InputText {...field} className="px-2 py-2 my-2" placeholder="Resolution" />
                    )}
                  />
                  {errors?.new_items?.[idx]?.resolution && (
                    <span className={TW_ERR}>
                      {errors.new_items[idx].resolution.message}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Other Matters */}
          <div className="flex flex-col mt-6">
            <label className="text-sm font-medium">Other Matters</label>
            <Controller
              name="other_matters"
              control={control}
              rules={req("Other Matters")}
              render={({ field }) => (
                <InputText {...field} className="px-2 py-2 my-2" placeholder="Other matters..." />
              )}
            />
            {errors?.other_matters && (
              <span className={TW_ERR}>{errors.other_matters.message}</span>
            )}
          </div>

          {/* Adjournment */}
          <div className="flex flex-col mt-6">
            <label className="text-sm font-medium">Adjournment</label>
            <Controller
              name="adjournment"
              control={control}
              rules={req("Adjournment")}
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
            {errors?.adjournment && (
              <span className={TW_ERR}>{errors.adjournment.message}</span>
            )}
          </div>

          {/* Documentation */}
          <div className="flex flex-col mt-6">
            <label className="text-sm font-medium">Documentation</label>
            <Controller
              name="documentation"
              control={control}
              rules={req("Documentation")}
              render={({ field }) => (
                <InputText {...field} className="px-2 py-2 my-2" placeholder="Notes / Documentation" />
              )}
            />
            {errors?.documentation && (
              <span className={TW_ERR}>{errors.documentation.message}</span>
            )}
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
              replaceAttendees(defaultValues.attendees);
              replaceNewItems(defaultValues.new_items);
            }}
          />
        </div>
      </form>
    </div>
  );
};
