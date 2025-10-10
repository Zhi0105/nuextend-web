import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "@_src/store/auth";
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveForm4, rejectForm4 } from "@_src/services/formservice";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { downloadForm4Pdf } from "@_src/utils/pdf/form4Pdf";
import { checkApprovalProcess } from "@_src/utils/approval";
import { getFormNumber } from "@_src/utils/approval";

// ✅ Buttons: UPDATE + APPROVE + REVISE + CHECKLIST + DOWNLOAD PDF
export const Form4Detail = () => {
  const { state, pathname } = useLocation();
  const navigate = useNavigate();
  const { event ,owner, data: initialData } = state || {};

  const queryClient = useQueryClient();
  const { user, token } = useUserStore((s) => ({ user: s.user, token: s.token }));
  const decryptedUser = token && DecryptUser(user);
  const decryptedToken = token && DecryptString(token);

  const [form4, setForm4] = useState(() => {
    if (!initialData) return null;
    if (Array.isArray(initialData)) return initialData[0] ?? null;
    return initialData;
  });

  const approvalCheck = checkApprovalProcess(getFormNumber(pathname), decryptedUser?.role_id, [ form4?.is_dean && 9, form4?.is_commex && 1, form4?.is_asd && 10, form4?.is_ad && 11, ].filter(Boolean), (owner?.role_id === 1 || owner?.role_id === 4), (owner?.role_id === 4))
  const isApprovalCheckPass = approvalCheck?.included && ( Number(decryptedUser?.role_id) === Number(approvalCheck?.nextApprover));
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
  if (!form4) return false;
  if (!isApprover) return false;
  if (hasUserRoleApproved(form4)) return false; // Remove [0] since form4 is the object
  if (form4.status === "approved") return false;
  return true;
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [form4, isApprover]);

  const isChecked = (key) => {
    const v = form4?.[key];
    return v === true || v === "true" || v === 1 || v === "1";
  };

  // Approve
  const { mutate: doApprove, isLoading: approveLoading } = useMutation({
    mutationFn: (vars) => approveForm4(vars),
    onSuccess: (res) => {
      toast(res?.message || "Approved", { type: "success" });
      setForm4((prev) => {
        if (!prev) return prev;
        return [
          {
            ...prev[0],
            is_commex: roleId === 1 ? true : prev.is_commex,
            is_dean: roleId === 9 ? true : prev.is_dean,
            is_asd: roleId === 10 ? true : prev.is_asd,
            is_ad: roleId === 11 ? true : prev.is_ad,
          },
        ];
      });
    },
    onError: () => toast("Failed to approve. Please try again.", { type: "error" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["form4"] }),
  });

  const onApprove = () => {
    if (!form4 || !canAction) return;
    doApprove({ token: decryptedToken, id: form4.id, role_id: roleId });
    navigate("/event/view");
  };

  // Revise
  const [showRevise, setShowRevise] = useState(false);
  const { handleSubmit, control, formState: { errors }, reset } = useForm({ defaultValues: { remarks: "" } });

  const { mutate: doReject, isLoading: rejectLoading } = useMutation({
    mutationFn: (vars) => rejectForm4(vars),
    onSuccess: (res) => {
      toast(res?.message || "Sent for revision", { type: "success" });
      reset({ remarks: "" });
    },
    onError: () => toast("Failed to submit revision request. Please try again.", { type: "error" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["form4"] }),
  });

  const onSubmitRevise = ({ remarks }) => {
    if (!form4 || !canAction) return;
    
    doReject({ 
      token: decryptedToken, 
      id: form4.id, 
      role_id: roleId,  
      remark: remarks  // ✅ Unified 'remark' field
    });
    setShowRevise(false);
    navigate("/event/view");
  };

  const isEventOwner = !!decryptedUser?.id && decryptedUser.id === owner?.id;

  const canDownloadPdf = useMemo(() => {
  if (!form4) return false;
  
  // For ComEx (roleId 1) and Faculty (roleId 4) - need ComEx and ASD approvals
  if ([1, 4].includes(roleId)) {
    return form4?.commex_approved_by && form4?.asd_approved_by;
  }
  
  // For Student (roleId 3) - need ComEx and either ASD or Dean approval
  if (roleId === 3) {
    return form4?.commex_approved_by && (form4?.asd_approved_by || form4?.dean_approved_by);
  }
  
  return false;
}, [form4, roleId]);

