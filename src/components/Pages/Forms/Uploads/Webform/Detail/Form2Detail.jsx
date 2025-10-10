import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "@_src/store/auth";
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveForm2, rejectForm2 } from "@_src/services/formservice";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { downloadForm2Pdf } from "@_src/utils/pdf/form2Pdf";
import { checkApprovalProcess } from "@_src/utils/approval";
import { getFormNumber } from "@_src/utils/approval";

export const Form2Detail = () => {
  const { state, pathname } = useLocation();
  const navigate = useNavigate();
  const { event, owner, data: initialData } = state || {};
  
  
  const queryClient = useQueryClient();
  const { user, token } = useUserStore((s) => ({ user: s.user, token: s.token }));
  const decryptedUser = token && DecryptUser(user);
  const decryptedToken = token && DecryptString(token);

  const [form2, setForm2] = useState(initialData || null);

  const approvalCheck = checkApprovalProcess(getFormNumber(pathname), decryptedUser?.role_id, [ form2[0]?.is_dean && 9, form2[0]?.is_commex && 1, form2[0]?.is_asd && 10, form2[0]?.is_ad && 11, ].filter(Boolean), (owner?.role_id === 1 || owner?.role_id === 4))
  const isApprovalCheckPass = approvalCheck?.included && ( Number(decryptedUser?.role_id) === Number(approvalCheck?.nextApprover))


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
    if (!form2) return false;
    if (!isApprover) return false;
    if (hasUserRoleApproved(form2[0])) return false;
    if (form2.status === "approved") return false;
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form2, isApprover]);

