import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "@_src/store/auth";
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveForm6, rejectForm6 } from "@_src/services/formservice";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { downloadForm6Pdf } from "@_src/utils/pdf/form6Pdf";
import { checkApprovalProcess } from "@_src/utils/approval";
import { getFormNumber } from "@_src/utils/approval";

export const Form6Detail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const routeState = location?.state ?? null;

  // handle multiple possible shapes: state.data, state.formdata, direct state (object or array)
  const incoming = (() => {
    if (!routeState) return null;
    if (Array.isArray(routeState)) return routeState;
    if (routeState.data || routeState.formdata) return routeState.data ?? routeState.formdata;
    // otherwise maybe the state itself is the object
    return routeState;
  })();

  const [form6, setForm6] = useState(incoming ?? null);
  useEffect(() => setForm6(incoming ?? null), [incoming]);


  // normalize to object in `details`
  const details = Array.isArray(form6) ? form6[0] : form6;

  const queryClient = useQueryClient();
  const { user, token } = useUserStore((s) => ({ user: s.user, token: s.token }));
  const decryptedUser = token && DecryptUser(user);
  const decryptedToken = token && DecryptString(token);
  const approvalCheck = checkApprovalProcess(getFormNumber(location?.pathname), decryptedUser?.role_id, [ form6[0]?.is_dean && 9, form6[0]?.is_commex && 1, form6[0]?.is_asd && 10, form6[0]?.is_ad && 11, ].filter(Boolean), (routeState?.owner?.role_id === 1 || routeState?.owner?.role_id === 4))
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
    if (!details) return false;
    if (!isApprover) return false;
    if (hasUserRoleApproved(details)) return false;
    if (details.status === "approved") return false;
    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details, isApprover]);

  // Approve
  const { mutate: doApprove, isLoading: approveLoading } = useMutation({
    mutationFn: (vars) => approveForm6(vars),
    onSuccess: (res) => {
      toast(res?.message || "Approved", { type: "success" })
       // Update local form1 state para mawala agad yung button
      setForm6((prev) => {
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
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["form6"] }),
  });

  const onApprove = () => {
    if (!details || !canAction) return;
    doApprove({ token: decryptedToken, id: details.id, role_id: roleId });
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
    mutationFn: (vars) => rejectForm6(vars),
    onSuccess: (res) => {
      toast(res?.message || "Sent for revision", { type: "success" });
      reset({ remarks: "" });
    },
    onError: () => toast("Failed to submit revision request. Please try again.", { type: "error" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["form6"] }),
  });

  const onSubmitRevise = ({ remarks }) => {
    if (!details || !canAction) return;
    
    doReject({ 
      token: decryptedToken, 
      id: details.id, 
      role_id: roleId,  
      remark: remarks  // ✅ Unified 'remark' field
    });
    setShowRevise(false);
    navigate("/event/view");
  };

  const canDownloadPdf = useMemo(() => {
  if (!details) return false;
  
  // For Form6, only need ComEx approval
  return details?.commex_approved_by;
}, [details]);
  const [remarksModal, setRemarksModal] = useState({
    show: false,
    remarks: [], // ✅ Change from '' to []
    approver: ''
  });

  const handleViewRemarks = () => {
    if (!routeState?.event?.form_remarks) {
      toast("No remarks found", { type: "info" });
      return;
    }

    // Filter remarks for this specific form6 and sort by newest first
    const form6Remarks = routeState.event.form_remarks
      .filter(remark => 
        remark.form_type === 'form6' && // ✅ Use 'form6' as form_type
        remark.form_id === details?.id
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setRemarksModal({ 
      show: true, 
      remarks: form6Remarks,
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

  const isEventOwner = !!decryptedUser?.id && decryptedUser.id === (routeState?.owner?.id ?? routeState?.owner);
  return (
    <div className="form6-detail-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">MANIFESTATION OF CONSENT AND COOPERATION FOR THE EXTENSION PROGRAM</h2>

      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-4xl">
        
        <p className="text-right mb-6">
          Date:{" "}
          {details?.created_at
            ? new Date(details.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "_____________"}
        </p>

        <p className="mb-1">To:<br />
          <span className="ml-6 font-semibold">Academic Services Director</span>
        </p>

        <p className="mb-1">Through:<br />
          <span className="ml-6 font-semibold">ComEx Coordinator</span>
        </p>

        <p className="mt-6">Dear Mr. Venturina,</p>

        <p className="mt-4 leading-relaxed text-justify">
          Greetings! I, as the designated <span className="font-semibold">{details.designation ?? "_____________"}</span>, 
          representing the <span className="font-semibold">{details.organization ?? "_____________"}</span>, 
          would like to formally inform your good office of our willingness to enter into a partnership with the 
          <span className="font-semibold"> {details.partnership ?? "_____________"}</span> of National University in their extension program entitled: 
          <span className="font-semibold"> {details.entitled ?? "_____________"}</span>, which will run from 
          <span className="font-semibold"> {details.conducted_on ?? "_____________"}</span> up until the program’s termination.
        </p>

        <p className="mt-4 leading-relaxed text-justify">
          With this manifestation of consent, I also would like to establish our full cooperation on the activities and plans for this said program from the start until it ends as it may be mutually beneficial to both parties involved.
        </p>

        <p className="mt-4 leading-relaxed">
          I hereby affix my signature on this date to manifest my concurrence on behalf of the 
          <span className="font-semibold"> {details.behalf_of ?? "_____________"}</span>.
        </p>

        <p className="mt-6">Sincerely,</p>

        <div className="mt-12">
          <p className="font-semibold">__________________________</p>
          <p>Signature Over Printed Name</p>
          <p>Designation: {details.designation ?? "_____________"}</p>
          <p>Organization/Institution: {details.organization ?? "_____________"}</p>
          <p>Address: {details.address ?? "_____________"}</p>
          <p>Mobile Number: {details.mobile_number ?? "_____________"}</p>
          <p>Email Address: {details.email ?? "_____________"}</p>
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        {/* Update button (unchanged behavior) */}
        {isEventOwner && (
          <Button
            onClick={() => navigate("/event/form/006", { state: { formdata: details } })}
            className="bg-[#013a63] text-white px-3 py-2 rounded-md text-xs font-semibold"
            label="Update"
          />
        )}

        {/* Approve + Revise (unchanged behavior) */}
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

        {/* download pdf*/}
        {canDownloadPdf && (
          <Button
            onClick={() => downloadForm6Pdf(details, routeState?.owner)}
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

      {/* Consent Section - Only ComEx for Form6 */}
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
                {details?.commex_approved_by ? (
                  <div className="flex flex-col justify-end h-full">
                    <p className="font-semibold text-green-600 mb-2">Approved</p>
                    <p className="font-medium">
                      {details?.commex_approver?.firstname}{" "}
                      {details?.commex_approver?.lastname}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(details?.commex_approve_date).toLocaleDateString('en-US', { 
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
                className={`${errors.remarks ? "border border-red-500" : ""} bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
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
    </div>
  );
};
