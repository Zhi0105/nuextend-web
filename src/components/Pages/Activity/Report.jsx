import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from '@_src/store/auth';
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { toast } from "react-toastify";
import { getReportsByActivity, getEventStatuses } from "@_src/services/form14";
import dayjs from "dayjs";

export const Report = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activities_id, creator_id } = location.state || {}; // Receive creator_id
  const { token, user } = useUserStore((s) => ({ token: s.token, user: s.user }));
  const decryptedToken = token && DecryptString(token);
  const decryptedUser = user && DecryptUser(user);
  const currentUserId = decryptedUser?.id;

  const [reports, setReports] = useState([]);
  const [eventStatuses, setEventStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creatorId] = useState(creator_id || null); // store creator ID from state

  // Load reports
  useEffect(() => {
    if (!activities_id || !decryptedToken) return;

    setLoading(true);
    getReportsByActivity({ token: decryptedToken, activities_id })
      .then((res) => setReports(res || []))
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to fetch reports"))
      .finally(() => setLoading(false));
  }, [activities_id, decryptedToken]);

  // Load event_status list (optional if needed for something else)
  useEffect(() => {
    if (!decryptedToken) return;

    getEventStatuses({ token: decryptedToken })
      .then((res) => setEventStatuses(res || []))
      .catch(() => toast.error("Failed to fetch event statuses"));
  }, [decryptedToken]);

  // Generate status text based on partial/full approval or revision
  const getStatusName = (report) => {
    const eventStatusId = report.event_status_id;

    // Fully approved
    if (report.is_commex && report.is_asd) {
      return "✅ Approved";
    }

    if (report.event_status_id === 6) {
      return "✏️ Sent for Revision";
    }

    if (eventStatusId === 4) {
      return "Submitted";
    }
    if (eventStatusId === 8) {
      return "✏️ Resubmitted";
    }
    if (eventStatusId === 5) {
      return "Returned";
    }
  };

  const reportNameTemplate = (rowData, options) => `Report ${options.rowIndex + 1}`;
  const dateTemplate = (rowData) => dayjs(rowData.created_at).format("MMM D, YYYY HH:mm");

  // Navigate to view report
  const actionTemplate = (rowData) => (
    <Button
      label="View"
      className="p-button-sm p-button-info"
      onClick={() => navigate("/view-report", { state: { report: rowData, creator_id: creatorId } })}
    />
  );

  // Determine if current user is the creator
  const isCreator = creatorId === currentUserId;

  // Compute total cost for all reports
  const grandTotalCost = reports.reduce((total, report) => {
    const reportCost = report.budget_summaries
      ? report.budget_summaries.reduce((sum, b) => sum + Number(b.cost || 0), 0)
      : 0;
    return total + reportCost;
  }, 0);

  return (
    <div className="report-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] pt-[5rem] px-4">
      <h1 className="text-2xl font-semibold mb-4">Progress Reports</h1>

      {isCreator && (
        <Button
          label="Create Progress Report"
          className="bg-[#2211cc] text-[#c7c430] font-bold rounded-lg px-4 py-2 mb-6"
          onClick={() => {
            if (!activities_id) {
              toast.warning("Activity ID not found!");
              return;
            }
            navigate("/create-report-progress", { state: { activities_id } });
          }}
        />
      )}

      <div className="w-full max-w-5xl">
        <DataTable
          value={reports}
          dataKey="form14_id"
          responsiveLayout="scroll"
          emptyMessage={loading ? "Loading..." : "No reports found."}
          loading={loading}
        >
          <Column header="Report Name" body={reportNameTemplate} />
          <Column header="Date / Time" body={dateTemplate} />
          <Column
            header="Status"
            body={(rowData) => getStatusName(rowData)}
          />
          <Column
            header="Budget"
            body={(rowData) => {
              const reportCost = rowData.budget_summaries
                ? rowData.budget_summaries.reduce((sum, b) => sum + Number(b.cost || 0), 0)
                : 0;
              return `₱${reportCost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`;
            }}
            footer={`Total: ₱${grandTotalCost.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
          />
          <Column header="Actions" body={actionTemplate} />
        </DataTable>
      </div>
    </div>
  );
};
