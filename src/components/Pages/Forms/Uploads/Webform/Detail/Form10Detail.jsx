import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "@_src/store/auth";
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveForm10, rejectForm10 } from "@_src/services/formservice";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { downloadForm10Pdf } from "@_src/utils/pdf/form10Pdf";
import { checkApprovalProcess } from "@_src/utils/approval";
import { getFormNumber } from "@_src/utils/approval";

export const Form10Detail = () => {
  const { state, pathname } = useLocation();
  const navigate = useNavigate();
  const { event, owner, data: initialData } = state || {};

  const queryClient = useQueryClient();
  const { user, token } = useUserStore((s) => ({ user: s.user, token: s.token }));
  const decryptedUser = token && DecryptUser(user);
  const decryptedToken = token && DecryptString(token);

  const [form10, setForm10] = useState(initialData || null);

  const approvalCheck = checkApprovalProcess(getFormNumber(pathname), decryptedUser?.role_id, [ form10[0]?.is_dean && 9, form10[0]?.is_commex && 1, form10[0]?.is_asd && 10, form10[0]?.is_ad && 11, ].filter(Boolean), (owner?.role_id === 1 || owner?.role_id === 4))
  const isApprovalCheckPass = approvalCheck?.included && ( Number(decryptedUser?.role_id) === Number(approvalCheck?.nextApprover))
      

  // Extract data from form10 and event
  const form10Data = form10?.[0] || form10;
  const form7Data = event?.form7?.[0]; 
  const aoopData = form10Data?.oaopb || []; // Objectives, Activities, Outputs, Personnel data
  const discussion = form10Data?.discussion;
  
  // Project data from event
  const projectTitle = event?.eventName;
  const targetGroup = event?.target_group;
  const implementationDate = form7Data?.conducted_on;

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
    if (!form10) return false;
    if (!isApprover) return false;
    if (hasUserRoleApproved(form10[0])) return false;
    if (form10.status === "approved") return false;
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form10, isApprover]);

  // PDF Download Logic
  const canDownloadPdf = useMemo(() => {
    if (!form10) return false;
    
    const formData = form10[0] || form10;
    
    // For ComEx (roleId 1) and role 4 - need 3 approvals (excluding dean)
    if ([1, 4].includes(roleId)) {
      return formData?.commex_approved_by && formData?.asd_approved_by && formData?.ad_approved_by;
    }
    
    // For role 3 - need dean approval AND the other 3 approvers
    if (roleId === 3) {
      return formData?.dean_approved_by && formData?.commex_approved_by && formData?.asd_approved_by && formData?.ad_approved_by;
    }
    
    return false;
  }, [form10, roleId]);

  // ✅ Approve
  const { mutate: doApprove, isLoading: approveLoading } = useMutation({
    mutationFn: (vars) => approveForm10(vars),
    onSuccess: (res) => {
      toast(res?.message || "Approved", { type: "success" })
      setForm10((prev) => {
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
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["form10"] }),
  });

  const onApprove = () => {
    if (!form10 || !canAction) return;
    doApprove({
      token: decryptedToken,
      id: form10[0]?.id ?? form10.id,
      role_id: roleId,
    });
    navigate("/event/view");
  };

  // ✅ Revise
  const [showRevise, setShowRevise] = useState(false);

  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({ defaultValues: { remarks: "" } });

  const { mutate: doReject, isLoading: rejectLoading } = useMutation({
    mutationFn: (vars) => rejectForm10(vars),
    onSuccess: (res) => {
      toast(res?.message || "Sent for revision", { type: "success" });
      reset({ remarks: "" });
    },
    onError: () =>
      toast("Failed to submit revision request. Please try again.", { type: "error" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["form10"] }),
  });

  const onSubmitRevise = ({ remarks }) => {
    if (!form10 || !canAction) return;
    
    doReject({ 
      token: decryptedToken, 
      id: form10[0]?.id ?? form10.id, 
      role_id: roleId,  
      remark: remarks  // ✅ Unified 'remark' field
    });
    setShowRevise(false);
    navigate("/event/view");
  };

  const isEventOwner = !!decryptedUser?.id && decryptedUser.id === owner?.id;

  const [remarksModal, setRemarksModal] = useState({
    show: false,
    remarks: [], // ✅ Change from '' to []
    approver: ''
  });

  // Add getRoleName function
  const getRoleName = (roleId) => {
    const roleMap = {
      1: 'ComEx',
      9: 'Dean', 
      10: 'Academic Services Director',
      11: 'Academic Director'
    };
    return roleMap[roleId] || 'Unknown Role';
  };

  const handleViewRemarks = () => {
    if (!event?.form_remarks) {
      toast("No remarks found", { type: "info" });
      return;
    }

    // Filter remarks for this specific form10 and sort by newest first
    const form10Remarks = event.form_remarks
      .filter(remark => 
        remark.form_type === 'form10' && // ✅ Use 'form10' as form_type
        remark.form_id === formData?.id
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setRemarksModal({ 
      show: true, 
      remarks: form10Remarks,
      approver: 'All Remarks' 
    });
  };

  if (!form10) return null;

  const formData = form10[0] || form10;

    const isFullyApproved = useMemo(() => {
  if (!formData) return false;
  
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
}, [formData, owner?.role_id]);

  return (
    <div className="project-detail-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
      <div className="w-full max-w-5xl bg-white shadow rounded-lg p-6 my-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">OUTREACH PROJECT EVALUATION AND DOCUMENTATION REPORT</h2>

        {/* I. PROJECT TITLE */}
        <div className="mb-6">
          <p className="font-semibold text-gray-600">I. PROJECT TITLE:</p>
          <p>{projectTitle || "No project title provided"}</p>
        </div>

        {/* II. TARGET GROUP */}
        <div className="mb-6">
          <p className="font-semibold text-gray-600">II. TARGET GROUP:</p>
          <p>{targetGroup || "No target group specified"}</p>
        </div>

        {/* III. DATE OF IMPLEMENTATION */}
        <div className="mb-6">
          <p className="font-semibold text-gray-600">III. DATE OF IMPLEMENTATION:</p>
          <p>{implementationDate || "No date specified"}</p>
        </div>

        {/* IV. REPORT PROPER */}
        <h2 className="text-1xl font-bold text-gray-800 mb-6">IV. REPORT PROPER:</h2>

        {/* A. Objectives, Activities, Outputs, Personnels and Budgeting */}
        <div className="mb-6">
          <p className="font-semibold text-gray-600">A. Objectives, Activities, Outputs, Personnels and Budgeting</p>
        </div>
        <table className="w-full border mt-2 table-fixed">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 break-words whitespace-normal">Objectives</th>
              <th className="border p-2 break-words whitespace-normal">Activities</th>
              <th className="border p-2 break-words whitespace-normal">Outputs</th>
              <th className="border p-2 break-words whitespace-normal">Personnel</th>
              <th className="border p-2 break-words whitespace-normal">Budget</th>
            </tr>
          </thead>
          <tbody>
            {aoopData.length > 0 ? (
              aoopData.map((item, index) => (
                <tr key={item.id || index}>
                  <td className="border p-2 break-words whitespace-normal">{item.objectives || ""}</td>
                  <td className="border p-2 break-words whitespace-normal">{item.activities || ""}</td>
                  <td className="border p-2 break-words whitespace-normal">{item.outputs || ""}</td>
                  <td className="border p-2 break-words whitespace-normal">{item.personnel || ""}</td>
                  <td className="border p-2 break-words whitespace-normal">{item.budget || ""}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="border p-2 italic text-gray-500 text-center">
                  No data provided
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <p className="text-sm text-gray-600 italic mt-2">
          Important Note: Filling out this matrix with accurate data will be helpful.
        </p>

        {/* B. Discussion */}
        <div className="mb-6 mt-6">
          <p className="font-semibold text-gray-600">B. Discussion:</p>
          <p className="break-words whitespace-normal">{discussion || "No discussion provided"}</p>
        </div>
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
                  {formData?.dean_approved_by ? (
                    <div className="flex flex-col justify-end h-full">
                      <p className="font-semibold text-green-600 mb-2">Approved</p>
                      <p className="font-medium">
                        {formData?.dean_approver?.firstname}{" "}
                        {formData?.dean_approver?.lastname}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(formData?.dean_approve_date).toLocaleDateString('en-US', {
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
                {formData?.commex_approved_by ? (
                  <div className="flex flex-col justify-end h-full">
                    <p className="font-semibold text-green-600 mb-2">Approved</p>
                    <p className="font-medium">
                      {formData?.commex_approver?.firstname}{" "}
                      {formData?.commex_approver?.lastname}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(formData?.commex_approve_date).toLocaleDateString('en-US', { 
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
                {formData?.asd_approved_by ? (
                  <div className="flex flex-col justify-end h-full">
                    <p className="font-semibold text-green-600 mb-2">Approved</p>
                    <p className="font-medium">
                      {formData?.asd_approver?.firstname}{" "}
                      {formData?.asd_approver?.lastname}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(formData?.asd_approve_date).toLocaleDateString('en-US', { 
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
                {formData?.ad_approved_by ? (
                  <div className="flex flex-col justify-end h-full">
                    <p className="font-semibold text-green-600 mb-2">Approved</p>
                    <p className="font-medium">
                      {formData?.ad_approver?.firstname}{" "}
                      {formData?.ad_approver?.lastname}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(formData?.ad_approve_date).toLocaleDateString('en-US', { 
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
            onClick={() => navigate("/event/form/010", { state: { formdata: form10 } })}
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
            onClick={() => downloadForm10Pdf(form10, event, owner, roleId)}
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
      
      {/* ✅ ADD THIS NEW MODAL */}
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
          {errors.remarks && (
            <p className="text-sm italic mt-1 text-red-400">remarks is required.*</p>
          )}
          <Button
            type="submit"
            disabled={rejectLoading}
            className="bg-[#2211cc] text-[#c7c430] font-bold rounded-lg p-2"
            label={rejectLoading ? "Submitting…" : "Submit"}
          />
        </form>
      </Dialog>
    </div>
  );
};