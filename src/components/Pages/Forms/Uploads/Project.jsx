import React, { useEffect, useRef, useState } from "react";
import { DecryptString, DecryptUser, ProjectPhases } from "@_src/utils/helpers";
import { useUserStore } from '@_src/store/auth'
import { useLocation } from "react-router-dom"
import { removeForm, uploadForm, getForms } from "@_src/services/event";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { approveForm, rejectForm } from "@_src/services/form";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify"
import { Dialog } from 'primereact/dialog';
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { Instruction } from "@_src/components/Partial/Instruction";
import _ from "lodash";

export const Project = () => {
    const location = useLocation()
    const { event } = location.state || {} 
    const { user, token } = useUserStore((state) => ({ user: state.user, token: state.token }));
    const decryptedUser = token && DecryptUser(user)
    const queryClient = useQueryClient()    
    const decryptedToken = token && DecryptString(token)
    const { data: formData, isLoading: formLoading  } = getForms({token: decryptedToken, event: event?.id})

        // fixed rows (you can tweak names/codes)
    const initialForms = [
        { id: "NUB-ACD-CMX-F-002", name: "Project Proposal Format", code: "NUB-ACD-CMX-F-002" },
        { id: "NUB-ACD-CMX-F-005", name: "Checklist of Criteria for Project Proposal", code: "NUB-ACD-CMX-F-005" },
        { id: "NUB-ACD-CMX-F-007", name: "Manifestation of Consent and Cooperation for the Outreach Project", code: "NUB-ACD-CMX-F-007" },
        { id: "NUB-ACD-CMX-F-008", name: "Target Group Needs Diagnosis Report Format", code: "NUB-ACD-CMX-F-008" },
        { id: "NUB-ACD-CMX-F-011", name: "Extension Program and Project Itinerary of Travel Format", code: "NUB-ACD-CMX-F-011" },
        { id: "NUB-ACD-CMX-F-012", name: "Minutes of the Meeting Format", code: "NUB-ACD-CMX-F-012" },
        { id: "NUB-ACD-CMX-F-013", name: "List of Attendees, Volunteers, and Donors Format", code: "NUB-ACD-CMX-F-013" },
        { id: "NUB-ACD-CMX-F-014", name: "Post-Activity Report Format", code: "NUB-ACD-CMX-F-014" },
        { id: "NUB-ACD-CMX-F-010", name: "Outreach Project Evaluation and Documentation Report Format", code: "NUB-ACD-CMX-F-010" }
    ];

    const [forms, setForms] = useState(
        initialForms.map((form) => ({ ...form, fileName: "", url: "", status: "none", approvalsCount: 0 })) // none | pending_review | approved | declined
    );
    const [uploadingRow, setUploadingRow] = useState(null);
    const [removingRow, setRemovingRow] = useState(null);
    const inputsRef = useRef({}); // keyed by row id
    const [visibleRow, setVisibleRow] = useState(null);

    const { mutate: handleUploadForm, isLoading: uploadLoading } = useMutation({
        mutationFn: uploadForm,
            onSuccess: (data, variables) => {
                queryClient.invalidateQueries({ queryKey: ['forms', variables.event_id] });
                setForms((prev) =>
                    prev.map((r) => (r.id === variables.code ? {
                        ...r, 
                        fileName: _.last(data?.form.name.split(" - ")), 
                        url: data?.form.file, status: "pending_review", 
                        approvalsCount: 0,
                        file_id: data?.form.id 
                    } : r))
                );
                }, 
                
            onError: (error) => {  
                console.log("@UE:", error)
            },
    });
    const { mutate: handleRemoveUploadedForm, isLoading: removeLoading } = useMutation({
        mutationFn: removeForm,
            onSuccess: (_, variables) => {
                queryClient.invalidateQueries({ queryKey: ['forms', event.id] });
                    setForms((prev) =>
                    prev.map((r) =>
                        r.file_id === variables?.form_id
                        ? { ...r, fileName: "", url: "", status: "none", approvalsCount: 0 }
                        : r
                    ));
            }, 
            onError: (error) => {  
                console.log("@RFE:", error)
            },
    });
    const { mutate: handleAcceptForm, isLoading: approveFormLoading } = useMutation({
        mutationFn: approveForm,

        // 1) Optimistic update para responsive agad yung UI
        onMutate: async (variables) => {
            // stop outgoing refetches para di mag-race
            await queryClient.cancelQueries({ queryKey: ['forms', event.id] });

            // optimistic local state: +1 approvalsCount; status -> approved if 4/4
            setForms((prev) =>
            prev.map((r) => {
                if (r.id !== variables.code) return r;
                const nextCount = Math.min(4, (r.approvalsCount || 0) + 1);
                return {
                ...r,
                approvalsCount: nextCount,
                status: nextCount === 4 ? 'approved' : 'pending_review',
                };
            })
            );
        },

        // 2) Success toast lang; di natin babaguhin ulit local state dito
        onSuccess: (data /*, variables*/) => {
            toast(data.message, { type: "success" });
        },

        // 3) Kung may error, simple refetch para ma-rollback ang optimistic UI
        onError: (error) => {
            console.log("@AFE:", error);
            // rollback by refetching from server truth
            queryClient.invalidateQueries({ queryKey: ['forms', event.id] });
            toast("Failed to approve. Please try again.", { type: "error" });
        },

        // 4) Laging i-sync back sa server
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['forms', event.id] });
        },
    });
    const { mutate: handleRejectForm, isLoading: rejectFormLoading } = useMutation({
        mutationFn: rejectForm,

        // optimistic update para agad makita sa UI na "Declined"
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: ['forms', event.id] });

            // snapshot for rollback
            const previousForms = forms;

            // close the dialog agad para snappy
            setVisibleRow(null);

            // apply optimistic decline
            setForms((prev) =>
            prev.map((r) =>
                r.code === variables.code
                ? { ...r, status: 'declined', approvalsCount: r.approvalsCount ?? 0 }
                : r
            )
            );

            // pass context for rollback on error
            return { previousForms };
        },

        onSuccess: (data) => {
            toast(data.message, { type: "success" });
        },

        // rollback kapag pumalya
        onError: (error, _vars, context) => {
            console.log("@RFE:", error);
            if (context?.previousForms) setForms(context.previousForms);
            toast("Failed to decline. Please try again.", { type: "error" });
        },

        // sync back to server truth
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['forms', event.id] });
        },
    });

    const acceptForm = (form) => {
        handleAcceptForm({
            token: decryptedToken,
            id: form?.file_id,
            role_id: decryptedUser?.role_id,
            code: form.code, // para mahanap natin sa local state onSuccess
        });
    }
    const RejectDialog = ({ rowData }) => {
        const { handleSubmit, control, formState: { errors }} = useForm({
            defaultValues: {
                remarks: ""
            },
        });
        const onSubmit = (data) => {
            const remarksKeyByRole = {
                1: "commex_remarks",
                9: 'dean_remarks',
                10: 'asd_remarks',
                11: 'ad_remarks'
            };

            const remarksKey = remarksKeyByRole[decryptedUser?.role_id];

            if (remarksKey) {
                handleRejectForm({
                    token: decryptedToken,
                    id: rowData?.file_id,
                    role_id: decryptedUser?.role_id,
                    code: rowData?.code,     
                    [remarksKey]: data?.remarks
                });
            }
        };

        return (
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-transparent flex flex-col gap-4 w-full my-8"
            >
                <div className="remarks">
                    <Controller
                        control={control}
                        rules={{
                        required: true,
                        }}
                        render={({ field: { onChange, value } }) => (
                            <InputTextarea
                                className={`${errors.remarks && 'border border-red-500'} bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                                name="description"
                                value={value} 
                                onChange={onChange}
                                rows={4}
                                placeholder="Enter your remarks here"
                            />
                        )}
                        name="remarks"
                    />
                    {errors.remarks && (
                        <p className="text-sm italic mt-1 text-red-400 indent-2">
                            remarks is required.*
                        </p>
                    )}
                </div>
                <Button
                    type="submit"
                    disabled={rejectFormLoading}
                    className="bg-[#2211cc] text-[#c7c430]  flex justify-center text-center font-bold rounded-lg p-2"
                >
                    Submit
                </Button>
            </form>
        )
    }
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

          // ------- STATUS HELPERS -------
    const deriveStatusFromMatch = (match) => {
        const approvalsCount =
        Number(!!match?.is_commex) +
        Number(!!match?.is_ad) +
        Number(!!match?.is_asd) +
        Number(!!match?.is_dean);

        const hasAnyRemarks =
        (match?.ad_remarks?.length || 0) > 0 ||
        (match?.asd_remarks?.length || 0) > 0 ||
        (match?.commex_remarks?.length || 0) > 0 ||
        (match?.dean_remarks?.length || 0) > 0;

        let status = "pending_review";
        if (hasAnyRemarks) status = "declined";
        else if (approvalsCount === 4) status = "approved";

        return { status, approvalsCount };
    };
    const displayStatusText = (status, approvalsCount, hasFile) => {
        if (!hasFile) return "No file";
        if (status === "declined") return "Declined";
        if (status === "approved") return "Approved";
        if (approvalsCount > 0 && approvalsCount < 4) return `Approved ${approvalsCount}/4`;
        return "Pending";
    };
        /* --- helpers --- */
    function statusColor(status) {
        if (status === "approved") return "text-emerald-700";
        if (status === "declined") return "text-rose-700";
        if (status === "pending_review") return "text-amber-600";
        return "text-slate-500";
    }

    // UPLOADING STEP LOGIC START
    const handleGetPhaseId = (id) => {
        for (const p in ProjectPhases) {
            if (ProjectPhases[p].includes(id)) return Number(p);
        }
        return 1;
    }
    const handleIfAllApproved = (ids, formsState) => {
        return ids.every((fid) => {
            const f = formsState.find((x) => x.id === fid);
            return f && f.status === "approved";
        });
    }
    const getPhaseUnlockStatus = (formRow, formsState) => {
        const phase = handleGetPhaseId(formRow.id);
        const p1Done = handleIfAllApproved(ProjectPhases[1], formsState);
        const p2Done = handleIfAllApproved(ProjectPhases[2], formsState);

        if (phase === 1) return { unlocked: true };

        if (phase === 2) {
            if (!p1Done) return { unlocked: false };
            return { unlocked: true };
        }

        // phase === 3
        if (!p1Done) return { unlocked: false };
        if (!p2Done) return { unlocked: false };
        return { unlocked: true };
    }
    // UPLOADING STEP LOGIC END


    useEffect(() => {
        if (!formData) return;
        setForms(prev =>
            prev.map(r => {
            const match = _.find(formData?.data, { code: r.id }); // dahil hook now returns res.data
            if (!match) return r;

            const { status, approvalsCount } = deriveStatusFromMatch(match);
            return  {
                    ...r,
                    fileName: _.last(match?.name.split(' - ')),
                    url: match?.file,
                    status,
                    approvalsCount,
                    file_id: match?.id,
                }
            })
        );
    }, [formData])

    if (formLoading) {
        return (                                   // <-- add return
            <div className="project-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-0 sm:pl-[200px] py-20">
                Loading forms...
            </div>
        );
    }

    return (
        <div className="project-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
            <div className="w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                {/* INSTRUCTIONS */}
                <div className="mb-5">
                    <Instruction model_id={event?.model_id} />
                </div>
                {/* header */}
                <div className="bg-[#153e6f] px-4 py-3 text-center font-bold text-white">
                    Project Forms
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
                                const disabledActions = !hasFile || form.status === "declined" || form.approvalsCount === 4;
                                const label = displayStatusText(form.status, form.approvalsCount, hasFile);
                                const colorClass = statusColor(form.status, form.approvalsCount, hasFile);


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
                                                    <span className={colorClass}>
                                                        {label}
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
                                                {(() => {
                                                    const { unlocked } = getPhaseUnlockStatus(form, forms);
                                                    const uploadDisabled = uploadLoading || removeLoading || !unlocked;

                                                    return (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => openPicker(form.id)}
                                                            disabled={uploadDisabled}
                                                            className="inline-flex items-center rounded-md bg-[#013a63] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                        {uploadingRow === form.id
                                                            ? "Uploading…"
                                                            : removingRow === form.id
                                                            ? "Removing…"
                                                            : unlocked
                                                            ? "Upload"
                                                            : "Locked"}
                                                        </button>
                                                        <span className="text-slate-400">
                                                            No file attached
                                                        </span>
                                                    </>
                                                    );
                                                })()}
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
                                                    onClick={() => acceptForm(form)}
                                                    disabled={disabledActions || approveFormLoading}
                                                    className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                    Approve
                                                    </button>
                                                    <button
                                                    type="button"
                                                    onClick={() => setVisibleRow(form)} // store full form row data
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
                    <Dialog
                        header="Remarks"
                        visible={!!visibleRow}
                        style={{ width: '50vw' }}
                        onHide={() => setVisibleRow(null)}
                        modal={false} // wala nang dark overlay
                    >
                        {visibleRow && <RejectDialog rowData={visibleRow} />}
                    </Dialog> 
                </div>
            </div>
        </div>
    )
}
