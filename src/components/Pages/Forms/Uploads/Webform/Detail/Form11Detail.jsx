import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "@_src/store/auth";
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveForm11, rejectForm11 } from "@_src/services/formservice";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { downloadForm11Pdf } from "@_src/utils/pdf/form11Pdf";
import { checkApprovalProcess } from "@_src/utils/approval";
import { getFormNumber } from "@_src/utils/approval";

export const Form11Detail = () => {
  const { state, pathname } = useLocation();
  const navigate = useNavigate();
  const { event, owner, data: initialData } = state || {};

  const queryClient = useQueryClient();
  const { user, token } = useUserStore((s) => ({ user: s.user, token: s.token }));
  const decryptedUser = token && DecryptUser(user);
  const decryptedToken = token && DecryptString(token);

  const [form11, setForm11] = useState(initialData || null);

  const approvalCheck = checkApprovalProcess(getFormNumber(pathname), decryptedUser?.role_id, [ form11[0]?.is_dean && 9, form11[0]?.is_commex && 1, form11[0]?.is_asd && 10, form11[0]?.is_ad && 11, ].filter(Boolean), (owner?.role_id === 1 || owner?.role_id === 4), (owner?.role_id === 4))
  const isApprovalCheckPass = approvalCheck?.included && ( Number(decryptedUser?.role_id) === Number(approvalCheck?.nextApprover));
  
  // Extract data from form11 and form1
  const form11Data = form11?.[0] || form11;
  const programCoordinator = event?.user ? `${event.user.firstname} ${event.user.middlename} ${event.user.lastname}` : "";
  const transportationMedium = form11Data?.transportation_medium;
  const driver = form11Data?.driver;
  const travelDetails = form11Data?.travel_details || [];

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
    if (!form11) return false;
    if (!isApprover) return false;
    if (hasUserRoleApproved(form11[0])) return false;
    if (form11.status === "approved") return false;
    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form11, isApprover]);

  // PDF Download Logic
  const canDownloadPdf = useMemo(() => {
    if (!form11) return false;
    
    const formData = form11[0] || form11;
    
    // For Form11, only need ComEx and ASD approval
    return formData?.commex_approved_by && formData?.asd_approved_by;
  }, [form11]);

  // ✅ Approve
  const { mutate: doApprove, isLoading: approveLoading } = useMutation({
    mutationFn: (vars) => approveForm11(vars),
    onSuccess: (res) => {
      toast(res?.message || "Approved", { type: "success" })
      setForm11((prev) => {
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
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["form11"] }),
  });

  const onApprove = () => {
    if (!form11 || !canAction) return;
    doApprove({
      token: decryptedToken,
      id: form11[0]?.id ?? form11.id,
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
    mutationFn: (vars) => rejectForm11(vars),
    onSuccess: (res) => {
      toast(res?.message || "Sent for revision", { type: "success" });
      reset({ remarks: "" });
    },
    onError: () =>
      toast("Failed to submit revision request. Please try again.", { type: "error" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["form11"] }),
  });

  const onSubmitRevise = ({ remarks }) => {
    if (!form11 || !canAction) return;
    
    doReject({ 
      token: decryptedToken, 
      id: form11[0]?.id ?? form11.id, 
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

    // Filter remarks for this specific form11 and sort by newest first
    const form11Remarks = event.form_remarks
      .filter(remark => 
        remark.form_type === 'form11' && // ✅ Use 'form11' as form_type
        remark.form_id === formData?.id
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setRemarksModal({ 
      show: true, 
      remarks: form11Remarks,
      approver: 'All Remarks' 
    });
  };

  if (!form11) return null;

  const formData = form11[0] || form11;

    const isFullyApproved = useMemo(() => {
      if (!formData) return false;
      
      // For Form11, only need ComEx and ASD approval regardless of role
      return formData.commex_approved_by && 
            formData.asd_approved_by;
    }, [formData]);

  return (
    <div className="project-detail-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
      <div className="w-full max-w-5xl bg-white shadow rounded-lg p-6 my-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">EXTENSION PROGRAM AND PROJECT ITINERARY OF TRAVEL</h2>

        {/* Header Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="mb-4">
            <p className="font-semibold text-gray-600">Program Coordinator / Project Leader</p>
            <p>{programCoordinator || "Not specified"}</p>
          </div>
          <div className="mb-4">
            <p className="font-semibold text-gray-600">Transportation Medium</p>
            <p>{transportationMedium || "Not specified"}</p>
          </div>
          <div className="mb-4">
            <p className="font-semibold text-gray-600">Driver</p>
            <p>{driver || "Not specified"}</p>
          </div>
        </div>

        {/* Travel Details Table */}
        <table className="w-full border mt-2 table-fixed">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 break-words whitespace-normal">Date and Phase</th>
              <th className="border p-2 break-words whitespace-normal" colSpan="2">Destination</th>
              <th className="border p-2 break-words whitespace-normal" colSpan="2">Time</th>
              <th className="border p-2 break-words whitespace-normal">Trip Duration</th>
              <th className="border p-2 break-words whitespace-normal">Purpose</th>
            </tr>
            <tr className="bg-gray-50">
              <th className="border p-2"></th>
              <th className="border p-2 font-medium break-words whitespace-normal">From</th>
              <th className="border p-2 font-medium break-words whitespace-normal">To</th>
              <th className="border p-2 font-medium break-words whitespace-normal">Departure</th>
              <th className="border p-2 font-medium break-words whitespace-normal">Arrival</th>
              <th className="border p-2 font-medium break-words whitespace-normal"></th>
              <th className="border p-2 font-medium break-words whitespace-normal"></th>
            </tr>
          </thead>
          <tbody>
            {travelDetails.length > 0 ? (
              travelDetails.map((detail, index) => (
                <tr key={detail.id || index}>
                  <td className="border p-2 break-words whitespace-normal">
                    {detail.date ? new Date(detail.date).toLocaleDateString() : ""}
                  </td>
                  <td className="border p-2 break-words whitespace-normal">{detail.from || ""}</td>
                  <td className="border p-2 break-words whitespace-normal">{detail.to || ""}</td>
                  <td className="border p-2 break-words whitespace-normal">
                    {detail.departure ? new Date(detail.departure).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                  </td>
                  <td className="border p-2 break-words whitespace-normal">
                    {detail.arrival ? new Date(detail.arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                  </td>
                  <td className="border p-2 break-words whitespace-normal">{detail.trip_duration || ""}</td>
                  <td className="border p-2 break-words whitespace-normal">{detail.purpose || ""}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="border p-2 italic text-gray-500 text-center">
                  No travel details provided
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Consent Section - Only ComEx and ASD */}
      <h2 className="text-2xl font-bold text-gray-800 mb-6 mt-8">Consent</h2>

      <div className="w-full max-w-5xl mt-6">
        <table className="w-full border border-collapse">
          <thead>
            <tr>
              <th className="border p-2 text-center">ComEx</th>
              <th className="border p-2 text-center">Academic Services Director</th>
            </tr>
          </thead>
          <tbody>
            <tr>
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
            </tr>
          </tbody>
        </table>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 mt-4">
        {isEventOwner && !isFullyApproved && (
          <Button
            onClick={() => navigate("/event/form/011", { state: { formdata: form11 } })}
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
            onClick={() => downloadForm11Pdf(form11, event, owner, roleId)}
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