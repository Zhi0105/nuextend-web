import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "@_src/store/auth";
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveForm7, rejectForm7 } from "@_src/services/formservice"; 
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { downloadForm7Pdf } from "@_src/utils/pdf/form7Pdf";
import { checkApprovalProcess } from "@_src/utils/approval";
import { getFormNumber } from "@_src/utils/approval";

export const Form7Detail = () => {
  const { state, pathname } = useLocation();
  const navigate = useNavigate();
  const { owner, data: initialData } = state || {};

  const queryClient = useQueryClient();
  const { user, token } = useUserStore((s) => ({ user: s.user, token: s.token }));
  const decryptedUser = token && DecryptUser(user);
  const decryptedToken = token && DecryptString(token);

  const [form7, setForm7] = useState(initialData || null);
  const formData = Array.isArray(form7) ? form7[0] : form7;

  const approvalCheck = checkApprovalProcess(getFormNumber(pathname), decryptedUser?.role_id, [ form7[0]?.is_dean && 9, form7[0]?.is_commex && 1, form7[0]?.is_asd && 10, form7[0]?.is_ad && 11, ].filter(Boolean), (owner?.role_id === 1 || owner?.role_id === 4), (owner?.role_id === 4))
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
    if (!form7) return false;
    if (!isApprover) return false;
    if (hasUserRoleApproved(form7[0])) return false;
    if (formData?.status === "approved") return false;
    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form7, formData, isApprover]);

  // ✅ Approve
  const { mutate: doApprove, isLoading: approveLoading } = useMutation({
    mutationFn: (vars) => approveForm7(vars),
    onSuccess: (res) => {
      toast(res?.message || "Approved", { type: "success" })
      // Update local form1 state para mawala agad yung button
      setForm7((prev) => {
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
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["form7"] }),
  });

  const onApprove = () => {
    if (!formData || !canAction) return;
    doApprove({ token: decryptedToken, id: formData.id, role_id: roleId });
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
    mutationFn: (vars) => rejectForm7(vars),
    onSuccess: (res) => {
      toast(res?.message || "Sent for revision", { type: "success" });
      reset({ remarks: "" });
    },
    onError: () => toast("Failed to submit revision request. Please try again.", { type: "error" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["form7"] }),
  });

  const onSubmitRevise = ({ remarks }) => {
    if (!formData || !canAction) return;
    
    doReject({ 
      token: decryptedToken, 
      id: formData.id, 
      role_id: roleId,  
      remark: remarks  // ✅ Unified 'remark' field (not role-specific keys)
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
    if (!state?.event?.form_remarks) {
      toast("No remarks found", { type: "info" });
      return;
    }

    // Filter remarks for this specific form7 and sort by newest first
    const form7Remarks = state.event.form_remarks
      .filter(remark => 
        remark.form_type === 'form7' && // ✅ Use 'form7' as form_type
        remark.form_id === formData?.id
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setRemarksModal({ 
      show: true, 
      remarks: form7Remarks,
      approver: 'All Remarks' 
    });
  };

  const canDownloadPdf = useMemo(() => {
    if (!formData) return false;
    
    // For Form7, only need ComEx approval (same as Form6)
    return formData?.commex_approved_by;
  }, [formData]);

  if (!formData) return null;

  const formatDate = (iso) => {
    if (!iso) return "_____________";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  const isFullyApproved = useMemo(() => {
    if (!formData) return false;
    
    // For Form7, only need ComEx approval regardless of role
    return formData.commex_approved_by;
  }, [formData]);
  
  return (
    <div className="form7-detail-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20 px-6">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-4xl">
          {/* Date */}
          <p className="text-right mb-6">
            Date: {formData?.created_at ? formatDate(formData.created_at) : "_____________"}
          </p>

          {/* To */}
          <p className="mb-1">
            To:<br />
            <span className="ml-6 font-semibold">Academic Services Director</span>
          </p>

          {/* Through */}
          <p className="mb-1">
            Through:<br />
            <span className="ml-6 font-semibold">ComEx Coordinator</span>
          </p>

          {/* Greeting */}
          <p className="mt-6">Dear Mr. Venturina,</p>

          {/* Body */}
          <p className="mt-4 leading-relaxed text-justify">
            Greetings! I, as the designated <span className="font-semibold">{formData?.designation ?? "_____________"}</span>, 
            representing the <span className="font-semibold">{formData?.organization ?? "_____________"}</span>, would like to formally inform 
            your good office of our willingness to enter into a partnership with the <span className="font-semibold">{formData?.partnership  ?? "_____________"}</span> 
             of National University in their outreach project entitled: <span className="font-semibold">{formData?.entitled ?? "_____________"}</span>, 
            which will be conducted on <span className="font-semibold">{formData?.conducted_on ?? "_____________"}</span>.
          </p>

          <p className="mt-4 leading-relaxed text-justify">
            With this manifestation of consent, I also would like to establish our full cooperation on the activities 
            and plans for this said outreach project from the start until the date of the implementation as it may 
            be mutually beneficial to both parties involved.
          </p>

          <p className="mt-4 leading-relaxed">
            I hereby affix my signature on this date to manifest my concurrence on behalf of the 
            <span className="font-semibold"> {formData?.organization ?? "_____________"}</span>.
          </p>

          {/* Closing */}
          <p className="mt-6">Sincerely,</p>

          {/* Signature Block */}
          <div className="mt-12">
            <p className="font-semibold">__________________________</p>
            <p>Signature Over Printed Name</p>
            <p>Designation: {formData?.designation ?? "_____________"}</p>
            <p>Organization/Institution: {formData?.organization ?? "_____________"}</p>
            <p>Address: {formData?.address ?? "_____________"}</p>
            <p>Mobile Number: {formData?.mobile_number ?? "_____________"}</p>
            <p>Email Address: {formData?.email ?? "_____________"}</p>
          </div>
        </div>

      
      <div className="flex gap-2 my-6">
        {isEventOwner && !isFullyApproved && (
          <Button
            onClick={() => navigate("/event/form/007", { state: { formdata: formData } })}
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

        {/* pdf download */}
        {canDownloadPdf && (
          <Button
            onClick={() => downloadForm7Pdf(formData, owner)}
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

    {/* Consent Section - Only ComEx for Form7 */}
    <h2 className="text-2xl font-bold text-gray-800 mb-6 mt-8">Consent</h2>

    <div className="w-full max-w-5xl mt-6">
      <table className="w-full border border-collapse">
        <thead>
          <tr>
            <th className="border p-2 text-center">ComEx</th>
          </tr>
        </thead>
        <tbody>
          <tr>
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
