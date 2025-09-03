import { useLocation, useNavigate } from "react-router-dom"
import { DataTable } from 'primereact/datatable';
import { Tooltip } from 'primereact/tooltip';
import { Column } from 'primereact/column';
import { useState } from "react";
import { InputText } from "primereact/inputtext";
import { TbUsersGroup } from "react-icons/tb";

export const Activity = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const data = location.state 
    const [globalFilter, setGlobalFilter] = useState("")
    
    const actionBodyTemplate = () => {
            return (
                <div className="flex gap-8">
                    <button onClick={() => navigate("/event/participants", { state: data?.participants })}>
                    <Tooltip target=".participants" content="Participants" position="right" />
                    <TbUsersGroup className="participants w-7 h-7 text-[#364190]" />
                    </button>
                </div>
            )
        }

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
                <Column headerClassName="bg-[#FCA712] text-white" body={actionBodyTemplate} header="Action"></Column>

            </DataTable>
        </div>
    )
}
