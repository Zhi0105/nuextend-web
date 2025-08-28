import React from "react";
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


// 1) Register font
Font.register({
    family: 'Inter',
    fonts: [
        { src: '/fonts/Inter_18pt-Regular.ttf', fontWeight: 'normal' },
        { src: '/fonts/Inter_24pt-Bold.ttf',    fontWeight: 'bold' }
    ]
});

const pdfStyles = StyleSheet.create({
    page: { padding: 32, fontSize: 11, lineHeight: 1.4, fontFamily: 'Inter' },
    h1: { fontSize: 18, marginBottom: 8, fontWeight: 'bold' },
    h2: { fontSize: 14, marginTop: 12, marginBottom: 6, fontWeight: 'bold' },
    label: { fontSize: 11, fontWeight: 'bold' },
    text: { marginBottom: 2 },
    section: { marginBottom: 8 }
});

const formatDateMDY = (d) => {
    if (!d) return '';
    try {
    const dt = new Date(d);
    const m = dt.getMonth() + 1;
    const day = dt.getDate();
    const y = dt.getFullYear();
    return `${m}/${day}/${y}`;
    } catch {
    return '';
    }
};

const peso = '\u20B1'; // ₱
const formatCurrency = (n) => {
    const val = Number(n || 0);
    return `${peso}${val.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
};

const ProgramPDF = ({ data }) => {
    const cpBudgetTotal = (data?.componentProjects || []).reduce((sum, cp) => sum + (Number(cp?.budget) || 0), 0);
    return (
        <Document>
            <Page size='A4' style={pdfStyles.page}>
                <Text style={pdfStyles.h1}>{data?.title || 'Program Proposal'}</Text>
                <View style={pdfStyles.section} wrap>
                    <Text style={pdfStyles.h2}>Program Details</Text>
                    <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Implementer: </Text>{data?.implementer || '-'}</Text>
                    <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Target Group: </Text>{data?.targetGroup || '-'}</Text>
                    <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Duration: </Text>{data?.duration || '-'}</Text>
                    <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Proposal Budget: </Text>{formatCurrency(data?.proposalBudget)}</Text>
                    <Text style={[pdfStyles.text, { marginTop: 6 }]}><Text style={pdfStyles.label}>Program Team Members: </Text>{(data?.programTeamMembers || []).join(', ') || '-'}</Text>
                    <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Cooperating Agencies: </Text>{(data?.cooperatingAgencies || []).join(', ') || '-'}</Text>    
                </View>
                <View style={pdfStyles.section} wrap>
                    <Text style={pdfStyles.h2}>Background & Problem Statement</Text>
                    <Text style={pdfStyles.text}>{data?.background || '-'}</Text>
                </View>


                <View style={pdfStyles.section} wrap>
                    <Text style={pdfStyles.h2}>Overall Goal</Text>
                    <Text style={pdfStyles.text}>{data?.overallGoal || '-'}</Text>
                </View>


                <View style={pdfStyles.section} wrap>
                    <Text style={pdfStyles.h2}>Scholarly Connection</Text>
                    <Text style={pdfStyles.text}>{data?.scholarlyConnection || '-'}</Text>
                </View>
                <View style={pdfStyles.section} wrap>
                    <Text style={pdfStyles.h2}>Component Projects</Text>
                    {(data?.componentProjects || []).map((cp, i) => (
                    <View key={i} style={{ marginBottom: 6 }}>
                    <Text style={pdfStyles.text}><Text style={pdfStyles.label}>#{i + 1} Title: </Text>{cp?.componentProjectTitle || '-'}</Text>
                    <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Outcomes: </Text>{cp?.outcomes || '-'}</Text>
                    <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Budget: </Text>{formatCurrency(cp?.budget)}</Text>
                    </View>
                    ))}
                    <Text style={[pdfStyles.text, { marginTop: 4 }]}><Text style={pdfStyles.label}>Total Component Budget: </Text>{formatCurrency(cpBudgetTotal)}</Text>    
                </View>


                <View style={pdfStyles.section} wrap>
                    <Text style={pdfStyles.h2}>Projects</Text>
                    {(data?.projects || []).map((p, i) => (
                    <View key={i} style={{ marginBottom: 6 }}>
                        <Text style={pdfStyles.text}><Text style={pdfStyles.label}>#{i + 1} Title: </Text>{p?.projectTitle || '-'}</Text>
                        <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Team Leader: </Text>{p?.teamLeader || '-'}</Text>
                        <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Team Members: </Text>{(p?.teamMembers || []).join(', ') || '-'}</Text>
                        <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Objectives: </Text>{p?.objectives || '-'}</Text>    
                    </View>
                    ))}
                </View>


                <View style={pdfStyles.section} wrap>
                    <Text style={pdfStyles.h2}>Activity Plans</Text>
                    {(data?.activityPlans || []).map((a, i) => (
                    <View key={i} style={{ marginBottom: 6 }}>
                        <Text style={pdfStyles.text}><Text style={pdfStyles.label}>#{i + 1} Activity: </Text>{a?.activity || '-'}</Text>
                        <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Outputs: </Text>{a?.outputs || '-'}</Text>
                        <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Timeline: </Text>{formatDateMDY(a?.timeline)}</Text>
                        <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Personnel: </Text>{a?.personnel || '-'}</Text>    
                    </View>
                    ))}
                </View>

                <View style={pdfStyles.section} wrap>
                    <Text style={pdfStyles.h2}>Coordinator Contact</Text>
                    <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Program Coordinator: </Text>{data?.coordinator || '-'}</Text>
                    <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Mobile: </Text>{data?.mobileNumber || '-'}</Text>
                    <Text style={pdfStyles.text}><Text style={pdfStyles.label}>Email: </Text>{data?.email || '-'}</Text>
                </View>
            </Page>
        </Document>
    )
}

export const Program = ({ onSubmit }) => {
    
    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm({
        defaultValues: {
        // Top-level details
        title: "",
        implementer: "",
        programTeamMembers: [], // marami
        targetGroup: "",
        cooperatingAgencies: [], // marami
        duration: "",
        proposalBudget: null,
        background: "",
        overallGoal: "",
        scholarlyConnection: "",

        // Contact (nasa dulo)
        coordinator: "",
        mobileNumber: "",
        email: "",

        // Triplets (pwede marami)
        componentProjects: [
            { componentProjectTitle: "", outcomes: "", budget: null },
        ],

        // Project set (pwede marami)
        projects: [
            {
            projectTitle: "",
            teamLeader: "",
            teamMembers: [], // marami
            objectives: "",
            },
        ],

        // Activity plan (pwede marami)
        activityPlans: [
            { activity: "", outputs: "", timeline: null, personnel: "" },
        ],
        },
        mode: "onSubmit",
    });
    // useFieldArray hooks for repeatable groups
    const componentProjectsFA = useFieldArray({ control, name: "componentProjects" });
    const projectsFA = useFieldArray({ control, name: "projects" });
    const activityPlansFA = useFieldArray({ control, name: "activityPlans" });


    const submit = (data) => {
        if (onSubmit) onSubmit(data);
        // Demo: log & show alert. Replace as needed.
        console.log("Submitted:", data);
    };

    // Simple helper for error text
    const Err = ({ name }) =>
        errors?.[name] ? (
        <small className="p-error block mt-1">{errors[name]?.message || "Required"}</small>
    ) : null;

    return (
        <div className="program-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
            <form onSubmit={handleSubmit(submit)} className="space-y-24">
                {/* Program Header */}
                <Card title="Program proposal" className="shadow-2 rounded-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block mb-2">Title</label>
                            <InputText
                                {...register("title", { required: "Invalid title" })}
                                className={`w-full py-1 px-4 border border-gray-400 ${errors.title ? "p-invalid" : ""}`}
                            />
                            <Err name="title" />
                        </div>

                        <div>
                            <label className="block mb-2">Implementer</label>
                            <InputText
                                {...register("implementer", { required: "Invalid Implementer" })}
                                className={`w-full py-1 px-4 border border-gray-400 ${errors.implementer ? "p-invalid" : ""}`}
                            />
                            <Err name="implementer" />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block mb-2">Program Team Members</label>
                            <Controller
                                control={control}
                                name="programTeamMembers"
                                rules={{ validate: (v) => (v?.length ?? 0) > 0 || "required at least 1 member." }}
                                render={({ field }) => (
                                <Chips
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.value)}
                                    separator="," placeholder="Type a name, press Enter"
                                    pt={{
                                        input: { className: "w-full px-4" }, // <-- force input width
                                        container: { className: "w-full border border-gray-400" } // ensure container respects parent
                                    }}
                                    className={`w-full py-1 ${errors.programTeamMembers ? "p-invalid" : ""}`}
                                />
                                )}
                            />
                            {errors.programTeamMembers && (
                                <small className="p-error block mt-1">{errors.programTeamMembers.message}</small>
                            )}
                        </div>

                        <div>
                            <label className="block mb-2">Target Group</label>
                            <InputText
                                {...register("targetGroup", { required: "Required" })}
                                className={`w-full py-1 px-4 border border-gray-400 ${errors.targetGroup ? "p-invalid" : ""}`}
                            />
                            <Err name="targetGroup" />
                        </div>

                        <div>
                            <label className="block mb-2">Cooperating Agencies (marami)</label>
                            <Controller
                                control={control}
                                name="cooperatingAgencies"
                                rules={{ validate: (v) => (v?.length ?? 0) > 0 || "required ng at least 1 agency." }}
                                render={({ field }) => (
                                <Chips
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.value)}
                                    separator="," placeholder="Add agency, press Enter"
                                    pt={{
                                        input: { className: "w-full px-4" }, // <-- force input width
                                        container: { className: "w-full border border-gray-400" } // ensure container respects parent
                                    }}
                                    className={`w-full ${errors.cooperatingAgencies ? "p-invalid" : ""}`}
                                />
                                )}
                            />
                            {errors.cooperatingAgencies && (
                                <small className="p-error block mt-1">{errors.cooperatingAgencies.message}</small>
                            )}
                        </div>

                        <div>
                            <label className="block mb-2">Duration</label>
                            <InputText
                                {...register("duration", { required: "Required" })}
                                className={`w-full py-1 px-4 border border-gray-400 ${errors.duration ? "p-invalid" : ""}`}
                            />
                            <Err name="duration" />
                        </div>

                        <div>
                            <label className="block mb-2">Proposal Budget</label>
                                <Controller
                                    control={control}
                                    name="proposalBudget"
                                    rules={{
                                    required: "Required",
                                    validate: (v) => (v ?? 0) >= 0 || "Dapat hindi negative.",
                                    }}
                                    render={({ field }) => (
                                    <InputNumber
                                        value={field.value}
                                        onValueChange={(e) => field.onChange(e.value)}
                                        mode="currency"
                                        currency="PHP"
                                        locale="en-PH"
                                        placeholder="0.00"
                                        inputClassName="px-4 py-1 border border-gray-400"
                                        className={`w-full ${errors.proposalBudget ? "p-invalid" : ""}`}
                                    />
                                )}
                            />
                            <Err name="proposalBudget" />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block mb-2">Background Information & Statement of the Problem</label>
                            <InputTextarea rows={5} autoResize {...register("background", { required: "Required" })} className={`w-full py-1 px-4 border border-gray-400 ${errors.background ? "p-invalid" : ""}`} />
                            <Err name="background" />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block mb-2">Overall Goal</label>
                            <InputTextarea rows={4} autoResize {...register("overallGoal", { required: "Required" })} className={`w-full py-1 px-4 border border-gray-400 ${errors.overallGoal ? "p-invalid" : ""}`} />
                            <Err name="overallGoal" />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block mb-2">Scholarly Connection</label>
                            <InputTextarea rows={4} autoResize {...register("scholarlyConnection", { required: "Required" })} className={`w-full py-1 px-4 border border-gray-400 ${errors.scholarlyConnection ? "p-invalid" : ""}`} />
                            <Err name="scholarlyConnection" />
                        </div>
                    </div>
                </Card>

                {/* Component Projects (triplets) */}
                < Fieldset legend="Component Projects">
                    <div className="space-y-8">
                        {componentProjectsFA.fields.map((field, idx) => (
                            <Card key={field.id} className="shadow-1 rounded-xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block mb-2">Component Project Title</label>
                                        <InputText
                                            {...register(`componentProjects.${idx}.componentProjectTitle`, { required: "Required" })}
                                            className={`w-full py-1 px-4 border border-gray-400 ${errors?.componentProjects?.[idx]?.componentProjectTitle ? "p-invalid" : ""}`}
                                        />
                                        {errors?.componentProjects?.[idx]?.componentProjectTitle && (
                                        <small className="p-error block mt-1">Required</small>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block mb-2">Budget</label>
                                        <Controller
                                            control={control}
                                            name={`componentProjects.${idx}.budget`}
                                            rules={{ required: "Required" }}
                                            render={({ field }) => (
                                            <InputNumber
                                                value={field.value}
                                                onValueChange={(e) => field.onChange(e.value)}
                                                mode="currency"
                                                currency="PHP"
                                                locale="en-PH"
                                                placeholder="0.00"
                                                inputClassName="px-4 py-1 border border-gray-400"
                                                className={`w-full ${errors?.componentProjects?.[idx]?.budget ? "p-invalid" : ""}`}
                                            />
                                        )}
                                        />
                                        {errors?.componentProjects?.[idx]?.budget && (
                                        <small className="p-error block mt-1">Required</small>
                                        )}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block mb-2">Outcomes</label>
                                        <InputTextarea rows={3} autoResize {...register(`componentProjects.${idx}.outcomes`, { required: "Required" })} className={`w-full py-1 px-4 border border-gray-400 ${errors?.componentProjects?.[idx]?.outcomes ? "p-invalid" : ""}`} />
                                        {errors?.componentProjects?.[idx]?.outcomes && (
                                        <small className="p-error block mt-1">Required</small>
                                        )}
                                    </div>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                    <Button type="button" icon="pi pi-plus" label="Add" onClick={() => componentProjectsFA.append({ componentProjectTitle: "", outcomes: "", budget: null })} />
                                    {componentProjectsFA.fields.length > 1 && (
                                        <Button type="button" icon="pi pi-trash" label="Remove" severity="danger" onClick={() => componentProjectsFA.remove(idx)} />
                                    )}
                                    </div>
                            </Card>
                        ))}
                    </div>
                </Fieldset>

                {/* Projects (project title / leader / members / objectives) */}
                <Fieldset legend="Projects">
                    <div className="space-y-8">
                        {projectsFA.fields.map((field, idx) => (
                        <Card key={field.id} className="shadow-1 rounded-xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block mb-2">Project Title</label>
                                    <InputText
                                    {...register(`projects.${idx}.projectTitle`, { required: "Required" })}
                                    className={`w-full py-1 px-4 border border-gray-400 ${errors?.projects?.[idx]?.projectTitle ? "p-invalid" : ""}`}
                                    />
                                    {errors?.projects?.[idx]?.projectTitle && (
                                    <small className="p-error block mt-1">Required</small>
                                    )}
                                </div>
                                <div>
                                    <label className="block mb-2">Team Leader</label>
                                    <InputText
                                    {...register(`projects.${idx}.teamLeader`, { required: "Required" })}
                                    className={`w-full py-1 px-4 border border-gray-400 ${errors?.projects?.[idx]?.teamLeader ? "p-invalid" : ""}`}
                                    />
                                    {errors?.projects?.[idx]?.teamLeader && (
                                    <small className="p-error block mt-1">Required</small>
                                    )}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block mb-2">Team Members</label>
                                    <Controller
                                        control={control}
                                        name={`projects.${idx}.teamMembers`}
                                        rules={{ validate: (v) => (v?.length ?? 0) > 0 || "required ng at least 1 member." }}
                                        render={({ field }) => (
                                        <Chips
                                            value={field.value}
                                            onChange={(e) => field.onChange(e.value)}
                                            separator="," placeholder="Type a name, press Enter"
                                            pt={{
                                                input: { className: "w-full px-4" }, // <-- force input width
                                                container: { className: "w-full border border-gray-400" } // ensure container respects parent
                                            }}
                                            className={`w-full ${errors?.projects?.[idx]?.teamMembers ? "p-invalid" : ""}`}
                                        />
                                    )}
                                    />
                                    {errors?.projects?.[idx]?.teamMembers && (
                                    <small className="p-error block mt-1">{errors.projects[idx].teamMembers.message}</small>
                                    )}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block mb-2">Objectives</label>
                                    <InputTextarea rows={4} autoResize {...register(`projects.${idx}.objectives`, { required: "Required" })} className={`w-full py-1 px-4 border border-gray-400 ${errors?.projects?.[idx]?.objectives ? "p-invalid" : ""}`} />
                                    {errors?.projects?.[idx]?.objectives && (
                                    <small className="p-error block mt-1">Required</small>
                                    )}
                                </div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                <Button type="button" icon="pi pi-plus" label="Add" onClick={() => projectsFA.append({ projectTitle: "", teamLeader: "", teamMembers: [], objectives: "" })} />
                                {projectsFA.fields.length > 1 && (
                                    <Button type="button" icon="pi pi-trash" label="Remove" severity="danger" onClick={() => projectsFA.remove(idx)} />
                                )}
                            </div>
                        </Card>
                        ))}
                    </div>
                </Fieldset>

                {/* Activity Plans (activities/outputs/timeline/personnel) */}
                <Fieldset legend="Activity Plans">
                    <div className="space-y-8">
                        {activityPlansFA.fields.map((field, idx) => (
                        <Card key={field.id} className="shadow-1 rounded-xl">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div>
                                    <label className="block mb-2">Activities</label>
                                    <InputText
                                    {...register(`activityPlans.${idx}.activity`, { required: "Required" })}
                                    className={`w-full py-1 px-4 border border-gray-400 ${errors?.activityPlans?.[idx]?.activity ? "p-invalid" : ""}`}
                                    />
                                    {errors?.activityPlans?.[idx]?.activity && (
                                    <small className="p-error block mt-1">Required</small>
                                    )}
                                </div>

                                <div>
                                    <label className="block mb-2">Output</label>
                                    <InputText
                                    {...register(`activityPlans.${idx}.outputs`, { required: "Required" })}
                                    className={`w-full py-1 px-4 border border-gray-400 ${errors?.activityPlans?.[idx]?.outputs ? "p-invalid" : ""}`}
                                    />
                                    {errors?.activityPlans?.[idx]?.outputs && (
                                    <small className="p-error block mt-1">Required</small>
                                    )}
                                </div>

                                <div>
                                    <label className="block mb-2">Timeline (M/D/Y)</label>
                                    <Controller
                                        control={control}
                                        name={`activityPlans.${idx}.timeline`}
                                        rules={{ required: "Required" }}
                                        render={({ field }) => (
                                            <Calendar
                                                value={field.value}
                                                onChange={(e) => field.onChange(e.value)}
                                                dateFormat="mm/dd/yy"
                                                className={`w-full ${errors?.activityPlans?.[idx]?.timeline ? "p-invalid" : ""}`}
                                            />
                                    )}
                                    />
                                    {errors?.activityPlans?.[idx]?.timeline && (
                                    <small className="p-error block mt-1">Required</small>
                                    )}
                                </div>

                                <div>
                                    <label className="block mb-2">Personnel</label>
                                    <InputText
                                    {...register(`activityPlans.${idx}.personnel`, { required: "Required" })}
                                    className={`w-full py-1 px-4 border border-gray-400 ${errors?.activityPlans?.[idx]?.personnel ? "p-invalid" : ""}`}
                                    />
                                    {errors?.activityPlans?.[idx]?.personnel && (
                                    <small className="p-error block mt-1">Required</small>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <Button
                                    type="button"
                                    icon="pi pi-plus"
                                    label="Add"
                                    onClick={() => activityPlansFA.append({ activity: "", outputs: "", timeline: null, personnel: "" })}
                                />
                                {activityPlansFA.fields.length > 1 && (
                                    <Button
                                    type="button"
                                    icon="pi pi-trash"
                                    label="Remove"
                                    severity="danger"
                                    onClick={() => activityPlansFA.remove(idx)}
                                    />
                                )}
                            </div>
                        </Card>
                        ))}
                    </div>
                </Fieldset>

                {/* Contact (nasa dulo) */}
                <Card title="Program Coordinator Contact" className="shadow-2 rounded-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block mb-2">Program Coordinator</label>
                            <InputText
                                placeholder="Coordinator name"
                                {...register("coordinator", { required: "Required" })}
                                className={`w-full py-1 px-4 border border-gray-400 ${errors.coordinator ? "p-invalid" : ""}`}
                            />
                            <Err name="coordinator" />
                        </div>
                        <div>
                            <label className="block mb-2">Mobile Number</label>
                            <InputText
                                keyfilter="int"
                                placeholder="09xxxxxxxxx"
                                {...register("mobileNumber", {
                                required: "Required",
                                pattern: { value: /^\d{10,15}$/g, message: "10-15 digits." },
                                })}
                                className={`w-full py-1 px-4 border border-gray-400 ${errors.mobileNumber ? "p-invalid" : ""}`}
                            />
                            <Err name="mobileNumber" />
                        </div>
                        <div>
                            <label className="block mb-2">Email Address</label>
                            <InputText
                                placeholder="name@example.com"
                                {...register("email", {
                                required: "Required",
                                pattern: {
                                    value: /[^@\s]+@[^@\s]+\.[^@\s]+/,
                                    message: "Invalid email format",
                                },
                                })}
                                className={`w-full py-1 px-4 border border-gray-400 ${errors.email ? "p-invalid" : ""}`}
                            />
                            <Err name="email" />
                        </div>
                    </div>
                </Card>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <Button type="submit" className="text-green-600" icon="pi pi-check" label="Submit" />
                    <Button type="reset" className="text-red-400" icon="pi pi-refresh" label="Reset" severity="secondary" />
                    <PDFDownloadLink
                        document={<ProgramPDF data={watch()} />}
                        fileName={`Program-proposal.pdf`}
                        >
                        {({ loading }) => (
                        <Button className="text-blue-400" type='button' icon='pi pi-download' label={loading ? 'Preparing PDF...' : 'Download PDF'} severity='success' />
                        )}
                    </PDFDownloadLink>
                </div>

                {/* Live JSON preview (for dev/testing) */}
                {/* <Fieldset legend="Preview JSON (dev)">
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded-xl overflow-auto">
                    {JSON.stringify(watch(), null, 2)}
                </pre>
                </Fieldset> */}
            </form>
        </div>
    );
}

