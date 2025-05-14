import { getEvents, getUserEvents } from "@_src/services/event"
import { useUserStore } from '@_src/store/auth';
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { PiNotePencil, PiListMagnifyingGlass } from "react-icons/pi";
import { TbUsersGroup } from "react-icons/tb";
import { FaWpforms } from "react-icons/fa";
import { useNavigate } from 'react-router-dom'
import _ from "lodash";
import { useEffect } from "react";


export const View = () => {
    const navigate = useNavigate()
    const { user, token } = useUserStore((state) => ({ user: state.user, token: state.token }));
    const decryptedToken = token && DecryptString(token)
    const decryptedUser = token && DecryptUser(user)
    const { data: eventData, isLoading: eventLoading, refetch: eventRefetch, isRefetching: eventRefetchLoading } = getEvents({token: decryptedToken})
    const { data: userEventData, isLoading: userEventLoading, refetch: userEventRefetch, isRefetching: userEventRefetchLoading} = getUserEvents({
        token: decryptedToken,
        user_id: decryptedUser?.id
    })

    const handleUpdateEventNavigation = (rowData) => {
        if(decryptedUser?.role_id === 1) {
            navigate('/admin/event/update', { state: rowData })
        } else {
            navigate('/event/update', { state: rowData })
        }
    }
    const handleDetailEventNavigation = (rowData) => {
        if(decryptedUser?.role_id === 1) {
            navigate('/admin/event/detail', { state: rowData })
        } else {
            navigate('/event/detail', { state: rowData })
        }
    }
    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-8">
                {((decryptedUser?.role_id !== 1 ) || (rowData?.organization_id === 1)) && 
                    <button onClick={() => handleUpdateEventNavigation(rowData)}>
                        <PiNotePencil className="w-7 h-7 text-[#364190]"/>
                    </button>
                }
                <button onClick={() => handleDetailEventNavigation(rowData)}>
                    <PiListMagnifyingGlass className="w-7 h-7 text-[#364190]"/>
                </button>
                {rowData?.event_status_id === 2 &&
                    <>
                    <button>
                        <TbUsersGroup className="w-7 h-7 text-[#364190]"/>
                    </button>
                    <button onClick={() => navigate("/event/form-list", { state: rowData })}>
                        <FaWpforms className="w-7 h-7 text-[#364190]"/>
                    </button>
                    </>
                }
            </div>
        )
    }
    const setStatus = (rowData) => {
        return (
            <div className={`${rowData.eventstatus.name.toLowerCase() === 'active' ? 'text-violet-400'
                : rowData.eventstatus.name.toLowerCase() === 'pending' ? 'text-yellow-400' 
                : rowData.eventstatus.name.toLowerCase() === 'declined' ? 'text-red-400' 
                : 'text-green-400' }`}>
                {rowData.eventstatus.name}
            </div>
        )
    }

    useEffect(() => {
        eventRefetch()
        userEventRefetch()
    }, [eventRefetch, userEventRefetch])

    if(eventLoading || userEventLoading || eventRefetchLoading || userEventRefetchLoading) {
        return (
            <div className="view-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px]">
                Event loading...
            </div>
        )
    }

    if(!eventLoading || !userEventLoading || !eventRefetchLoading || !userEventRefetchLoading || eventData || userEventData) {
        const events = ![1, 10, 11].includes(decryptedUser?.role_id) ? userEventData?.data : eventData?.data.data        
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
