import React, { useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Card } from "primereact/card";
import { Fieldset } from "primereact/fieldset";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useUserStore } from '@_src/store/auth';
import { DecryptString } from "@_src/utils/helpers";
import { createForm3, updateForm3 } from "@_src/services/formservice";
import { useLocation, useNavigate } from "react-router-dom";

const defaultValues = {
    description: "",
    targetGroup: "",
    startDate: null,
    endDate: null,
    activity_plan_budget: [
        { objectives: "", activities: "", outputs: "", personnel: "", budget: null },
    ],
    detailed_budget: [
        { item: "", details: "", quantity: null, amount: null, total: null },
    ],
    budget_sourcing: [
        { university: "", outreachGroup: "", service: "", other: "", total: null },
    ],
};

const toYMD = (d) => {
    if (!d) return undefined;
    const dt = d instanceof Date ? d : new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};
const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

const FieldError = ({ error }) => error ? <small className="text-red-600 mt-1 block">{error.message || "Required"}</small> : null;

const InputLabel = ({ children, htmlFor }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-800 mb-1">
        {children}
    </label>
);

const TW_CARD = "shadow-sm rounded-2xl border border-gray-200";
const TW_INPUT = "w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition px-3 py-2 bg-white";
const TW_BTN = "px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition";

