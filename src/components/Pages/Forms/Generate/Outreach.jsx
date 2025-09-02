import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Fieldset } from "primereact/fieldset";
import { Chips } from "primereact/chips";
import { Divider } from "primereact/divider";
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from "@react-pdf/renderer";
import { createOutreach, updateOutreach } from "@_src/services/proposal";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useUserStore } from '@_src/store/auth';
import { DecryptString, toDateOrNull } from "@_src/utils/helpers";
import dayjs from 'dayjs';


// 1) Register font (same approach as your Program component)
Font.register({
  family: "Inter",
    fonts: [
        { src: "/fonts/Inter_18pt-Regular.ttf", fontWeight: "normal" },
        { src: "/fonts/Inter_24pt-Bold.ttf", fontWeight: "bold" },
    ],
});

const peso = "\u20B1"; // ₱
const formatCurrency = (n) => {
    const val = Number(n || 0);
    return `${peso}${val.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

const formatDateMDY = (d) => {
    if (!d) return "";
    try {
        const dt = new Date(d);
        const m = dt.getMonth() + 1;
        const day = dt.getDate();
        const y = dt.getFullYear();
        return `${m}/${day}/${y}`;
    } catch {
        return "";
    }
};

// PDF styles
const pdfStyles = StyleSheet.create({
    page: { padding: 32, fontSize: 11, lineHeight: 1.4, fontFamily: "Inter" },
    h1: { fontSize: 18, marginBottom: 8, fontWeight: "bold" },
    h2: { fontSize: 14, marginTop: 12, marginBottom: 6, fontWeight: "bold" },
    label: { fontSize: 11, fontWeight: "bold" },
    text: { marginBottom: 2 },
    section: { marginBottom: 8 },
});

const OutreachPDF = ({ data }) => {
    // computed totals
    const detailedBudgetTotal = (data?.detailedBudget || []).reduce(
        (sum, row) => sum + (Number(row?.total) || 0),
        0
    );
    const activityPlanBudgetTotal = (data?.activityPlanBudget || []).reduce(
        (sum, row) => sum + (Number(row?.budget) || 0),
        0
    );
    const budgetSourcingGrandTotal = (data?.budgetSourcing || []).reduce(
        (sum, row) => sum + (Number(row?.total) || 0),
        0
    );

    return (
        <Document>
        <Page size="A4" style={pdfStyles.page}>
            <Text style={pdfStyles.h1}>{data?.title || "Outreach Proposal"}</Text>

            {/* Basic Info */}
            <View style={pdfStyles.section} wrap>
            <Text style={pdfStyles.h2}>Project Information</Text>
            <Text style={pdfStyles.text}>
                <Text style={pdfStyles.label}>Brief Description: </Text>
                {data?.description || "-"}
            </Text>
            <Text style={pdfStyles.text}>
                <Text style={pdfStyles.label}>Target Group & Reasons: </Text>
                {data?.targetGroup || "-"}
            </Text>
            <Text style={pdfStyles.text}>
                <Text style={pdfStyles.label}>Start Date: </Text>
                {formatDateMDY(data?.startDate)}
            </Text>
            <Text style={pdfStyles.text}>
                <Text style={pdfStyles.label}>End Date: </Text>
                {formatDateMDY(data?.endDate)}
            </Text>
            </View>

            {/* Activity Plan & Budget */}
            <View style={pdfStyles.section} wrap>
            <Text style={pdfStyles.h2}>Activity Plan & Budget</Text>
            {(data?.activityPlanBudget || []).map((apb, i) => (
                <View key={i} style={{ marginBottom: 6 }}>
                <Text style={pdfStyles.text}>
                    <Text style={pdfStyles.label}>#{i + 1} Objectives: </Text>
                    {Array.isArray(apb?.objectives) ? apb.objectives.join(", ") : apb?.objectives || "-"}
                </Text>
                <Text style={pdfStyles.text}>
                    <Text style={pdfStyles.label}>Activities: </Text>
                    {Array.isArray(apb?.activities) ? apb.activities.join(", ") : apb?.activities || "-"}
                </Text>
                <Text style={pdfStyles.text}>
                    <Text style={pdfStyles.label}>Outputs: </Text>
                    {Array.isArray(apb?.outputs) ? apb.outputs.join(", ") : apb?.outputs || "-"}
                </Text>
                <Text style={pdfStyles.text}>
                    <Text style={pdfStyles.label}>Personnel: </Text>
                    {apb?.personnel || "-"}
                </Text>
                <Text style={pdfStyles.text}>
                    <Text style={pdfStyles.label}>Budget: </Text>
                    {formatCurrency(apb?.budget)}
                </Text>
                </View>
            ))}
            <Text style={[pdfStyles.text, { marginTop: 4 }]}>
                <Text style={pdfStyles.label}>Total Activity Budget: </Text>
                {formatCurrency(activityPlanBudgetTotal)}
            </Text>
            </View>

            {/* Detailed Budget */}
            <View style={pdfStyles.section} wrap>
            <Text style={pdfStyles.h2}>Detailed Budget</Text>
            {(data?.detailedBudget || []).map((row, i) => (
                <View key={i} style={{ marginBottom: 4 }}>
                <Text style={pdfStyles.text}>
                    <Text style={pdfStyles.label}>#{i + 1} Item: </Text>
                    {row?.item || "-"}
                </Text>
                <Text style={pdfStyles.text}>
                    <Text style={pdfStyles.label}>Details/Particulars: </Text>
                    {row?.details || "-"}
                </Text>
                <Text style={pdfStyles.text}>
                    <Text style={pdfStyles.label}>Quantity: </Text>
                    {row?.quantity ?? "-"}
                </Text>
                <Text style={pdfStyles.text}>
                    <Text style={pdfStyles.label}>Amount: </Text>
                    {row?.amount != null ? formatCurrency(row?.amount) : "-"}
                </Text>
                <Text style={pdfStyles.text}>
                    <Text style={pdfStyles.label}>Total: </Text>
                    {row?.total != null ? formatCurrency(row?.total) : "-"}
                </Text>
                </View>
            ))}
            <Text style={[pdfStyles.text, { marginTop: 4 }]}>
                <Text style={pdfStyles.label}>Detailed Budget Total: </Text>
                {formatCurrency(detailedBudgetTotal)}
            </Text>
            </View>

            {/* Budget Sourcing */}
            <View style={pdfStyles.section} wrap>
            <Text style={pdfStyles.h2}>Budget Sourcing</Text>
            {(data?.budgetSourcing || []).map((bs, i) => (
                <View key={i} style={{ marginBottom: 6 }}>
                <Text style={pdfStyles.text}>
                    <Text style={pdfStyles.label}>#{i + 1} Counterpart (University): </Text>
                    {bs?.university || "-"}
                </Text>
                <Text style={pdfStyles.text}>
                    <Text style={pdfStyles.label}>Counterpart (Outreach Group): </Text>
                    {bs?.outreachGroup || "-"}
                </Text>
                <Text style={pdfStyles.text}>
                    <Text style={pdfStyles.label}>Counterpart (Service): </Text>
                    {bs?.service || "-"}
                </Text>
                <Text style={pdfStyles.text}>
                    <Text style={pdfStyles.label}>Other Source of Funding: </Text>
                    {bs?.other || "-"}
                </Text>
                <Text style={pdfStyles.text}>
                    <Text style={pdfStyles.label}>Total: </Text>
                    {formatCurrency(bs?.total)}
                </Text>
                </View>
            ))}
            <Text style={[pdfStyles.text, { marginTop: 4 }]}>
                <Text style={pdfStyles.label}>Budget Sourcing Grand Total: </Text>
                {formatCurrency(budgetSourcingGrandTotal)}
            </Text>
            </View>

            {/* Project Leader & Contacts */}
            <View style={pdfStyles.section} wrap>
            <Text style={pdfStyles.h2}>Project Leader & Contact</Text>
            <Text style={pdfStyles.text}>
                <Text style={pdfStyles.label}>Project Leader: </Text>
                {data?.projectLeader || "-"}
            </Text>
            <Text style={pdfStyles.text}>
                <Text style={pdfStyles.label}>Mobile: </Text>
                {data?.mobile || "-"}
            </Text>
            <Text style={pdfStyles.text}>
                <Text style={pdfStyles.label}>Email: </Text>
                {data?.email || "-"}
            </Text>
            </View>
        </Page>
        </Document>
    );
};

export const Outreach = ({ onSubmit }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const queryClient = useQueryClient()
    const { token } = useUserStore((state) => ({ token: state.token }));
    const decryptedToken = token && DecryptString(token)
    const proposalData = location.state


    const { mutate: handleCreateOutreachProposal, isLoading: createProposalLoading } = useMutation({
        mutationFn: createOutreach,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['proposal'] });
            toast(data.message, { type: "success" })
            reset()
            }, 
        onError: (error) => {
            toast(error?.response.data.message, { type: "warning" })

            console.log("@COPE:", error)
        },
    });

    const { mutate: handleUpdateOutreachProposal, isLoading: updateProposalLoading } = useMutation({
        mutationFn: updateOutreach,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['proposal'] });
            toast(data.message, { type: "success" })
            }, 
        onError: (error) => {
            toast(error?.response.data.message, { type: "warning" })

            console.log("@UOPE:", error)
        },
    });

    const setFormatDate = (date) => {
        return dayjs(new Date(date)).format('MM-DD-YYYY')
    }

    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
        watch,
        reset
    } = useForm({
        defaultValues: {
        // Top-level
        title: "",
        description: "",
        targetGroup: "",
        startDate: null,
        endDate: null,

        // Activity Plan & Budget (pwede marami)
        activityPlanBudget: [
            {
            objectives: "", 
            activities: "", 
            outputs: "",
            personnel: "",
            budget: null,
            },
        ],

        // Detailed budget (pwede marami)
        detailedBudget: [
            { item: "", details: "", quantity: null, amount: null, total: null },
        ],

        // Budget sourcing (pwede marami)
        budgetSourcing: [
            { university: "", outreachGroup: "", service: "", other: "", total: null },
        ],

        // Contact
        projectLeader: "",
        mobile: "",
        email: "",
        },
        mode: "onSubmit",
    });

    // Field arrays
    const apbFA = useFieldArray({ control, name: "activityPlanBudget" });
    const dbFA = useFieldArray({ control, name: "detailedBudget" });
    const bsFA = useFieldArray({ control, name: "budgetSourcing" });

    const submit = (data) => {
        if (onSubmit) onSubmit(data);
        console.log("Submitted Outreach:", data);
        
        if(proposalData?.id) {
            handleUpdateOutreachProposal({
                token: decryptedToken,
                id: proposalData?.id,
                title: data?.title,
                description: data?.description,
                targetGroup: data?.targetGroup,
                startDate: setFormatDate(data?.startDate),
                endDate: setFormatDate(data?.endDate),
                activityPlanBudget: [ ...data.activityPlanBudget ],
                detailedBudget: [ ...data.detailedBudget ],
                budgetSourcing: [ ...data.budgetSourcing ],
                projectLeader: data?.projectLeader,
                mobile: data?.mobile,
                email: data?.email
            })
        } else {
            handleCreateOutreachProposal({
                token: decryptedToken,
                title: data?.title,
                description: data?.description,
                targetGroup: data?.targetGroup,
                startDate: setFormatDate(data?.startDate),
                endDate: setFormatDate(data?.endDate),
                activityPlanBudget: [ ...data.activityPlanBudget ],
                detailedBudget: [ ...data.detailedBudget ],
                budgetSourcing: [ ...data.budgetSourcing ],
                projectLeader: data?.projectLeader,
                mobile: data?.mobile,
                email: data?.email
            })
        }
        
    };


    const CardTitle = () => {
        return (
            <div className="flex justify-between">
                <h1 className="font-bold text-2xl">
                    Outreach Proposal
                </h1>
                <h1>
                    <Button 
                        onClick={() => navigate("/event/form/generate/outreach/data")}
                        type="button" 
                        className="text-blue-400" 
                        label="View all proposal"
                    />
                </h1>
            </div>
        )
    }

    const Err = ({ name }) =>
        errors?.[name] ? (
        <small className="p-error block mt-1">{errors[name]?.message || "Required"}</small>
        ) : null;
        
    useEffect(() => {
        if(proposalData) {
            reset({
                title: proposalData?.title ?? '' ,
                description: proposalData?.description ?? '',
                targetGroup: proposalData?.targetGroup ?? '',
                startDate: toDateOrNull(proposalData?.startDate),
                endDate: toDateOrNull(proposalData?.endDate),
                activityPlanBudget: Array.isArray(proposalData?.activityPlanBudget) ? [...proposalData.activityPlanBudget] : [],
                detailedBudget: Array.isArray(proposalData?.detailedBudget) ? [...proposalData.detailedBudget] : [],
                budgetSourcing: Array.isArray(proposalData?.budgetSourcing) ? [...proposalData.budgetSourcing] : [],
                projectLeader: proposalData?.projectLeader ?? '',
                mobile: proposalData?.mobile ?? '', 
                email: proposalData?.email ?? ''
            })
        }
    }, [proposalData, reset])

    return (
        <div className="outreach-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
            <form onSubmit={handleSubmit(submit)} className="space-y-24 px-4">
                {/* Header / Basic Info */}
                <Card title={<CardTitle />} className="shadow-2 rounded-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block mb-2">Title</label>
                            <InputText
                                {...register("title", { required: "Invalid title" })}
                                className={`w-full py-1 px-4 border border-gray-400 ${errors.title ? "p-invalid" : ""}`}
                            />
                            <Err name="title" />
                        </div>


                        <div className="md:col-span-2">
                        <label className="block mb-2">Description</label>
                        <InputTextarea
                            rows={3}
                            autoResize
                            {...register("description", { required: "Required" })}
                            className={`w-full py-1 px-4 border border-gray-400 ${errors.description ? "p-invalid" : ""}`}
                        />
                        <Err name="description" />
                        </div>

            
                        <div className="md:col-span-2">
                        <label className="block mb-2">Target Group & Reasons</label>
                        <InputTextarea
                            rows={3}
                            autoResize
                            {...register("targetGroup", { required: "Required" })}
                            className={`w-full py-1 px-4 border border-gray-400 ${errors.targetGroup ? "p-invalid" : ""}`}
                        />
                        <Err name="targetGroup" />
                        </div>

                        <div>
                        <label className="block mb-2">Start Date (M/D/Y)</label>
                        <Controller
                            control={control}
                            name="startDate"
                            rules={{ required: "Required" }}
                            render={({ field }) => (
                            <Calendar
                                value={field.value}
                                onChange={(e) => field.onChange(e.value)}
                                dateFormat="mm/dd/yy"
                                className={`w-full ${errors.startDate ? "p-invalid" : ""}`}
                                showIcon
                            />
                            )}
                        />
                        <Err name="startDate" />
                        </div>

                        <div>
                        <label className="block mb-2">End Date (M/D/Y)</label>
                        <Controller
                            control={control}
                            name="endDate"
                            rules={{ required: "Required" }}
                            render={({ field }) => (
                            <Calendar
                                value={field.value}
                                onChange={(e) => field.onChange(e.value)}
                                dateFormat="mm/dd/yy"
                                className={`w-full ${errors.endDate ? "p-invalid" : ""}`}
                                showIcon
                            />
                            )}
                        />
                        <Err name="endDate" />
                        </div>
                    </div>
                </Card>

                {/* Activity Plan & Budget (repeatable) */}
                <Fieldset legend="Activity Plan & Budget">
                    <div className="space-y-8">
                        {apbFA.fields.map((field, idx) => (
                            <Card key={field.id} className="shadow-1 rounded-xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block mb-2">Objectives</label>
                                        <InputTextarea rows={3} autoResize {...register(`activityPlanBudget.${idx}.objectives`, { required: "Required" })} className={`w-full py-1 px-4 border border-gray-400 ${errors?.activityPlanBudget?.[idx]?.objectives ? "p-invalid" : ""}`} />
                                        {errors?.activityPlanBudget?.[idx]?.objectives && (<small className="p-error block mt-1">Required</small>)}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block mb-2">Activities</label>
                                        <InputTextarea rows={3} autoResize {...register(`activityPlanBudget.${idx}.activities`, { required: "Required" })} className={`w-full py-1 px-4 border border-gray-400 ${errors?.activityPlanBudget?.[idx]?.activities ? "p-invalid" : ""}`} />
                                        {errors?.activityPlanBudget?.[idx]?.activities && (<small className="p-error block mt-1">Required</small>)}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block mb-2">Outputs</label>
                                        <InputTextarea rows={3} autoResize {...register(`activityPlanBudget.${idx}.outputs`, { required: "Required" })} className={`w-full py-1 px-4 border border-gray-400 ${errors?.activityPlanBudget?.[idx]?.outputs ? "p-invalid" : ""}`} />
                                        {errors?.activityPlanBudget?.[idx]?.outputs && (<small className="p-error block mt-1">Required</small>)}
                                    </div>

                                    <div>
                                        <label className="block mb-2">Personnel</label>
                                        <InputText
                                        {...register(`activityPlanBudget.${idx}.personnel`, { required: "Required" })}
                                        className={`w-full py-1 px-4 border border-gray-400 ${errors?.activityPlanBudget?.[idx]?.personnel ? "p-invalid" : ""}`}
                                        />
                                        {errors?.activityPlanBudget?.[idx]?.personnel && (
                                        <small className="p-error block mt-1">Required</small>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block mb-2">Budget</label>
                                        <Controller
                                            control={control}
                                            name={`activityPlanBudget.${idx}.budget`}
                                            rules={{ required: "Required", validate: (v) => (v ?? 0) >= 0 || "Dapat hindi negative." }}
                                            render={({ field }) => (
                                                <InputNumber
                                                    value={field.value}
                                                    onValueChange={(e) => field.onChange(e.value)}
                                                    mode="currency"
                                                    currency="PHP"
                                                    locale="en-PH"
                                                    placeholder="0.00"
                                                    inputClassName="px-4 py-1 border border-gray-400"
                                                    className={`w-full ${errors?.activityPlanBudget?.[idx]?.budget ? "p-invalid" : ""}`}
                                                />
                                        )}
                                        />
                                        {errors?.activityPlanBudget?.[idx]?.budget && (
                                        <small className="p-error block mt-1">Required</small>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <Button
                                        type="button"
                                        icon="pi pi-plus"
                                        label="Add"
                                        onClick={() =>
                                        apbFA.append({ objectives: [], activities: [], outputs: [], personnel: "", budget: null })
                                        }
                                    />
                                    {apbFA.fields.length > 1 && (
                                        <Button
                                        type="button"
                                        icon="pi pi-trash"
                                        label="Remove"
                                        severity="danger"
                                        onClick={() => apbFA.remove(idx)}
                                        />
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </Fieldset>

                {/* Detailed Budget */}
                <Fieldset legend="Detailed Budget">
                    <div className="space-y-8">
                        {dbFA.fields.map((field, idx) => (
                            <Card key={field.id} className="shadow-1 rounded-xl">
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                                    <div>
                                        <label className="block mb-2">Budget Item</label>
                                        <InputText
                                        {...register(`detailedBudget.${idx}.item`, { required: "Required" })}
                                        className={`w-full py-1 px-4 border border-gray-400 ${errors?.detailedBudget?.[idx]?.item ? "p-invalid" : ""}`}
                                        />
                                        {errors?.detailedBudget?.[idx]?.item && (
                                        <small className="p-error block mt-1">Required</small>
                                        )}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block mb-2">Details / Particulars</label>
                                        <InputTextarea
                                        rows={2}
                                        autoResize
                                        {...register(`detailedBudget.${idx}.details`)}
                                        className={`w-full py-1 px-4 border border-gray-400`}
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-2">Quantity (optional)</label>
                                        <Controller
                                        control={control}
                                        name={`detailedBudget.${idx}.quantity`}
                                        render={({ field }) => (
                                            <InputNumber
                                            value={field.value}
                                            onValueChange={(e) => field.onChange(e.value)}
                                            inputClassName="px-4 py-1 border border-gray-400"
                                            className={`w-full`}
                                            />
                                        )}
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-2">Amount (optional)</label>
                                        <Controller
                                        control={control}
                                        name={`detailedBudget.${idx}.amount`}
                                        render={({ field }) => (
                                            <InputNumber
                                            value={field.value}
                                            onValueChange={(e) => field.onChange(e.value)}
                                            mode="currency"
                                            currency="PHP"
                                            locale="en-PH"
                                            placeholder="0.00"
                                            inputClassName="px-4 py-1 border border-gray-400"
                                            className={`w-full`}
                                            />
                                        )}
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-2">Total</label>
                                        <Controller
                                        control={control}
                                        name={`detailedBudget.${idx}.total`}
                                        render={({ field }) => (
                                            <InputNumber
                                            value={field.value}
                                            onValueChange={(e) => field.onChange(e.value)}
                                            mode="currency"
                                            currency="PHP"
                                            locale="en-PH"
                                            placeholder="0.00"
                                            inputClassName="px-4 py-1 border border-gray-400"
                                            className={`w-full`}
                                            />
                                        )}
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <Button type="button" icon="pi pi-plus" label="Add" onClick={() => dbFA.append({ item: "", details: "", quantity: null, amount: null, total: null })} />
                                    {dbFA.fields.length > 1 && (
                                        <Button type="button" icon="pi pi-trash" label="Remove" severity="danger" onClick={() => dbFA.remove(idx)} />
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </Fieldset>

                {/* Budget Sourcing */}
                <Fieldset legend="Budget Sourcing">
                    <div className="space-y-8">
                        {bsFA.fields.map((field, idx) => (
                            <Card key={field.id} className="shadow-1 rounded-xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block mb-2">Counterpart of the University</label>
                                        <InputText
                                        {...register(`budgetSourcing.${idx}.university`, { required: "Required" })}
                                        className={`w-full py-1 px-4 border border-gray-400 ${errors?.budgetSourcing?.[idx]?.university ? "p-invalid" : ""}`}
                                        />
                                        {errors?.budgetSourcing?.[idx]?.university && (
                                        <small className="p-error block mt-1">Required</small>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block mb-2">Counterpart of the Outreach Group</label>
                                        <InputText
                                        {...register(`budgetSourcing.${idx}.outreachGroup`, { required: "Required" })}
                                        className={`w-full py-1 px-4 border border-gray-400 ${errors?.budgetSourcing?.[idx]?.outreachGroup ? "p-invalid" : ""}`}
                                        />
                                        {errors?.budgetSourcing?.[idx]?.outreachGroup && (
                                        <small className="p-error block mt-1">Required</small>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block mb-2">Counterpart of the Service</label>
                                        <InputText
                                        {...register(`budgetSourcing.${idx}.service`, { required: "Required" })}
                                        className={`w-full py-1 px-4 border border-gray-400 ${errors?.budgetSourcing?.[idx]?.service ? "p-invalid" : ""}`}
                                        />
                                        {errors?.budgetSourcing?.[idx]?.service && (
                                        <small className="p-error block mt-1">Required</small>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block mb-2">Other Source of Funding</label>
                                        <InputText
                                        {...register(`budgetSourcing.${idx}.other`)}
                                        className={`w-full py-1 px-4 border border-gray-400`}
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-2">Total</label>
                                        <Controller
                                        control={control}
                                        name={`budgetSourcing.${idx}.total`}
                                        rules={{ validate: (v) => (v ?? 0) >= 0 || "Dapat hindi negative." }}
                                        render={({ field }) => (
                                            <InputNumber
                                            value={field.value}
                                            onValueChange={(e) => field.onChange(e.value)}
                                            mode="currency"
                                            currency="PHP"
                                            locale="en-PH"
                                            placeholder="0.00"
                                            inputClassName="px-4 py-1 border border-gray-400"
                                            className={`w-full ${errors?.budgetSourcing?.[idx]?.total ? "p-invalid" : ""}`}
                                            />
                                        )}
                                        />
                                        {errors?.budgetSourcing?.[idx]?.total && (
                                        <small className="p-error block mt-1">Required</small>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <Button type="button" icon="pi pi-plus" label="Add" onClick={() => bsFA.append({ university: "", outreachGroup: "", service: "", other: "", total: null })} />
                                    {bsFA.fields.length > 1 && (
                                        <Button type="button" icon="pi pi-trash" label="Remove" severity="danger" onClick={() => bsFA.remove(idx)} />
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </Fieldset>

                {/* Project Leader & Contact */}
                <Card title="Project Leader & Contact" className="shadow-2 rounded-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block mb-2">Project Leader</label>
                            <InputText
                                {...register("projectLeader", { required: "Required" })}
                                className={`w-full py-1 px-4 border border-gray-400 ${errors.projectLeader ? "p-invalid" : ""}`}
                            />
                            <Err name="projectLeader" />
                        </div>
                        <div>
                            <label className="block mb-2">Mobile Number</label>
                            <InputText
                                keyfilter="int"
                                placeholder="09xxxxxxxxx"
                                {...register("mobile", {
                                required: "Required",
                                pattern: { value: /^\d{10,15}$/g, message: "10-15 digits." },
                                })}
                                className={`w-full py-1 px-4 border border-gray-400 ${errors.mobile ? "p-invalid" : ""}`}
                            />
                            <Err name="mobile" />
                        </div>
                        <div>
                            <label className="block mb-2">Email Address</label>
                            <InputText
                                placeholder="name@example.com"
                                {...register("email", {
                                required: "Required",
                                pattern: { value: /[^@\s]+@[^@\s]+\.[^@\s]+/, message: "Invalid email format" },
                                })}
                                className={`w-full py-1 px-4 border border-gray-400 ${errors.email ? "p-invalid" : ""}`}
                            />
                            <Err name="email" />
                        </div>
                    </div>
                </Card>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <Button 
                        type="submit" 
                        className="text-green-600" 
                        icon="pi pi-check" 
                        label={createProposalLoading || updateProposalLoading ? "loading..." : "Submit"}
                        disabled={createProposalLoading || updateProposalLoading} 
                    />
                    <Button type="reset" className="text-red-400" icon="pi pi-refresh" label="Reset" severity="secondary" />

                    <PDFDownloadLink document={<OutreachPDF data={watch()} />} fileName={`Outreach-proposal.pdf`}>
                        {({ loading }) => (
                        <Button
                            className="text-blue-400"
                            type="button"
                            icon="pi pi-download"
                            label={loading ? "Preparing PDF..." : "Download PDF"}
                            severity="success"
                        />
                        )}
                    </PDFDownloadLink>
                </div>

                {/* Dev JSON Preview */}
                {/* <Fieldset legend="Preview JSON (dev)">
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded-xl overflow-auto">{JSON.stringify(watch(), null, 2)}</pre>
                </Fieldset> */}
            </form>
        </div>
    );
};
