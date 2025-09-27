import { DecryptString, DecryptUser, ProjectPhases, SetFormCodeNavigate, 
} from "@_src/utils/helpers";
import { useUserStore } from '@_src/store/auth'
import { useLocation, useNavigate } from "react-router-dom"
import { 
    Controller 
} from "react-hook-form";
import { Dialog } from 'primereact/dialog';
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { Instruction } from "@_src/components/Partial/Instruction";
import { Tooltip } from "primereact/tooltip";
import _ from "lodash";


export const UpdatedProject = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { event } = location.state || {} 
    const { user, token } = useUserStore((state) => ({ user: state.user, token: state.token }));
    const decryptedUser = token && DecryptUser(user)
    
    const eventOwnerId =
    event?.created_by ??
    event?.user_id ??
    event?.owner_id ??
    event?.author_id ??
    null;

    const isEventOwner = !!decryptedUser?.id && decryptedUser.id === eventOwnerId;



    // fixed rows (you can tweak names/codes)
    const forms = [
        { id: "NUB-ACD-CMX-F-002", name: "Project Proposal Format", code: "NUB-ACD-CMX-F-002", formKey: 'form2' },
        { id: "NUB-ACD-CMX-F-005", name: "Checklist of Criteria for Project Proposal", code: "NUB-ACD-CMX-F-005", formKey: 'form5' },
        { id: "NUB-ACD-CMX-F-007", name: "Manifestation of Consent and Cooperation for the Outreach Project", code: "NUB-ACD-CMX-F-007", formKey: 'form7' },
        { id: "NUB-ACD-CMX-F-008", name: "Target Group Needs Diagnosis Report Format", code: "NUB-ACD-CMX-F-008", formKey: 'form8' },
        { id: "NUB-ACD-CMX-F-011", name: "Extension Program and Project Itinerary of Travel Format", code: "NUB-ACD-CMX-F-011", formKey: 'form11' },
        { id: "NUB-ACD-CMX-F-012", name: "Minutes of the Meeting Format", code: "NUB-ACD-CMX-F-012", formKey: 'form12' },
        { id: "NUB-ACD-CMX-F-013", name: "List of Attendees, Volunteers, and Donors Format", code: "NUB-ACD-CMX-F-013", formKey: 'form13' },
        { id: "NUB-ACD-CMX-F-010", name: "Outreach Project Evaluation and Documentation Report Format", code: "NUB-ACD-CMX-F-010", formKey: 'form10' }
    ];
        
    // 2) Small helpers.
    const hasSubmission = (event, key) =>  Array.isArray(event?.[key]) && event[key].length > 0;
            
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
                            {forms.map((form, index) => {
                                const isOdd = index % 2 === 1;
                                const showView = hasSubmission(event, form.formKey); // <— THIS is the toggle

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
                                                        return (
                                                            <>
                                                                {showView ? (
                                                                    <button
                                                                            onClick={() => navigate(`/event/form/detail/${SetFormCodeNavigate(form.id)}`, 
                                                                                {
                                                                                    state: {
                                                                                        event: event,
                                                                                        owner: event?.user,
                                                                                        data: event?.[form.formKey] ?? [], // ← dito papasok ang event.form3, form5, etc.
                                                                                    }
                                                                                }            
                                                                            )}
                                                                            type="button"
                                                                        className="inline-flex items-center rounded-md bg-[#013a63] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                                                                    >
                                                                        View
                                                                    </button>
                                                                    ) : (   
                                                                    <span className="text-slate-400">No forms yet</span>
                                                                )}
                                                            </>
                                                        )
                                                    }

                                                    return (
                                                    <>
                                                    {showView ? (
                                                        <button
                                                            onClick={() => navigate(`/event/form/detail/${SetFormCodeNavigate(form.id)}`, 
                                                                {
                                                                    state: {
                                                                        event: event,
                                                                        owner: event?.user,
                                                                        data: event?.[form.formKey] ?? [], // ← dito papasok ang event.form3, form5, etc.
                                                                    }
                                                                }
                                                            )}
                                                            type="button"
                                                            className="inline-flex items-center rounded-md bg-[#013a63] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            View
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => navigate(`/event/form/${SetFormCodeNavigate(form.id)}`, { state: { event: event } })}
                                                            type="button"
                                                            className="inline-flex items-center rounded-md bg-[#013a63] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            Fill up
                                                        </button>
                                                    )}
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
