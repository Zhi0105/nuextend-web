import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "@_src/store/auth";
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveForm12, rejectForm12 } from "@_src/services/formservice"; // 🔄 update services for form12
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";

export const Form12Detail = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { owner, data: initialData } = state || {};

  const queryClient = useQueryClient();
  const { user, token } = useUserStore((s) => ({ user: s.user, token: s.token }));
  const decryptedUser = token && DecryptUser(user);
  const decryptedToken = token && DecryptString(token);

  const [form12] = useState(initialData || null);

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
    if (hasUserRoleApproved(form12)) return false;
    if (form12.status === "approved") return false;
    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form12, isApprover]);

  // ✅ Approve
  const { mutate: doApprove, isLoading: approveLoading } = useMutation({
    mutationFn: (vars) => approveForm12(vars),
    onSuccess: (res) => toast(res?.message || "Approved", { type: "success" }),
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
      <div className="flex gap-2">
        {/* Update button */}
        {isEventOwner && (
          <Button
            onClick={() => navigate("/event/form/012", { state: { formdata: form12 } })}
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
