import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "@_src/store/auth";
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveForm4, rejectForm4 } from "@_src/services/formservice";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";

// ✅ Buttons: UPDATE + APPROVE + REVISE + CHECKLIST
export const Form4Detail = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { owner, data: initialData } = state || {};

  const queryClient = useQueryClient();
  const { user, token } = useUserStore((s) => ({ user: s.user, token: s.token }));
  const decryptedUser = token && DecryptUser(user);
  const decryptedToken = token && DecryptString(token);

  // Normalize initialData to an object (if API returns an array, take first element)
  const [form4, setForm4] = useState(() => {
    if (!initialData) return null;
    if (Array.isArray(initialData)) return initialData[0] ?? null;
    return initialData;
  });

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
    if (!form4) return false;
    if (!isApprover) return false;
    if (hasUserRoleApproved(form4[0])) return false;
    if (form4.status === "approved") return false;
    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form4, isApprover]); // keep deps simple

  // Helper: robust truth check (handles true/"true"/1/"1")
  const isChecked = (key) => {
    const v = form4?.[key];
    return v === true || v === "true" || v === 1 || v === "1";
  };

  // Approve
  const { mutate: doApprove, isLoading: approveLoading } = useMutation({
    mutationFn: (vars) => approveForm4(vars),
    onSuccess: (res) => {
      toast(res?.message || "Approved", { type: "success" })
      // Update local form1 state para mawala agad yung button
      setForm4((prev) => {
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
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["form4"] }),
  });

  const onApprove = () => {
    if (!form4 || !canAction) return;
    doApprove({ token: decryptedToken, id: form4.id, role_id: roleId });
  };

  // Revise
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
    mutationFn: (vars) => rejectForm4(vars),
    onSuccess: (res) => {
      toast(res?.message || "Sent for revision", { type: "success" });
      reset({ remarks: "" });
    },
    onError: () => toast("Failed to submit revision request. Please try again.", { type: "error" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["form4"] }),
  });

  const onSubmitRevise = ({ remarks }) => {
    if (!form4 || !canAction) return;
    const key = remarksKeyByRole[roleId];
    if (!key) return;
    doReject({
      token: decryptedToken,
      id: form4.id,
      role_id: roleId,
      [key]: remarks,
    });
    setShowRevise(false);
  };

  const isEventOwner = !!decryptedUser?.id && decryptedUser.id === owner?.id;

  if (!form4) return null;

  // Checklist mapping (A–P)
  const checklist = [
    { key: "a", label: "A. Is the program strongly linked to teaching and research that is appropriate to the identity of National University as a higher educational institution?" },
    { key: "b", label: "B. Is it going to be built and maintained on the basis of the existing academic or research programs that the University have?" },
    { key: "c", label: "C. Is the program relevant to the core competencies of the School or Department?" },
    { key: "d", label: "D. Does it involve the input and collaboration of the target group?" },
    { key: "e", label: "E. Is the target group willing to take part in the implementation, monitoring, and evaluation of the program?" },
    { key: "f", label: "F. Are there assurances that the cooperating department or agency will support the program?" },
    { key: "g", label: "G. Is it to be done within a community that we have MOA with?" },
    { key: "h", label: "H. Does the program promote social transformation that is in line with the University’s core values?" },
    { key: "i", label: "I. Is the program not financially demanding so as not draining to financial resources allotted..." },
    { key: "j", label: "J. Is there a good number of appropriate personnel who will implement the program both on the side of University and the target group?" },
    { key: "k", label: "K. Is there any external funding agency that shall support the program?" },
    { key: "l", label: "L. Is the proponent capable of managing the program sustainably?" },
    { key: "m", label: "M. Will the program contribute to the holistic growth of the community?" },
    { key: "n", label: "N. Does the program have a clearly stated background, significance, intended outcomes, and projects to support and realize the objectives?" },
    { key: "o", label: "O. Are there formal studies, community assessments, and problem analyses that were conducted?" },
    { key: "p", label: "P. Does the program have specific and measurable results?" },
  ];

  return (
    <div className="form4-detail-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">CHECKLIST OF CRITERIA FOR EXTENSION PROGRAM PROPOSAL</h2>
      {/* Checklist Table */}
      <div className="w-full max-w-4xl border rounded-lg shadow">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2 text-left">Criteria</th>
              <th className="border p-2 text-center w-20">Yes</th>
              <th className="border p-2 text-center w-20">No</th>
            </tr>
          </thead>
          <tbody>
            {/* I. Relevance to Academic and Research Programs */}
            <tr>
              <td colSpan="3" className="border p-2 font-bold bg-gray-100">
                I. Relevance to Academic and Research Programs
              </td>
            </tr>
            {["a", "b", "c"].map((key, idx) => (
              <tr key={key} className="odd:bg-gray-50 even:bg-white">
                <td className="border p-2">{checklist.find((i) => i.key === key)?.label}</td>
                <td className="border p-2 text-center">{isChecked(key) ? "✔" : ""}</td>
                <td className="border p-2 text-center">{!isChecked(key) ? "✔" : ""}</td>
              </tr>
            ))}

            {/* II. Collaborative and Participatory */}
            <tr>
              <td colSpan="3" className="border p-2 font-bold bg-gray-100">
                II. Collaborative and Participatory
              </td>
            </tr>
            {["d", "e", "f", "g"].map((key) => (
              <tr key={key} className="odd:bg-gray-50 even:bg-white">
                <td className="border p-2">{checklist.find((i) => i.key === key)?.label}</td>
                <td className="border p-2 text-center">{isChecked(key) ? "✔" : ""}</td>
                <td className="border p-2 text-center">{!isChecked(key) ? "✔" : ""}</td>
              </tr>
            ))}

            {/* III. Values Oriented */}
            <tr>
              <td colSpan="3" className="border p-2 font-bold bg-gray-100">
                III. Value(s) Oriented
              </td>
            </tr>
            {["h"].map((key) => (
              <tr key={key} className="odd:bg-gray-50 even:bg-white">
                <td className="border p-2">{checklist.find((i) => i.key === key)?.label}</td>
                <td className="border p-2 text-center">{isChecked(key) ? "✔" : ""}</td>
                <td className="border p-2 text-center">{!isChecked(key) ? "✔" : ""}</td>
              </tr>
            ))}

            {/* IV. Financing and Sustainability */}
            <tr>
              <td colSpan="3" className="border p-2 font-bold bg-gray-100">
                IV. Financing and Sustainability
              </td>
            </tr>
            {["i", "j", "k", "l", "m"].map((key) => (
              <tr key={key} className="odd:bg-gray-50 even:bg-white">
                <td className="border p-2">{checklist.find((i) => i.key === key)?.label}</td>
                <td className="border p-2 text-center">{isChecked(key) ? "✔" : ""}</td>
                <td className="border p-2 text-center">{!isChecked(key) ? "✔" : ""}</td>
              </tr>
            ))}

            {/* V. Evidence-Based Need and Significance */}
            <tr>
              <td colSpan="3" className="border p-2 font-bold bg-gray-100">
                V. Evidence-Based Need and Significance
              </td>
            </tr>
            {["n", "o", "p"].map((key) => (
              <tr key={key} className="odd:bg-gray-50 even:bg-white">
                <td className="border p-2">{checklist.find((i) => i.key === key)?.label}</td>
                <td className="border p-2 text-center">{isChecked(key) ? "✔" : ""}</td>
                <td className="border p-2 text-center">{!isChecked(key) ? "✔" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2 mb-6">
        {/* Update button */}
        {isEventOwner && (
          <Button
            onClick={() => navigate("/event/form/004", { state: { formdata: form4 } })}
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
