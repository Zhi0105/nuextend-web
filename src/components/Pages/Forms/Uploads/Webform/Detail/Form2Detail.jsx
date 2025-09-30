import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "@_src/store/auth";
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveForm2, rejectForm2 } from "@_src/services/formservice";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";

export const Form2Detail = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { event, owner, data: initialData } = state || {};
  console.log(event);

  const queryClient = useQueryClient();
  const { user, token } = useUserStore((s) => ({ user: s.user, token: s.token }));
  const decryptedUser = token && DecryptUser(user);
  const decryptedToken = token && DecryptString(token);

  const [form2, setForm2] = useState(initialData || null);
  const [showRevise, setShowRevise] = useState(false);

  const roleId = decryptedUser?.role_id;
  const isApprover = useMemo(() => [1, 9, 10, 11].includes(roleId), [roleId]);
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!form2) return false;
    if (!isApprover) return false;
    if (hasUserRoleApproved(form2[0])) return false;
    if (form2.status === "approved") return false;
    return true;
  }, [form2, isApprover, hasUserRoleApproved]);

  // Approve mutation
  const { mutate: doApprove, isLoading: approveLoading } = useMutation({
    mutationFn: (vars) => approveForm2(vars),
    onSuccess: (res) => {
      toast(res?.message || "Approved", { type: "success" });
      setForm2((prev) => {
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
    if (!form2 || !canAction) return;
    doApprove({ token: decryptedToken, id: form2[0].id, role_id: roleId });
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
    mutationFn: (vars) => rejectForm2(vars),
    onSuccess: (res) => { 
      toast(res?.message || "Sent for revision", { type: "success" }); 
      reset({ remarks: "" }); 
    },
    onError: () => toast("Failed to submit revision request. Please try again.", { type: "error" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["outreach"] }),
  });

  const onSubmitRevise = ({ remarks }) => {
    if (!form2 || !canAction) return;
    const key = remarksKeyByRole[roleId];
    if (!key) return;
    doReject({ 
      token: decryptedToken, 
      id: form2[0].id, 
      role_id: roleId,  
      [key]: remarks 
    });
    setShowRevise(false);
  };

  const isEventOwner = !!decryptedUser?.id && decryptedUser.id === owner?.id;

  if (!form2) return null;

  const formData = form2[0];
  const eventName = event?.name || "osdos1"; // Get event name from event data
  // const totalBudget = formData.defaulted_budgets?.reduce((sum, budget) => {
  //   const amount = parseFloat(budget.amount) || 0;
  //   return sum + amount;
  // }, 0) || 0;

  return (
    <div className="project-detail-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-8">
      {/* Header with Title and Action Buttons */}
      <div className="w-full max-w-5xl bg-white shadow rounded-lg p-6 my-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Program Proposal</h2>
        {/* Project Proposal Content */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* I. PROJECT DESCRIPTION */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4">I. PROJECT DESCRIPTION</h2>
            <div className="space-y-3">
              <div className="mb-2">
                <span className="font-bold">A. Project Title</span><br />
                <span className="ml-4">{eventName || "wala lumabas"}</span>
              </div>
              
              <div className="mb-2">
                <span className="font-bold">B. Type of Project</span><br />
                <span className="ml-4">{formData.event_type?.name || "wala lumabas"}</span>
              </div>
              
              <div className="mb-2">
                <span className="font-bold">C. Project Proponent(s)</span><br />
                <div className="ml-4 whitespace-pre-line">
                  {formData.proponents|| `wala lumabas`}
                </div>
              </div>
              
              <div className="mb-2">
                <span className="font-bold">D. Project Collaborator(s)</span><br />
                <div className="ml-4 whitespace-pre-line">
                  {formData.collaborators|| `wala lumabas`}
                </div>
              </div>
              
              <div className="mb-2">
                <span className="font-bold">E. Number of Participants</span><br />
                <span className="ml-4">{formData.participants || "wala lumabas"}</span>
              </div>
              
              <div className="mb-2">
                <span className="font-bold">F. Project Partner(s)</span><br />
                <span className="ml-4">{formData.partners || "wala lumabas"}</span>
              </div>
              
              <div className="mb-2">
                <span className="font-bold">G. Date of Implementation and Duration in Hours</span><br />
                <span className="ml-4">{formData.implementationDate || "wala lumabas"}</span>
              </div>
              
              <div className="mb-2">
                <span className="font-bold">H. Area of Project Implementation</span><br />
                <span className="ml-4">{formData.area || "wala lumabas"}</span>
              </div>
              
              <div className="mb-2">
                <span className="font-bold">I. Budget Requirement</span><br />
                <span className="ml-4">{formData.budgetRequirement ? `P${formData.budgetRequirement}.00` : "wala lumabas"}</span>
              </div>
              
              <div className="mb-2">
                <span className="font-bold">J. Budget Requested</span><br />
                <span className="ml-4">{formData.budgetRequested ? `P${formData.budgetRequested}.00` : "wala lumabas"}</span>
              </div>
            </div>
          </div>

          {/* II. BACKGROUND/SITUATION ANALYSIS */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4">II. BACKGROUND/SITUATION ANALYSIS</h2>
            <p className="whitespace-pre-wrap">{formData.background || "No background information provided."}</p>
          </div>

          {/* III. PROJECT OBJECTIVES */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4">III. PROJECT OBJECTIVES</h2>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left font-bold">Objectives</th>
                  <th className="border border-gray-300 p-2 text-left font-bold">Strategies</th>
                </tr>
              </thead>
              <tbody>
                {formData.objectives?.map((obj, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2">{obj.objectives}</td>
                    <td className="border border-gray-300 p-2">{obj.strategies}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* IV. DESIRED IMPACT AND OUTCOME */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4">IV. DESIRED IMPACT AND OUTCOME OF THE PROJECT</h2>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left font-bold">Impact</th>
                  <th className="border border-gray-300 p-2 text-left font-bold">Outcome</th>
                  <th className="border border-gray-300 p-2 text-left font-bold">Linkage</th>
                </tr>
              </thead>
              <tbody>
                {formData.impact_outcomes?.map((impact, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2">{impact.impact}</td>
                    <td className="border border-gray-300 p-2">{impact.outcome}</td>
                    <td className="border border-gray-300 p-2">{impact.linkage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* V. RISK MANAGEMENT */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4">V. RISK MANAGEMENT</h2>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left font-bold">Risk Identification</th>
                  <th className="border border-gray-300 p-2 text-left font-bold">Risk Mitigation</th>
                </tr>
              </thead>
              <tbody>
                {formData.risks?.map((risk, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2">{risk.risk_identification}</td>
                    <td className="border border-gray-300 p-2">{risk.risk_mitigation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* VI. PROJECT ORGANIZATION AND STAFFING */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4">VI. PROJECT ORGANIZATION AND STAFFING</h2>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left font-bold">Office Staff Designated</th>
                  <th className="border border-gray-300 p-2 text-left font-bold">Responsibilities</th>
                  <th className="border border-gray-300 p-2 text-left font-bold">Contact Details</th>
                </tr>
              </thead>
              <tbody>
                {formData.staffings?.map((staff, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2">{staff.staff}</td>
                    <td className="border border-gray-300 p-2">{staff.responsibilities}</td>
                    <td className="border border-gray-300 p-2">{staff.contact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* VII. PROJECT WORK PLAN */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4">VII. PROJECT WORK PLAN</h2>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left font-bold">Phases of Project and Date</th>
                  <th className="border border-gray-300 p-2 text-left font-bold">Activities</th>
                  <th className="border border-gray-300 p-2 text-left font-bold">Targets and Outputs</th>
                  <th className="border border-gray-300 p-2 text-left font-bold">Indicators and Outcomes</th>
                  <th className="border border-gray-300 p-2 text-left font-bold">Personnel In Charge</th>
                  <th className="border border-gray-300 p-2 text-left font-bold">Resources Needed</th>
                  <th className="border border-gray-300 p-2 text-left font-bold">Cost</th>
                </tr>
              </thead>
              <tbody>
                {formData.work_plans?.map((work, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2">{work.phaseDate}</td>
                    <td className="border border-gray-300 p-2">{work.activities}</td>
                    <td className="border border-gray-300 p-2">{work.targets}</td>
                    <td className="border border-gray-300 p-2">{work.indicators || "N/A"}</td>
                    <td className="border border-gray-300 p-2">{work.personnel || "N/A"}</td>
                    <td className="border border-gray-300 p-2">{work.resources || "N/A"}</td>
                    <td className="border border-gray-300 p-2">{work.cost || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* VIII. DETAILED BUDGET REQUIREMENT */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4">VIII. DETAILED BUDGET REQUIREMENT</h2>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left font-bold">Budget Item</th>
                  <th className="border border-gray-300 p-2 text-left font-bold">Description</th>
                  <th className="border border-gray-300 p-2 text-left font-bold">Quantity</th>
                  <th className="border border-gray-300 p-2 text-left font-bold">Amount</th>
                  <th className="border border-gray-300 p-2 text-left font-bold">Proposed Source(s)</th>
                </tr>
              </thead>
              <tbody>
                {formData.detailed_budgets?.map((budget, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2">{budget.item}</td>
                    <td className="border border-gray-300 p-2">{budget.description}</td>
                    <td className="border border-gray-300 p-2">{budget.quantity}</td>
                    <td className="border border-gray-300 p-2">PHP {budget.amount || "0.00"}</td>
                    <td className="border border-gray-300 p-2">{budget.source || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* IX. OTHER RELEVANT INFORMATION */}
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">IX. OTHER RELEVANT INFORMATION</h2>
            <p className="whitespace-pre-wrap">{formData.otherInfo || "No additional information provided."}</p>
          </div>
        </div>
      </div>
          <div className="flex gap-2">
            {/* Update button */}
            {isEventOwner && (
              <Button
                onClick={() => navigate('/event/form/002', { state: { formdata: form2 } })}
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
        modal
      >
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
            className="bg-[#2211cc] text-white font-bold rounded-lg p-2"
            label={rejectLoading ? "Submitting…" : "Submit"}
          />
        </form>
      </Dialog>
    </div>
  );
};