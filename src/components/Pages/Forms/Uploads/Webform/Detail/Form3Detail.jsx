import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "@_src/store/auth";
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveForm3, rejectForm3 } from "@_src/services/formservice";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";

export const Form3Detail = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { event, owner, data: initialData } = state || {};
  console.log(event);

  const queryClient = useQueryClient();
  const { user, token } = useUserStore((s) => ({ user: s.user, token: s.token }));
  const decryptedUser = token && DecryptUser(user);
  const decryptedToken = token && DecryptString(token);

  const [form3, setForm3] = useState(initialData || null);
  const [showRevise, setShowRevise] = useState(false);

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
    if (!form3) return false;
    if (!isApprover) return false;
    if (hasUserRoleApproved(form3[0])) return false;
    if (form3.status === "approved") return false;
    return true;
  }, [form3, isApprover, hasUserRoleApproved]);

  // Approve mutation
  const { mutate: doApprove, isLoading: approveLoading } = useMutation({
    mutationFn: (vars) => approveForm3(vars),
    onSuccess: (res) => {
      toast(res?.message || "Approved", { type: "success" });
      setForm3((prev) => {
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
    if (!form3 || !canAction) return;
    doApprove({ token: decryptedToken, id: form3[0].id, role_id: roleId });
  };

  // Revise mutation
  const remarksKeyByRole = { 
    1: "commex_remarks", 
    9: "dean_remarks", 
    10: "asd_remarks", 
    11: "ad_remarks" 
  };
  
  const { handleSubmit, control, formState: { errors }, reset } = useForm({ 
    defaultValues: { remarks: "" } 
  });

  const { mutate: doReject, isLoading: rejectLoading } = useMutation({
    mutationFn: (vars) => rejectForm3(vars),
    onSuccess: (res) => { 
      toast(res?.message || "Sent for revision", { type: "success" }); 
      reset({ remarks: "" }); 
    },
    onError: () => toast("Failed to submit revision request. Please try again.", { type: "error" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["outreach"] }),
  });

  const onSubmitRevise = ({ remarks }) => {
    if (!form3 || !canAction) return;
    const key = remarksKeyByRole[roleId];
    if (!key) return;
    doReject({ 
      token: decryptedToken, 
      id: form3[0].id, 
      role_id: roleId,  
      [key]: remarks 
    });
    setShowRevise(false);
  };

  const isEventOwner = !!decryptedUser?.id && decryptedUser.id === owner?.id;

  if (!form3 || !form3[0]) {
    return (
      <div className="min-h-screen bg-white w-full flex justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
        <div className="text-center">No form data found</div>
      </div>
    );
  }

  const formData = form3[0];
  const detailedBudgets = formData.detailed_budgets || [];
  const budgetSourcing = formData.budget_sourcings || [];
  // Date formatting function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString; // Return original string if parsing fails
    }
  };

  return (
    <div className="outreach-detail-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] py-8 px-4">
      
      {/* Header with Title and Action Buttons */}
      <div className="w-full max-w-5xl bg-white shadow rounded-lg p-6 my-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">OutReach Project Proposal</h2>

        {/* Form Content */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* TITLE */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">TITLE:</h2>
            <p className="text-gray-900">{event?.eventName || "N/A"}</p>
          </div>

          {/* BRIEF DESCRIPTION AND RATIONALE */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              BRIEF DESCRIPTION AND RATIONALE OF THE ACTIVITY OR SERVICE:
            </h2>
            <p className="text-gray-900 whitespace-pre-wrap">
              {formData.description || "N/A"}
            </p>
          </div>

          {/* TARGET GROUP */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              TARGET GROUP AND REASONS FOR CHOOSING IT:
            </h2>
            <p className="text-gray-900 whitespace-pre-wrap">
              {formData.targetGroup || "N/A"}
            </p>
          </div>

          {/* DATE OF IMPLEMENTATION */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              DATE OF IMPLEMENTATION:
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-1">A. Start Date</h3>
                <p className="text-gray-900">
                  {formData.startDate ? formatDate(formData.startDate) : "N/A"}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-1">B. End Date</h3>
                <p className="text-gray-900">
                  {formData.endDate ? formatDate(formData.endDate) : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* ACTIVITY PLAN AND BUDGET */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              V. ACTIVITY PLAN AND BUDGET:
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
                      Objectives
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
                      Activities
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
                      Outputs
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
                      Personnel
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
                      Budget
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {formData.activity_plans_budgets?.map((activity, index) => (
                    <tr key={activity.id || index}>
                      <td className="border border-gray-300 px-4 py-3 text-gray-900">
                        {activity.objectives || "N/A"}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-gray-900">
                        {activity.activities || "N/A"}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-gray-900">
                        {activity.outputs || "N/A"}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-gray-900">
                        {activity.personnel || "N/A"}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-gray-900">
                        {activity.budget ? `₱${parseFloat(activity.budget).toLocaleString()}` : "N/A"}
                      </td>
                    </tr>
                  ))}
                  {(!formData.activity_plans_budgets || formData.activity_plans_budgets.length === 0) && (
                    <tr>
                      <td colSpan="5" className="border border-gray-300 px-4 py-3 text-center text-gray-500">
                        No activity plan data found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* DETAILED BUDGET */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              VI. DETAILED BUDGET:
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
                      Budget Item
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
                      Details or Particulars
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
                      Quantity
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
                      Amount
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detailedBudgets.map((item, index) => (
                    <tr key={item.id || index}>
                      <td className="border border-gray-300 px-4 py-2 text-gray-900">
                        {item.item || "N/A"}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-900">
                        {item.details || "N/A"}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-900">
                        {item.quantity || "N/A"}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-900">
                        {item.amount ? `₱${parseFloat(item.amount).toLocaleString()}` : "N/A"}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-900">
                        {item.amount ? `₱${parseFloat(item.amount).toLocaleString()}` : "N/A"}
                      </td>
                    </tr>
                  ))}
                  {detailedBudgets.length === 0 && (
                    <tr>
                      <td colSpan="5" className="border border-gray-300 px-4 py-3 text-center text-gray-500">
                        No budget items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* BUDGET SOURCING */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              VII. BUDGET SOURCING:
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
                      Counterpart of the University
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
                      Counterpart of the Outreach Group
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
                      Counterpart of the Target Group
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
                      Other Source(s) of Funding
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {budgetSourcing.map((item, index) => (
                    <tr key={item.id || index}>
                      <td className="border border-gray-300 px-4 py-2 text-gray-900">
                        {item.university || "N/A"}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-900">
                        {item.outreachGroup || "N/A"}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-900">
                        {item.service || "N/A"}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-900">
                        {item.other || "N/A"}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-900">
                        {item.total ? `₱${parseFloat(item.total).toLocaleString()}` : "N/A"}
                      </td>
                    </tr>
                  ))}
                  {budgetSourcing.length === 0 && (
                    <tr>
                      <td colSpan="5" className="border border-gray-300 px-4 py-3 text-center text-gray-500">
                        No budget sourcing data found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
            {/* Update button */}
            {isEventOwner && (
              <Button
                onClick={() => navigate('/event/form/003', { state: { formdata: form3 } })}
                className="bg-[#013a63] text-white px-4 py-2 rounded-md text-sm font-semibold"
                label="Update"
              />
            )}
            
            {/* Approve + Revise */}
            {canAction && (
              <>
                <Button
                  onClick={onApprove}
                  disabled={approveLoading}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-semibold"
                  label={approveLoading ? "Approving…" : "Approve"}
                />
                <Button
                  onClick={() => setShowRevise(true)}
                  disabled={rejectLoading}
                  className="bg-rose-600 text-white px-4 py-2 rounded-md text-sm font-semibold"
                  label="Revise"
                />
              </>
            )}
          </div>

      {/* Revise Dialog */}
      <Dialog header="Remarks" visible={showRevise} style={{ width: "50vw" }} onHide={() => setShowRevise(false)} modal={false}>
        <form onSubmit={handleSubmit(onSubmitRevise)} className="flex flex-col gap-4 w-full my-4">
          <Controller
            control={control}
            name="remarks"
            rules={{ required: true }}
            render={({ field: { onChange, value } }) => (
              <InputTextarea
                className={`${errors.remarks ? 'border border-red-500' : ''} bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                rows={4}
                placeholder="Enter your remarks here"
                value={value}
                onChange={onChange}
              />
            )}
          />
          {errors.remarks && <p className="text-sm italic mt-1 text-red-400">remarks is required.*</p>}
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