export const Form3 = ({ onSubmit }) => {
    const queryClient = useQueryClient()
    const location = useLocation()
    const navigate = useNavigate();
    const { event, formdata } = location.state || {}
    const { token } = useUserStore((state) => ({ token: state.token }));
    const decryptedToken = token && DecryptString(token)

    const { mutate: handleCreateForm3, isLoading: createForm3Loading } = useMutation({
        mutationFn: createForm3,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['outreach'] });
            toast(data.message, { type: "success" })
            reset(defaultValues)
            navigate("/event/view");
            }, 
        onError: (error) => {
            toast(error?.response?.data?.message, { type: "warning" })
            console.log("@COPE:", error)
        },
    });
    const { mutate: handleUpdateForm3, isLoading: updateForm3Loading } = useMutation({
        mutationFn: updateForm3,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['outreach'] });
            toast(data.message, { type: "success" })
            navigate("/event/view");
            }, 
        onError: (error) => {
            toast(error?.response?.data?.message, { type: "warning" })
            console.log("@UOPE:", error)
        },
    });
    
    
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        watch,
        reset,
    } = useForm({ defaultValues, mode: "onSubmit" });


    useEffect(() => {
        if (Array.isArray(formdata) && formdata.length > 0) {
            const f = formdata[0] || {};

            const values = {
            description: f.description ?? "",
            targetGroup: f.targetGroup ?? "",
            startDate: f.startDate ? new Date(f.startDate) : null,
            endDate: f.endDate ? new Date(f.endDate) : null,
            activity_plan_budget: f.activity_plans_budgets?.length
                ? f.activity_plans_budgets
                : defaultValues.activity_plan_budget,
            detailed_budget: f.detailed_budgets?.length
                ? f.detailed_budgets
                : defaultValues.detailed_budget,
            budget_sourcing: f.budget_sourcings?.length
                ? f.budget_sourcings
                : defaultValues.budget_sourcing,
            };

            reset(values);

            // Para sure na aligned yung mga field array
            apbFA.replace(values.activity_plan_budget);
            dbFA.replace(values.detailed_budget);
            bsFA.replace(values.budget_sourcing);

        } else {
            reset(defaultValues);
            apbFA.replace(defaultValues.activity_plan_budget);
            dbFA.replace(defaultValues.detailed_budget);
            bsFA.replace(defaultValues.budget_sourcing);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formdata, reset]);

    const apbFA = useFieldArray({ control, name: "activity_plan_budget" });
    const dbFA = useFieldArray({ control, name: "detailed_budget" });
    const bsFA = useFieldArray({ control, name: "budget_sourcing" });

    const submit = (data) => {
        const payload = {
            ...(Array.isArray(formdata) && formdata[0]?.id && { id: formdata[0].id }),
            event_id: event?.id,
            description: data.description,
            targetGroup: data.targetGroup,
            startDate: toYMD(data.startDate),
            endDate: toYMD(data.endDate),
            activity_plan_budget: data.activity_plan_budget.map((r) => ({
                objectives: r.objectives,
                activities: r.activities,
                outputs: r.outputs,
                personnel: r.personnel,
                budget: num(r.budget),
            })),
            detailed_budget: data.detailed_budget.map((r) => ({
                item: r.item,
                details: r.details || undefined,
                quantity: num(r.quantity),
                amount: num(r.amount),
                total: num(r.total),
            })),
            budget_sourcing: data.budget_sourcing.map((r) => ({
                university: r.university,
                outreachGroup: r.outreachGroup,
                service: r.service,
                other: r.other || undefined,
                total: num(r.total),
            })),
        };
        onSubmit?.(payload);
        
        if (Array.isArray(formdata) && formdata.length > 0) {
            handleUpdateForm3({
                token: decryptedToken,
                ...payload
            })
        } else {
            handleCreateForm3({
                token: decryptedToken,
                ...payload
            })
        }
    };


    return (
        <div className="outreach-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
            <form onSubmit={handleSubmit(submit)} className="max-w-6xl mx-auto p-6 space-y-10">
                {/* Basic Info */}
                <Card title="Outreach Proposal Form" className={TW_CARD}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <InputLabel htmlFor="description">Brief Description</InputLabel>
                            <InputTextarea
                                id="description"
                                rows={3}
                                autoResize
                                {...register("description", { required: "Required", maxLength: { value: 2000, message: "Max 2000 chars" } })}
                                className={TW_INPUT}
                            />
                            <FieldError error={errors.description} />
                        </div>
                        <div className="md:col-span-2">
                            <InputLabel htmlFor="targetGroup">Target Group &amp; Reasons</InputLabel>
                            <InputTextarea
                                id="targetGroup"
                                rows={3}
                                autoResize
                                {...register("targetGroup", { required: "Required", maxLength: { value: 2000, message: "Max 2000 chars" } })}
                                className={TW_INPUT}
                            />
                            <FieldError error={errors.targetGroup} />
                        </div>

                        <div>
                            <InputLabel>Start Date (M/D/Y)</InputLabel>
                            <Controller
                                control={control}
                                name="startDate"
                                rules={{ required: "Required" }}
                                render={({ field }) => (
                                <Calendar
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.value)}
                                    dateFormat="mm/dd/yy"
                                    showIcon
                                    className="w-full"
                                    inputClassName={TW_INPUT}
                                />
                                )}
                            />
                            <FieldError error={errors.startDate} />
                        </div>

                        <div>
                            <InputLabel>End Date (M/D/Y)</InputLabel>
                            <Controller
                                control={control}
                                name="endDate"
                                rules={{ required: "Required" }}
                                render={({ field }) => (
                                <Calendar
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.value)}
                                    dateFormat="mm/dd/yy"
                                    showIcon
                                    className="w-full"
                                    inputClassName={TW_INPUT}
                                />
                                )}
                            />
                            <FieldError error={errors.endDate} />
                        </div>
                    </div>
                </Card>

                {/* Activity Plan & Budget */}
                <Fieldset legend="Activity Plan & Budget" className={TW_CARD}>
                    <div className="space-y-6">
                        {apbFA.fields.map((field, idx) => (
                            <Card key={field.id} className={TW_CARD}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <InputLabel>Objectives</InputLabel>
                                        <InputTextarea
                                        rows={2}
                                        autoResize
                                        {...register(`activity_plan_budget.${idx}.objectives`, { required: "Required", maxLength: { value: 2000, message: "Max 2000 chars" } })}
                                        className={TW_INPUT}
                                        />
                                        <FieldError error={errors?.activity_plan_budget?.[idx]?.objectives} />
                                    </div>

                                    <div className="md:col-span-2">
                                        <InputLabel>Activities</InputLabel>
                                        <InputTextarea
                                        rows={2}
                                        autoResize
                                        {...register(`activity_plan_budget.${idx}.activities`, { required: "Required", maxLength: { value: 2000, message: "Max 2000 chars" } })}
                                        className={TW_INPUT}
                                        />
                                        <FieldError error={errors?.activity_plan_budget?.[idx]?.activities} />
                                    </div>

                                    <div className="md:col-span-2">
                                        <InputLabel>Outputs</InputLabel>
                                        <InputTextarea
                                        rows={2}
                                        autoResize
                                        {...register(`activity_plan_budget.${idx}.outputs`, { required: "Required", maxLength: { value: 2000, message: "Max 2000 chars" } })}
                                        className={TW_INPUT}
                                        />
                                        <FieldError error={errors?.activity_plan_budget?.[idx]?.outputs} />
                                    </div>

                                    <div>
                                        <InputLabel>Personnel</InputLabel>
                                        <InputText
                                        {...register(`activity_plan_budget.${idx}.personnel`, { required: "Required", maxLength: { value: 255, message: "Max 255 chars" } })}
                                        className={TW_INPUT}
                                        />
                                        <FieldError error={errors?.activity_plan_budget?.[idx]?.personnel} />
                                    </div>

                                    <div>
                                        <InputLabel>Budget (₱)</InputLabel>
                                        <Controller
                                        control={control}
                                        name={`activity_plan_budget.${idx}.budget`}
                                        rules={{
                                            required: "Required",
                                            validate: (v) => (v ?? 0) >= 0 || "Must be ≥ 0",
                                        }}
                                        render={({ field }) => (
                                            <InputNumber
                                            value={field.value}
                                            onValueChange={(e) => field.onChange(e.value)}
                                            mode="currency"
                                            currency="PHP"
                                            locale="en-PH"
                                            placeholder="0.00"
                                            inputClassName={TW_INPUT}
                                            className="w-full"
                                            />
                                        )}
                                        />
                                        <FieldError error={errors?.activity_plan_budget?.[idx]?.budget} />
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <Button
                                        type="button"
                                        icon="pi pi-plus"
                                        label="Add"
                                        className={TW_BTN}
                                        onClick={() =>
                                        apbFA.append({ objectives: "", activities: "", outputs: "", personnel: "", budget: null })
                                        }
                                    />
                                    {apbFA.fields.length > 1 && (
                                        <Button
                                        type="button"
                                        icon="pi pi-trash"
                                        label="Remove"
                                        severity="danger"
                                        className={TW_BTN}
                                        onClick={() => apbFA.remove(idx)}
                                        />
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </Fieldset>

                {/* Detailed Budget */}
                <Fieldset legend="Detailed Budget" className={TW_CARD}>
                    <div className="space-y-6">
                        {dbFA.fields.map((field, idx) => (
                            <Card key={field.id} className={TW_CARD}>
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                                    <div>
                                        <InputLabel>Item</InputLabel>
                                        <InputText
                                        {...register(`detailed_budget.${idx}.item`, { required: "Required", maxLength: { value: 255, message: "Max 255 chars" } })}
                                        className={TW_INPUT}
                                        />
                                        <FieldError error={errors?.detailed_budget?.[idx]?.item} />
                                    </div>

                                    <div className="md:col-span-2">
                                        <InputLabel>Details / Particulars</InputLabel>
                                        <InputTextarea
                                        rows={2}
                                        autoResize
                                        {...register(`detailed_budget.${idx}.details`, { maxLength: { value: 2000, message: "Max 2000 chars" } })}
                                        className={TW_INPUT}
                                        />
                                    </div>

                                    <div>
                                        <InputLabel>Quantity</InputLabel>
                                        <Controller
                                        control={control}
                                        name={`detailed_budget.${idx}.quantity`}
                                        rules={{ validate: (v) => (v == null || Number(v) >= 0) || "Must be ≥ 0" }}
                                        render={({ field }) => (
                                            <InputNumber
                                            value={field.value}
                                            onValueChange={(e) => field.onChange(e.value)}
                                            inputClassName={TW_INPUT}
                                            className="w-full"
                                            />
                                        )}
                                        />
                                        <FieldError error={errors?.detailed_budget?.[idx]?.quantity} />
                                    </div>

                                    <div>
                                        <InputLabel>Amount (₱)</InputLabel>
                                        <Controller
                                        control={control}
                                        name={`detailed_budget.${idx}.amount`}
                                        rules={{ validate: (v) => (v == null || Number(v) >= 0) || "Must be ≥ 0" }}
                                        render={({ field }) => (
                                            <InputNumber
                                            value={field.value}
                                            onValueChange={(e) => field.onChange(e.value)}
                                            mode="currency"
                                            currency="PHP"
                                            locale="en-PH"
                                            placeholder="0.00"
                                            inputClassName={TW_INPUT}
                                            className="w-full"
                                            />
                                        )}
                                        />
                                        <FieldError error={errors?.detailed_budget?.[idx]?.amount} />
                                    </div>

                                    <div>
                                        <InputLabel>Total (₱)</InputLabel>
                                        <Controller
                                        control={control}
                                        name={`detailed_budget.${idx}.total`}
                                        rules={{ validate: (v) => (v == null || Number(v) >= 0) || "Must be ≥ 0" }}
                                        render={({ field }) => (
                                            <InputNumber
                                            value={field.value}
                                            onValueChange={(e) => field.onChange(e.value)}
                                            mode="currency"
                                            currency="PHP"
                                            locale="en-PH"
                                            placeholder="0.00"
                                            inputClassName={TW_INPUT}
                                            className="w-full"
                                            />
                                        )}
                                        />
                                        <FieldError error={errors?.detailed_budget?.[idx]?.total} />
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <Button
                                        type="button"
                                        icon="pi pi-plus"
                                        label="Add"
                                        className={TW_BTN}
                                        onClick={() =>
                                        dbFA.append({ item: "", details: "", quantity: null, amount: null, total: null })
                                        }
                                    />
                                    {dbFA.fields.length > 1 && (
                                        <Button
                                        type="button"
                                        icon="pi pi-trash"
                                        label="Remove"
                                        severity="danger"
                                        className={TW_BTN}
                                        onClick={() => dbFA.remove(idx)}
                                        />
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </Fieldset>

                {/* Budget Sourcing */}
                <Fieldset legend="Budget Sourcing" className={TW_CARD}>
                    <div className="space-y-6"> 
                        {bsFA.fields.map((field, idx) => (
                            <Card key={field.id} className={TW_CARD}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel>Counterpart (University)</InputLabel>
                                        <InputText
                                        {...register(`budget_sourcing.${idx}.university`, { required: "Required", maxLength: { value: 255, message: "Max 255 chars" } })}
                                        className={TW_INPUT}
                                        />
                                        <FieldError error={errors?.budget_sourcing?.[idx]?.university} />
                                    </div>
                                    <div>
                                        <InputLabel>Counterpart (Outreach Group)</InputLabel>
                                        <InputText
                                        {...register(`budget_sourcing.${idx}.outreachGroup`, { required: "Required", maxLength: { value: 255, message: "Max 255 chars" } })}
                                        className={TW_INPUT}
                                        />
                                        <FieldError error={errors?.budget_sourcing?.[idx]?.outreachGroup} />
                                    </div>
                                    <div>
                                        <InputLabel>Counterpart (Service)</InputLabel>
                                        <InputText
                                        {...register(`budget_sourcing.${idx}.service`, { required: "Required", maxLength: { value: 255, message: "Max 255 chars" } })}
                                        className={TW_INPUT}
                                        />
                                        <FieldError error={errors?.budget_sourcing?.[idx]?.service} />
                                    </div>
                                    <div>
                                        <InputLabel>Other Source of Funding</InputLabel>
                                        <InputText
                                        {...register(`budget_sourcing.${idx}.other`, { maxLength: { value: 255, message: "Max 255 chars" } })}
                                        className={TW_INPUT}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel>Total (₱)</InputLabel>
                                        <Controller
                                        control={control}
                                        name={`budget_sourcing.${idx}.total`}
                                        rules={{ validate: (v) => (v == null || Number(v) >= 0) || "Must be ≥ 0" }}
                                        render={({ field }) => (
                                            <InputNumber
                                            value={field.value}
                                            onValueChange={(e) => field.onChange(e.value)}
                                            mode="currency"
                                            currency="PHP"
                                            locale="en-PH"
                                            placeholder="0.00"
                                            inputClassName={TW_INPUT}
                                            className="w-full"
                                            />
                                        )}
                                        />
                                        <FieldError error={errors?.budget_sourcing?.[idx]?.total} />
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <Button
                                        type="button"
                                        icon="pi pi-plus"
                                        label="Add"
                                        className={TW_BTN}
                                        onClick={() =>
                                        bsFA.append({ university: "", outreachGroup: "", service: "", other: "", total: null })
                                        }
                                    />
                                    {bsFA.fields.length > 1 && (
                                        <Button
                                        type="button"
                                        icon="pi pi-trash"
                                        label="Remove"
                                        severity="danger"
                                        className={TW_BTN}
                                        onClick={() => bsFA.remove(idx)}
                                        />
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </Fieldset>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button disabled={createForm3Loading || updateForm3Loading} type="submit" label={`${createForm3Loading  || updateForm3Loading ? 'Submitting...' : 'Submit'}`} icon="pi pi-check" className={TW_BTN} />
                    <Button type="reset" label="Reset" icon="pi pi-refresh" className={TW_BTN} onClick={() => reset(defaultValues)} />
                </div>

                {/* Dev Preview */}
                <details className="mt-6">
                    <summary className="cursor-pointer select-none">Preview JSON (dev)</summary>
                    <pre className="bg-gray-50 p-3 rounded overflow-auto text-sm">
                        {JSON.stringify(watch(), null, 2)}
                    </pre>
                </details>
            </form>
        </div>
    );
};
