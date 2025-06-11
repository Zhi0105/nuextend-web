import { useLocation } from "react-router-dom"
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FaRegCalendarCheck } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom'

export const Participant = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const participants = location.state 

    const nameTemplate = (rowData) => {
        return (
            <div>
                {rowData?.user.lastname}, {rowData?.user.firstname} {rowData?.user.middlename}
            </div>
        )
    }

    // 
    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-8">
            
                <button onClick={() => navigate('/event/participants/attendance', {state: rowData})}>
                    <FaRegCalendarCheck className="w-7 h-7 text-[#364190]"/>
                </button>
            </div>
        )
    }
    
    return (
        <div className="participant-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] pt-[5rem]">
            <DataTable 
                    value={participants} 
                    size="normal"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    dataKey="id"
                    emptyMessage="Participant(s) Not Found."
                    className="datatable-responsive min-w-full px-2 py-2"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} participants"
                    rows={10}
                    paginator
                    removableSort
                    filterDisplay="row"
                >
                    <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" body={nameTemplate} header="Participant" />
                    <Column headerClassName="bg-[#FCA712] text-white" body={actionBodyTemplate} header="Action"></Column>

                </DataTable>
        </div>
    )
}
