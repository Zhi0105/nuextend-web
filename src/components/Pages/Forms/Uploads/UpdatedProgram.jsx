// import React, { useEffect, useRef, useState } from "react";
import { DecryptString, DecryptUser, ProgramPhases, SetFormCodeNavigate, 
    // getRequiredApprovals 
} from "@_src/utils/helpers";
import { useUserStore } from '@_src/store/auth'
import { useLocation, useNavigate } from "react-router-dom"
// import { removeForm, uploadForm, getForms } from "@_src/services/event";
// import { useQueryClient, useMutation } from "@tanstack/react-query";
// import { approveForm, rejectForm } from "@_src/services/form";
import { 
    // useForm, 
    Controller 
} from "react-hook-form";
// import { toast } from "react-toastify"
import { Dialog } from 'primereact/dialog'; 
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { Instruction } from "@_src/components/Partial/Instruction";
import { Tooltip } from "primereact/tooltip";
import _ from "lodash";

export const UpdatedProgram = () => {
        const location = useLocation()
        const navigate = useNavigate()
        const { event } = location.state || {} 
        const { user, token } = useUserStore((state) => ({ user: state.user, token: state.token }));
        const decryptedUser = token && DecryptUser(user)
        // const queryClient = useQueryClient()    
        // const decryptedToken = token && DecryptString(token)
        
        const eventOwnerId =
        event?.created_by ??
        event?.user_id ??
        event?.owner_id ??
        event?.author_id ??
        null;
    
        const isEventOwner = !!decryptedUser?.id && decryptedUser.id === eventOwnerId;
    
        // const { data: formData, isLoading: formLoading  } = getForms({token: decryptedToken, event: event.id})
    
    
        // fixed rows (you can tweak names/codes)
        const initialForms = [
            { id: "NUB-ACD-CMX-F-001", name: "Program Proposal Format", code: "NUB-ACD-CMX-F-001" },
            { id: "NUB-ACD-CMX-F-004", name: "Checklist of Criteria for Extension Program Proposal", code: "NUB-ACD-CMX-F-004" },
            { id: "NUB-ACD-CMX-F-006", name: "Manifestation of Consent and Cooperation for the Extension Program", code: "NUB-ACD-CMX-F-006" },
            { id: "NUB-ACD-CMX-F-008", name: "Target Group Needs Diagnosis Report Format", code: "NUB-ACD-CMX-F-008" },
            { id: "NUB-ACD-CMX-F-011", name: "Extension Program and Project Itinerary of Travel Format", code: "NUB-ACD-CMX-F-011" },
            { id: "NUB-ACD-CMX-F-012", name: "Minutes of the Meeting Format", code: "NUB-ACD-CMX-F-012" },
            { id: "NUB-ACD-CMX-F-013", name: "List of Attendees, Volunteers, and Donors Format", code: "NUB-ACD-CMX-F-013" },
            // { id: "NUB-ACD-CMX-F-014", name: "Post-Activity Report Format", code: "NUB-ACD-CMX-F-014" },
            { id: "NUB-ACD-CMX-F-009", name: "Extension Program Evaluation and Terminal Report Format", code: "NUB-ACD-CMX-F-009" }
        ];

    

    return (
        <div className="program-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
            <div className="w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    {/* INSTRUCTIONS */}
                    <div className="mb-5">
                        <Instruction model_id={event?.model_id} />
                    </div>
                    {/* header */}
                    <div className="bg-[#153e6f] px-4 py-3 text-center font-bold text-white">
                        Program Forms
                    </div>

                    {/* table */}
                    <div className="overflow-x-auto">
                        {/* <Tooltip target=".status-has-tooltip" position="right" /> */}
                        <table className="min-w-full text-sm">
                            <thead>
                            <tr className="bg-[#153e6f] text-white">
                                <th className="px-4 py-3 text-left font-semibold">Name of the Form</th>
                                <th className="px-4 py-3 text-left font-semibold">Form Code</th>
                                <th className="px-4 py-3 text-left font-semibold">Fill up forms</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-yellow-200/70">
                                {initialForms.map((form, index) => {
                                    const isOdd = index % 2 === 1;
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
                                        
                                                <div className="flex items-center gap-2">
                                                    {(() => {
    
                                                        if (!isEventOwner) {
                                                            // non-owners see a passive state only
                                                            return <span className="text-slate-400">View</span>;
                                                        }
    
                                                        return (
                                                        <>
                                                            <button
                                                                onClick={() => navigate(`/event/form/${SetFormCodeNavigate(form.id)}`)}
                                                                type="button"
                                                                className="inline-flex items-center rounded-md bg-[#013a63] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                                                            >
                                                                Fill up
                                                            </button>
                                                        </>
                                                        );
                                                    })()}
                                                </div>
                                            </td>
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
