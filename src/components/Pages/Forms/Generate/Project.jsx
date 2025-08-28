import React, { useMemo } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Fieldset } from "primereact/fieldset";
import { Divider } from "primereact/divider";
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from "@react-pdf/renderer";
import { getEventTypes } from "@_src/services/event";


// Register fonts (same approach as your Outreach component)
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
    return `${peso}${val.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

// ---------------- PDF ----------------
const pdfStyles = StyleSheet.create({
    page: { padding: 32, fontSize: 11, lineHeight: 1.4, fontFamily: "Inter" },
    h1: { fontSize: 18, marginBottom: 8, fontWeight: "bold" },
    h2: { fontSize: 14, marginTop: 12, marginBottom: 6, fontWeight: "bold" },
    label: { fontSize: 11, fontWeight: "bold" },
    text: { marginBottom: 2 },
    section: { marginBottom: 8 },
});

const ProjectPDF = ({ data }) => {
    // Totals
    const detailedBudgetTotal = (data?.detailedBudget || []).reduce(
        (sum, row) => sum + (Number(row?.amount || 0) * Number(row?.quantity || 1) || 0),
        0
    );
    const workPlanTotal = (data?.workPlan || []).reduce(
        (sum, row) => sum + (Number(row?.cost) || 0),
        0
    );

    return (
        <Document>
        <Page size="A4" style={pdfStyles.page}>
            <Text style={pdfStyles.h1}>{data?.projectTitle || "Project Proposal"}</Text>

            {/* Project Information */}
            <View style={pdfStyles.section} wrap>
            <Text style={pdfStyles.h2}>Project Information</Text>
            <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Type: </Text>{data?.projectTypeLabel || "-"}</Text>
            <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Proponents: </Text>{data?.proponents || "-"}</Text>
            <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Collaborators: </Text>{data?.collaborators || "-"}</Text>
            <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Participants: </Text>{data?.participants || "-"}</Text>
            <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Partners: </Text>{data?.partners || "-"}</Text>
            <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Date of Implementation: </Text>{formatDateMDY(data?.implementationDate)}</Text>
            <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Duration (hours): </Text>{data?.durationHours ?? "-"}</Text>
            <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Area: </Text>{data?.area || "-"}</Text>
            <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Budget Requirement: </Text>{formatCurrency(data?.budgetRequirement)}</Text>
            <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Budget Requested: </Text>{formatCurrency(data?.budgetRequested)}</Text>
            <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Background / Situation Analysis: </Text>{data?.background || "-"}</Text>
            </View>

            {/* Objectives & Strategies */}
            <View style={pdfStyles.section} wrap>
            <Text style={pdfStyles.h2}>Project Objectives & Strategies</Text>
            {(data?.objectives || []).map((row, i) => (
                <View key={i} style={{ marginBottom: 6 }}>
                <Text style={pdfStyles.text}><Text style={pdfStyles.label}>#{i + 1} Objective: </Text>{row?.objective || "-"}</Text>
                <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Strategies: </Text>{row?.strategies || "-"}</Text>
                </View>
            ))}
            </View>

            {/* Desired Impact & Outcomes */}
            <View style={pdfStyles.section} wrap>
            <Text style={pdfStyles.h2}>Desired Impact & Outcomes</Text>
            {(data?.impactOutcome || []).map((row, i) => (
                <View key={i} style={{ marginBottom: 6 }}>
                <Text style={pdfStyles.text}><Text style={pdfStyles.label}>#{i + 1} Impact: </Text>{row?.impact || "-"}</Text>
                <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Outcome: </Text>{row?.outcome || "-"}</Text>
                <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Linkage: </Text>{row?.linkage || "-"}</Text>
                </View>
            ))}
            </View>

            {/* Risk Management */}
            <View style={pdfStyles.section} wrap>
            <Text style={pdfStyles.h2}>Risk Management</Text>
            {(data?.risks || []).map((row, i) => (
                <View key={i} style={{ marginBottom: 6 }}>
                <Text style={pdfStyles.text}><Text style={pdfStyles.label}>#{i + 1} Risk Identification: </Text>{row?.risk || "-"}</Text>
                <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Risk Mitigation: </Text>{row?.mitigation || "-"}</Text>
                </View>
            ))}
            </View>

            {/* Organization & Staffing */}
            <View style={pdfStyles.section} wrap>
            <Text style={pdfStyles.h2}>Project Organization & Staffing</Text>
            {(data?.staffing || []).map((row, i) => (
                <View key={i} style={{ marginBottom: 6 }}>
                <Text style={pdfStyles.text}><Text style={pdfStyles.label}>#{i + 1} Office Staff Designated: </Text>{row?.staff || "-"}</Text>
                <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Responsibilities: </Text>{row?.responsibilities || "-"}</Text>
                <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Contact Details: </Text>{row?.contact || "-"}</Text>
                </View>
            ))}
            </View>

            {/* Work Plan */}
            <View style={pdfStyles.section} wrap>
            <Text style={pdfStyles.h2}>Project Work Plan</Text>
            {(data?.workPlan || []).map((row, i) => (
                <View key={i} style={{ marginBottom: 6 }}>
                <Text style={pdfStyles.text}><Text style={pdfStyles.label}>#{i + 1} Phase & Date: </Text>{row?.phaseDate || "-"}</Text>
                <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Activities: </Text>{row?.activities || "-"}</Text>
                <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Targets & Outputs: </Text>{row?.targets || "-"}</Text>
                <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Indicators & Outcome: </Text>{row?.indicators || "-"}</Text>
                <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Personnel in Charge: </Text>{row?.personnel || "-"}</Text>
                <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Resources Needed: </Text>{row?.resources || "-"}</Text>
                <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Cost: </Text>{formatCurrency(row?.cost)}</Text>
                </View>
            ))}
            <Text style={[pdfStyles.text, { marginTop: 4 }]}>
                <Text style={pdfStyles.label}>Work Plan Total Cost: </Text>{formatCurrency(workPlanTotal)}
            </Text>
            </View>

            {/* Detailed Budget Requirement */}
            <View style={pdfStyles.section} wrap>
            <Text style={pdfStyles.h2}>Detailed Budget Requirement</Text>
            {(data?.detailedBudget || []).map((row, i) => (
                <View key={i} style={{ marginBottom: 4 }}>
                <Text style={pdfStyles.text}><Text style={pdfStyles.label}>#{i + 1} Budget Item: </Text>{row?.item || "-"}</Text>
                <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Description: </Text>{row?.description || "-"}</Text>
                <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Quantity: </Text>{row?.quantity ?? "-"}</Text>
                <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Amount: </Text>{formatCurrency(row?.amount)}</Text>
                <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Proposed Source: </Text>{row?.source || "-"}</Text>
                </View>
            ))}
            <Text style={[pdfStyles.text, { marginTop: 4 }]}>
                <Text style={pdfStyles.label}>Detailed Budget Total: </Text>{formatCurrency(detailedBudgetTotal)}
            </Text>
            </View>

            {/* Other Information */}
            <View style={pdfStyles.section} wrap>
            <Text style={pdfStyles.h2}>Other Relevant Information</Text>
            <Text style={pdfStyles.text}>{data?.otherInfo || "-"}</Text>
            </View>

            {/* Leader & Contacts */}
            <View style={pdfStyles.section} wrap>
            <Text style={pdfStyles.h2}>Project Leader & Contact</Text>
            <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Project Leader: </Text>{data?.projectLeader || "-"}</Text>
            <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Mobile: </Text>{data?.mobile || "-"}</Text>
            <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Email: </Text>{data?.email || "-"}</Text>
            </View>
        </Page>
        </Document>
    );
};

// --------------- Form -----------------

const Err = ({ message }) => (message ? <small className="p-error block mt-1">{message}</small> : null);

const numberRules = { validate: (v) => (v === null || v === undefined || v === "" || Number(v) >= 0) || "Dapat hindi negative." };

const emailRules = {
    required: "Required",
    pattern: { value: /[^@\s]+@[^@\s]+\.[^@\s]+/, message: "Invalid email format" },
};

const mobileRules = {
    required: "Required",
    pattern: { value: /^\d{10,15}$/g, message: "10-15 digits." },
};


const SectionTitle = ({ children }) => (
    <div className="text-lg font-semibold mb-3">{children}</div>
);

export const Project = ({ onSubmit }) => {
    const { data: eventTypeOptions = [{ label: "— Select type —", value: "" }] } = getEventTypes();

    const { control, register, handleSubmit, formState: { errors }, watch } = useForm({
        defaultValues: {
            projectTitle: "",
            projectType: "",
            proponents: "",
            collaborators: "",
            participants: "",
            partners: "",
            implementationDate: null,
            durationHours: null,
            area: "",
            budgetRequirement: null,
            budgetRequested: null,
            background: "",

            // arrays
            objectives: [{ objective: "", strategies: "" }],
            impactOutcome: [{ impact: "", outcome: "", linkage: "" }],
            risks: [{ risk: "", mitigation: "" }],
            staffing: [{ staff: "", responsibilities: "", contact: "" }],
            workPlan: [{ phaseDate: "", activities: "", targets: "", indicators: "", personnel: "", resources: "", cost: null }],
            detailedBudget: [{ item: "", description: "", quantity: null, amount: null, source: "" }],

            otherInfo: "",
            projectLeader: "",
            mobile: "",
            email: "",
            },
        mode: "onSubmit",
    });
        // if you need the label for the PDF:
    const projectType = watch("projectType");
    const typeLabelMap = useMemo(
        () => Object.fromEntries(eventTypeOptions.map(o => [String(o.value), o.label])),
        [eventTypeOptions]
    );
    const projectTypeLabel = typeLabelMap[String(projectType)] ?? "";

  // Field Arrays
    const objectivesFA = useFieldArray({ control, name: "objectives" });
    const impactOutcomeFA = useFieldArray({ control, name: "impactOutcome" });
    const risksFA = useFieldArray({ control, name: "risks" });
    const staffingFA = useFieldArray({ control, name: "staffing" });
    const workPlanFA = useFieldArray({ control, name: "workPlan" });
    const detailedBudgetFA = useFieldArray({ control, name: "detailedBudget" });

    const submit = (data) => {
        if (onSubmit) onSubmit(data);
        console.log("Submitted project:", data);
    };



    return (
        <div className="project-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
            <form onSubmit={handleSubmit(submit)} className="space-y-16 w-full max-w-6xl px-4">
                <Card title="Project Proposal" className="shadow-2 rounded-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block mb-2">Title</label>
                            <InputText {...register("projectTitle", { required: "Required" })}
                                className={`w-full py-1 px-4 border border-gray-400 ${errors.projectTitle ? "p-invalid" : ""}`} />
                            <Err message={errors.projectTitle?.message} />
                        </div>

                        <div>
                        <label className="block mb-2">Type of Project</label>
                            <Controller control={control} name="projectType" rules={{ required: "Required" }}
                                render={({ field }) => (
                                    <Dropdown
                                        value={field.value}
                                        onChange={(e) => field.onChange(e.value)}
                                        options={eventTypeOptions}
                                        optionLabel="label"
                                        optionValue="value"
                                        placeholder="Select type"
                                        className={`w-full ${errors.projectType ? "p-invalid" : ""}`}
                                    />
                                )}
                            />
                            <Err message={errors.projectType?.message} />
                        </div>

                        <div>
                            <label className="block mb-2">Project Proponents</label>
                            <InputText {...register("proponents", { required: "Required" })}
                                className={`w-full py-1 px-4 border border-gray-400 ${errors.proponents ? "p-invalid" : ""}`} />
                            <Err message={errors.proponents?.message} />
                        </div>

                        <div>
                            <label className="block mb-2">Project Collaborators</label>
                            <InputText {...register("collaborators", { required: "Required" })}
                                className={`w-full py-1 px-4 border border-gray-400 ${errors.collaborators ? "p-invalid" : ""}`} />
                            <Err message={errors.collaborators?.message} />
                        </div>

                        <div>
                            <label className="block mb-2">Number of Participants</label>
                            <Controller control={control} name="participants" rules={numberRules}
                                render={({ field }) => (
                                <InputNumber value={field.value} onValueChange={(e) => field.onChange(e.value)} inputClassName="px-4 py-1 border border-gray-400" className="w-full" />
                                )} />
                            <Err message={errors.participants?.message} />
                        </div>

                        <div>
                            <label className="block mb-2">Project Partners</label>
                            <InputText {...register("partners")} className={`w-full py-1 px-4 border border-gray-400`} />
                        </div>

                        <div>
                            <label className="block mb-2">Date of Implementation</label>
                            <Controller control={control} name="implementationDate" rules={{ required: "Required" }}
                                render={({ field }) => (
                                <Calendar value={field.value} onChange={(e) => field.onChange(e.value)} dateFormat="mm/dd/yy" className={`w-full ${errors.implementationDate ? "p-invalid" : ""}`} showIcon />
                                )} />
                            <Err message={errors.implementationDate?.message} />
                        </div>

                        <div>
                            <label className="block mb-2">Duration (hours)</label>
                            <Controller control={control} name="durationHours" rules={numberRules}
                                render={({ field }) => (
                                <InputNumber value={field.value} onValueChange={(e) => field.onChange(e.value)} inputClassName="px-4 py-1 border border-gray-400" className="w-full" />
                                )} />
                            <Err message={errors.durationHours?.message} />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block mb-2">Area of Project Implementation</label>
                            <InputTextarea rows={2} autoResize {...register("area", { required: "Required" })}
                                className={`w-full py-1 px-4 border border-gray-400 ${errors.area ? "p-invalid" : ""}`} />
                            <Err message={errors.area?.message} />
                        </div>

                        <div>
                            <label className="block mb-2">Budget Requirement</label>
                            <Controller control={control} name="budgetRequirement" rules={numberRules}
                                render={({ field }) => (
                                <InputNumber value={field.value} onValueChange={(e) => field.onChange(e.value)} mode="currency" currency="PHP" locale="en-PH" placeholder="0.00" inputClassName="px-4 py-1 border border-gray-400" className="w-full" />
                                )} />
                            <Err message={errors.budgetRequirement?.message} />
                        </div>

                        <div>
                            <label className="block mb-2">Budget Requested</label>
                            <Controller control={control} name="budgetRequested" rules={numberRules}
                                render={({ field }) => (
                                <InputNumber value={field.value} onValueChange={(e) => field.onChange(e.value)} mode="currency" currency="PHP" locale="en-PH" placeholder="0.00" inputClassName="px-4 py-1 border border-gray-400" className="w-full" />
                                )} />
                            <Err message={errors.budgetRequested?.message} />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block mb-2">Background / Situation Analysis</label>
                            <InputTextarea rows={3} autoResize {...register("background", { required: "Required" })}
                                className={`w-full py-1 px-4 border border-gray-400 ${errors.background ? "p-invalid" : ""}`} />
                            <Err message={errors.background?.message} />
                        </div>
                    </div>
                </Card>

                {/* Objectives & Strategies */}
                <Fieldset legend="Project Objectives & Strategies">
                    <div className="space-y-8">
                        {objectivesFA.fields.map((field, idx) => (
                            <Card key={field.id} className="shadow-1 rounded-xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block mb-2">Objective</label>
                                        <InputTextarea rows={2} autoResize {...register(`objectives.${idx}.objective`, { required: "Required" })}
                                        className={`w-full py-1 px-4 border border-gray-400 ${errors?.objectives?.[idx]?.objective ? "p-invalid" : ""}`} />
                                        <Err message={errors?.objectives?.[idx]?.objective?.message} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block mb-2">Strategies</label>
                                        <InputTextarea rows={2} autoResize {...register(`objectives.${idx}.strategies`, { required: "Required" })}
                                        className={`w-full py-1 px-4 border border-gray-400 ${errors?.objectives?.[idx]?.strategies ? "p-invalid" : ""}`} />
                                        <Err message={errors?.objectives?.[idx]?.strategies?.message} />
                                    </div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <Button type="button" icon="pi pi-plus" label="Add" onClick={() => objectivesFA.append({ objective: "", strategies: "" })} />
                                    {objectivesFA.fields.length > 1 && (
                                        <Button type="button" icon="pi pi-trash" label="Remove" severity="danger" onClick={() => objectivesFA.remove(idx)} />
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </Fieldset>

                {/* Impact & Outcomes */}
                <Fieldset legend="Desired Impact & Outcomes">
                    <div className="space-y-8">
                        {impactOutcomeFA.fields.map((field, idx) => (
                            <Card key={field.id} className="shadow-1 rounded-xl">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block mb-2">Impact</label>
                                        <InputTextarea rows={2} autoResize {...register(`impactOutcome.${idx}.impact`, { required: "Required" })}
                                        className={`w-full py-1 px-4 border border-gray-400 ${errors?.impactOutcome?.[idx]?.impact ? "p-invalid" : ""}`} />
                                        <Err message={errors?.impactOutcome?.[idx]?.impact?.message} />
                                    </div>
                                    <div>
                                        <label className="block mb-2">Outcome</label>
                                        <InputTextarea rows={2} autoResize {...register(`impactOutcome.${idx}.outcome`, { required: "Required" })}
                                        className={`w-full py-1 px-4 border border-gray-400 ${errors?.impactOutcome?.[idx]?.outcome ? "p-invalid" : ""}`} />
                                        <Err message={errors?.impactOutcome?.[idx]?.outcome?.message} />
                                    </div>
                                    <div>
                                        <label className="block mb-2">Linkage</label>
                                        <InputTextarea rows={2} autoResize {...register(`impactOutcome.${idx}.linkage`) }
                                        className={`w-full py-1 px-4 border border-gray-400`} />
                                    </div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <Button type="button" icon="pi pi-plus" label="Add" onClick={() => impactOutcomeFA.append({ impact: "", outcome: "", linkage: "" })} />
                                    {impactOutcomeFA.fields.length > 1 && (
                                        <Button type="button" icon="pi pi-trash" label="Remove" severity="danger" onClick={() => impactOutcomeFA.remove(idx)} />
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </Fieldset>

                {/* Risk Management */}
                <Fieldset legend="Risk Management">
                    <div className="space-y-8">
                        {risksFA.fields.map((field, idx) => (
                            <Card key={field.id} className="shadow-1 rounded-xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-1">
                                        <label className="block mb-2">Risk Identification</label>
                                        <InputTextarea rows={2} autoResize {...register(`risks.${idx}.risk`, { required: "Required" })}
                                        className={`w-full py-1 px-4 border border-gray-400 ${errors?.risks?.[idx]?.risk ? "p-invalid" : ""}`} />
                                        <Err message={errors?.risks?.[idx]?.risk?.message} />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block mb-2">Risk Mitigation</label>
                                        <InputTextarea rows={2} autoResize {...register(`risks.${idx}.mitigation`, { required: "Required" })}
                                        className={`w-full py-1 px-4 border border-gray-400 ${errors?.risks?.[idx]?.mitigation ? "p-invalid" : ""}`} />
                                        <Err message={errors?.risks?.[idx]?.mitigation?.message} />
                                    </div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <Button type="button" icon="pi pi-plus" label="Add" onClick={() => risksFA.append({ risk: "", mitigation: "" })} />
                                    {risksFA.fields.length > 1 && (
                                        <Button type="button" icon="pi pi-trash" label="Remove" severity="danger" onClick={() => risksFA.remove(idx)} />
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </Fieldset>

                {/* Organization & Staffing */}
                <Fieldset legend="Project Organization & Staffing">
                    <div className="space-y-8">
                        {staffingFA.fields.map((field, idx) => (
                            <Card key={field.id} className="shadow-1 rounded-xl">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block mb-2">Office Staff Designated</label>
                                        <InputText {...register(`staffing.${idx}.staff`, { required: "Required" })}
                                        className={`w-full py-1 px-4 border border-gray-400 ${errors?.staffing?.[idx]?.staff ? "p-invalid" : ""}`} />
                                        <Err message={errors?.staffing?.[idx]?.staff?.message} />
                                    </div>
                                    <div>
                                        <label className="block mb-2">Responsibilities</label>
                                        <InputTextarea rows={2} autoResize {...register(`staffing.${idx}.responsibilities`, { required: "Required" })}
                                        className={`w-full py-1 px-4 border border-gray-400 ${errors?.staffing?.[idx]?.responsibilities ? "p-invalid" : ""}`} />
                                        <Err message={errors?.staffing?.[idx]?.responsibilities?.message} />
                                    </div>
                                    <div>
                                        <label className="block mb-2">Contact Details</label>
                                        <InputTextarea rows={2} autoResize {...register(`staffing.${idx}.contact`) }
                                        className={`w-full py-1 px-4 border border-gray-400`} />
                                    </div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <Button type="button" icon="pi pi-plus" label="Add" onClick={() => staffingFA.append({ staff: "", responsibilities: "", contact: "" })} />
                                    {staffingFA.fields.length > 1 && (
                                        <Button type="button" icon="pi pi-trash" label="Remove" severity="danger" onClick={() => staffingFA.remove(idx)} />
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </Fieldset>

                {/* Work Plan */}
                <Fieldset legend="Project Work Plan">
                    <div className="space-y-8">
                        {workPlanFA.fields.map((field, idx) => (
                            <Card key={field.id} className="shadow-1 rounded-xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block mb-2">Phase of Project and Date</label>
                                        <InputText {...register(`workPlan.${idx}.phaseDate`, { required: "Required" })}
                                        className={`w-full py-1 px-4 border border-gray-400 ${errors?.workPlan?.[idx]?.phaseDate ? "p-invalid" : ""}`} />
                                        <Err message={errors?.workPlan?.[idx]?.phaseDate?.message} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block mb-2">Activities</label>
                                        <InputTextarea rows={2} autoResize {...register(`workPlan.${idx}.activities`, { required: "Required" })}
                                        className={`w-full py-1 px-4 border border-gray-400 ${errors?.workPlan?.[idx]?.activities ? "p-invalid" : ""}`} />
                                        <Err message={errors?.workPlan?.[idx]?.activities?.message} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block mb-2">Target and Outputs</label>
                                        <InputTextarea rows={2} autoResize {...register(`workPlan.${idx}.targets`, { required: "Required" })}
                                        className={`w-full py-1 px-4 border border-gray-400 ${errors?.workPlan?.[idx]?.targets ? "p-invalid" : ""}`} />
                                        <Err message={errors?.workPlan?.[idx]?.targets?.message} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block mb-2">Indicators and Outcome</label>
                                        <InputTextarea rows={2} autoResize {...register(`workPlan.${idx}.indicators`, { required: "Required" })}
                                        className={`w-full py-1 px-4 border border-gray-400 ${errors?.workPlan?.[idx]?.indicators ? "p-invalid" : ""}`} />
                                        <Err message={errors?.workPlan?.[idx]?.indicators?.message} />
                                    </div>
                                    <div>
                                        <label className="block mb-2">Personnel in Charge (optional)</label>
                                        <InputText {...register(`workPlan.${idx}.personnel`) } className={`w-full py-1 px-4 border border-gray-400`} />
                                    </div>
                                    <div>
                                        <label className="block mb-2">Resources Needed</label>
                                        <InputTextarea rows={2} autoResize {...register(`workPlan.${idx}.resources`, { required: "Required" })}
                                        className={`w-full py-1 px-4 border border-gray-400 ${errors?.workPlan?.[idx]?.resources ? "p-invalid" : ""}`} />
                                        <Err message={errors?.workPlan?.[idx]?.resources?.message} />
                                    </div>
                                    <div>
                                        <label className="block mb-2">Cost</label>
                                        <Controller control={control} name={`workPlan.${idx}.cost`} rules={numberRules}
                                        render={({ field }) => (
                                            <InputNumber value={field.value} onValueChange={(e) => field.onChange(e.value)} mode="currency" currency="PHP" locale="en-PH" placeholder="0.00" inputClassName="px-4 py-1 border border-gray-400" className="w-full" />
                                        )} />
                                        <Err message={errors?.workPlan?.[idx]?.cost?.message} />
                                    </div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <Button type="button" icon="pi pi-plus" label="Add" onClick={() => workPlanFA.append({ phaseDate: "", activities: "", targets: "", indicators: "", personnel: "", resources: "", cost: null })} />
                                    {workPlanFA.fields.length > 1 && (
                                        <Button type="button" icon="pi pi-trash" label="Remove" severity="danger" onClick={() => workPlanFA.remove(idx)} />
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </Fieldset>

                {/* Detailed Budget Requirement */}
                <Fieldset legend="Detailed Budget Requirement">
                    <div className="space-y-8">
                        {detailedBudgetFA.fields.map((field, idx) => (
                            <Card key={field.id} className="shadow-1 rounded-xl">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div>
                                        <label className="block mb-2">Budget Item</label>
                                        <InputText {...register(`detailedBudget.${idx}.item`, { required: "Required" })}
                                        className={`w-full py-1 px-4 border border-gray-400 ${errors?.detailedBudget?.[idx]?.item ? "p-invalid" : ""}`} />
                                        <Err message={errors?.detailedBudget?.[idx]?.item?.message} />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block mb-2">Description</label>
                                        <InputTextarea rows={2} autoResize {...register(`detailedBudget.${idx}.description`) }
                                        className={`w-full py-1 px-4 border border-gray-400`} />
                                    </div>

                                    <div>
                                        <label className="block mb-2">Quantity</label>
                                        <Controller control={control} name={`detailedBudget.${idx}.quantity`} rules={numberRules}
                                        render={({ field }) => (
                                            <InputNumber value={field.value} onValueChange={(e) => field.onChange(e.value)} inputClassName="px-4 py-1 border border-gray-400" className="w-full" />
                                        )} />
                                        <Err message={errors?.detailedBudget?.[idx]?.quantity?.message} />
                                    </div>

                                    <div>
                                        <label className="block mb-2">Amount</label>
                                        <Controller control={control} name={`detailedBudget.${idx}.amount`} rules={numberRules}
                                        render={({ field }) => (
                                            <InputNumber value={field.value} onValueChange={(e) => field.onChange(e.value)} mode="currency" currency="PHP" locale="en-PH" placeholder="0.00" inputClassName="px-4 py-1 border border-gray-400" className="w-full" />
                                        )} />
                                        <Err message={errors?.detailedBudget?.[idx]?.amount?.message} />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block mb-2">Proposed Source</label>
                                        <InputText {...register(`detailedBudget.${idx}.source`) } className={`w-full py-1 px-4 border border-gray-400`} />
                                    </div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <Button type="button" icon="pi pi-plus" label="Add" onClick={() => detailedBudgetFA.append({ item: "", description: "", quantity: null, amount: null, source: "" })} />
                                    {detailedBudgetFA.fields.length > 1 && (
                                        <Button type="button" icon="pi pi-trash" label="Remove" severity="danger" onClick={() => detailedBudgetFA.remove(idx)} />
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </Fieldset>

                <Card title="Other Relevant Information" className="shadow-2 rounded-2xl">
                    <InputTextarea rows={3} autoResize {...register("otherInfo")} className={`w-full py-1 px-4 border border-gray-400`} />
                </Card>

                {/* Leader & Contact */}
                <Card title="Project Leader & Contact" className="shadow-2 rounded-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block mb-2">Project Leader</label>
                            <InputText {...register("projectLeader", { required: "Required" })}
                                className={`w-full py-1 px-4 border border-gray-400 ${errors.projectLeader ? "p-invalid" : ""}`} />
                            <Err message={errors.projectLeader?.message} />
                        </div>
                        <div>
                            <label className="block mb-2">Mobile Number</label>
                            <InputText keyfilter="int" placeholder="09xxxxxxxxx" {...register("mobile", mobileRules)}
                                className={`w-full py-1 px-4 border border-gray-400 ${errors.mobile ? "p-invalid" : ""}`} />
                            <Err message={errors.mobile?.message} />
                        </div>
                        <div>
                            <label className="block mb-2">Email Address</label>
                            <InputText placeholder="name@example.com" {...register("email", emailRules)}
                                className={`w-full py-1 px-4 border border-gray-400 ${errors.email ? "p-invalid" : ""}`} />
                            <Err message={errors.email?.message} />
                        </div>
                    </div>
                </Card>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <Button type="submit" className="text-green-600" icon="pi pi-check" label="Submit" />
                    <Button type="reset" className="text-red-400" icon="pi pi-refresh" label="Reset" severity="secondary" />
                    <PDFDownloadLink document={<ProjectPDF  data={{ ...watch(), projectTypeLabel }} />} fileName={`Project-proposal.pdf`}>
                        {({ loading }) => (
                            <Button className="text-blue-400" type="button" icon="pi pi-download" label={loading ? "Preparing PDF..." : "Download PDF"} severity="success" />
                        )}
                    </PDFDownloadLink>
                </div>

                {/* Dev JSON Preview */}
                <Fieldset legend="Preview JSON (dev)">
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded-xl overflow-auto">{JSON.stringify(watch(), null, 2)}</pre>
                </Fieldset>
            </form>
        </div>
    );
};

