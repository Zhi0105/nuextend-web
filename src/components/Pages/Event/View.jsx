import { getEvents } from "@_src/services/event"
import { useUserStore } from '@_src/store/auth';
import { DecryptString } from "@_src/utils/helpers";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { PiNotePencil, PiListMagnifyingGlass } from "react-icons/pi";
import { useNavigate } from 'react-router-dom'


export const View = () => {
    const navigate = useNavigate()
    const { token } = useUserStore((state) => ({ token: state.token }));
    const decryptedToken = token && DecryptString(token)
    const { data: eventData, isLoading: eventLoading } = getEvents({token: decryptedToken})


    
    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-8">
                <button onClick={() => navigate('/event/update', { state: rowData })}>
                    <PiNotePencil className="w-7 h-7 text-[#364190]"/>
                </button>
                <button onClick={() => console.log(rowData)}>
                    <PiListMagnifyingGlass className="w-7 h-7 text-[#364190]"/>
                </button>
                
            </div>
        )
    }

    const setStatus = (rowData) => {
        return (
            <div className={`${rowData.eventstatus.name.toLowerCase() === 'active' ? 'text-violet-400' : rowData.eventstatus.name.toLowerCase() === 'pending' ? 'text-yellow-400' : 'text-green-400' }`}>
                {rowData.eventstatus.name}
            </div>
        )
    }

    if(eventLoading) {
        return (
            <div className="view-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px]">
                Event loading...
            </div>
        )
    }

    if(!eventLoading || eventData) {
        const events = eventData?.data.data
        return (
            <div className="view-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] pt-[5rem]">
                <DataTable 
                    value={events} 
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
                    <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="name" header="Event" />
                    <Column headerClassName="bg-[#364190] text-white" body={setStatus} header="Status" />
                    <Column headerClassName="bg-[#FCA712] text-white" body={actionBodyTemplate} header="Action"></Column>

                </DataTable>
            </div>
        )
    }

}
