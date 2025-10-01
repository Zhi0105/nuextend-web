import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "@_src/store/auth";
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveForm9, rejectForm9 } from "@_src/services/formservice";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { downloadForm9Pdf } from "@_src/utils/pdf/form9Pdf";

export const Form9Detail = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { event, owner, data: initialData } = state || {};
  console.log(event);

  const queryClient = useQueryClient();
  const { user, token } = useUserStore((s) => ({ user: s.user, token: s.token }));
  const decryptedUser = token && DecryptUser(user);
  const decryptedToken = token && DecryptString(token);

  const [form9, setForm9] = useState(initialData || null);

  // Extract data from form9 and related data
  const form9Data = form9?.[0] || form9;
  const form1Data = event?.form1?.[0];

  // Program Title and Team Data
  const programTitle = event?.eventName;
  const implementer = event?.organization?.name;
  const managementTeam = form1Data?.team_members || [];
  const targetGroup = event?.target_group;

  // Executive Summary Data from form9
  const logicModels = form9Data?.logic_models || [];
  const findingsDiscussion = form9Data?.findings_discussion;
  const conclusionRecommendations = form9Data?.conclusion_recommendations;

  // Get team leader from user data
  const teamLeader = event?.user ? `${event.user.firstname} ${event.user.middlename} ${event.user.lastname}` : "";

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
    if (!form9) return false;
    if (!isApprover) return false;
    if (hasUserRoleApproved(form9[0])) return false;
    if (form9.status === "approved") return false;
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form9, isApprover]);

  // PDF Download Logic
  const canDownloadPdf = useMemo(() => {
    if (!form9) return false;
    
    const formData = form9[0] || form9;
    
    // For ComEx (roleId 1) and role 4 - need 3 approvals (excluding dean)
    if ([1, 4].includes(roleId)) {
      return formData?.commex_approved_by && formData?.asd_approved_by && formData?.ad_approved_by;
    }
    
    // For role 3 - need dean approval AND the other 3 approvers
    if (roleId === 3) {
      return formData?.dean_approved_by && formData?.commex_approved_by && formData?.asd_approved_by && formData?.ad_approved_by;
    }
    
    return false;
  }, [form9, roleId]);

  // ✅ Approve
  const { mutate: doApprove, isLoading: approveLoading } = useMutation({
    mutationFn: (vars) => approveForm9(vars),
    onSuccess: (res) => {
      toast(res?.message || "Approved", { type: "success" })
      setForm9((prev) => {
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
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["form9"] }),
  });

  const onApprove = () => {
    if (!form9 || !canAction) return;
    doApprove({
      token: decryptedToken,
      id: form9[0]?.id ?? form9.id,
      role_id: roleId,
    });
  };

  // ✅ Revise
  const [showRevise, setShowRevise] = useState(false);
  const remarksKeyByRole = {
    1: "commex_remarks",
    9: "dean_remarks",
    10: "asd_remarks",
    11: "ad_remarks",
  };

  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({ defaultValues: { remarks: "" } });

  const { mutate: doReject, isLoading: rejectLoading } = useMutation({
    mutationFn: (vars) => rejectForm9(vars),
    onSuccess: (res) => {
      toast(res?.message || "Sent for revision", { type: "success" });
      reset({ remarks: "" });
    },
    onError: () =>
      toast("Failed to submit revision request. Please try again.", { type: "error" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["form9"] }),
  });

  const onSubmitRevise = ({ remarks }) => {
    if (!form9 || !canAction) return;
    const key = remarksKeyByRole[roleId];
    if (!key) return;
    doReject({
      token: decryptedToken,
      id: form9[0]?.id ?? form9.id,
      role_id: roleId,
      [key]: remarks,
    });
    setShowRevise(false);
  };

  const isEventOwner = !!decryptedUser?.id && decryptedUser.id === owner?.id;

  if (!form9) return null;

  const formData = form9[0] || form9;

  return (
    <div className="project-detail-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
      <div className="w-full max-w-5xl bg-white shadow rounded-lg p-6 my-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">EXTENSION PROGRAM EVALUATION AND TERMINAL REPORT</h2>

        {/* I. PROGRAM TITLE */}
        <h2 className="text-1xl font-bold text-gray-800 mb-6">I. PROGRAM TITLE:</h2>
        <div className="mb-6">
          <p>{programTitle || "No program title provided"}</p>
        </div>

        {/* A. Implementer */}
        <div className="mb-6">
          <p className="font-semibold text-gray-600">A. Implementer</p>
          <p>{implementer || "No implementer specified"}</p>
        </div>

        {/* B. Extension Program Management Team */}
        <div className="mb-6">
          <p className="font-semibold text-gray-600">B. Extension Program Management Team</p>
          
          {/* 1. Program Coordinator */}
          <div className="ml-4 mt-2">
            <p className="font-semibold text-gray-600">1. Program Coordinator</p>
            <p>{teamLeader || "No program coordinator specified"}</p>
          </div>

          {/* 2. Team Members */}
          <div className="ml-4 mt-4">
            <p className="font-semibold text-gray-600">2. Team Members</p>
            <ul className="list-disc ml-6">
              {managementTeam.length > 0 ? (
                managementTeam.map((member, index) => (
                  <li key={member.id || index}>{member.name}</li>
                ))
              ) : (
                <li>No management team members specified</li>
              )}
            </ul>
          </div>
        </div>

        {/* C. Target Group */}
        <div className="mb-6">
          <p className="font-semibold text-gray-600">C. Target Group</p>
          <p>{targetGroup || "No target group specified"}</p>
        </div>

        {/* II. EXECUTIVE SUMMARY */}
        <h2 className="text-1xl font-bold text-gray-800 mb-6">II. EXECUTIVE SUMMARY:</h2>

        {/* A. Program Logic Model */}
        <div className="mb-6">
          <p className="font-semibold text-gray-600">A. Program Logic Model</p>
        </div>
        <table className="w-full border mt-2 table-fixed">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 break-words whitespace-normal">Objectives</th>
              <th className="border p-2 break-words whitespace-normal">Inputs</th>
              <th className="border p-2 break-words whitespace-normal">Activities</th>
              <th className="border p-2 break-words whitespace-normal">Outputs</th>
              <th className="border p-2 break-words whitespace-normal">Outcomes</th>
            </tr>
          </thead>
          <tbody>
            {logicModels.length > 0 ? (
              logicModels.map((item, index) => (
                <tr key={item.id || index}>
                  <td className="border p-2 break-words whitespace-normal">{item.objectives || "No objectives provided"}</td>
                  <td className="border p-2 break-words whitespace-normal">{item.inputs || "No inputs provided"}</td>
                  <td className="border p-2 break-words whitespace-normal">{item.activities || "No activities provided"}</td>
                  <td className="border p-2 break-words whitespace-normal">{item.outputs || "No outputs provided"}</td>
                  <td className="border p-2 break-words whitespace-normal">{item.outcomes || "No outcomes provided"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="border p-2 italic text-gray-500 text-center">
                  No logic model data provided
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* B. Findings and Discussion */}
        <div className="mb-6 mt-6">
          <p className="font-semibold text-gray-600">B. Findings and Discussion</p>
          <p className="break-words whitespace-normal">{findingsDiscussion || "No findings and discussion provided"}</p>
        </div>

        {/* C. Conclusion and Recommendations */}
        <div className="mb-6">
          <p className="font-semibold text-gray-600">C. Conclusion and Recommendations</p>
          <p className="break-words whitespace-normal">{conclusionRecommendations || "No conclusion and recommendations provided"}</p>
        </div>
      </div>

      {/* Consent Section */}
      <h2 className="text-2xl font-bold text-gray-800 mb-6 mt-8">Consent</h2>

      <div className="w-full max-w-5xl mt-6">
        <table className="w-full border border-collapse">
          <thead>
            <tr>
              {roleId === 2 && <th className="border p-2 text-center">Dean</th>}
              <th className="border p-2 text-center">ComEx</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* Dean Column */}
              {roleId === 2 && (
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
                    <div className="flex items-center justify-center h-full">
                      <p className="italic text-gray-500">Awaiting Approval</p>
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
                  <div className="flex items-center justify-center h-full">
                    <p className="italic text-gray-500">Awaiting Approval</p>
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="w-full max-w-5xl mt-6">
        <table className="w-full border border-collapse">
          <thead>
            <tr>
              <th className="border p-2 text-center">Academic Services Director</th>
              <th className="border p-2 text-center">Academic Director</th>
            </tr>
          </thead>
          <tbody>
            <tr>
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
                  <div className="flex items-center justify-center h-full">
                    <p className="italic text-gray-500">Awaiting Approval</p>
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
                  <div className="flex items-center justify-center h-full">
                    <p className="italic text-gray-500">Awaiting Approval</p>
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 mt-4">
        {isEventOwner && (
          <Button
            onClick={() => navigate("/event/form/009", { state: { formdata: form9 } })}
            className="bg-[#013a63] text-white px-3 py-2 rounded-md text-xs font-semibold"
            label="Update"
          />
        )}
        {canAction && (
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
            onClick={() => downloadForm9Pdf(form9, event, owner, roleId)}
            className="bg-indigo-600 text-white px-3 py-2 rounded-md text-xs font-semibold"
          >
            Download PDF
          </Button>
        )}
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