const [remarksModal, setRemarksModal] = useState({
  show: false,
  remarks: [], // ✅ Change from '' to []
  approver: ''
});

  if (!form4) return null;

  // Checklist items
  const checklist = [
    { key: "a", label: "A. Is the program strongly linked to teaching and research ..." },
    { key: "b", label: "B. Is it going to be built and maintained on the basis ..." },
    { key: "c", label: "C. Is the program relevant to the core competencies ..." },
    { key: "d", label: "D. Does it involve the input and collaboration of the target group?" },
    { key: "e", label: "E. Is the target group willing to take part in implementation ..." },
    { key: "f", label: "F. Are there assurances that the cooperating department ..." },
    { key: "g", label: "G. Is it to be done within a community that we have MOA with?" },
    { key: "h", label: "H. Does the program promote social transformation ..." },
    { key: "i", label: "I. Is the program not financially demanding ..." },
    { key: "j", label: "J. Is there a good number of appropriate personnel ..." },
    { key: "k", label: "K. Is there any external funding agency that shall support ..." },
    { key: "l", label: "L. Is the proponent capable of managing the program ..." },
    { key: "m", label: "M. Will the program contribute to the holistic growth ..." },
    { key: "n", label: "N. Does the program have a clearly stated background ..." },
    { key: "o", label: "O. Are there formal studies, community assessments ..." },
    { key: "p", label: "P. Does the program have specific and measurable results?" },
  ];

  const handleViewRemarks = () => {
    if (!event?.form_remarks) {
      toast("No remarks found", { type: "info" });
      return;
    }

    // Filter remarks for this specific form4 and sort by newest first
    const form4Remarks = event.form_remarks
      .filter(remark => 
        remark.form_type === 'form4' && // ✅ Use 'form4' as form_type
        remark.form_id === form4?.id
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setRemarksModal({ 
      show: true, 
      remarks: form4Remarks,
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
  if (!form4) return false;
  
  // For role 1 (ComEx), need ComEx + ASD approvals
  if (owner?.role_id === 1) {
    return form4.commex_approved_by && 
           form4.asd_approved_by;
  }
  
  // For roles 3 (student) and 4 (faculty), need ComEx + (ASD OR Dean)
  if ([3, 4].includes(owner?.role_id)) {
    return form4.commex_approved_by && 
           (form4.asd_approved_by || form4.dean_approved_by);
  }
  
  return false;
}, [form4, owner?.role_id]);

  return (
    <div className="form4-detail-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
      
      {/* Printable section */}
      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          CHECKLIST OF CRITERIA FOR EXTENSION PROGRAM PROPOSAL
        </h2>

        <div className="w-full border rounded-lg shadow mb-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2 text-left">Criteria</th>
                <th className="border p-2 text-center w-20">Yes</th>
                <th className="border p-2 text-center w-20">No</th>
              </tr>
            </thead>
            <tbody>
              {/* Categories with grouped rows */}
              <tr><td colSpan="3" className="border p-2 font-bold bg-gray-100">I. Relevance to Academic and Research Programs</td></tr>
              {["a", "b", "c"].map((key) => (
                <tr key={key} className="odd:bg-gray-50 even:bg-white">
                  <td className="border p-2">{checklist.find((i) => i.key === key)?.label}</td>
                  <td className="border p-2 text-center">{isChecked(key) ? "✔" : ""}</td>
                  <td className="border p-2 text-center">{!isChecked(key) ? "✔" : ""}</td>
                </tr>
              ))}

              <tr><td colSpan="3" className="border p-2 font-bold bg-gray-100">II. Collaborative and Participatory</td></tr>
              {["d","e","f","g"].map((key) => (
                <tr key={key} className="odd:bg-gray-50 even:bg-white">
                  <td className="border p-2">{checklist.find((i) => i.key === key)?.label}</td>
                  <td className="border p-2 text-center">{isChecked(key) ? "✔" : ""}</td>
                  <td className="border p-2 text-center">{!isChecked(key) ? "✔" : ""}</td>
                </tr>
              ))}

              <tr><td colSpan="3" className="border p-2 font-bold bg-gray-100">III. Values Oriented</td></tr>
              {["h"].map((key) => (
                <tr key={key} className="odd:bg-gray-50 even:bg-white">
                  <td className="border p-2">{checklist.find((i) => i.key === key)?.label}</td>
                  <td className="border p-2 text-center">{isChecked(key) ? "✔" : ""}</td>
                  <td className="border p-2 text-center">{!isChecked(key) ? "✔" : ""}</td>
                </tr>
              ))}

              <tr><td colSpan="3" className="border p-2 font-bold bg-gray-100">IV. Financing and Sustainability</td></tr>
              {["i","j","k","l","m"].map((key) => (
                <tr key={key} className="odd:bg-gray-50 even:bg-white">
                  <td className="border p-2">{checklist.find((i) => i.key === key)?.label}</td>
                  <td className="border p-2 text-center">{isChecked(key) ? "✔" : ""}</td>
                  <td className="border p-2 text-center">{!isChecked(key) ? "✔" : ""}</td>
                </tr>
              ))}

              <tr><td colSpan="3" className="border p-2 font-bold bg-gray-100">V. Evidence-Based Need and Significance</td></tr>
              {["n","o","p"].map((key) => (
                <tr key={key} className="odd:bg-gray-50 even:bg-white">
                  <td className="border p-2">{checklist.find((i) => i.key === key)?.label}</td>
                  <td className="border p-2 text-center">{isChecked(key) ? "✔" : ""}</td>
                  <td className="border p-2 text-center">{!isChecked(key) ? "✔" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-4">
        {isEventOwner && !isFullyApproved && (
          <Button
            onClick={() => navigate("/event/form/004", { state: { formdata: form4 } })}
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
        {/* ✅ PDF Button */}
        {canDownloadPdf && (
          <Button
            onClick={() => downloadForm4Pdf(form4, checklist, roleId, owner)}
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
                {form4?.commex_approved_by ? (
                  <div className="flex flex-col justify-end h-full">
                    <p className="font-semibold text-green-600 mb-2">Approved</p>
                    <p className="font-medium">
                      {form4?.commex_approver?.firstname}{" "}
                      {form4?.commex_approver?.lastname}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(form4?.commex_approve_date).toLocaleDateString('en-US', { 
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
                  form4?.asd_approved_by ? (
                    <div className="flex flex-col justify-end h-full">
                      <p className="font-semibold text-green-600 mb-2">Approved</p>
                      <p className="font-medium">
                        {form4?.asd_approver?.firstname} {form4?.asd_approver?.lastname}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(form4?.asd_approve_date).toLocaleDateString('en-US', {
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
                  form4?.asd_approved_by || form4?.dean_approved_by ? (
                    <div className="flex flex-col justify-end h-full">
                      <p className="font-semibold text-green-600 mb-2">Approved</p>
                      <p className="font-medium">
                        {form4?.asd_approved_by ? 
                          `${form4.asd_approver?.firstname} ${form4.asd_approver?.lastname}` :
                          `${form4.dean_approver?.firstname} ${form4.dean_approver?.lastname}`
                        }
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(form4?.asd_approve_date || form4?.dean_approve_date).toLocaleDateString('en-US', {
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
      <Dialog header="Remarks" visible={showRevise} style={{ width: "50vw" }} onHide={() => setShowRevise(false)} modal={false}>
        <form onSubmit={handleSubmit(onSubmitRevise)} className="flex flex-col gap-4 w-full my-4">
          <Controller
            control={control}
            name="remarks"
            rules={{ required: true }}
            render={({ field: { onChange, value } }) => (
              <InputTextarea
                className={`${errors.remarks ? "border border-red-500" : ""} bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                rows={4}
                placeholder="Enter your remarks here"
                value={value}
                onChange={onChange}
              />
            )}
          />
          {errors.remarks && <p className="text-sm italic mt-1 text-red-400">remarks is required.*</p>}
          <Button type="submit" disabled={rejectLoading} className="bg-[#2211cc] text-[#c7c430] font-bold rounded-lg p-2" label={rejectLoading ? "Submitting…" : "Submit"} />
        </form>
      </Dialog>
    </div>
  );
};
