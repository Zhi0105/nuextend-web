import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "@_src/store/auth";
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveForm12, rejectForm12 } from "@_src/services/formservice";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";

export const Form12Detail = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { event, owner, data: initialData } = state || {};
  console.log(event);

  const queryClient = useQueryClient();
  const { user, token } = useUserStore((s) => ({ user: s.user, token: s.token }));
  const decryptedUser = token && DecryptUser(user);
  const decryptedToken = token && DecryptString(token);

  const [form12, setForm12] = useState(initialData || null);

  // Extract data from form12
  const form12Data = form12?.[0] || form12;
  const attenders = form12Data?.attendees || []; 
  const callToOrder = form12Data?.call_to_order;
  const approvalMinutes = form12Data?.approval_minutes;
  const newItems = form12Data?.new_items || []; // Note: field name is "not_items" in your data
  const otherMatters = form12Data?.other_matters;
  const adjournment = form12Data?.adjournment;
  const documentation = form12Data?.documentation;
  // const meetingDate = form12Data?.meeting_date;

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
    if (!form12) return false;
    if (!isApprover) return false;
    if (hasUserRoleApproved(form12[0])) return false;
    if (form12.status === "approved") return false;
    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form12, isApprover]);

  // ✅ Approve
  const { mutate: doApprove, isLoading: approveLoading } = useMutation({
    mutationFn: (vars) => approveForm12(vars),
    onSuccess: (res) => {
      toast(res?.message || "Approved", { type: "success" })
      // Update local form1 state para mawala agad yung button
      setForm12((prev) => {
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
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["form12"] }),
  });

  const onApprove = () => {
    if (!form12 || !canAction) return;
    doApprove({
      token: decryptedToken,
      id: form12[0]?.id ?? form12.id,
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
    mutationFn: (vars) => rejectForm12(vars),
    onSuccess: (res) => {
      toast(res?.message || "Sent for revision", { type: "success" });
      reset({ remarks: "" });
    },
    onError: () =>
      toast("Failed to submit revision request. Please try again.", { type: "error" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["form12"] }),
  });

  const onSubmitRevise = ({ remarks }) => {
    if (!form12 || !canAction) return;
    const key = remarksKeyByRole[roleId];
    if (!key) return;
    doReject({
      token: decryptedToken,
      id: form12[0]?.id ?? form12.id,
      role_id: roleId,
      [key]: remarks,
    });
    setShowRevise(false);
  };

  const isEventOwner = !!decryptedUser?.id && decryptedUser.id === owner?.id;

  if (!form12) return null;

  return (
    <div className="form12-detail-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
      <div className="w-full max-w-6xl px-4">
        {/* Meeting Minutes Content */}
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
          <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">
            MEETING MINUTES
          </h1>

         {/* I. ATTENDERS */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">I. ATTENDERS:</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 font-semibold">A</th>
                    <th className="border border-gray-300 p-2 font-semibold">Full Name</th>
                    <th className="border border-gray-300 p-2 font-semibold">Designation</th>
                    <th className="border border-gray-300 p-2 font-semibold">School/Department</th>
                  </tr>
                </thead>
                <tbody>
                  {attenders.map((attender, index) => (
                    <tr key={attender.id || index}>
                      <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                      <td className="border border-gray-300 p-2">{attender.full_name || ""}</td>
                      <td className="border border-gray-300 p-2">{attender.designation || ""}</td>
                      <td className="border border-gray-300 p-2">
                        {attender.department?.name || attender.program?.name || ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t border-gray-300 my-6"></div>

          {/* II. CALL TO ORDER */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">II. CALL TO ORDER:</h2>
            <div className="border border-gray-300 p-4 rounded bg-gray-50 min-h-[60px]">
              {callToOrder || "No call to order provided"}
            </div>
          </div>

          <div className="border-t border-gray-300 my-6"></div>

          {/* III. APPROVAL OF MINUTES FROM THE LAST MEETING */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">III. APPROVAL OF MINUTES FROM THE LAST MEETING:</h2>
            <div className="border border-gray-300 p-4 rounded bg-gray-50 min-h-[60px]">
              {approvalMinutes || "No approval minutes provided"}
            </div>
          </div>

          <div className="border-t border-gray-300 my-6"></div>

         {/* IV. NEW ITEMS */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">IV. NEW ITEMS:</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 font-semibold">A</th>
                      <th className="border border-gray-300 p-2 font-semibold">Topic</th>
                      <th className="border border-gray-300 p-2 font-semibold">Discussion</th>
                      <th className="border border-gray-300 p-2 font-semibold">Resolution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newItems.map((item, index) => (
                      <tr key={item.id || index}>
                        <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                        <td className="border border-gray-300 p-2">{item.topic || ""}</td>
                        <td className="border border-gray-300 p-2">{item.discussion || ""}</td>
                        <td className="border border-gray-300 p-2">{item.resolution || ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          <div className="border-t border-gray-300 my-6"></div>

          {/* V. OTHER MATTERS */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">V. OTHER MATTERS:</h2>
            <div className="border border-gray-300 p-4 rounded bg-gray-50 min-h-[60px]">
              {otherMatters || "No other matters provided"}
            </div>
          </div>

          <div className="border-t border-gray-300 my-6"></div>

          {/* VI. ADJOURNMENT */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">VI. ADJOURNMENT:</h2>
            <div className="border border-gray-300 p-4 rounded bg-gray-50 min-h-[60px]">
              The meeting adjourned at exactly {adjournment ? new Date(adjournment).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "______"}.
            </div>
          </div>

          {/* VII. DOCUMENTATION */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">VII. DOCUMENTATION:</h2>
            <div className="border border-gray-300 p-4 rounded bg-gray-50 min-h-[60px]">
              {documentation || "No documentation provided"}
            </div>
          </div>
        </div>
      </div>

          {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          {isEventOwner && (
            <Button
              onClick={() => navigate("/event/form/012", { state: { formdata: form12 } })}
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