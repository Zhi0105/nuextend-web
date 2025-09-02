import {  useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { getProgramProposals } from '@_src/services/proposal';
import { useUserStore } from '@_src/store/auth';
import { DecryptString } from '@_src/utils/helpers';
import { Tooltip } from 'primereact/tooltip';
import { PiNotePencil } from 'react-icons/pi';
import { useNavigate } from "react-router-dom";


export const ProgramData = () => {
    const navigate = useNavigate()
    const { token } = useUserStore((state) => ({ token: state.token }));
    const decryptedToken = token && DecryptString(token);

    const { data: programData, isLoading: programLoading } = getProgramProposals({
        token: decryptedToken,
    });

    const [globalFilter, setGlobalFilter] = useState('');

    const rows = useMemo(() => {
        const arr = programData?.data ?? [];
        return (Array.isArray(arr) ? arr : []).map((item, idx) => ({
            id: item?.id ?? idx,
            // your payload shows two variants that both have a "title"
            // e.g. detailed object with title: "sample proposal" and also {id, title: 'Quis esse...'}
            title: item?.title ?? '',
            implementer: item?.implementer ?? '',
            programTeamMembers:  Array.isArray(item?.program_team_members) ? [...item.program_team_members] : [],
            targetGroup: item?.targetGroup ?? '',
            cooperatingAgencies:  Array.isArray(item?.program_cooperating_agencies) ? [...item.program_cooperating_agencies] : [],
            duration: item?.duration ?? '',
            proposalBudget: item?.proposalBudget ?? '',
            background: item?.background ?? '',
            overallGoal: item?.overallGoal ?? '',
            scholarlyConnection: item?.scholarlyConnection ?? '',
            coordinator: item?.coordinator ?? '',
            mobileNumber: item?.mobileNumber ?? '',
            email: item?.email ?? '',
            componentProjects:  Array.isArray(item?.program_component_projects) ? [...item.program_component_projects] : [],
            projects:  Array.isArray(item?.program_projects) ? [...item.program_projects] : [],
            activityPlans:  Array.isArray(item?.program_activity_plans) ? [...item.program_activity_plans] : [],
        }));
    }, [programData]);

    const actionBodyTemplate = (rowData) => {
        return (
            <button
                onClick={() => navigate('/event/form/generate/program', { state: rowData })}
            >
                <Tooltip target=".edit" content="Edit" position="right" />
                <PiNotePencil className="edit w-7 h-7 text-[#364190]"/>
            </button>
        )
    }

    
    if (programLoading) {
        return (
        <div className="outreach-data-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
            Loading proposals...
        </div>
        );
    }

    return (
        <div className="program-data-main min-h-screen bg-white w-full flex flex-col justify-center gap-6 xs:pl-[0px] sm:pl-[200px] py-10 px-4">
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
                    globalFilterFields={['title', 'implementer', 'targetGroup', 'duration', 'coordinator', 'mobileNumber', 'email']}   // fields to search
                    globalFilter={globalFilter}      // bind the search box
                    dataKey="id"
                >
                    <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="title" header="Title"  />
                    <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="implementer" header="Implementer"  />
                    <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="targetGroup" header="Target group"  />
                    <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="duration" header="Duration"  />
                    <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="coordinator" header="Coordinator"  />
                    <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="mobileNumber" header="Mobile"  />
                    <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="email" header="Email"  />
                    <Column headerClassName="bg-[#FCA712] text-white" body={actionBodyTemplate} header="Action" />
                </DataTable>
            </div>
        </div>
    )
}
