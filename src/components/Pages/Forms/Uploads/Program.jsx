import React, { useEffect, useRef, useState } from "react";
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { useUserStore } from '@_src/store/auth'
import { useLocation } from "react-router-dom"
import { removeForm, uploadForm, getForms } from "@_src/services/event";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import _ from "lodash";

export const Program = () => {
    const location = useLocation()
    const { event } = location.state || {} 
    const { user, token } = useUserStore((state) => ({ user: state.user, token: state.token }));
    const decryptedUser = token && DecryptUser(user)
    const queryClient = useQueryClient()    
    const decryptedToken = token && DecryptString(token)
    const { data: formData, isLoading: formLoading  } = getForms({token: decryptedToken, event: event?.id})


            // fixed rows (you can tweak names/codes)
    const initialForms = [
        { id: "NUB-ACD-CMX-F-001", name: "Project Proposal Format", code: "NUB-ACD-CMX-F-001" },
        { id: "NUB-ACD-CMX-F-004", name: "Checklist of Criteria for Extension Program Proposal", code: "NUB-ACD-CMX-F-004" },
        { id: "NUB-ACD-CMX-F-006", name: "Manifestation of Consent and Cooperation for the Extension Program", code: "NUB-ACD-CMX-F-006" },
        { id: "NUB-ACD-CMX-F-008", name: "Target Group Needs Diagnosis Report Format", code: "NUB-ACD-CMX-F-008" },
        { id: "NUB-ACD-CMX-F-011", name: "Extension Program and Project Itinerary of Travel Format", code: "NUB-ACD-CMX-F-011" },
        { id: "NUB-ACD-CMX-F-012", name: "Minutes of the Meeting Format", code: "NUB-ACD-CMX-F-012" },
        { id: "NUB-ACD-CMX-F-013", name: "List of Attendees, Volunteers, and Donors Format", code: "NUB-ACD-CMX-F-013" },
        { id: "NUB-ACD-CMX-F-014", name: "Post-Activity Report Format", code: "NUB-ACD-CMX-F-014" },
        { id: "NUB-ACD-CMX-F-009", name: "Extension Program Evaluation and Terminal Report Format", code: "NUB-ACD-CMX-F-009" }
    ];

      const [forms, setForms] = useState(
            initialForms.map((form) => ({ ...form, fileName: "", url: "", status: "none" })) // none | pending_review | approved | declined
        );
        const [uploadingRow, setUploadingRow] = useState(null);
        const [removingRow, setRemovingRow] = useState(null);
        const inputsRef = useRef({}); // keyed by row id
    
        const { mutate: handleUploadForm, isLoading: uploadLoading } = useMutation({
                mutationFn: uploadForm,
                    onSuccess: (data, variables) => {
                        queryClient.invalidateQueries({ queryKey: ['upload'] });
                        setForms((prev) =>
                            prev.map((r) => (r.id === variables.code ? { ...r, fileName: _.last(data?.form.name.split(" - ")), url: data?.form.file, status: "pending_review", file_id: data?.form.id } : r))
                        );
                        }, 
                        
                    onError: (error) => {  
                        console.log("@UE:", error)
                    },
        });
    
        const { mutate: handleRemoveUploadedForm, isLoading: removeLoading } = useMutation({
            mutationFn: removeForm,
                onSuccess: (_, variables) => {
                    queryClient.invalidateQueries({ queryKey: ['remove-form'] });
                        setForms((prev) =>
                        prev.map((r) =>
                            r.file_id === variables?.form_id
                            ? { ...r, fileName: "", url: "", status: "none" }
                            : r
                        ));
                }, 
                onError: (error) => {  
                    console.log("@RFE:", error)
                },
        });
    
        const openPicker = (rowId) => inputsRef.current[rowId]?.click();
    
        const onPick = (rowId, e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploadingRow(rowId);
            handleUploadForm(
                {
                token: decryptedToken,
                event_id: event.id,
                name: file.name,
                code: rowId,
                file,
                },
                { onSettled: () => { setUploadingRow(null); e.target.value = ''; } }
            );
        };
        const onDelete = (form_id, rowId) => {  
            setRemovingRow(rowId);
            handleRemoveUploadedForm({
                token: decryptedToken,
                form_id
            }, {
                onSettled: () => setRemovingRow(null) // reset after delete finishes
            })
        };
    
        function statusColor(status) {
            if (status === "approved") return "text-emerald-700";
            if (status === "declined") return "text-rose-700";
            if (status === "pending_review") return "text-amber-600";
            return "text-slate-500";
        }
    
        useEffect(() => {
            if (!formData) return;
            setForms(prev =>
                prev.map(r => {
                const match = _.find(formData?.data, { code: r.id }); // dahil hook now returns res.data
                return match
                    ? {
                        ...r,
                        fileName: _.last(match?.name.split(' - ')),
                        url: match?.file,
                        status: 'pending_review',
                        file_id: match?.id,
                    }
                    : r;
                })
            );
        }, [formData]);
    
        if (formLoading) {
            return (                                   // <-- add return
                <div className="program-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-0 sm:pl-[200px] py-20">
                    Loading forms...
                </div>
            );
        }
    

    return (
        <div className="program-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
            <div className="w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                {/* header */}
                <div className="bg-[#153e6f] px-4 py-3 text-center font-bold text-white">
                    Program Forms
                </div>

                 {/* table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-[#153e6f] text-white">
                                <th className="px-4 py-3 text-left font-semibold">Name of the Form</th>
                                <th className="px-4 py-3 text-left font-semibold">Form Code</th>
                                <th className="px-4 py-3 text-left font-semibold">Form Uploaded File / Upload</th>
                                {[1, 9, 10, 11].includes(decryptedUser?.role_id) && (
                                    <th className="px-4 py-3 text-left font-semibold">Approve / Decline</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-yellow-200/70">
                            {forms.map((form, index) => {
                                const isOdd = index % 2 === 1;
                                const hasFile = !!form.fileName;
                                const disabledActions = !hasFile || form.status === "approved" || form.status === "declined";

                                return (
                                    <tr key={form.id} className={isOdd ? "bg-yellow-50" : ""}>
                                        {/* name */}
                                        <td className="px-4 py-4 align-top">
                                            <div className="max-w-xs">{form.name}</div>
                                        </td>

                                        {/* code */}
                                        <td className="px-4 py-4 align-top text-slate-700">{form.code}</td>

                                        {/* upload cell */}
                                        <td className="px-4 py-4 align-top">
                                        {hasFile ? (
                                            <div className="flex flex-col gap-2">
                                                <div className="font-semibold">
                                                    {form.fileName}{" "}
                                                    <span className={statusColor(form.status)}>
                                                    (
                                                    {form.status === "approved"
                                                        ? "Approved"
                                                        : form.status === "declined"
                                                        ? "Declined"
                                                        : "Pending"}
                                                    )
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => onDelete(form.file_id, form.id)}
                                                        disabled={removeLoading}
                                                        className="inline-flex items-center rounded-md bg-[#013a63] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {removingRow === form.id ? "Removing…" : "Delete"}
                                                    </button>
                                                    {form.url ? (
                                                        <a
                                                            href={form.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                                                        >
                                                            View
                                                        </a>
                                                    ) : null}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openPicker(form.id)}
                                                disabled={uploadLoading || removeLoading}
                                                className="inline-flex items-center rounded-md bg-[#013a63] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
                                            >
                                                    {uploadingRow === form.id
                                                    ? "Uploading…"
                                                    : removingRow === form.id
                                                    ? "Removing…"
                                                    : "Upload"}
                                            </button>
                                            <span className="text-slate-400">No file attached</span>
                                            </div>
                                        )}

                                        <input
                                            ref={(el) => (inputsRef.current[form.id] = el)}
                                            type="file"
                                            accept=".pdf,.png,.jpg,.jpeg"
                                            className="hidden"
                                            onChange={(e) => onPick(form.id, e)}
                                        />
                                        </td>

                                        {/* approve / decline */}
                                        {[1, 9, 10, 11].includes(decryptedUser?.role_id) && (
                                            <td className="px-4 py-4 align-top">
                                                <div className="flex flex-col gap-2">
                                                    <button
                                                    type="button"
                                                    // onClick={() => setDecision(form.id, "approved")}
                                                    disabled={disabledActions}
                                                    className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                    Approve
                                                    </button>
                                                    <button
                                                    type="button"
                                                    // onClick={() => setDecision(form.id, "declined")}
                                                    disabled={disabledActions}
                                                    className="inline-flex items-center justify-center rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                    Decline
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
