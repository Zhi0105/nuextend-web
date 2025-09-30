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

export const Form7Detail = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { owner, data: initialData } = state || {};

  const queryClient = useQueryClient();
  const { user, token } = useUserStore((s) => ({ user: s.user, token: s.token }));
  const decryptedUser = token && DecryptUser(user);
  const decryptedToken = token && DecryptString(token);

  const [form7, setForm7] = useState(initialData || null);
  const formData = Array.isArray(form7) ? form7[0] : form7;

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
    const key = remarksKeyByRole[roleId];
    if (!key) return;
    doReject({
      token: decryptedToken,
      id: formData.id,
      role_id: roleId,
      [key]: remarks,
    });
    setShowRevise(false);
  };

  const isEventOwner = !!decryptedUser?.id && decryptedUser.id === owner?.id;

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
        {isEventOwner && (
          <Button
            onClick={() => navigate("/event/form/007", { state: { formdata: formData } })}
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
