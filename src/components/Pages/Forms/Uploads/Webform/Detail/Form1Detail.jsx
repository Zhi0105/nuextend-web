import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "@_src/store/auth";
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveForm1, rejectForm1 } from "@_src/services/formservice";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { downloadForm1Pdf } from "@_src/utils/pdf/form1Pdf";
import { checkApprovalProcess } from "@_src/utils/approval";
import { getFormNumber } from "@_src/utils/approval";


export const Form1Detail = () => {
  const { state, pathname } = useLocation();
  const navigate = useNavigate();
  const { event, owner, data: initialData } = state || {};

  const queryClient = useQueryClient();
  const { user, token } = useUserStore((s) => ({ user: s.user, token: s.token }));
  const decryptedUser = token && DecryptUser(user);
  const decryptedToken = token && DecryptString(token);

  const [form1, setForm1] = useState(initialData || null);

  const approvalCheck = checkApprovalProcess(getFormNumber(pathname), decryptedUser?.role_id, [ form1[0]?.is_dean && 9, form1[0]?.is_commex && 1, form1[0]?.is_asd && 10, form1[0]?.is_ad && 11, ].filter(Boolean), (owner?.role_id === 1 || owner?.role_id === 4), (owner?.role_id === 4))
  const isApprovalCheckPass = approvalCheck?.included && [...approvalCheck.nextApprover].includes(decryptedUser?.role_id)

  const roleId = decryptedUser?.role_id;
  const isApprover = useMemo(() => [1, 9, 10, 11].includes(roleId), [roleId]);
  const hasUserRoleApproved = (row) => {
    if (!row) return false;
    switch (roleId) {
      case 1:
        return !!row.is_commex;
      case 9:
        return !!row.is_dean;
      case 10:
        return !!row.is_asd;
      case 11:
        return !!row.is_ad;
      default:
        return false;
    }
  };

  const canAction = useMemo(() => {
    if (!form1) return false;
    if (!isApprover) return false;
    if (hasUserRoleApproved(form1[0])) return false;
    if (form1.status === "approved") return false;
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form1, isApprover]);

const canDownloadPdf = useMemo(() => {
  if (!form1) return false;
  
  const formData = form1[0];
  
  // For ComEx (roleId 1) and role 4 - need 3 approvals (excluding dean)
  if ([1, 4].includes(roleId)) {
    return formData?.commex_approved_by && formData?.asd_approved_by && formData?.ad_approved_by;
  }
  
  // For role 3 - need dean approval AND the other 3 approvers
  if (roleId === 3) {
    return formData?.dean_approved_by && formData?.commex_approved_by && formData?.asd_approved_by && formData?.ad_approved_by;
  }
  
  return false;
}, [form1, roleId]);

  // Approve
  const { mutate: doApprove, isLoading: approveLoading } = useMutation({
    mutationFn: (vars) => approveForm1(vars),
    onSuccess: (res) => {
      toast(res?.message || "Approved", { type: "success" });
      setForm1((prev) => {
        if (!prev) return prev;
        return [
          {
            ...prev[0],
            is_commex: roleId === 1 ? true : prev[0].is_commex,
            is_dean: roleId === 9 ? true : prev[0].is_dean,
            is_asd: roleId === 10 ? true : prev[0].is_asd,
            is_ad: roleId === 11 ? true : prev[0].is_ad,
          },
        ];
      });
    },
    onError: () => toast("Failed to approve. Please try again.", { type: "error" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["outreach"] }),
  });

  const onApprove = () => {
    if (!form1 || !canAction) return;
    doApprove({ token: decryptedToken, id: form1[0].id, role_id: roleId });
    navigate("/event/view");
  };

  // Revise
  const [showRevise, setShowRevise] = useState(false);
  
  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({ defaultValues: { remarks: "" } });

  const { mutate: doReject, isLoading: rejectLoading } = useMutation({
    mutationFn: (vars) => rejectForm1(vars),
    onSuccess: (res) => {
      toast(res?.message || "Sent for revision", { type: "success" });
      reset({ remarks: "" });
    },
    onError: () => toast("Failed to submit revision request. Please try again.", { type: "error" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["outreach"] }),
  });

  const onSubmitRevise = ({ remarks }) => {
    if (!form1 || !canAction) return;
    
    doReject({ 
      token: decryptedToken, 
      id: form1[0].id, 
      role_id: roleId,  
      remark: remarks  // ✅ Unified 'remark' field
    });
    setShowRevise(false);
    navigate("/event/view");
  };

  const isEventOwner = !!decryptedUser?.id && decryptedUser.id === owner?.id;
  const [remarksModal, setRemarksModal] = useState({
    show: false,
    remarks: '',
    approver: ''
  });

  const handleViewRemarks = () => {
    if (!event?.form_remarks) {
      toast("No remarks found", { type: "info" });
      return;
    }

    // Filter remarks for this specific form3 and sort by newest first
    const form3Remarks = event.form_remarks
      .filter(remark => 
        remark.form_type === 'form1' && 
        remark.form_id === form1[0]?.id
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Newest first

    setRemarksModal({ 
      show: true, 
      remarks: form3Remarks,
      approver: 'All Remarks' 
    });
  };

  const getRoleName = (roleId) => {
    const roleMap = {
      1: 'ComEx',
      9: 'Dean', 
      10: 'Academic Services Director',
      11: 'Academic Director'
    };
    return roleMap[roleId] || 'Unknown Role';
  };

 
  if (!form1) return null;

     const isFullyApproved = useMemo(() => {
    if (!form1 || !form1[0]) return false;
    
    const formData = form1[0];
    
    // For role 1 (ComEx), need 3 approvers (excluding dean)
    if (owner?.role_id === 1) {
      return formData.commex_approved_by && 
            formData.asd_approved_by && 
            formData.ad_approved_by;
    }
    
    // For roles 3 (student) and 4 (faculty), need all 4 approvers
    if ([3, 4].includes(owner?.role_id)) {
      return formData.dean_approved_by && 
            formData.commex_approved_by && 
            formData.asd_approved_by && 
            formData.ad_approved_by;
    }
    
    return false;
  }, [form1, owner?.role_id]);

  return (
    <div className="project-detail-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
      <div  className="w-full max-w-5xl bg-white shadow rounded-lg p-6 my-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Program Proposal</h2>

        <h2 className="text-1xl font-bold text-gray-800 mb-6">I. PROGRAM DESCRIPTION:</h2>
        {/* A. Title */}
        <div className="mb-6">
          <p className="font-semibold text-gray-600">A. Title</p>
          <p>{event?.eventName || "—"}</p>
        </div>

        {/* B. Implementer */}
        <div className="mb-6">
          <p className="font-semibold text-gray-600">B. Implementer</p>
          <p>{event?.organization?.name || "—"}</p>
        </div>

        {/* C. Extension Program Management Team */}
        <div className="mt-8">
          <p className="font-semibold text-gray-600">C. Extension Program Management Team</p>

          {/* 1. Coordinator */}
          <div className="ml-4 mt-2">
            <p className="font-semibold text-gray-600">1. Program Coordinator</p>
            <p>
              {event?.user?.firstname} {event?.user?.middlename} {event?.user?.lastname}
            </p>
          </div>

          {/* 2. Members */}
          <div className="ml-4 mt-4">
            <p className="font-semibold text-gray-600">2. Program Team Members</p>
            <ul className="list-disc ml-6">
              {form1[0]?.team_members?.length > 0 ? (
                form1[0].team_members.map((m) => <li key={m.id}>{m.name}</li>)
              ) : (
                <li>No team members</li>
              )}
            </ul>
          </div>
        </div>

        {/* D. Target Group */}
        <div className="mb-6">
          <p className="font-semibold text-gray-600">D. Target Group</p>
          <p>{event?.target_group || "—"}</p>
        </div>

        <h3 className="mt-6 font-semibold text-gray-700">E. Cooperating Agencies</h3>
        <ul className="list-disc ml-6">
          {form1[0]?.cooperating_agencies?.length > 0 ? (
            form1[0].cooperating_agencies.map((a) => <li key={a.id}>{a.name}</li>)
          ) : (
            <li>No agencies</li>
          )}
        </ul>

        <div className="mb-6">
          <p className="font-semibold text-gray-600">F. Duration:</p>
          <p>{form1[0]?.duration || "—"}</p>
        </div>

        {/* G. Budget */}
        <div className="mb-6">
          <p className="font-semibold text-gray-600">G. Proposed Budget</p>
          <p>₱ {event?.budget_proposal?.toLocaleString() || "0.00"}</p>
        </div>

        <h2 className="text-1xl font-bold text-gray-800 mb-6">II. PROGRAM DETAILS:</h2>
        <div className="mb-6">
          <p className="font-semibold text-gray-600">A. Background:</p>
          <p className="break-words whitespace-normal">{form1[0]?.background || "—"}</p>
        </div>

        <div className="mb-6">
          <p className="font-semibold text-gray-600">B. Overall Goal:</p>
          <p className="break-words whitespace-normal">{form1[0]?.overall_goal || "—"}</p>
        </div>

       {/* C. Component Projects */}
        <div className="mb-6">
          <p className="font-semibold text-gray-600">C. Component Projects, Outcomes, and Budget</p>
        </div>
        <table className="w-full border mt-2 table-fixed">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 w-1/4 break-words whitespace-normal">Title</th>
              <th className="border p-2 w-2/4 break-words whitespace-normal">Outcomes</th>
              <th className="border p-2 w-1/4 break-words whitespace-normal">Budget</th>
            </tr>
          </thead>
          <tbody>
            {form1[0]?.component_projects?.length > 0 ? (
              form1[0].component_projects.map((c) => (
                <tr key={c.id}>
                  <td className="border p-2 break-words whitespace-normal">{c.title}</td>
                  <td className="border p-2 break-words whitespace-normal">{c.outcomes}</td>
                  <td className="border p-2 break-words whitespace-normal">₱ {c.budget}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="border p-2 italic text-gray-500 text-center">
                  No component projects
                </td>
              </tr>
            )}
          </tbody>
        </table>


        <div className="mb-6">
          <p className="font-semibold text-gray-600">Scholarly Connection:</p>
          <p>{form1[0]?.scholarly_connection || "—"}</p>
        </div>

        <h2 className="text-1xl font-bold text-gray-800 mb-6">III. PROJECT DETAILS:</h2>
        <h3 className="mt-6 font-semibold text-gray-700">I. Projects</h3>
        {form1[0]?.projects?.length > 0 ? (
          form1[0].projects.map((p) => (
            <div key={p.id} className="border p-3 rounded mb-4">
              <p><b className="font-semibold text-gray-600">Title:</b> {p.title}</p>
              <p><b className="font-semibold text-gray-600">Team Leader:</b> {p.teamLeader}</p>
              <p><b className="font-semibold text-gray-600">Objectives:</b></p>
              <p className="break-words whitespace-normal">{p.objectives || "—"}</p>

              {/* Project Team Members */}
              <h4 className="font-semibold text-gray-600">Project Team Members</h4>
              <ul className="list-disc ml-6">
                {p.team_members?.length > 0 ? (
                  p.team_members.map((tm) => <li key={tm.id}>{tm.name}</li>)
                ) : (
                  <li>No team members</li>
                )}
              </ul>

              {/* Budget Summary */}
              <h4 className="font-semibold text-gray-600">Budget Summary</h4>
              <table className="w-full border mt-2">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Activities</th>
                    <th className="border p-2">Outputs</th>
                    <th className="border p-2">Timeline</th>
                    <th className="border p-2">Personnel</th>
                    <th className="border p-2">Budget</th>
                  </tr>
                </thead>
                <tbody>
                  {p.budget_summaries?.length > 0 ? (
                    p.budget_summaries.map((b) => (
                      <tr key={b.id}>
                        <td className="border p-2">{b.activities}</td>
                        <td className="border p-2">{b.outputs}</td>
                        <td className="border p-2">{b.timeline}</td>
                        <td className="border p-2">{b.personnel}</td>
                        <td className="border p-2">₱ {b.budget}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="border p-2 italic text-gray-500">
                        No budget entries
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ))
        ) : (
          <p>No projects</p>
        )}
      </div>

    {/* Consent Section */}
      <div className="w-full max-w-5xl mt-6">
        <table className="w-full border border-collapse">
          <thead>
            <tr>
              {(owner?.role_id === 3 || owner?.role_id === 4) && <th className="border p-2 text-center">Dean</th>}
              <th className="border p-2 text-center">ComEx</th>
              <th className="border p-2 text-center">Academic Services Director</th>
              <th className="border p-2 text-center">Academic Director</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* Dean Column */}
              {(owner?.role_id === 3 || owner?.role_id === 4) && (
                <td className="border p-6 text-center align-bottom h-32">
                  {form1[0]?.dean_approved_by ? (
                    <div className="flex flex-col justify-end h-full">
                      <p className="font-semibold text-green-600 mb-2">Approved</p>
                      <p className="font-medium">
                        {form1[0]?.dean_approver?.firstname}{" "}
                        {form1[0]?.dean_approver?.lastname}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(form1[0]?.dean_approve_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <p className="italic text-gray-500 mb-2">Awaiting Approval</p>
                    </div>
                  )}
                </td>
              )}

              {/* ComEx Column */}
              <td className="border p-6 text-center align-bottom h-32">
                {form1[0]?.commex_approved_by ? (
                  <div className="flex flex-col justify-end h-full">
                    <p className="font-semibold text-green-600 mb-2">Approved</p>
                    <p className="font-medium">
                      {form1[0]?.commex_approver?.firstname}{" "}
                      {form1[0]?.commex_approver?.lastname}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(form1[0]?.commex_approve_date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <p className="italic text-gray-500 mb-2">Awaiting Approval</p>
                  </div>
                )}
              </td>

              {/* ASD Column */}
              <td className="border p-6 text-center align-bottom h-32">
                {form1[0]?.asd_approved_by ? (
                  <div className="flex flex-col justify-end h-full">
                    <p className="font-semibold text-green-600 mb-2">Approved</p>
                    <p className="font-medium">
                      {form1[0]?.asd_approver?.firstname}{" "}
                      {form1[0]?.asd_approver?.lastname}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(form1[0]?.asd_approve_date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <p className="italic text-gray-500 mb-2">Awaiting Approval</p>
                  </div>
                )}
              </td>

              {/* AD Column */}
              <td className="border p-6 text-center align-bottom h-32">
                {form1[0]?.ad_approved_by ? (
                  <div className="flex flex-col justify-end h-full">
                    <p className="font-semibold text-green-600 mb-2">Approved</p>
                    <p className="font-medium">
                      {form1[0]?.ad_approver?.firstname}{" "}
                      {form1[0]?.ad_approver?.lastname}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(form1[0]?.ad_approve_date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <p className="italic text-gray-500 mb-2">Awaiting Approval</p>
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* Buttons */}
      <div className="flex gap-2 mt-4">
        {isEventOwner && !isFullyApproved && (
          <Button
            onClick={() => navigate("/event/form/001", { state: { formdata: form1 } })}
            className="bg-[#013a63] text-white px-3 py-2 rounded-md text-xs font-semibold"
            label="Update"
          />
        )}
        {canAction && isApprovalCheckPass && (
          <>
            <Button
              onClick={onApprove}
              disabled={approveLoading}
              className="bg-emerald-600 text-white px-3 py-2 rounded-md text-xs font-semibold"
              label={approveLoading ? "Approving…" : "Approve"}
            />
            <Button
              onClick={() => setShowRevise(true)}
              disabled={rejectLoading}
              className="bg-rose-600 text-white px-3 py-2 rounded-md text-xs font-semibold"
              label="Revise"
            />
          </>
        )}

       {/* PDF Download Button - Conditionally shown */}
        {canDownloadPdf && (
          <Button
            onClick={() => downloadForm1Pdf(form1, event, owner, roleId)}
            className="bg-indigo-600 text-white px-3 py-2 rounded-md text-xs font-semibold"
          >
            Download PDF
          </Button>
        )}
        <Button
          onClick={handleViewRemarks}
          className="bg-blue-600 text-white px-3 py-2 rounded-md text-xs font-semibold"
          label="View Remarks"
        />
      </div>

      {/* Revise Dialog */}
      <Dialog
        header="Remarks"
        visible={showRevise}
        style={{ width: "50vw" }}
        onHide={() => setShowRevise(false)}
        modal={false}
      >
        <form onSubmit={handleSubmit(onSubmitRevise)} className="flex flex-col gap-4 w-full my-4">
          <Controller
            control={control}
            name="remarks"
            rules={{ required: true }}
            render={({ field: { onChange, value } }) => (
              <InputTextarea
                className={`${errors.remarks ? "border border-red-500" : ""} 
                  bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm 
                  rounded-lg focus:ring-primary-600 focus:border-primary-600 
                  block leading-normal w-full p-2.5`}
                rows={4}
                placeholder="Enter your remarks here"
                value={value}
                onChange={onChange}
              />
            )}
          />
          {errors.remarks && <p className="text-sm italic mt-1 text-red-400">remarks is required.*</p>}
          <Button
            type="submit"
            disabled={rejectLoading}
            className="bg-[#2211cc] text-[#c7c430] font-bold rounded-lg p-2"
            label={rejectLoading ? "Submitting…" : "Submit"}
          />
        </form>
      </Dialog>
      <Dialog
        header="All Remarks"
        visible={remarksModal.show}
        style={{ width: "60vw", maxWidth: "800px" }}
        onHide={() => setRemarksModal({ show: false, remarks: [], approver: '' })}
      >
        <div className="p-4">
          {remarksModal.remarks && remarksModal.remarks.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {remarksModal.remarks.map((remark, index) => (
                <div key={index} className="border-b pb-3 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-gray-800 capitalize">
                      {getRoleName(remark.user?.role_id)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(remark.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                    {remark.remark}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    - {remark.user?.firstname} {remark.user?.lastname}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No remarks found</p>
          )}
          <div className="flex justify-end mt-4">
            <Button
              label="Close"
              className="p-button-text"
              onClick={() => setRemarksModal({ show: false, remarks: [], approver: '' })}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};