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
  const findingsDiscussion = form9Data?.finding_discussion;
  const conclusionRecommendations = form9Data?.conclusion_recommendations;

  // Get team leader from user data
  const teamLeader = decryptedUser ? `${decryptedUser.firstname} ${decryptedUser.lastname}` : "";

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

  // ✅ Approve
  const { mutate: doApprove, isLoading: approveLoading } = useMutation({
    mutationFn: (vars) => approveForm9(vars),
    onSuccess: (res) => {
      toast(res?.message || "Approved", { type: "success" })
      // Update local form1 state para mawala agad yung button
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

  return (
    <div className="form9-detail-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
      <div className="w-full max-w-6xl px-4">

        {/* Evaluation and Terminal Report Content */}
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
          <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">
            EXTENSION PROGRAM EVALUATION AND TERMINAL REPORT
          </h1>

          {/* I. PROGRAM TITLE */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">I. PROGRAM TITLE:</h2>
            <div className="border border-gray-300 p-4 rounded bg-gray-50 min-h-[50px] mb-4">
              {programTitle || "No program title provided"}
            </div>

            {/* A. Implementer */}
            <div className="mb-4">
              <h3 className="font-medium mb-2 text-gray-600">A. Implementer</h3>
              <div className="border border-gray-300 p-3 rounded bg-gray-50 min-h-[40px]">
                {implementer || "No implementer specified"}
              </div>
            </div>

            {/* B. Extension Program Management Team */}
            <div className="mb-4">
              <h3 className="font-medium mb-2 text-gray-600">B. Extension Program Management Team</h3>
              <div className="border border-gray-300 p-3 rounded bg-gray-50">
                {managementTeam.length > 0 ? (
                  <div>
                    <p className="font-semibold mb-2">Team Leader: {teamLeader}</p>
                    <p className="font-semibold mb-2">Team members</p>
                    <ul className="list-disc list-inside space-y-1">
                      {managementTeam.map((member, index) => (
                        <li key={member.id || index} className="text-gray-700">
                          {member.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  "No management team members specified"
                )}
              </div>
            </div>

            {/* C. Target Group */}
            <div>
              <h3 className="font-medium mb-2 text-gray-600">C. Target Group</h3>
              <div className="border border-gray-300 p-3 rounded bg-gray-50 min-h-[40px]">
                {targetGroup || "No target group specified"}
              </div>
            </div>
          </div>

          {/* II. EXECUTIVE SUMMARY */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-700">II. EXECUTIVE SUMMARY:</h2>
            
          {/* A. Program Logic Model */}
            <div className="mb-6">
              <h3 className="font-medium mb-3 text-gray-600">A. Program Logic Model</h3>
              
              {logicModels.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 font-semibold">Objectives</th>
                        <th className="border border-gray-300 p-2 font-semibold">Inputs</th>
                        <th className="border border-gray-300 p-2 font-semibold">Activities</th>
                        <th className="border border-gray-300 p-2 font-semibold">Outputs</th>
                        <th className="border border-gray-300 p-2 font-semibold">Outcomes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logicModels.map((item, index) => (
                        <tr key={item.id || index}>
                          <td className="border border-gray-300 p-2 align-top">
                            {item.objectives || "No objectives provided"}
                          </td>
                          <td className="border border-gray-300 p-2 align-top">
                            {item.inputs || "No inputs provided"}
                          </td>
                          <td className="border border-gray-300 p-2 align-top">
                            {item.activities || "No activities provided"}
                          </td>
                          <td className="border border-gray-300 p-2 align-top">
                            {item.outputs || "No outputs provided"}
                          </td>
                          <td className="border border-gray-300 p-2 align-top">
                            {item.outcomes || "No outcomes provided"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4 border border-gray-300 rounded">
                  No logic model data provided
                </div>
              )}
            </div>

            {/* B. Findings and Discussion */}
            <div className="mb-6">
              <h3 className="font-medium mb-2 text-gray-600">B. Findings and Discussion</h3>
              <div className="border border-gray-300 p-4 rounded bg-gray-50 min-h-[80px]">
                {findingsDiscussion || "No findings and discussion provided"}
              </div>
            </div>

            {/* C. Conclusion and Recommendations */}
            <div className="mb-6">
              <h3 className="font-medium mb-2 text-gray-600">C. Conclusion and Recommendations</h3>
              <div className="border border-gray-300 p-4 rounded bg-gray-50 min-h-[80px]">
                {conclusionRecommendations || "No conclusion and recommendations provided"}
              </div>
            </div>
          </div>
        </div>
      </div>

       {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
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
        </div>

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