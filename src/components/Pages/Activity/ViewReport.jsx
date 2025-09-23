import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { toast } from "react-toastify";
import { updateForm14Status } from "@_src/services/form14";
import { useUserStore } from "@_src/store/auth";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { DecryptUser, DecryptString } from "@_src/utils/helpers";

export const ViewReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { report, creator_id } = location.state || {};

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

  // Event status id
  const eventStatusId = Number(currentReport?.event_status_id);
  const isApprovedByAny = currentReport.is_commex || currentReport.is_asd;
  const isFullyApproved = currentReport.is_commex && currentReport.is_asd;

  const hasApproved = 
    (currentRoleId === 1 && currentReport.is_commex) || 
    (currentRoleId === 10 && currentReport.is_asd);

  // Role-based button logic
  const canSubmitOrPullBack = [1, 3, 4, 5, 6, 7, 8, 9].includes(currentRoleId);
  const canApproveOrRevise = [1, 10].includes(currentRoleId) && !hasApproved;

  const isCreator = currentUserId === creator_id;

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
      await updateForm14Status({
        token: decryptedToken,
        id: currentReport.form14_id,
        event_status_id: 4, // Submit
      });
      toast.success("Report submitted successfully!");
      navigate(-1);
    } catch (error) {
      console.error("Submit error:", error.response?.data || error.message);
      toast.error("Failed to submit report.");
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

  const [isEditing, setIsEditing] = useState(false); // <-- new

  const handleRevise = () => {
    setRevisionRemarks(""); // reset input
    setIsEditing(true);     // editing mode
    setShowReviseDialog(true);
  };

  const handleViewRemarks = (remarks) => {
    setRevisionRemarks(remarks); // show the existing remark
    setIsEditing(false);         // view-only mode
    setShowReviseDialog(true);
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
    <div className="min-h-screen bg-white w-full flex flex-col items-center xs:pl-0 sm:pl-52 pt-20 px-4">
      <div className="p-4">
      {/* 🔹 Approval Status Panel */}
      <div className="w-full max-w-3xl mb-6 p-4 border rounded bg-gray-50">
        <h2 className="font-bold mb-2">Approval Status</h2>

        {/* Commex Status */}
        <div className="flex items-center justify-between mb-2">
          <span>
            Commex:{" "}
            {currentReport.is_commex ? (
              <span className="text-green-600 font-medium">✅ Approved</span>
            ) : currentReport.commex_remarks ? (
              <span className="text-red-600 font-medium">✏️ Sent for Revision</span>
            ) : (
              <span className="text-gray-600">⏳ Pending</span>
            )}
          </span>

          {currentReport.commex_remarks && (
            <Button
              label="View Remarks"
              size="small"
              severity="info"
              onClick={() => {
                setRemarksText(currentReport.commex_remarks || currentReport.asd_remarks);
                setShowRemarksDialog(true);
              }}
            />
          )}
        </div>

        {/* ASD Status */}
        <div className="flex items-center justify-between">
          <span>
            ASD:{" "}
            {currentReport.is_asd ? (
              <span className="text-green-600 font-medium">✅ Approved</span>
            ) : currentReport.asd_remarks ? (
              <span className="text-red-600 font-medium">✏️ Sent for Revision</span>
            ) : !currentReport.is_commex ? (
              <span className="text-gray-600">⏳ Pending Commex approval...</span>
            ) : (
              <span className="text-gray-600">⏳ Pending ASD review</span>
            )}
          </span>

          {currentReport.asd_remarks && (
            <Button
              label="View Remarks"
              size="small"
              severity="info"
              onClick={() => {
                setRemarksText(currentReport.commex_remarks || currentReport.asd_remarks);
                setShowRemarksDialog(true);
              }}
            />
          )}
        </div>

          {/* 🔹 Remarks Popup */}
          <Dialog
            header="Remarks"
            visible={showRemarksDialog}
            style={{ width: "40vw" }}
            modal
            onHide={() => setShowRemarksDialog(false)}
          >
            <p className="whitespace-pre-line">{remarksText}</p>
          </Dialog>

          <Dialog
            header="Revise Report"
            visible={showReviseDialog}
            style={{ width: "40vw" }}
            modal
            onHide={() => setShowReviseDialog(false)}
          >
            <InputTextarea
              value={revisionRemarks}
              onChange={(e) => setRevisionRemarks(e.target.value)}
              rows={5}
              placeholder="Enter your revision remarks..."
            />
            <Button
              label="Submit Revision"
              severity="success"
              loading={loading}
              onClick={submitRevision}
            />
          </Dialog>
      </div>
      {/* 🔹 Existing Approve / Revise buttons */}
      {eventStatusId === 4 && (
        <div>
          {/* ... your existing button logic */}
        </div>
      )}
    </div>
      <h1 className="text-2xl font-semibold mb-4">View Report</h1>
      

      {/* Buttons */}
      <div className="flex gap-2 mb-4 items-center">
        <Button label="Back" onClick={() => navigate(-1)} />

        {/* Submit button */}
        {canSubmitOrPullBack && isCreator && eventStatusId !== 4 && !isApprovedByAny && (
          <Button label="Submit" severity="success" loading={loading} onClick={handleSubmit} />
        )}

        {/* Pull-back button: only show if already submitted, not approved, AND user is creator */}
        {canSubmitOrPullBack && isCreator && [8, 4,].includes(eventStatusId) && !isFullyApproved && (
          <Button label="Pull-back" severity="danger" loading={loading} onClick={handlePullBack} />
        )}
        {isCreator && !isFullyApproved && eventStatusId == 5 && (
          <Button label="Update" severity="warning" onClick={() => navigate("/create-report-progress", { state: { activities_id: currentReport.activities_id, report: currentReport } })}/>
        )}

 {[4, 6, 8].includes(eventStatusId) && (
  <>
    {/* Commex Approve/Revise (role_id = 1) */}
    {currentRoleId === 1 && !currentReport.is_commex && (
      <>
        <Button
          label="Approve"
          severity="success"
          loading={loading}
          onClick={handleApprove}
          tooltip="Approving will mark your approval. ASD can only review after this."
        />
        <Button
          label="Revise"
          severity="warning"
          loading={loading}
          onClick={handleRevise}
          tooltip="Send report back for revision with remarks"
        />
      </>
    )}

    {/* ASD Approve/Revise (role_id = 10) */}
    {currentRoleId === 10 && (
      <>
        {!currentReport.is_commex ? (
          <p className="text-gray-600 italic">⏳ Pending Commex approval...</p>
        ) : !currentReport.is_asd ? (
          <>
            <Button
              label="Approve"
              severity="success"
              loading={loading}
              onClick={handleApprove}
              tooltip="Approving will finalize the review process."
            />
            <Button
              label="Revise"
              severity="warning"
              loading={loading}
              onClick={handleRevise}
              tooltip="Send report back for revision with remarks"
            />
          </>
        ) : (
          <p className="text-green-600 italic">✅ ASD already approved.</p>
        )}
      </>
    )}
  </>
)}


      </div>

      {/* Report Details */}
      <div className="w-full max-w-3xl space-y-4">
        <div>
          <h2 className="font-bold">Objectives:</h2>
          <p>{currentReport.objectives || "N/A"}</p>
        </div>
        <div>
          <h2 className="font-bold">Target Group:</h2>
          <p>{currentReport.target_group || "N/A"}</p>
        </div>
        <div>
          <h2 className="font-bold">Description:</h2>
          <p>{currentReport.description || "N/A"}</p>
        </div>
        <div>
          <h2 className="font-bold">Achievements:</h2>
          <p>{currentReport.achievements || "N/A"}</p>
        </div>
        <div>
          <h2 className="font-bold">Challenges:</h2>
          <p>{currentReport.challenges || "N/A"}</p>
        </div>
        <div>
          <h2 className="font-bold">Feedback:</h2>
          <p>{currentReport.feedback || "N/A"}</p>
        </div>
        <div>
          <h2 className="font-bold">Acknowledgements:</h2>
          <p>{currentReport.acknowledgements || "N/A"}</p>
        </div>

        {/* Budget Summaries */}
        <div className="mt-6">
          <h2 className="font-bold mb-2">Budget Summaries:</h2>
          {currentReport.budget_summaries?.length > 0 ? (
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Description</th>
                  <th className="border p-2">Item</th>
                  <th className="border p-2">Personnel</th>
                  <th className="border p-2">Quantity</th>
                  <th className="border p-2">Cost</th>
                </tr>
              </thead>
              <tbody>
                {currentReport.budget_summaries.map((b, idx) => (
                  <tr key={idx} className="text-center">
                    <td className="border p-2">{b.description || "N/A"}</td>
                    <td className="border p-2">{b.item || "N/A"}</td>
                    <td className="border p-2">{b.personnel || "N/A"}</td>
                    <td className="border p-2">{b.quantity || "N/A"}</td>
                    <td className="border p-2">{b.cost}</td>
                  </tr>
                ))}
                <tr className="text-center font-bold bg-gray-100">
                  <td className="border p-2" colSpan={4}>
                    Total budget
                  </td>
                  <td className="border p-2">
                    {currentReport.budget_summaries.reduce((sum, b) => sum + Number(b.cost || 0), 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p>No budget summaries available.</p>
          )}
        </div>
      </div>
    </div>
  );
};
