import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "@_src/store/auth";
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveForm8, rejectForm8 } from "@_src/services/formservice";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";

export const Form8Detail = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { event, owner, data: initialData } = state || {};

  const queryClient = useQueryClient();
  const { user, token } = useUserStore((s) => ({ user: s.user, token: s.token }));
  const decryptedUser = token && DecryptUser(user);
  const decryptedToken = token && DecryptString(token);

  const [form8] = useState(initialData || null);

  const roleId = decryptedUser?.role_id;
  const isApprover = useMemo(() => [1, 9, 10, 11].includes(roleId), [roleId]);
  
  // Extract data from form1 and form8
  const form1Data = event?.form1?.[0];
  const form8Data = form8?.[0] || form8;
  
  // Get team leader and members from form1
  const teamLeader = form1Data?.team_members?.[0]; // Assuming first member is leader
  const teamMembers = form1Data?.team_members || [];
  
  const proposedTitle = event?.eventName;
  const introduction = form8Data?.introduction;
  const method = form8Data?.method;
  const findingsDiscussion = form8Data?.finding_discussion;
  const implicationIntervention = form8Data?.implication_intervention;
  const references = form8Data?.references || [];

  console.log(initialData);
  console.log(event);

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
    if (!form8) return false;
    if (!isApprover) return false;
    if (hasUserRoleApproved(form8)) return false;
    if (form8.status === "approved") return false;
    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form8, isApprover]);

  // ✅ Approve
  const { mutate: doApprove, isLoading: approveLoading } = useMutation({
    mutationFn: (vars) => approveForm8(vars),
    onSuccess: (res) => toast(res?.message || "Approved", { type: "success" }),
    onError: () => toast("Failed to approve. Please try again.", { type: "error" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["form8"] }),
  });

  const onApprove = () => {
    if (!form8 || !canAction) return;
    doApprove({ token: decryptedToken, id: form8[0]?.id ?? form8.id, role_id: roleId });
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
    mutationFn: (vars) => rejectForm8(vars),
    onSuccess: (res) => {
      toast(res?.message || "Sent for revision", { type: "success" });
      reset({ remarks: "" });
    },
    onError: () => toast("Failed to submit revision request. Please try again.", { type: "error" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["form8"] }),
  });

  const onSubmitRevise = ({ remarks }) => {
    if (!form8 || !canAction) return;
    const key = remarksKeyByRole[roleId];
    if (!key) return;
    doReject({
      token: decryptedToken,
      id: form8[0]?.id ?? form8.id,
      role_id: roleId,
      [key]: remarks,
    });
    setShowRevise(false);
  };

  const isEventOwner = !!decryptedUser?.id && decryptedUser.id === owner?.id;

  if (!form8) return null;

  return (
    <div className="form8-detail-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
      <div className="w-full max-w-4xl px-4">

        {/* Needs Assessment Report Content */}
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
          <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">TARGET GROUP NEEDS DIAGNOSIS REPORT</h1>
          <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">NEEDS ASSESSMENT REPORT</h1>
          
          {/* I. PROPOSED TITLE */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-700">I. PROPOSED TITLE:</h2>
            <div className="p-3 rounded bg-gray-50 min-h-[40px]">
              {proposedTitle || "No title provided"}
            </div>
          </div>

          {/* II. TEAM */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-700">II. TEAM:</h2>
            
            {/* Team Leader */}
            <div className="mb-3">
              <h3 className="font-medium mb-1 text-gray-600">A. Leader</h3>
              <div className=" p-3 rounded bg-gray-50">
                {teamLeader ? `${teamLeader.name}` : "No team leader specified"}
              </div>
            </div>
            
            {/* Team Members */}
            <div>
              <h3 className="font-medium mb-1 text-gray-600">B. Members</h3>
              <div className=" p-3 rounded bg-gray-50">
                {teamMembers.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {teamMembers.map((member, index) => (
                      <li key={member.id || index} className="text-gray-700">
                        {member.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  "No team members specified"
                )}
              </div>
            </div>
          </div>

          {/* III. REPORT PROPER */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-700">III. REPORT PROPER:</h2>
            
            {/* A. Introduction */}
            <div className="mb-6">
              <h3 className="font-medium mb-2 text-gray-600">A. Introduction</h3>
              <div className=" p-3 rounded bg-gray-50 min-h-[80px]">
                {introduction || "No introduction provided"}
              </div>
            </div>

            {/* B. Method */}
            <div className="mb-6">
              <h3 className="font-medium mb-2 text-gray-600">B. Method</h3>
              <div className=" p-3 rounded bg-gray-50 min-h-[80px]">
                {method || "No method provided"}
              </div>
            </div>

            {/* C. Findings and Discussion */}
            <div className="mb-6">
              <h3 className="font-medium mb-2 text-gray-600">C. Findings and Discussion</h3>
              <div className=" p-3 rounded bg-gray-50 min-h-[80px]">
                {findingsDiscussion || "No findings and discussion provided"}
              </div>
            </div>

            {/* D. Implication for Intervention */}
            <div className="mb-6">
              <h3 className="font-medium mb-2 text-gray-600">D. Implication for Intervention</h3>
              <div className=" p-3 rounded bg-gray-50 min-h-[80px]">
                {implicationIntervention || "No implication for intervention provided"}
              </div>
            </div>

            {/* E. References */}
            <div>
              <h3 className="font-medium mb-2 text-gray-600">E. References</h3>
              <div className=" p-3 rounded bg-gray-50">
                {references.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {references.map((reference, index) => (
                      <li key={reference.id || index} className="text-gray-700">
                        {reference.reference || `Reference ${index + 1}`}
                      </li>
                    ))}
                  </ul>
                ) : (
                  "No references provided"
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          {/* Update button */}
          {isEventOwner && (
            <Button
              onClick={() => navigate("/event/form/008", { state: { formdata: form8 } })}
              className="bg-[#013a63] text-white px-3 py-2 rounded-md text-xs font-semibold"
              label="Update"
            />
          )}

          {/* Approve + Revise */}
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