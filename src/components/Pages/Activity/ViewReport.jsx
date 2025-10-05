import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { toast } from "react-toastify";
import { updateForm14Status } from "@_src/services/form14";
import { useUserStore } from "@_src/store/auth";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { DecryptUser, DecryptString } from "@_src/utils/helpers";
import { downloadForm14Pdf } from "@_src/utils/pdf/form14Pdf";

export const ViewReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activity, report, creator_id } = location.state || {};

  const { user, token } = useUserStore((s) => ({ user: s.user, token: s.token }));
  const decryptedUser = token ? DecryptUser(user) : null;
  const decryptedToken = token ? DecryptString(token) : null;
  const currentUserId = decryptedUser?.id;
  const currentRoleId = decryptedUser?.role_id;
  
  const [showRemarksDialog, setShowRemarksDialog] = useState(false);
  const [remarksText, setRemarksText] = useState("");
  const [showReviseDialog, setShowReviseDialog] = useState(false);
  const [revisionRemarks, setRevisionRemarks] = useState("");
  const [currentReport, setCurrentReport] = useState(report);
  const [loading, setLoading] = useState(false);

  // Try different possible locations for form14 data
  const form14Data = 
    activity?.[0]?.form14?.[0] || 
    activity?.[0]?.fromid?.[0] || 
    activity?.[0] ||
    report;

    const approvalData = activity?.activity?.[0]?.form14?.[0];
  

  // Event status id
  const eventStatusId = Number(form14Data?.event_status_id);
  const isApprovedByAny = form14Data?.is_commex || form14Data?.is_asd;
  const isFullyApproved = form14Data?.is_commex && form14Data?.is_asd;

  const hasApproved = 
    (currentRoleId === 1 && form14Data?.is_commex) || 
    (currentRoleId === 10 && form14Data?.is_asd);

  // Role-based button logic
  const canSubmitOrPullBack = [1, 3, 4, 5, 6, 7, 8, 9].includes(currentRoleId);
  const canApproveOrRevise = [1, 10].includes(currentRoleId) && !hasApproved;

  const isCreator = currentUserId === creator_id;

  const canDownloadPdf = !!(form14Data?.is_commex && form14Data?.is_asd);

  // Redirect if no report
  useEffect(() => {
    if (!report) {
      toast.error("No report selected!");
      navigate(-1);
    }
  }, [report, navigate]);

  if (!currentReport) return null;

  // Handlers
  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Determine the target status based on current status
      const targetStatus = eventStatusId === 8 ? 9 : 4; // 9 = Resubmitted, 4 = Submitted
      
      await updateForm14Status({
        token: decryptedToken,
        id: currentReport.form14_id,
        event_status_id: targetStatus,
      });
      
      const successMessage = targetStatus === 9 ? "Report resubmitted successfully!" : "Report submitted successfully!";
      toast.success(successMessage);
      navigate(-1);
    } catch (error) {
      console.error("Submit error:", error.response?.data || error.message);
      const errorMessage = eventStatusId === 8 ? "Failed to resubmit report." : "Failed to submit report.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePullBack = async () => {
    try {
      setLoading(true);
      await updateForm14Status({
        token: decryptedToken,
        id: currentReport.form14_id,
        event_status_id: 5, // Pulled-back
      });
      toast.success("Report pulled back successfully!");
      navigate(-1);
    } catch (error) {
      console.error("Pull-back error:", error.response?.data || error.message);
      toast.error("Failed to pull back report.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      await updateForm14Status({
        token: decryptedToken,
        id: currentReport.form14_id,
        event_status_id: 7, // approved
      });
      toast.success("Report marked as approved!");
      navigate(-1);
    } catch (error) {
      console.error("Approve error:", error.response?.data || error.message);
      toast.error("Failed to mark as approved.");
    } finally {
      setLoading(false);
    }
  };

  const [isEditing, setIsEditing] = useState(false);

  const handleRevise = () => {
    setRevisionRemarks("");
    setIsEditing(true);
    setShowReviseDialog(true);
  };

  const handleViewRemarks = (remarks) => {
    setRemarksText(remarks);
    setShowRemarksDialog(true);
  };

  const submitRevision = async () => {
    if (!revisionRemarks.trim()) {
      toast.info("Remarks are required.");
      return;
    }

    try {
      setLoading(true);
      await updateForm14Status({
        token: decryptedToken,
        id: currentReport.form14_id,
        event_status_id: 6, // revise
        remarks: revisionRemarks,
      });

      toast.success("Report sent back for revision!");
      setShowReviseDialog(false);
      navigate(-1);
    } catch (error) {
      console.error("Revise error:", error.response?.data || error.message);
      toast.error("Failed to send report for revision.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="project-detail-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
      <div className="w-full max-w-5xl bg-white shadow rounded-lg p-6 my-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">POST-ACTIVITY REPORT</h2>

        {/* 🔹 Dynamic Approval Status Panel */}
        <div className="w-full mb-6 p-4 border rounded bg-gray-50">
          <h2 className="font-bold mb-2">Approval Status</h2>

          {/* Commex Status */}
          <div className="flex items-center justify-between mb-2">
            <span>
              Commex:{" "}
              {form14Data?.is_commex ? (
                <span className="text-green-600 font-medium">✅ Approved</span>
              ) : form14Data?.commex_remarks ? (
                <span className="text-red-600 font-medium">✏️ Sent for Revision</span>
              ) : (
                <span className="text-gray-600">⏳ Pending</span>
              )}
            </span>

            {form14Data?.commex_remarks && (
              <Button
                label="View Remarks"
                size="small"
                className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
                onClick={() => handleViewRemarks(form14Data.commex_remarks)}
              />
            )}
          </div>

          {/* ASD Status */}
          <div className="flex items-center justify-between">
            <span>
              ASD:{" "}
              {form14Data?.is_asd ? (
                <span className="text-green-600 font-medium">✅ Approved</span>
              ) : form14Data?.asd_remarks ? (
                <span className="text-red-600 font-medium">✏️ Sent for Revision</span>
              ) : !form14Data?.is_commex ? (
                <span className="text-gray-600">⏳ Pending Commex approval...</span>
              ) : (
                <span className="text-gray-600">⏳ Pending ASD review</span>
              )}
            </span>

            {form14Data?.asd_remarks && (
              <Button
                label="View Remarks"
                size="small"
                className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
                onClick={() => handleViewRemarks(form14Data.asd_remarks)}
              />
            )}
          </div>
        </div>

        {/* Report Details */}
        <div className="space-y-6">
          <div className="mb-6">
            <p className="font-semibold text-gray-600">Objectives:</p>
            <p className="break-words whitespace-normal">{currentReport.objectives || "N/A"}</p>
          </div>

          <div className="mb-6">
            <p className="font-semibold text-gray-600">Target Group:</p>
            <p className="break-words whitespace-normal">{currentReport.target_group || "N/A"}</p>
          </div>

          <div className="mb-6">
            <p className="font-semibold text-gray-600">Description:</p>
            <p className="break-words whitespace-normal">{currentReport.description || "N/A"}</p>
          </div>

          <div className="mb-6">
            <p className="font-semibold text-gray-600">Achievements:</p>
            <p className="break-words whitespace-normal">{currentReport.achievements || "N/A"}</p>
          </div>

          <div className="mb-6">
            <p className="font-semibold text-gray-600">Challenges:</p>
            <p className="break-words whitespace-normal">{currentReport.challenges || "N/A"}</p>
          </div>

          <div className="mb-6">
            <p className="font-semibold text-gray-600">Feedback:</p>
            <p className="break-words whitespace-normal">{currentReport.feedback || "N/A"}</p>
          </div>

          <div className="mb-6">
            <p className="font-semibold text-gray-600">Acknowledgements:</p>
            <p className="break-words whitespace-normal">{currentReport.acknowledgements || "N/A"}</p>
          </div>

          {/* Budget Summaries */}
          <div className="mb-6">
            <p className="font-semibold text-gray-600">Budget Summaries:</p>
            <table className="w-full border mt-2 table-fixed">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 break-words whitespace-normal">Description</th>
                  <th className="border p-2 break-words whitespace-normal">Item</th>
                  <th className="border p-2 break-words whitespace-normal">Personnel</th>
                  <th className="border p-2 break-words whitespace-normal">Quantity</th>
                  <th className="border p-2 break-words whitespace-normal">Cost</th>
                </tr>
              </thead>
              <tbody>
                {currentReport.budget_summaries?.length > 0 ? (
                  <>
                    {currentReport.budget_summaries.map((b, idx) => (
                      <tr key={idx}>
                        <td className="border p-2 break-words whitespace-normal">{b.description || "N/A"}</td>
                        <td className="border p-2 break-words whitespace-normal">{b.item || "N/A"}</td>
                        <td className="border p-2 break-words whitespace-normal">{b.personnel || "N/A"}</td>
                        <td className="border p-2 break-words whitespace-normal">{b.quantity || "N/A"}</td>
                        <td className="border p-2 break-words whitespace-normal">{b.cost || "0"}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-bold">
                      <td className="border p-2 break-words whitespace-normal" colSpan={4}>
                        Total Budget
                      </td>
                      <td className="border p-2 break-words whitespace-normal">
                        {currentReport.budget_summaries.reduce((sum, b) => sum + Number(b.cost || 0), 0)}
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan={5} className="border p-2 italic text-gray-500 text-center">
                      No budget summaries available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 🔹 Consent Section */}
      <h2 className="text-2xl font-bold text-gray-800 mb-6 mt-8">Consent</h2>

      <div className="w-full max-w-5xl mt-6">
        <table className="w-full border border-collapse">
          <thead>
            <tr>
              <th className="border p-2 text-center">ComEx</th>
              <th className="border p-2 text-center">Academic Services Director</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* ComEx Column */}
              <td className="border p-6 text-center align-bottom h-32">
                {form14Data?.is_commex ? (
                  <div className="flex flex-col justify-end h-full">
                    <p className="font-semibold text-green-600 mb-2">Approved</p>
                    <p className="font-medium">
                      {approvalData?.commex_approver?.firstname} {approvalData?.commex_approver?.lastname}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {form14Data?.commex_approve_date ? 
                        new Date(form14Data.commex_approve_date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        }) : ""}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="italic text-gray-500">Awaiting Approval</p>
                  </div>
                )}
              </td>

              {/* ASD Column */}
              <td className="border p-6 text-center align-bottom h-32">
                {form14Data?.is_asd ? (
                  <div className="flex flex-col justify-end h-full">
                    <p className="font-semibold text-green-600 mb-2">Approved</p>
                    <p className="font-medium">
                      {approvalData?.asd_approver?.firstname} {approvalData?.asd_approver?.lastname}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {form14Data?.asd_approve_date ? 
                        new Date(form14Data.asd_approve_date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        }) : ""}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="italic text-gray-500">Awaiting Approval</p>
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 mt-4">
        <Button 
          onClick={() => navigate(-1)}
          className="bg-gray-600 text-white px-3 py-2 rounded-md text-xs font-semibold"
          label="Back"
        />

        {/* Submit button */}
        {canSubmitOrPullBack && isCreator && ![4, 6, 9].includes(eventStatusId) && !isApprovedByAny && (
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-emerald-600 text-white px-3 py-2 rounded-md text-xs font-semibold"
            label={loading ? ([8, 5].includes(eventStatusId) ? "Resubmitting…" : "Submitting…") : ([8, 5].includes(eventStatusId) ? "Resubmit" : "Submit")}
          />
        )}

        {/* Pull-back button */}
        {canSubmitOrPullBack && isCreator && [9, 4].includes(eventStatusId) && !isFullyApproved && (
          <Button
            onClick={handlePullBack}
            disabled={loading}
            className="bg-rose-600 text-white px-3 py-2 rounded-md text-xs font-semibold"
            label={loading ? "Pulling Back…" : "Pull-back"}
          />
        )}

        {/* Update button */}
        {isCreator && !isFullyApproved && [5, 6, 8].includes(eventStatusId) && (
          <Button
            onClick={() => navigate("/create-report-progress", { state: { activities_id: currentReport.activities_id, report: currentReport } })}
            className="bg-[#013a63] text-white px-3 py-2 rounded-md text-xs font-semibold"
            label="Update"
          />
        )}

        {/* Approve/Revise buttons */}
        {[4, 9].includes(eventStatusId) && (
          <>
            {/* Commex Approve/Revise (role_id = 1) */}
            {currentRoleId === 1 && !form14Data?.is_commex && (
              <>
                <Button
                  onClick={handleApprove}
                  disabled={loading}
                  className="bg-emerald-600 text-white px-3 py-2 rounded-md text-xs font-semibold"
                  label={loading ? "Approving…" : "Approve"}
                />
                <Button
                  onClick={handleRevise}
                  disabled={loading}
                  className="bg-rose-600 text-white px-3 py-2 rounded-md text-xs font-semibold"
                  label="Revise"
                />
              </>
            )}

            {/* ASD Approve/Revise (role_id = 10) */}
            {currentRoleId === 10 && (
              <>
                {!form14Data?.is_commex ? (
                  <p className="text-gray-600 italic">⏳ Pending Commex approval...</p>
                ) : !form14Data?.is_asd ? (
                  <>
                    <Button
                      onClick={handleApprove}
                      disabled={loading}
                      className="bg-emerald-600 text-white px-3 py-2 rounded-md text-xs font-semibold"
                      label={loading ? "Approving…" : "Approve"}
                    />
                    <Button
                      onClick={handleRevise}
                      disabled={loading}
                      className="bg-rose-600 text-white px-3 py-2 rounded-md text-xs font-semibold"
                      label="Revise"
                    />
                  </>
                ) : (
                  <p className="text-green-600 italic">✅ ASD already approved.</p>
                )}
              </>
            )}
          </>
        )}

        {/* Download PDF */}
        {canDownloadPdf && (
          <Button
            onClick={() => downloadForm14Pdf(
              currentReport, 
              activity, 
              activity?.user || { id: creator_id },  // Use activity.user which has the name fields
              currentRoleId, 
              approvalData
            )}
            className="bg-indigo-600 text-white px-3 py-2 rounded-md text-xs font-semibold"
          >
            Download PDF
          </Button>
        )}
      </div>

      {/* Remarks Dialog */}
      <Dialog
        header="Remarks"
        visible={showRemarksDialog}
        style={{ width: "40vw" }}
        modal
        onHide={() => setShowRemarksDialog(false)}
      >
        <p className="whitespace-pre-line">{remarksText}</p>
      </Dialog>

      {/* Revise Dialog */}
      <Dialog
        header="Revise Report"
        visible={showReviseDialog}
        style={{ width: "50vw" }}
        modal
        onHide={() => setShowReviseDialog(false)}
      >
        <div className="flex flex-col gap-4 w-full my-4">
          <InputTextarea
            value={revisionRemarks}
            onChange={(e) => setRevisionRemarks(e.target.value)}
            rows={5}
            placeholder="Enter your revision remarks..."
            className="w-full"
          />
          <Button
            label="Submit Revision"
            severity="success"
            loading={loading}
            onClick={submitRevision}
          />
        </div>
      </Dialog>
    </div>
  );
};