const canDownloadPdf = useMemo(() => {
  if (!form2) return false;
  
  const formData = form2[0];
  
  // For ComEx (roleId 1) and role 4 - need 3 approvals (excluding dean)
  if ([1, 4].includes(roleId)) {
    return formData?.commex_approved_by && formData?.asd_approved_by && formData?.ad_approved_by;
  }
  
  // For role 3 - need dean approval AND the other 3 approvers
  if (roleId === 3) {
    return formData?.dean_approved_by && formData?.commex_approved_by && formData?.asd_approved_by && formData?.ad_approved_by;
  }
  
  return false;
}, [form2, roleId]);

  // Approve
  const { mutate: doApprove, isLoading: approveLoading } = useMutation({
    mutationFn: (vars) => approveForm2(vars),
    onSuccess: (res) => {
      toast(res?.message || "Approved", { type: "success" });
      setForm2((prev) => {
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
    if (!form2 || !canAction) return;
    doApprove({ token: decryptedToken, id: form2[0].id, role_id: roleId });
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
    mutationFn: (vars) => rejectForm2(vars),
    onSuccess: (res) => {
      toast(res?.message || "Sent for revision", { type: "success" });
      reset({ remarks: "" });
    },
    onError: () => toast("Failed to submit revision request. Please try again.", { type: "error" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["outreach"] }),
  });

  const onSubmitRevise = ({ remarks }) => {
    if (!form2 || !canAction) return;
    
    doReject({ 
      token: decryptedToken, 
      id: form2[0].id, 
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

    // Filter remarks for this specific form2 and sort by newest first
    const form2Remarks = event.form_remarks
      .filter(remark => 
        remark.form_type === 'form2' && // Use your actual form2 table name
        remark.form_id === form2[0]?.id
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setRemarksModal({ 
      show: true, 
      remarks: form2Remarks,
      approver: 'All Remarks' 
    });
  };

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

  if (!form2) return null;

  const formData = form2[0];

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
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Project Proposal</h2>

        <h2 className="text-1xl font-bold text-gray-800 mb-6">I. PROJECT DESCRIPTION:</h2>
        
        {/* A. Title */}
        <div className="mb-6">
          <p className="font-semibold text-gray-600">A. Project Title</p>
          <p>{event?.eventName || "—"}</p>
        </div>

        {/* B. Type of Project */}
        <div className="mb-6">
          <p className="font-semibold text-gray-600">B. Type of Project</p>
          <p>{formData?.event_type?.name || "—"}</p>
        </div>

        {/* C. Project Proponent(s) */}
        <div className="mb-6">
          <p className="font-semibold text-gray-600">C. Project Proponent(s)</p>
          <p className="break-words whitespace-normal">{formData?.proponents || "—"}</p>
        </div>

        {/* D. Project Collaborator(s) */}
        <div className="mb-6">
          <p className="font-semibold text-gray-600">D. Project Collaborator(s)</p>
          <p className="break-words whitespace-normal">{formData?.collaborators || "—"}</p>
        </div>

        {/* E. Number of Participants */}
        <div className="mb-6">
          <p className="font-semibold text-gray-600">E. Number of Participants</p>
          <p>{formData?.participants || "—"}</p>
        </div>

        {/* F. Project Partner(s) */}
        <div className="mb-6">
          <p className="font-semibold text-gray-600">F. Project Partner(s)</p>
          <p>{formData?.partners || "—"}</p>
        </div>

        {/* G. Date of Implementation */}
        <div className="mb-6">
          <p className="font-semibold text-gray-600">G. Date of Implementation and Duration in Hours</p>
          <p>{formData?.implementationDate || "—"}</p>
        </div>

        {/* H. Area of Project Implementation */}
        <div className="mb-6">
          <p className="font-semibold text-gray-600">H. Area of Project Implementation</p>
          <p>{formData?.area || "—"}</p>
        </div>

        {/* I. Budget Requirement */}
        <div className="mb-6">
          <p className="font-semibold text-gray-600">I. Budget Requirement</p>
          <p>₱ {formData?.budgetRequirement?.toLocaleString() || "0.00"}</p>
        </div>

        {/* J. Budget Requested */}
        <div className="mb-6">
          <p className="font-semibold text-gray-600">J. Budget Requested</p>
          <p>₱ {formData?.budgetRequested?.toLocaleString() || "0.00"}</p>
        </div>

        <h2 className="text-1xl font-bold text-gray-800 mb-6">II. BACKGROUND/SITUATION ANALYSIS:</h2>
        <div className="mb-6">
          <p className="break-words whitespace-normal">{formData?.background || "—"}</p>
        </div>

        <h2 className="text-1xl font-bold text-gray-800 mb-6">III. PROJECT OBJECTIVES:</h2>
        <div className="mb-6">
          <p className="font-semibold text-gray-600">Project Objectives and Strategies</p>
        </div>
        <table className="w-full border mt-2 table-fixed">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 w-1/2 break-words whitespace-normal">Objectives</th>
              <th className="border p-2 w-1/2 break-words whitespace-normal">Strategies</th>
            </tr>
          </thead>
          <tbody>
            {formData?.objectives?.length > 0 ? (
              formData.objectives.map((obj, index) => (
                <tr key={index}>
                  <td className="border p-2 break-words whitespace-normal">{obj.objectives}</td>
                  <td className="border p-2 break-words whitespace-normal">{obj.strategies}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="border p-2 italic text-gray-500 text-center">
                  No objectives defined
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <h2 className="text-1xl font-bold text-gray-800 mb-6 mt-6">IV. DESIRED IMPACT AND OUTCOME OF THE PROJECT:</h2>
        <table className="w-full border mt-2 table-fixed">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 w-1/3 break-words whitespace-normal">Impact</th>
              <th className="border p-2 w-1/3 break-words whitespace-normal">Outcome</th>
              <th className="border p-2 w-1/3 break-words whitespace-normal">Linkage</th>
            </tr>
          </thead>
          <tbody>
            {formData?.impact_outcomes?.length > 0 ? (
              formData.impact_outcomes.map((impact, index) => (
                <tr key={index}>
                  <td className="border p-2 break-words whitespace-normal">{impact.impact}</td>
                  <td className="border p-2 break-words whitespace-normal">{impact.outcome}</td>
                  <td className="border p-2 break-words whitespace-normal">{impact.linkage}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="border p-2 italic text-gray-500 text-center">
                  No impact outcomes defined
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <h2 className="text-1xl font-bold text-gray-800 mb-6 mt-6">V. RISK MANAGEMENT:</h2>
        <table className="w-full border mt-2 table-fixed">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 w-1/2 break-words whitespace-normal">Risk Identification</th>
              <th className="border p-2 w-1/2 break-words whitespace-normal">Risk Mitigation</th>
            </tr>
          </thead>
          <tbody>
            {formData?.risks?.length > 0 ? (
              formData.risks.map((risk, index) => (
                <tr key={index}>
                  <td className="border p-2 break-words whitespace-normal">{risk.risk_identification}</td>
                  <td className="border p-2 break-words whitespace-normal">{risk.risk_mitigation}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="border p-2 italic text-gray-500 text-center">
                  No risks identified
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <h2 className="text-1xl font-bold text-gray-800 mb-6 mt-6">VI. PROJECT ORGANIZATION AND STAFFING:</h2>
        <table className="w-full border mt-2 table-fixed">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 w-1/3 break-words whitespace-normal">Office Staff Designated</th>
              <th className="border p-2 w-1/3 break-words whitespace-normal">Responsibilities</th>
              <th className="border p-2 w-1/3 break-words whitespace-normal">Contact Details</th>
            </tr>
          </thead>
          <tbody>
            {formData?.staffings?.length > 0 ? (
              formData.staffings.map((staff, index) => (
                <tr key={index}>
                  <td className="border p-2 break-words whitespace-normal">{staff.staff}</td>
                  <td className="border p-2 break-words whitespace-normal">{staff.responsibilities}</td>
                  <td className="border p-2 break-words whitespace-normal">{staff.contact}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="border p-2 italic text-gray-500 text-center">
                  No staff assigned
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <h2 className="text-1xl font-bold text-gray-800 mb-6 mt-6">VII. PROJECT WORK PLAN:</h2>
        <table className="w-full border mt-2 table-fixed">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 break-words whitespace-normal">Phases of Project and Date</th>
              <th className="border p-2 break-words whitespace-normal">Activities</th>
              <th className="border p-2 break-words whitespace-normal">Targets and Outputs</th>
              <th className="border p-2 break-words whitespace-normal">Indicators and Outcomes</th>
              <th className="border p-2 break-words whitespace-normal">Personnel In Charge</th>
              <th className="border p-2 break-words whitespace-normal">Resources Needed</th>
              <th className="border p-2 break-words whitespace-normal">Cost</th>
            </tr>
          </thead>
          <tbody>
            {formData?.work_plans?.length > 0 ? (
              formData.work_plans.map((work, index) => (
                <tr key={index}>
                  <td className="border p-2 break-words whitespace-normal">{work.phaseDate}</td>
                  <td className="border p-2 break-words whitespace-normal">{work.activities}</td>
                  <td className="border p-2 break-words whitespace-normal">{work.targets}</td>
                  <td className="border p-2 break-words whitespace-normal">{work.indicators || "N/A"}</td>
                  <td className="border p-2 break-words whitespace-normal">{work.personnel || "N/A"}</td>
                  <td className="border p-2 break-words whitespace-normal">{work.resources || "N/A"}</td>
                  <td className="border p-2 break-words whitespace-normal">₱ {work.cost || "0.00"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="border p-2 italic text-gray-500 text-center">
                  No work plans defined
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <h2 className="text-1xl font-bold text-gray-800 mb-6 mt-6">VIII. DETAILED BUDGET REQUIREMENT:</h2>
        <table className="w-full border mt-2 table-fixed">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 break-words whitespace-normal">Budget Item</th>
              <th className="border p-2 break-words whitespace-normal">Description</th>
              <th className="border p-2 break-words whitespace-normal">Quantity</th>
              <th className="border p-2 break-words whitespace-normal">Amount</th>
              <th className="border p-2 break-words whitespace-normal">Proposed Source(s)</th>
            </tr>
          </thead>
          <tbody>
            {formData?.detailed_budgets?.length > 0 ? (
              formData.detailed_budgets.map((budget, index) => (
                <tr key={index}>
                  <td className="border p-2 break-words whitespace-normal">{budget.item}</td>
                  <td className="border p-2 break-words whitespace-normal">{budget.description}</td>
                  <td className="border p-2 break-words whitespace-normal">{budget.quantity}</td>
                  <td className="border p-2 break-words whitespace-normal">₱ {budget.amount || "0.00"}</td>
                  <td className="border p-2 break-words whitespace-normal">{budget.source || "N/A"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="border p-2 italic text-gray-500 text-center">
                  No budget details provided
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <h2 className="text-1xl font-bold text-gray-800 mb-6 mt-6">IX. OTHER RELEVANT INFORMATION:</h2>
        <div className="mb-6">
          <p className="break-words whitespace-normal">{formData?.otherInfo || "—"}</p>
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
                {formData?.dean_remarks && (
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium mt-2"
                    onClick={() => setRemarksModal({ show: true, remarks: formData.dean_remarks, approver: 'Dean' })}
                  >
                    View Remarks
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="italic text-gray-500 mb-2">Awaiting Approval</p>
                {formData?.dean_remarks && (
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium"
                    onClick={() => setRemarksModal({ show: true, remarks: formData.dean_remarks, approver: 'Dean' })}
                  >
                    View Remarks
                  </button>
                )}
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
              {formData?.commex_remarks && (
                <button
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium mt-2"
                  onClick={() => setRemarksModal({ show: true, remarks: formData.commex_remarks, approver: 'ComEx' })}
                >
                  View Remarks
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="italic text-gray-500 mb-2">Awaiting Approval</p>
              {formData?.commex_remarks && (
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium"
                  onClick={() => setRemarksModal({ show: true, remarks: formData.commex_remarks, approver: 'ComEx' })}
                >
                  View Remarks
                </button>
              )}
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
              {formData?.asd_remarks && (
                <button
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium mt-2"
                  onClick={() => setRemarksModal({ show: true, remarks: formData.asd_remarks, approver: 'Academic Services Director' })}
                >
                  View Remarks
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="italic text-gray-500 mb-2">Awaiting Approval</p>
              {formData?.asd_remarks && (
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium"
                  onClick={() => setRemarksModal({ show: true, remarks: formData.asd_remarks, approver: 'Academic Services Director' })}
                >
                  View Remarks
                </button>
              )}
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
              {formData?.ad_remarks && (
                <button
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium mt-2"
                  onClick={() => setRemarksModal({ show: true, remarks: formData.ad_remarks, approver: 'Academic Director' })}
                >
                  View Remarks
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="italic text-gray-500 mb-2">Awaiting Approval</p>
              {formData?.ad_remarks && (
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium"
                  onClick={() => setRemarksModal({ show: true, remarks: formData.ad_remarks, approver: 'Academic Director' })}
                >
                  View Remarks
                </button>
              )}
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
            onClick={() => navigate("/event/form/002", { state: { formdata: form2 } })}
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
            onClick={() => downloadForm2Pdf(form2, event, owner, roleId)}
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
    </div>
  );
};