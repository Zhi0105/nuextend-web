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

export const Form11Detail = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { event, owner, data: initialData } = state || {};
  console.log(event);

  const queryClient = useQueryClient();
  const { user, token } = useUserStore((s) => ({ user: s.user, token: s.token }));
  const decryptedUser = token && DecryptUser(user);
  const decryptedToken = token && DecryptString(token);

  const [form11, setForm11] = useState(initialData || null);

  // Extract data from form11 and form1
  const form11Data = form11?.[0] || form11;
  const form1Data = event?.form1?.[0];
  const programCoordinator = form1Data?.team_members?.[0]?.name;
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

  // ✅ Approve
  const { mutate: doApprove, isLoading: approveLoading } = useMutation({
    mutationFn: (vars) => approveForm11(vars),
    onSuccess: (res) => {
      toast(res?.message || "Approved", { type: "success" })
      // Update local form1 state para mawala agad yung button
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
    const key = remarksKeyByRole[roleId];
    if (!key) return;
    doReject({
      token: decryptedToken,
      id: form11[0]?.id ?? form11.id,
      role_id: roleId,
      [key]: remarks,
    });
    setShowRevise(false);
  };

  const isEventOwner = !!decryptedUser?.id && decryptedUser.id === owner?.id;

  if (!form11) return null;

  return (
    <div className="form11-detail-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
      <div className="w-full max-w-6xl px-4">

        {/* Travel Itinerary Table */}
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
          <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">
            EXTENSION PROGRAM AND PROJECT ITINERARY OF TRAVEL
          </h1>

          {/* Header Info */}
          <div className="grid grid-cols-3 gap-4 mb-6 border-b pb-4">
            <div>
              <label className="font-semibold text-gray-700">Program Coordinator / Project Leader</label>
              <div className="border border-gray-300 p-2 rounded bg-gray-50 min-h-[40px] mt-1">
                {programCoordinator || "Not specified"}
              </div>
            </div>
            <div>
              <label className="font-semibold text-gray-700">Transportation Medium</label>
              <div className="border border-gray-300 p-2 rounded bg-gray-50 min-h-[40px] mt-1">
                {transportationMedium || "Not specified"}
              </div>
            </div>
            <div>
              <label className="font-semibold text-gray-700">Driver</label>
              <div className="border border-gray-300 p-2 rounded bg-gray-50 min-h-[40px] mt-1">
                {driver || "Not specified"}
              </div>
            </div>
          </div>

          {/* Travel Details Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 font-semibold">Date and Phase</th>
                  <th className="border border-gray-300 p-2 font-semibold" colSpan="2">Destination</th>
                  <th className="border border-gray-300 p-2 font-semibold" colSpan="2">Time</th>
                  <th className="border border-gray-300 p-2 font-semibold">Trip Duration</th>
                  <th className="border border-gray-300 p-2 font-semibold">Purpose</th>
                </tr>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2"></th>
                  <th className="border border-gray-300 p-2 font-medium">From</th>
                  <th className="border border-gray-300 p-2 font-medium">To</th>
                  <th className="border border-gray-300 p-2 font-medium">Departure</th>
                  <th className="border border-gray-300 p-2 font-medium">Arrival</th>
                  <th className="border border-gray-300 p-2 font-medium"></th>
                  <th className="border border-gray-300 p-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {travelDetails.map((detail, index) => (
                  <tr key={detail.id || index}>
                    <td className="border border-gray-300 p-2">
                      {detail.date ? new Date(detail.date).toLocaleDateString() : ""}
                    </td>
                    <td className="border border-gray-300 p-2">{detail.from || ""}</td>
                    <td className="border border-gray-300 p-2">{detail.to || ""}</td>
                    <td className="border border-gray-300 p-2">
        {detail.departure ? new Date(detail.departure).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
      </td>
                     <td className="border border-gray-300 p-2">
        {detail.arrival ? new Date(detail.arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
      </td>
                    <td className="border border-gray-300 p-2">{detail.trip_duration || ""}</td>
                    <td className="border border-gray-300 p-2">{detail.purpose || ""}</td>
                  </tr>
                ))}
                {/* Empty rows if needed */}
                {travelDetails.length === 0 && (
                  <tr>
                    <td className="border border-gray-300 p-2 text-center text-gray-500" colSpan="7">
                      No travel details provided
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          {isEventOwner && (
            <Button
              onClick={() => navigate("/event/form/011", { state: { formdata: form11 } })}
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