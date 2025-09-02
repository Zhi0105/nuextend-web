import {  useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { getOutreachProposals } from '@_src/services/proposal';
import { useUserStore } from '@_src/store/auth';
import { DecryptString } from '@_src/utils/helpers';
import { Tooltip } from 'primereact/tooltip';
import { PiNotePencil } from 'react-icons/pi';
import { useNavigate } from "react-router-dom";

export const OutreachData = () => {
    const navigate = useNavigate()
    const { token } = useUserStore((state) => ({ token: state.token }));
    const decryptedToken = token && DecryptString(token);

    const { data: outreachData, isLoading: outreachLoading } = getOutreachProposals({
        token: decryptedToken,
    });

    const [globalFilter, setGlobalFilter] = useState('');

    // Normalize response into simple rows: { id, title }
    const rows = useMemo(() => {
        const arr = outreachData?.data ?? [];
        return (Array.isArray(arr) ? arr : []).map((item, idx) => ({
            id: item?.id ?? idx,
            // your payload shows two variants that both have a "title"
            // e.g. detailed object with title: "sample proposal" and also {id, title: 'Quis esse...'}
            title: item?.title ?? '',
            description: item?.description ?? '',
            targetGroup: item?.targetGroup ?? '',
            startDate: item?.startDate ?? '',
            endDate: item?.endDate ?? '',
            activityPlanBudget: Array.isArray(item?.outreach_activity_plans_budgets) ? [...item.outreach_activity_plans_budgets] : [],
            detailedBudget: Array.isArray(item?.outreach_detailed_budgets) ? [...item.outreach_detailed_budgets] : [],
            budgetSourcing: Array.isArray(item?.outreach_budget_sourcings) ? [...item.outreach_budget_sourcings] : [],
            projectLeader: item?.projectLeader ?? '',
            mobile: item?.mobile ?? '',
            email: item?.email ?? '',

        }));
    }, [outreachData]);

    const actionBodyTemplate = (rowData) => {
        return (
            <button
                onClick={() => navigate('/event/form/generate/outreach', { state: rowData })}
            >
                <Tooltip target=".edit" content="Edit" position="right" />
                <PiNotePencil className="edit w-7 h-7 text-[#364190]"/>
            </button>
        )
    }

    if (outreachLoading) {
        return (
        <div className="outreach-data-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
            Loading proposals...
        </div>
        );
    }

    return (
        <div className="outreach-data-main min-h-screen bg-white w-full flex flex-col justify-center gap-6 xs:pl-[0px] sm:pl-[200px] py-10 px-4">
            <div className="flex items-center gap-2 px-4">
                <span className="p-input-icon-left">
                <InputText
                    className="text-sm p-2"
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Search"
                />
                </span>
            </div>

            <div className='px-4'>
                <DataTable
                    size='normal'
                    value={rows}
                    paginator
                    rows={10}
                    removableSort
                    emptyMessage="No proposals found."
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} proposals"
                    globalFilterFields={['title', 'targetGroup', 'projectLeader', 'mobile', 'email', 'startDate', 'endDate']}   // fields to search
                    globalFilter={globalFilter}      // bind the search box
                    dataKey="id"
                >
                    <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="title" header="Title"  />
                    <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="targetGroup" header="Target Group"  />
                    <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="projectLeader" header="Leader"  />
                    <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="mobile" header="Mobile"  />
                    <Column headerClassName="bg-[#364190] text-white" className="font-bold" field="email" header="Email"  />
                    <Column headerClassName="bg-[#364190] text-white" className="font-bold" field="startDate" header="Startdate"  />
                    <Column headerClassName="bg-[#364190] text-white" className="font-bold" field="endDate" header="endDate"  />
                    <Column headerClassName="bg-[#FCA712] text-white" body={actionBodyTemplate} header="Action" />
                </DataTable>
            </div>
        </div>
    );
};
