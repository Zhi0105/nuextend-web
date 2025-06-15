import { getEvents, getUserEvents } from "@_src/services/event"
import { useUserStore } from '@_src/store/auth';
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { PiNotePencil, PiListMagnifyingGlass, PiCertificate } from "react-icons/pi";
import { TbUsersGroup } from "react-icons/tb";
import { FaSearch, FaWpforms } from "react-icons/fa";
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from "react";
import { FilterMatchMode } from "primereact/api";
import { InputText } from "primereact/inputtext";
import { MdAttachment } from "react-icons/md";
import { Tooltip } from 'primereact/tooltip'
import { useCertificatePreview } from "@_src/utils/useCertificatePreview";
import _ from "lodash";


export const View = () => {
    const navigate = useNavigate()
    const previewCertificates = useCertificatePreview();
    const { user, token } = useUserStore((state) => ({ user: state.user, token: state.token }));
    const decryptedToken = token && DecryptString(token)
    const decryptedUser = token && DecryptUser(user)
    const { data: eventData, isLoading: eventLoading, refetch: eventRefetch, isRefetching: eventRefetchLoading } = getEvents({token: decryptedToken})
    const { data: userEventData, isLoading: userEventLoading, refetch: userEventRefetch, isRefetching: userEventRefetchLoading} = getUserEvents({
        token: decryptedToken,
        user_id: decryptedUser?.id
    })
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    })
    const [completedFilters, setCompletedFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    })


    const handleGenerateCertificates = (data) => {
        const participants = data?.participants
        const fullnames = _.map(participants, (participant) => {

            const user = participant?.user;
            // Format: Lastname, Firstname Middlename
            const lastname = user?.lastname || '';
            const firstname = user?.firstname || '';
            const middlename = user?.middlename || '';

            const name = `${lastname}, ${firstname}${middlename ? ' ' + middlename : ''}`;
            return name.trim();
            });

        previewCertificates(fullnames)
    }
    

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

        if([1].includes(decryptedUser?.role_id)) {
            return (
                <div className="flex gap-8">
                    <button onClick={() => handleDetailEventNavigation(rowData)}>
                        <Tooltip target=".view" content="view" position="right" />
                        <PiListMagnifyingGlass className="view w-7 h-7 text-[#364190]"/>
                    </button>
                    <button onClick={() => navigate("/event/participants", { state: rowData.participants })}>
                        <Tooltip target=".participants" content="participants" position="right" />
                        <TbUsersGroup className="participants w-7 h-7 text-[#364190]"/>
                    </button>
                    <button onClick={() => navigate("/event/form-list", { state: rowData })}>
                        <Tooltip target=".form" content="form" position="right" />
                        <FaWpforms className="form w-7 h-7 text-[#364190]"/>
                    </button>
                    {rowData?.model_id === 3 && (
                        <button onClick={() => navigate("/event/form/attach", {state: rowData })}>
                            <Tooltip target=".sync" content="attach form" position="right" />
                            <MdAttachment className="sync w-7 h-7 text-[#364190]"/>
                        </button>
                    )}
                    {rowData?.event_status_id === 2 && (
                        <button onClick={() => handleGenerateCertificates(rowData)}>
                            <Tooltip target=".generate" content="generate certifications" position="right" />
                            <PiCertificate className="generate w-7 h-7 text-[#364190]"/>
                        </button>
                    )}
                </div>
            )
        }


        if([9, 10, 11].includes(decryptedUser?.role_id)) {
            return (
                <button onClick={() => navigate("/event/form-list", { state: rowData })}>
                    <Tooltip target=".form" content="form" position="right" />
                    <FaWpforms className="form w-7 h-7 text-[#364190]"/>
                </button>
            )
        }

        return (
            <div className="flex gap-8">
                <button onClick={() => handleUpdateEventNavigation(rowData)}>
                    <Tooltip target=".edit" content="edit" position="right" />
                    <PiNotePencil className="edit w-7 h-7 text-[#364190]"/>
                </button>
                <button onClick={() => handleDetailEventNavigation(rowData)}>
                    <Tooltip target=".view" content="view" position="right" />
                    <PiListMagnifyingGlass className="view w-7 h-7 text-[#364190]"/>
                </button>
                <button onClick={() => navigate("/event/participants", { state: rowData.participants })}>
                    <Tooltip target=".participants" content="participants" position="right" />
                    <TbUsersGroup className="participants w-7 h-7 text-[#364190]"/>
                </button>
                <button onClick={() => navigate("/event/form-list", { state: rowData })}>
                    <Tooltip target=".form" content="form" position="right" />
                    <FaWpforms className="form w-7 h-7 text-[#364190]"/>
                </button>
                {rowData?.model_id === 3 && (
                    <button onClick={() => navigate("/event/form/attach", {state: rowData })}>
                        <Tooltip target=".sync" content="attach form" position="right" />
                        <MdAttachment className="sync w-7 h-7 text-[#364190]"/>
                    </button>
                )}
            </div>
        )
    }
    const programModelTemplate = (rowData) => {
        return (
            <div>
                {rowData?.program_model_name ?? "N/A"}
            </div>
        )
    }
    const handleEventListIfDeanUser = (events) => {
        if(decryptedUser?.role_id === 9) {
            const filteredEvents = _.filter(events, (event) => event.user.department_id === decryptedUser?.department_id)
            return filteredEvents
        }
        return events
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
        const events = ![1, 9, 10, 11].includes(decryptedUser?.role_id) ? userEventData?.data : handleEventListIfDeanUser(eventData?.data.data)        
        const activeEvents = _.filter(events, (event) => event.event_status_id === 1)
        const completedEvents = _.filter(events, (event) => event.event_status_id === 2)
        
        return (
            <div className="view-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] pt-[5rem]">
                <div className="w-full px-4 text-xl font-bold">
                    <h1>Active</h1>
                </div>
                <div className="w-full flex justify-end items-center">
                    <div className="w-[18%] p-inputgroup mr-2">
                        <InputText
                            className="text-sm p-2" 
                            placeholder="Search" 
                            onInput={(e) => {
                            setFilters({
                                global: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS }
                            })
                            }}
                        />
                        <span className="p-button p-component bg-[#f0f3f5] text-[#5c6873]">
                            <FaSearch />
                        </span>
                    </div>
                </div>
                <DataTable 
                    value={activeEvents} 
                    size="normal"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    dataKey="id"
                    emptyMessage="Event(s) Not Found."
                    className="datatable-responsive min-w-full px-2 py-2"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} active events"
                    rows={10}
                    paginator
                    removableSort
                    filters={filters}
                    filterDisplay="row"
                >
                    <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="name" header="Event" />
                    <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="program_model_name" body={programModelTemplate} header="Program model" />
                    <Column headerClassName="bg-[#FCA712] text-white" body={actionBodyTemplate} header="Action"></Column>

                </DataTable>


                <div className="w-full px-4 text-xl font-bold">
                    <h1>Completed</h1>
                </div>
                <div className="w-full flex justify-end items-center">
                    <div className="w-[18%] p-inputgroup mr-2">
                        <InputText
                            className="text-sm p-2" 
                            placeholder="Search" 
                            onInput={(e) => {
                            setCompletedFilters({
                                global: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS }
                            })
                            }}
                        />
                        <span className="p-button p-component bg-[#f0f3f5] text-[#5c6873]">
                            <FaSearch />
                        </span>
                    </div>
                </div>
                <DataTable 
                    value={completedEvents} 
                    size="normal"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    dataKey="id"
                    emptyMessage="Event(s) Not Found."
                    className="datatable-responsive min-w-full px-2 py-2"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} completed events"
                    rows={10}
                    paginator
                    removableSort
                    filters={completedFilters}
                    filterDisplay="row"
                >
                    <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="name" header="Event" />
                    <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="program_model_name" body={programModelTemplate} header="Program model" />
                    <Column headerClassName="bg-[#FCA712] text-white" body={actionBodyTemplate} header="Action"></Column>

                </DataTable>
            </div>
        )
    }

}
