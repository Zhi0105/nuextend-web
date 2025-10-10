import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "@_src/store/auth";
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveForm5, rejectForm5 } from "@_src/services/formservice";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { downloadForm5Pdf } from "@_src/utils/pdf/form5Pdf";
import { checkApprovalProcess } from "@_src/utils/approval";
import { getFormNumber } from "@_src/utils/approval";

export const Form5Detail = () => {
  const { state, pathname } = useLocation();
  const navigate = useNavigate();
  const { event, owner, data: initialData } = state || {};

  const queryClient = useQueryClient();
  const { user, token } = useUserStore((s) => ({ user: s.user, token: s.token }));
  const decryptedUser = token && DecryptUser(user);
  const decryptedToken = token && DecryptString(token);

  // Normalize initialData to an object (if API returns an array, take first element)
  const [form5, setForm5] = useState(() => {
    if (!initialData) return null;
    if (Array.isArray(initialData)) return initialData[0] ?? null;
    return initialData;
  });

  const approvalCheck = checkApprovalProcess(getFormNumber(pathname), decryptedUser?.role_id, [ form5?.is_dean && 9, form5?.is_commex && 1, form5?.is_asd && 10, form5?.is_ad && 11, ].filter(Boolean), (owner?.role_id === 1 || owner?.role_id === 4))
  const isApprovalCheckPass = approvalCheck?.included && ( Number(decryptedUser?.role_id) === Number(approvalCheck?.nextApprover))
  
  const roleId = decryptedUser?.role_id;
  const isApprover = useMemo(() => [1, 9, 10, 11].includes(roleId), [roleId]);

  const hasUserRoleApproved = (row) => {
    if (!row) return false;
    switch (roleId) {
      case 1: return !!row.is_commex;
      case 9: return !!row.is_dean;
      case 10: return !!row.is_asd;
      case 11: return !!row.is_ad;
      default: return false;
    }
  };

  const canAction = useMemo(() => {
    if (!form5) return false;
    if (!isApprover) return false;
    if (hasUserRoleApproved(form5)) return false;
    if (form5.status === "approved") return false;
    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form5, isApprover]);

  // Helper: robust truth check (handles true/"true"/1/"1")
  const isChecked = (key) => {
    const v = form5?.[key];
    return v === true || v === "true" || v === 1 || v === "1";
  };

  // Approve
  const { mutate: doApprove, isLoading: approveLoading } = useMutation({
    mutationFn: (vars) => approveForm5(vars),
    onSuccess: (res) => {
      toast(res?.message || "Approved", { type: "success" })
      // Update local form5 state para mawala agad yung button
      setForm5((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          is_commex: roleId === 1 ? true : prev.is_commex,
          is_dean: roleId === 9 ? true : prev.is_dean,
          is_asd: roleId === 10 ? true : prev.is_asd,
          is_ad: roleId === 11 ? true : prev.is_ad,
        };
      });
    },
    onError: () => toast("Failed to approve. Please try again.", { type: "error" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["form5"] }),
  });

  const onApprove = () => {
    if (!form5 || !canAction) return;
    doApprove({ token: decryptedToken, id: form5.id, role_id: roleId });
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
    mutationFn: (vars) => rejectForm5(vars),
    onSuccess: (res) => {
      toast(res?.message || "Sent for revision", { type: "success" });
      reset({ remarks: "" });
    },
    onError: () => toast("Failed to submit revision request. Please try again.", { type: "error" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["form5"] }),
  });

  const onSubmitRevise = ({ remarks }) => {
    if (!form5 || !canAction) return;
    
    doReject({ 
      token: decryptedToken, 
      id: form5.id, 
      role_id: roleId,  
      remark: remarks  // ✅ Unified 'remark' field
    });
    setShowRevise(false);
    navigate("/event/view");
  };

  const isEventOwner = !!decryptedUser?.id && decryptedUser.id === owner?.id;

    const canDownloadPdf = useMemo(() => {
    if (!form5) return false;
    
    // For ComEx (roleId 1) and Faculty (roleId 4) - need ComEx and ASD approvals
    if ([1, 4].includes(roleId)) {
      return form5?.commex_approved_by && form5?.asd_approved_by;
    }
    
    // For Student (roleId 3) - need ComEx and either ASD or Dean approval
    if (roleId === 3) {
      return form5?.commex_approved_by && (form5?.asd_approved_by || form5?.dean_approved_by);
    }
    
    return false;
  }, [form5, roleId]);

  const [remarksModal, setRemarksModal] = useState({
    show: false,
    remarks: [], // ✅ Change from '' to []
    approver: ''
  });

  // Checklist mapping (A–N) based on the image
  const checklist = [
    { key: "a", label: "A. Is the project related to disaster response, rehabilitation, and recovery?" },
    { key: "b", label: "B. If it is a regular outreach project, is it going to be built and maintained on the basis of the existing academic research programs of the school?" },
    { key: "c", label: "C. Can it be easily repackaged into an extension program for future purposes?" },
    { key: "d", label: "D. Is the project relevant to the core competencies of the School or Department?" },
    { key: "e", label: "E. Does it involve the input and collaboration of the target group?" },
    { key: "f", label: "F. Is the target group willing to take part in the implementation, monitoring, and evaluation of the project?" },
    { key: "g", label: "G. Is it to be done within a community that we have MOA with?" },
    { key: "h", label: "H. Is the project in line with the ComEx's value proposition?" },
    { key: "i", label: "I. Is the project not financially demanding so that it cannot drain the financial resources in the implementation of the project?" },
    { key: "j", label: "J. Is the target group willing to share its counterpart in terms of its physical or financial resources in the implementation of the project?" },
    { key: "k", label: "K. Is there any external funding agency that shall support the project?" },
    { key: "l", label: "L. Is there any related activity to support and finance the proposed project?" },
    { key: "m", label: "M. Is it going to cater to pressing and legitimate community needs?" },
    { key: "n", label: "N. Are there formal studies, community assessments, and problem analyses that were conducted?" },
  ];
  const handleViewRemarks = () => {
  if (!event?.form_remarks) {
    toast("No remarks found", { type: "info" });
    return;
  }

  // Filter remarks for this specific form5 and sort by newest first
  const form5Remarks = event.form_remarks
    .filter(remark => 
      remark.form_type === 'form5' && // ✅ Use 'form5' as form_type
      remark.form_id === form5?.id
    )
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  setRemarksModal({ 
    show: true, 
    remarks: form5Remarks,
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

const isFullyApproved = useMemo(() => {
  if (!form5) return false;
  
  // For role 1 (ComEx), need ComEx + ASD approvals
  if (owner?.role_id === 1) {
    return form5.commex_approved_by && 
           form5.asd_approved_by;
  }
  
  // For roles 3 (student) and 4 (faculty), need ComEx + (ASD OR Dean)
  if ([3, 4].includes(owner?.role_id)) {
    return form5.commex_approved_by && 
           (form5.asd_approved_by || form5.dean_approved_by);
  }
  
  return false;
}, [form5, owner?.role_id]);

  return (
    <div className="form5-detail-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">CHECKLIST OF CRITERIA FOR PROJECT PROPOSAL</h2>
      
      {/* Checklist Table */}
      <div className="w-full max-w-4xl border rounded-lg shadow mb-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2 text-left">Criteria</th>
              <th className="border p-2 text-center w-20">Yes</th>
              <th className="border p-2 text-center w-20">No</th>
            </tr>
          </thead>
          <tbody>
            {/* I. Relevance to Academic Extension Programs */}
            <tr>
              <td colSpan="3" className="border p-2 font-bold bg-gray-100">
                I. Relevance to Academic Extension Programs
              </td>
            </tr>
            {["a", "b", "c", "d"].map((key) => (
              <tr key={key} className="odd:bg-gray-50 even:bg-white">
                <td className="border p-2">{checklist.find((i) => i.key === key)?.label}</td>
                <td className="border p-2 text-center">{isChecked(key) ? "✔" : ""}</td>
                <td className="border p-2 text-center">{!isChecked(key) ? "✔" : ""}</td>
              </tr>
            ))}

            {/* II. Collaborative and Participatory */}
            <tr>
              <td colSpan="3" className="border p-2 font-bold bg-gray-100">
                II. Collaborative and Participatory
              </td>
            </tr>
            {["e", "f", "g"].map((key) => (
              <tr key={key} className="odd:bg-gray-50 even:bg-white">
                <td className="border p-2">{checklist.find((i) => i.key === key)?.label}</td>
                <td className="border p-2 text-center">{isChecked(key) ? "✔" : ""}</td>
                <td className="border p-2 text-center">{!isChecked(key) ? "✔" : ""}</td>
              </tr>
            ))}

            {/* III. Values Oriented */}
            <tr>
              <td colSpan="3" className="border p-2 font-bold bg-gray-100">
                III. Value(s) Oriented
              </td>
            </tr>
            {["h"].map((key) => (
              <tr key={key} className="odd:bg-gray-50 even:bg-white">
                <td className="border p-2">{checklist.find((i) => i.key === key)?.label}</td>
                <td className="border p-2 text-center">{isChecked(key) ? "✔" : ""}</td>
                <td className="border p-2 text-center">{!isChecked(key) ? "✔" : ""}</td>
              </tr>
            ))}

            {/* IV. Financing and Sustainability */}
            <tr>
              <td colSpan="3" className="border p-2 font-bold bg-gray-100">
                IV. Financing and Sustainability
              </td>
            </tr>
            {["i", "j", "k", "l"].map((key) => (
              <tr key={key} className="odd:bg-gray-50 even:bg-white">
                <td className="border p-2">{checklist.find((i) => i.key === key)?.label}</td>
                <td className="border p-2 text-center">{isChecked(key) ? "✔" : ""}</td>
                <td className="border p-2 text-center">{!isChecked(key) ? "✔" : ""}</td>
              </tr>
            ))}

            {/* V. Significance */}
            <tr>
              <td colSpan="3" className="border p-2 font-bold bg-gray-100">
                V. Significance
              </td>
            </tr>
            {["m", "n"].map((key) => (
              <tr key={key} className="odd:bg-gray-50 even:bg-white">
                <td className="border p-2">{checklist.find((i) => i.key === key)?.label}</td>
                <td className="border p-2 text-center">{isChecked(key) ? "✔" : ""}</td>
                <td className="border p-2 text-center">{!isChecked(key) ? "✔" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2 mb-6">
        {/* Update button */}
        {isEventOwner && !isFullyApproved && (
          <Button
            onClick={() => navigate("/event/form/005", { state: { formdata: form5 } })}
            className="bg-[#013a63] text-white px-3 py-2 rounded-md text-xs font-semibold"
            label="Update"
          />
        )}

        {/* Approve + Revise */}
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

        {/* ✅ PDF Button */}
          {canDownloadPdf && (
            <Button
              onClick={() => downloadForm5Pdf(form5, checklist, roleId, owner)}
              className="bg-indigo-600 text-white px-3 py-2 rounded-md text-xs font-semibold"
              label="Download PDF"
            />
          )}
          <Button
            onClick={handleViewRemarks}
            className="bg-blue-600 text-white px-3 py-2 rounded-md text-xs font-semibold"
            label="View Remarks"
          />
      </div>

      {/* Consent Section */}
      <h2 className="text-2xl font-bold text-gray-800 mb-6 mt-8">Consent</h2>

      <div className="w-full max-w-5xl mt-6">
        <table className="w-full border border-collapse table-fixed">
          <colgroup>
            <col className="w-1/2" />
            <col className="w-1/2" />
          </colgroup>
          <thead>
            <tr>
              <th className="border p-2 text-center w-1/2">ComEx</th>
              <th className="border p-2 text-center w-1/2">Academic Services Director / Dean</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* ComEx Column */}
              <td className="border p-6 text-center align-bottom h-32 w-1/2">
                {form5?.commex_approved_by ? (
                  <div className="flex flex-col justify-end h-full">
                    <p className="font-semibold text-green-600 mb-2">Approved</p>
                    <p className="font-medium">
                      {form5?.commex_approver?.firstname}{" "}
                      {form5?.commex_approver?.lastname}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(form5?.commex_approve_date).toLocaleDateString('en-US', { 
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

              {/* ASD/Dean Column - Show only one approver based on role requirements */}
              <td className="border p-6 text-center align-bottom h-32 w-1/2">
                {/* For role 3 (student) - show either ASD or Dean, whichever approved first */}
                {[1, 4].includes(roleId) ? (
                  // For ComEx (1) and Faculty (4) - only need ASD
                  form5?.asd_approved_by ? (
                    <div className="flex flex-col justify-end h-full">
                      <p className="font-semibold text-green-600 mb-2">Approved</p>
                      <p className="font-medium">
                        {form5?.asd_approver?.firstname} {form5?.asd_approver?.lastname}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(form5?.asd_approve_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <p className="italic text-gray-500 mb-2">Awaiting Academic Services Director Approval</p>
                    </div>
                  )
                ) : (
                  // For other roles (including student role 3) - show whichever approved first
                  form5?.asd_approved_by || form5?.dean_approved_by ? (
                    <div className="flex flex-col justify-end h-full">
                      <p className="font-semibold text-green-600 mb-2">Approved</p>
                      <p className="font-medium">
                        {form5?.asd_approved_by ? 
                          `${form5.asd_approver?.firstname} ${form5.asd_approver?.lastname}` :
                          `${form5.dean_approver?.firstname} ${form5.dean_approver?.lastname}`
                        }
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(form5?.asd_approve_date || form5?.dean_approve_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <p className="italic text-gray-500 mb-2">Awaiting Approval</p>
                      {(form5?.asd_remarks || form5?.dean_remarks) && (
                        <button
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium"
                          onClick={() => setRemarksModal({ 
                            show: true, 
                            remarks: form5.asd_remarks || form5.dean_remarks, 
                            approver: form5.asd_remarks ? 'Academic Services Director' : 'Dean' 
                          })}
                        >
                          View Remarks
                        </button>
                      )}
                    </div>
                  )
                )}
              </td>
            </tr>
          </tbody>
        </table>
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
                className={`${
                  errors.remarks ? "border border-red-500" : ""
                } bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
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