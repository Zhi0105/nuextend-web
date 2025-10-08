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
import { LuEye } from "react-icons/lu";

export const Report = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data, activities_id, creator_id } = location.state || {};
  const { token, user } = useUserStore((s) => ({ token: s.token, user: s.user }));
  const decryptedToken = token && DecryptString(token);
  const decryptedUser = user && DecryptUser(user);
  const currentUserId = decryptedUser?.id;
  const currentRoleId = decryptedUser?.role_id;

  const [reports, setReports] = useState([]);
  const [eventStatuses, setEventStatuses] = useState([]); // Fixed this line
  const [loading, setLoading] = useState(false);
  const [creatorId] = useState(creator_id || null);

  // Check if view button should be shown
  const shouldShowViewButton = (rowData) => {
    const isCreator = creatorId === currentUserId;
    const isCommex = currentRoleId === 1;
    const isAsd = currentRoleId === 10;
    const isRole11 = currentRoleId === 0;
    const isRole12 = currentRoleId === 11;
    
    const hiddenStatuses = [3, 5, 6, 8];
    
    if (isCreator) {
      return true;
    }
    
    if (isCommex) {
      return !hiddenStatuses.includes(rowData.event_status_id);
    }
    
    if (isAsd || isRole11 || isRole12) {
      return !hiddenStatuses.includes(rowData.event_status_id);
    }
    
    return false;
  };

  // Load reports
  useEffect(() => {
    if (!activities_id || !decryptedToken) {
      console.log("Missing activities_id or token:", { activities_id, hasToken: !!decryptedToken });
      return;
    }

    setLoading(true);
    getReportsByActivity({ token: decryptedToken, activities_id })
      .then((res) => {
        console.log("Reports fetched:", res);
        setReports(res || []);
      })
      .catch((err) => {
        console.error("Error fetching reports:", err);
        toast.error(err?.response?.data?.message || "Failed to fetch reports");
      })
      .finally(() => setLoading(false));
  }, [activities_id, decryptedToken]);

  // Load event_status list
  useEffect(() => {
    if (!decryptedToken) return;

    getEventStatuses({ token: decryptedToken })
      .then((res) => setEventStatuses(res || []))
      .catch((err) => {
        console.error("Error fetching event statuses:", err);
        toast.error("Failed to fetch event statuses");
      });
  }, [decryptedToken]); // Removed the eslint disable comment

  // Generate status text based on partial/full approval or revision
  const getStatusName = (report) => {
    const { event_status_id, is_commex, is_asd } = report;

    if (is_commex && is_asd) return "✅ Approved";

    const statusMap = {
      6: "✏️ Sent for Revision",
      4: "Submitted",
      8: "Updated",
      9: "Resubmitted",
      5: "Returned",
      3: "Not Yet Submitted",
    };

    return statusMap[event_status_id] || "⏳ Pending";
  };

  const reportNameTemplate = (rowData, options) => `Report ${options.rowIndex + 1}`;
  const dateTemplate = (rowData) => dayjs(rowData.created_at).format("MMM D, YYYY HH:mm");

  // Navigate to view report
  const actionTemplate = (rowData) => {
    if (!shouldShowViewButton(rowData)) {
      return null;
    }

    return (
      <div className="relative group flex justify-center">
        <Button
          className="p-button-sm p-button-info p-button-outlined flex items-center justify-center w-8 h-8"
          onClick={() => {
            if (!rowData.form14_id) {
              toast.error("Report data is incomplete");
              return;
            }
            navigate("/view-report", { 
              state: { 
                activity: data, 
                report: rowData, 
                creator_id: creatorId 
              } 
            });
          }}
        >
          <LuEye size={30} />
        </Button>
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
          View
        </div>
      </div>
    );
  };

  const isCreator = creatorId === currentUserId;
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