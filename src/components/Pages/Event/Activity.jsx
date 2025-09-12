import { useLocation, useNavigate } from "react-router-dom"
import { DataTable } from 'primereact/datatable';
import { Tooltip } from 'primereact/tooltip';
import { Column } from 'primereact/column';
import { useState } from "react";
import { InputText } from "primereact/inputtext";
import { TbUsersGroup } from "react-icons/tb";
import { HiDocumentReport } from "react-icons/hi";
import { Tag } from 'primereact/tag';
import _ from "lodash";

export const Activity = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const data = location.state 
    const [globalFilter, setGlobalFilter] = useState("")
    
    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-8">
                <button onClick={() => navigate("/event/participants", { state: data?.participants })}>
                    <Tooltip target=".participants" content="Participants" position="right" />
                    <TbUsersGroup className="participants w-7 h-7 text-[#364190]" />
                </button>
                <button onClick={() => navigate("/event/activities/report", { state: { data: rowData, user_id: data?.user_id } })}>
                    <Tooltip target=".report" content="Report" position="right" />
                    <HiDocumentReport className="report w-7 h-7 text-[#364190]" />
                </button>
            </div>
        )
    }

    // returns true ONLY if may reports AND lahat ay approved
    const isAllApproved = (activity) => {
        const reports = _.get(activity, 'progress_report', []);
        return !_.isEmpty(reports) &&
                _.every(reports, (r) => Number(r.is_commex) === 1 && Number(r.is_asd) === 1);
    };

    // (optional) progress summary
    const approvedCount = (activity) => {
        const reports = _.get(activity, 'progress_report', []);
        return _.sumBy(reports, (r) => (Number(r.is_commex) === 1 && Number(r.is_asd) === 1 ? 1 : 0));
    };

    const StatusBody = (rowData) => {
    const reports = _.get(rowData, 'progress_report', []);
    console.log(reports)
    const allApproved = isAllApproved(rowData);

    // walang report yet
    if (_.isEmpty(reports)) {
        return <Tag value="No reports" severity="secondary" rounded />;
    }

    // may reports
    return allApproved
        ? <Tag value="Done" severity="success" rounded />
        : <Tag value={`${approvedCount(rowData)}/${reports.length} approved`} severity="warn" rounded />;
    };
        // total budget per activity with money format
    const totalBudget = (activity) => {
        const reports = _.get(activity, 'progress_report', []);
        const total = _.sumBy(reports, (r) => Number(r.budget) || 0);

        // Format as PHP Peso (₱) — change currency if needed
        return new Intl.NumberFormat('en-PH', { 
            style: 'currency', 
            currency: 'PHP' 
        }).format(total);
    };
        // overall budget for ALL activities
    const overallBudget = (activities) => {
        return new Intl.NumberFormat('en-PH', { 
            style: 'currency', 
            currency: 'PHP' 
        }).format(
            _.sumBy(activities, (activity) => 
                _.sumBy(activity.progress_report, (r) => Number(r.budget) || 0)
            )
        );
    };


    return (
        <div className="activity-main min-h-screen bg-white w-full flex flex-col  items-center xs:pl-[0px] sm:pl-[200px] pt-[5rem]">
            
            <div className="w-full flex justify-end mb-4 px-2">
                    <InputText  
                        value={globalFilter} 
                        onChange={(e) => setGlobalFilter(e.target.value)} 
                        placeholder="Search..." 
                        className="p-inputtext-sm py-2 px-4"
                    />
            </div>
            <DataTable 
                value={data?.activity} 
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
                globalFilter={globalFilter}   // 👈 Add this
                globalFilterFields={['name', 'description', 'address', 'start_date', 'end_date']} // 👈 Define searchable fields
            >
                <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="name" header="Name" />
                <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="description" header="Description" />
                <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="address" header="Location" />
                <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="start_date" header="StartDate" />
                <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="end_date" header="EndDate" />
                <Column 
                    headerClassName="bg-[#364190] text-white" 
                    className="capitalize font-bold" 
                    body={(rowData) => totalBudget(rowData)} 
                    header="Budget" 
                />
                <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" body={StatusBody} header="Status" />
                <Column headerClassName="bg-[#FCA712] text-white" body={actionBodyTemplate} header="Action"></Column>

            </DataTable>
            <div className="w-full flex justify-start mt-4 px-4">
                <span className="font-bold text-lg">
                    Overall Budget: {overallBudget(data?.activity || [])}
                </span>
            </div>
        </div>
    )
}
