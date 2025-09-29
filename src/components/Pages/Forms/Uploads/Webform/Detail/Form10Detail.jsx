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

export const Form10Detail = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { event, owner, data: initialData } = state || {};
  console.log(event);

  const queryClient = useQueryClient();
  const { user, token } = useUserStore((s) => ({ user: s.user, token: s.token }));
  const decryptedUser = token && DecryptUser(user);
  const decryptedToken = token && DecryptString(token);

  const [form10, setForm10] = useState(initialData || null);

  // Extract data from form10 and event
  const form10Data = form10?.[0] || form10;
  const form7Data = event?.form7?.[0]; 
 const aoopData = form10Data?.oaopb || []; // Objectives, Activities, Outputs, Personnel data
  const discussion = form10Data?.discussion;
  
  // Project data from event
  const projectTitle = event?.eventName;
  const targetGroup = event?.target_group;
  const implementationDate = form7Data?.conducted_on; /// Using created_at as implementation date

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

  // ✅ Approve
  const { mutate: doApprove, isLoading: approveLoading } = useMutation({
    mutationFn: (vars) => approveForm10(vars),
    onSuccess: (res) => {
      toast(res?.message || "Approved", { type: "success" })
      // Update local form1 state para mawala agad yung button
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
    const key = remarksKeyByRole[roleId];
    if (!key) return;
    doReject({
      token: decryptedToken,
      id: form10[0]?.id ?? form10.id,
      role_id: roleId,
      [key]: remarks,
    });
    setShowRevise(false);
  };

  const isEventOwner = !!decryptedUser?.id && decryptedUser.id === owner?.id;

  if (!form10) return null;

  return (
    <div className="form10-detail-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
      <div className="w-full max-w-6xl px-4">

        {/* Outreach Project Evaluation Content */}
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
          <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">
            OUTREACH PROJECT EVALUATION AND DOCUMENTATION REPORT
          </h1>

          {/* I. PROJECT TITLE */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-700">I. PROJECT TITLE:</h2>
            <div className="border border-gray-300 p-4 rounded bg-gray-50 min-h-[50px]">
              {projectTitle || "No project title provided"}
            </div>
          </div>

          {/* II. TARGET GROUP */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-700">II. TARGET GROUP:</h2>
            <div className="border border-gray-300 p-4 rounded bg-gray-50 min-h-[50px] mb-2">
              {targetGroup || "No target group specified"}
            </div>
            <p className="text-sm text-gray-600 italic">
              Important Note: Please attach the attendance or registration sheet.
            </p>
          </div>

          {/* III. DATE OF IMPLEMENTATION */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-700">III. DATE OF IMPLEMENTATION:</h2>
            <div className="border border-gray-300 p-4 rounded bg-gray-50 min-h-[50px]">
              {implementationDate || "No date specified"}
            </div>
          </div>

          {/* IV. REPORT PROPER */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-700">IV. REPORT PROPER:</h2>
            
            {/* A. Objectives, Activities, Outputs, Personnels and Budgeting */}
            <div className="mb-6">
              <h3 className="font-medium mb-3 text-gray-600">A. Objectives, Activities, Outputs, Personnels and Budgeting</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 font-semibold">Objectives</th>
                      <th className="border border-gray-300 p-2 font-semibold">Activities</th>
                      <th className="border border-gray-300 p-2 font-semibold">Outputs</th>
                      <th className="border border-gray-300 p-2 font-semibold">Personnel</th>
                      <th className="border border-gray-300 p-2 font-semibold">Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aoopData.map((item, index) => (
                      <tr key={item.id || index}>
                        <td className="border border-gray-300 p-2 align-top">
                          {item.objectives || ""}
                        </td>
                        <td className="border border-gray-300 p-2 align-top">
                          {item.activities || ""}
                        </td>
                        <td className="border border-gray-300 p-2 align-top">
                          {item.outputs || ""}
                        </td>
                        <td className="border border-gray-300 p-2 align-top">
                          {item.personnel || ""}
                        </td>
                        <td className="border border-gray-300 p-2 align-top">
                          {item.budget || ""}
                        </td>
                      </tr>
                    ))}
                    {/* Empty rows if no data */}
                    {aoopData.length === 0 && (
                      <tr>
                        <td className="border border-gray-300 p-2 text-center text-gray-500" colSpan="5">
                          No data provided
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-600 italic mt-2">
                Important Note: Filling out this matrix with accurate data will be helpful.
              </p>
            </div>

            {/* B. Discussion */}
            <div className="mb-6">
              <h3 className="font-medium mb-2 text-gray-600">B. Discussion:</h3>
              <div className="border border-gray-300 p-4 rounded bg-gray-50 min-h-[100px]">
                {discussion || "No discussion provided"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          {isEventOwner && (
            <Button
              onClick={() => navigate("/event/form/010", { state: { formdata: form10 } })}
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