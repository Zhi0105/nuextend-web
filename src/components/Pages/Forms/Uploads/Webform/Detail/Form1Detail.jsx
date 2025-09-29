import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "@_src/store/auth";
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveForm1, rejectForm1 } from "@_src/services/formservice";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";

// ✅ Buttons: UPDATE + APPROVE + REVISE only
export const Form1Detail = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { event, owner, data: initialData } = state || {};

  const queryClient = useQueryClient();
  const { user, token } = useUserStore((s) => ({ user: s.user, token: s.token }));
  const decryptedUser = token && DecryptUser(user);
  const decryptedToken = token && DecryptString(token);

  const [form1 , setForm1] = useState(initialData || null);

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
    if (!form1) return false;
    if (!isApprover) return false;
    if (hasUserRoleApproved(form1[0])) return false;
    if (form1.status === "approved") return false;
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form1, isApprover]);

  // Approve
  const { mutate: doApprove, isLoading: approveLoading } = useMutation({
    mutationFn: (vars) => approveForm1(vars),
    onSuccess: (res) => {
        toast(res?.message || "Approved", { type: "success" })
        // Update local form1 state para mawala agad yung button
        setForm1((prev) => {
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
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["outreach"] }),
  });

  const onApprove = () => {
    if (!form1 || !canAction) return;
    doApprove({ token: decryptedToken, id: form1[0].id, role_id: roleId });
  };

  // Revise
  const [showRevise, setShowRevise] = useState(false);
  const remarksKeyByRole = { 1: "commex_remarks", 9: "dean_remarks", 10: "asd_remarks", 11: "ad_remarks" };
  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({ defaultValues: { remarks: "" } });

  const { mutate: doReject, isLoading: rejectLoading } = useMutation({
    mutationFn: (vars) => rejectForm1(vars),
    onSuccess: (res) => {
      toast(res?.message || "Sent for revision", { type: "success" });
      reset({ remarks: "" });
    },
    onError: () => toast("Failed to submit revision request. Please try again.", { type: "error" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["outreach"] }),
  });

  const onSubmitRevise = ({ remarks }) => {
    if (!form1 || !canAction) return;
    const key = remarksKeyByRole[roleId];
    if (!key) return;
    doReject({ token: decryptedToken, id: form1[0].id, role_id: roleId, [key]: remarks });
    setShowRevise(false);
  };

  const isEventOwner = !!decryptedUser?.id && decryptedUser.id === owner?.id;

  if (!form1) return null;


  return (
    <div className="project-detail-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
      <div className="w-full max-w-5xl bg-white shadow rounded-lg p-6 my-6">
  <h2 className="text-2xl font-bold text-gray-800 mb-6">Program Proposal
    
  </h2>

  <h2 className="text-1xl font-bold text-gray-800 mb-6">I. PROGRAM DESCRIPTION:</h2>
  {/* A. Title */}
  <div className="mb-6">
    <p className="font-semibold text-gray-600">A. Title</p>
    <p>{event?.eventName || "—"}</p>
  </div>

  {/* B. Implementer */}
  <div className="mb-6">
    <p className="font-semibold text-gray-600">B. Implementer</p>
    <p>{event?.organization?.name || "—"}</p>
  </div>

  {/* C. Extension Program Management Team */}
  <div className="mt-8">
    <p className="font-semibold text-gray-600">C. Extension Program Management Team</p>

    {/* 1. Program Coordinator */}
    <div className="ml-4 mt-2">
      <p className="font-semibold text-gray-600">1. Program Coordinator</p>
      <p>
        {event?.user?.firstname} {event?.user?.middlename} {event?.user?.lastname}
      </p>
    </div>

    {/* 2. Program Team Members */}
    <div className="ml-4 mt-4">
      <p className="font-semibold text-gray-600">2. Program Team Members</p>
      <ul className="list-disc ml-6">
        {form1[0]?.team_members?.length > 0 ? (
          form1[0].team_members.map((m) => <li key={m.id}>{m.name}</li>)
        ) : (
          <li>No team members</li>
        )}
      </ul>
    </div>
  </div>

  {/* D. Target Group */}
  <div className="mb-6">
    <p className="font-semibold text-gray-600">D. Target Group</p>
    <p>{event?.target_group || "—"}</p>
  </div>

  <h3 className="mt-6 font-semibold text-gray-700">E. Cooperating Agencies</h3>
  <ul className="list-disc ml-6">
    {form1[0]?.cooperating_agencies?.length > 0 ? (
      form1[0].cooperating_agencies.map((a) => <li key={a.id}>{a.name}</li>)
    ) : (
      <li>No agencies</li>
    )}
  </ul>
  
    <div className="mb-6">
      <p className="font-semibold text-gray-600">F. Duration:</p>
      <p>{form1[0]?.duration || "—"}</p>
    </div>
  {/* E. Proposed Budget */}
  <div className="mb-6">
    <p className="font-semibold text-gray-600">G. Proposed Budget</p>
    <p>₱ {event?.budget_proposal?.toLocaleString() || "0.00"}</p>
  </div>

  <h2 className="text-1xl font-bold text-gray-800 mb-6">II. PROGRAM DETAILS:</h2>

  <div className="mb-6">
    <p className="font-semibold text-gray-600">A. Background:</p>
    <p>{form1[0]?.background || "—"}</p>
  </div>

  <div className="mb-6">
    <p className="font-semibold text-gray-600">B. Overall Goal:</p>
    <p>{form1[0]?.overall_goal || "—"}</p>
  </div>

   {/* H. Component Projects Budget Summary */}

   <div className="mb-6">
    <p className="font-semibold text-gray-600">C. Component Projects, Outcomes, and Budget</p>
  </div>
  <table className="w-full border mt-2">
    <thead>
      <tr className="bg-gray-100">
        <th className="border p-2">Title</th>
        <th className="border p-2">Outcomes</th>
        <th className="border p-2">Budget</th>
      </tr>
    </thead>
    <tbody>
      {form1[0]?.component_projects?.length > 0 ? (
        form1[0].component_projects.map((c) => (
          <tr key={c.id}>
            <td className="border p-2">{c.title}</td>
            <td className="border p-2">{c.outcomes}</td>
            <td className="border p-2">₱ {c.budget}</td>
          </tr>
        ))
      ) : (
        <tr>
          <td className="border p-2 italic text-gray-500" colSpan={3}>
            No component projects
          </td>
        </tr>
      )}
    </tbody>
  </table>
  
  <div className="mb-6">
      <p className="font-semibold text-gray-600">Scholarly Connection:</p>
      <p>{form1[0]?.scholarly_connection || "—"}</p>
  </div>

  <h2 className="text-1xl font-bold text-gray-800 mb-6">III. PROJECT DETAILS:</h2>
  <h3 className="mt-6 font-semibold text-gray-700">I. Projects</h3>
  {form1[0]?.projects?.length > 0 ? (
    form1[0].projects.map((p) => (
      <div key={p.id} className="border p-3 rounded mb-4">
        <p><b className="font-semibold text-gray-600">Title:</b> {p.title}</p>
        <p><b className="font-semibold text-gray-600">Team Leader:</b> {p.teamLeader}</p>
        <p ><b className="font-semibold text-gray-600">Objectives:</b> {p.objectives}</p>

        {/* Project Team Members */}
        <h4 className="font-semibold text-gray-600">Project Team Members</h4>
        <ul className="list-disc ml-6">
          {p.team_members?.length > 0 ? (
            p.team_members.map((tm) => <li key={tm.id}>{tm.name}</li>)
          ) : (
            <li>No team members</li>
          )}
        </ul>

        {/* Budget Summary (now in a table) */}
        <h4 className="font-semibold text-gray-600">Budget Summary</h4>
        <table className="w-full border mt-2">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Activities</th>
              <th className="border p-2">Outputs</th>
              <th className="border p-2">Timeline</th>
              <th className="border p-2">Personnel</th>
              <th className="border p-2">Budget</th>
            </tr>
          </thead>
          <tbody>
            {p.budget_summaries?.length > 0 ? (
              p.budget_summaries.map((b) => (
                <tr key={b.id}>
                  <td className="border p-2">{b.activities}</td>
                  <td className="border p-2">{b.outputs}</td>
                  <td className="border p-2">{b.timeline}</td>
                  <td className="border p-2">{b.personnel}</td>
                  <td className="border p-2">₱ {b.budget}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="border p-2 italic text-gray-500" colSpan={5}>
                  No budget entries
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    ))
  ) : (
    <p>No projects</p>
  )}
</div>


      {/* Buttons */}
      <div className="flex gap-2">
        {isEventOwner && (
          <Button
            onClick={() => navigate("/event/form/001", { state: { formdata: form1 } })}
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
