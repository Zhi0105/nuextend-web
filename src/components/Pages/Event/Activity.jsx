import { useLocation, useNavigate } from "react-router-dom";
import { DataTable } from 'primereact/datatable';
import { Tooltip } from 'primereact/tooltip';
import { Column } from 'primereact/column';
import { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { TbUsersGroup } from "react-icons/tb";
import { HiDocumentReport } from "react-icons/hi";
import { Tag } from 'primereact/tag';
import _ from "lodash";
import { getReportsByActivity } from "@_src/services/form14";
import { useUserStore } from "@_src/store/auth";
import { DecryptString } from "@_src/utils/helpers";

export const Activity = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const data = location.state;
  const { token } = useUserStore((s) => ({ token: s.token }));
  const decryptedToken = token && DecryptString(token);

  const [globalFilter, setGlobalFilter] = useState("");
  const [activitiesWithReports, setActivitiesWithReports] = useState([]);

  // Fetch reports for each activity
  useEffect(() => {
    if (!decryptedToken || !data?.activity) return;

    const fetchReports = async () => {
      const updatedActivities = await Promise.all(
        data.activity.map(async (activity) => {
          try {
            const reports = await getReportsByActivity({
              token: decryptedToken,
              activities_id: activity.id
            });
            return { ...activity, progress_report: reports || [] };
          } catch (err) {
            console.error("Error fetching reports for activity", activity.id, err);
            return { ...activity, progress_report: [] };
          }
        })
      );
      setActivitiesWithReports(updatedActivities);
    };

    fetchReports();
  }, [data?.activity, decryptedToken]);

  const actionBodyTemplate = (rowData) => (
    <div className="flex gap-8">
      <button onClick={() => navigate("/event/participants", { state: data?.participants })}>
        <Tooltip target=".participants" content="Participants" position="right" />
        <TbUsersGroup className="participants w-7 h-7 text-[#364190]" />
      </button>
      <button
        onClick={() =>
          navigate("/event/activities/report", {
            state: { data: rowData, user_id: data?.user_id, activities_id: rowData.id, creator_id: data?.user_id },
          })
        }
      >
        <Tooltip target=".report" content="Report" position="right" />
        <HiDocumentReport className="report w-7 h-7 text-[#364190]" />
      </button>
    </div>
  );

  // Status logic based on reports
  const StatusBody = (activity) => {
    const reports = _.get(activity, "progress_report", []);
    if (_.isEmpty(reports)) return <Tag value="No reports" severity="secondary" rounded />;

    const approvedReports = reports.filter((r) => r.event_status_id === 7); // approved
    const totalReports = reports.length;

    if (approvedReports.length === totalReports) {
      return <Tag value="Done" severity="success" rounded />;
    }

    return <Tag value={`${approvedReports.length}/${totalReports} complete`} severity="warning" rounded />;
  };

  // Total budget per activity (sum of all budget_summaries like Report page)
  const totalBudget = (activity) => {
    const reports = _.get(activity, "progress_report", []);
    const total = _.sumBy(reports, (r) =>
      r.budget_summaries
        ? _.sumBy(r.budget_summaries, (b) => Number(b.cost || 0))
        : 0
    );
    return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(total);
  };

  // Overall budget for all activities
  const overallBudget = (activities) => {
    return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
      _.sumBy(activities, (activity) =>
        _.sumBy(activity.progress_report, (r) =>
          r.budget_summaries
            ? _.sumBy(r.budget_summaries, (b) => Number(b.cost || 0))
            : 0
        )
      )
    );
  };

  return (
    <div className="activity-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] pt-[5rem]">
      <div className="w-full flex justify-end mb-4 px-2">
        <InputText
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search..."
          className="p-inputtext-sm py-2 px-4"
        />
      </div>

      <DataTable
        value={activitiesWithReports}
        size="normal"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        dataKey="id"
        emptyMessage="Activities(s) Not Found."
        className="datatable-responsive min-w-full px-2 py-2"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} activities"
        rows={10}
        paginator
        removableSort
        filterDisplay="row"
        globalFilter={globalFilter}
        globalFilterFields={["name", "description", "address", "start_date", "end_date"]}
      >
        <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="name" header="Name" />
        <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="description" header="Description" />
        <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="address" header="Location" />
        <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="start_date" header="StartDate" />
        <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="end_date" header="EndDate" />
        <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" body={(rowData) => totalBudget(rowData)} header="Budget" />
        <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" body={StatusBody} header="Status" />
        <Column headerClassName="bg-[#FCA712] text-white" body={actionBodyTemplate} header="Action" />
      </DataTable>

      <div className="w-full flex justify-start mt-4 px-4">
        <span className="font-bold text-lg">Overall Budget: {overallBudget(activitiesWithReports)}</span>
      </div>
    </div>
  );
};
