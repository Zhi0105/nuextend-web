import { getOrganizations } from "@_src/services/organization"
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FaUserGroup } from "react-icons/fa6";
import { BsFillCalendarEventFill } from "react-icons/bs";

export const View = () => {
    const { data: orgData, isLoading: orgLoading } = getOrganizations()

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-8">
                <button onClick={() => console.log(rowData)} className="flex gap-2 justify-center items-center cursor-pointer">
                    <FaUserGroup className="w-4 h-4 text-[#364190]"/>
                    <label className="text-xs text-[#FCA712]">Members</label>
                </button>
                <button onClick={() => console.log(rowData)} className="flex gap-2 justify-center items-center cursor-pointer">
                    <BsFillCalendarEventFill className="w-4 h-4 text-[#364190]"/>
                    <label className="text-xs text-[#FCA712]">Events</label>
                </button>
                
            </div>
        )
    }

    if(orgLoading) {
        return (
            <div className="orgview-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] pt-[5rem]">
                Organization loading...
            </div>
        )
    }

    if(!orgLoading || orgData) {
        const organizations = orgData?.data
        return (
            <div className="orgview-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] pt-[5rem]">
                <DataTable 
                    value={organizations} 
                    size="normal"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    dataKey="id"
                    emptyMessage="Event(s) Not Found."
                    className="datatable-responsive min-w-full px-2 py-2"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} events"
                    rows={10}
                    paginator
                    removableSort
                >
                    <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="name" header="Organization" />
                    <Column headerClassName="bg-[#FCA712] text-white" body={actionBodyTemplate} header="Action"></Column>

                </DataTable>
            </div>
        )
    }
}
