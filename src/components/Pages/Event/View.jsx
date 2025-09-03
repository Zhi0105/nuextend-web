import { getEvents, getUserEvents, eventPost, eventTerminate } from "@_src/services/event";
import { useUserStore } from "@_src/store/auth";
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { PiNotePencil, PiListMagnifyingGlass, PiCertificate } from "react-icons/pi";
import { TbUsersGroup } from "react-icons/tb";
import { RiIndeterminateCircleLine } from "react-icons/ri";
import { MdOutlinePostAdd } from "react-icons/md";
import { FaSearch, FaWpforms } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { FilterMatchMode } from "primereact/api";
import { InputText } from "primereact/inputtext";
import { MdAttachment } from "react-icons/md";
import { Tooltip } from "primereact/tooltip";
import { useCertificatePreview } from "@_src/utils/useCertificatePreview";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { VscLayoutActivitybarLeft } from "react-icons/vsc";
import { toast } from "react-toastify"
import _ from "lodash";

export const View = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient()
    const previewCertificates = useCertificatePreview();
    const { user, token } = useUserStore((state) => ({
        user: state.user,
        token: state.token,
    }));

    const decryptedToken = useMemo(() => (token ? DecryptString(token) : null), [token]);
    const decryptedUser = useMemo(() => (token ? DecryptUser(user) : null), [token, user]);
    const roleId = decryptedUser?.role_id;

    const needsAllEvents = useMemo(() => [1, 9, 10, 11].includes(roleId), [roleId]);
    const needsUserEvents = !needsAllEvents;

    const {
        data: allEvents = [],
        isLoading: eventLoading,
        isRefetching: eventRefetchLoading,
    } = getEvents({
        token: decryptedToken,
        enabled: needsAllEvents,
    });

    const {
        data: myEvents = [],
        isLoading: userEventLoading,
        isRefetching: userEventRefetchLoading,
    } = getUserEvents({
        token: decryptedToken,
        user_id: decryptedUser?.id,
        enabled: needsUserEvents,
    });

    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    });
    const [completedFilters, setCompletedFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    });


    const { mutate: handleEventpost, isLoading: eventPostLoading } = useMutation({
        mutationFn: eventPost,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['post-event'] });
            toast(data.message, { type: "success" })
            navigate("/admin/event/view")
            }, 
        onError: (error) => {  
            toast(error?.response?.data.message, { type: "warning" })
            console.log("@EPE:", error)
        },
    });
    const { mutate: handleEventTerminate, isLoading: eventTerminateLoading } = useMutation({
        mutationFn: eventTerminate,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['terminate-event'] });
            toast(data.message, { type: "success" })
            navigate("/admin/event/view")
            }, 
        onError: (error) => {  
            console.log("@ETE:", error)
        },
    });

    const handleTerminate = (data) => {
        const validateTermination = _.some(data?.forms, item => {
            return (
                _.endsWith(_.get(item, 'code'), '009') ||
                _.endsWith(_.get(item, 'code'), '010')
            ) &&
            _.get(item, 'is_commex') &&
            _.get(item, 'is_dean') &&
            _.get(item, 'is_asd') &&
            _.get(item, 'is_ad');
        });

        if(!validateTermination) {
            toast("Unable to terminate, incomplete event process.", {type: "warning"})
        } else {
            handleEventTerminate({
                token: decryptedToken, id: data?.id
            })
        }
    }

    const handleGenerateCertificates = (data) => {
        const participants = data?.participants ?? [];
        const fullnames = _.map(participants, (p) => {
        const u = p?.user;
        const lastname = u?.lastname || "";
        const firstname = u?.firstname || "";
        const middlename = u?.middlename || "";
        const name = `${lastname}, ${firstname}${middlename ? " " + middlename : ""}`;
        return name.trim();
        });
        previewCertificates(fullnames);
    };

    const handleUpdateEventNavigation = (rowData) => {
        if (roleId === 1) {
        navigate("/admin/event/update", { state: rowData });
        } else {
        navigate("/event/update", { state: rowData });
        }
    };

    const handleDetailEventNavigation = (rowData) => {
        if (roleId === 1) {
        navigate("/admin/event/detail", { state: rowData });
        } else {
        navigate("/event/detail", { state: rowData });
        }
    };

    const handleFormNavigation = (rowData) => {
        if (rowData.model_id === 1) navigate("/event/form/outreach", { state: { event: rowData } });
        if (rowData.model_id === 2) navigate("/event/form/project", { state: { event: rowData } });
        if (rowData.model_id === 3) navigate("/event/form/program", { state: { event: rowData } });
    };

    const actionBodyTemplateForActivity = (rowData) => {
        const eventRow = rowData?.__event || rowData; // fallback

        // re-use your same branching by role, but call handlers with eventRow
        if ([1].includes(roleId)) {
            return (
            <div className="flex gap-8">
                <button onClick={() => handleDetailEventNavigation(eventRow)}>
                <Tooltip target=".view" content="View" position="right" />
                <PiListMagnifyingGlass className="view w-7 h-7 text-[#364190]" />
                </button>
                {/* <button onClick={() => navigate("/event/participants", { state: eventRow.participants })}>
                <Tooltip target=".participants" content="Participants" position="right" />
                <TbUsersGroup className="participants w-7 h-7 text-[#364190]" />
                </button> */}
                <button 
                    onClick={() => navigate("/event/activities", { state: eventRow })}
                >
                <Tooltip target=".activities" content="Activities" position="right" />
                <VscLayoutActivitybarLeft className="activities w-7 h-7 text-[#364190]" />
                </button>
                <button onClick={() => handleFormNavigation(eventRow)}>
                <Tooltip target=".form" content="Form" position="right" />
                <FaWpforms className="form w-7 h-7 text-[#364190]" />
                </button>
                <button
                disabled={eventRow?.is_posted || eventPostLoading}
                onClick={() => handleEventpost({ token: decryptedToken, id: eventRow?.id })}
                >
                <Tooltip
                    target={`#post-${eventRow.id}`}
                    content={eventRow?.is_posted ? "Already posted" : "Post"}
                    position="right"
                />
                <MdOutlinePostAdd
                    id={`post-${eventRow.id}`}
                    className={`w-7 h-7 ${eventRow?.is_posted ? "text-gray-200" : "text-[#364190]"}`}
                />
                </button>
                <button disabled={eventTerminateLoading} onClick={() => handleTerminate(eventRow)}>
                <Tooltip target=".terminate" content="Terminate" position="right" />
                <RiIndeterminateCircleLine className="terminate w-7 h-7 text-[#364190]" />
                </button>
                {eventRow?.event_status_id === 2 && (
                <button onClick={() => handleGenerateCertificates(eventRow)}>
                    <Tooltip target=".generate" content="Generate Certifications" position="right" />
                    <PiCertificate className="generate w-7 h-7 text-[#364190]" />
                </button>
                )}
            </div>
            );
        }

        if ([9, 10, 11].includes(roleId)) {
            return (
            <button onClick={() => handleFormNavigation(eventRow)}>
                <Tooltip target=".form" content="Form" position="right" />
                <FaWpforms className="form w-7 h-7 text-[#364190]" />
            </button>
            );
        }

        return (
            <div className="flex gap-8">
            <button onClick={() => handleUpdateEventNavigation(rowData)}>
                <Tooltip target=".edit" content="Edit" position="right" />
                <PiNotePencil className="edit w-7 h-7 text-[#364190]" />
            </button>
            <button onClick={() => handleDetailEventNavigation(eventRow)}>
                <Tooltip target=".view" content="View" position="right" />
                <PiListMagnifyingGlass className="view w-7 h-7 text-[#364190]" />
            </button>
            {/* <button onClick={() => navigate("/event/participants", { state: eventRow.participants })}>
                <Tooltip target=".participants" content="Participants" position="right" />
                <TbUsersGroup className="participants w-7 h-7 text-[#364190]" />
            </button> */}
            <button 
                onClick={() => navigate("/event/activities", { state: eventRow })}
            >
            <Tooltip target=".activities" content="Activities" position="right" />
            <VscLayoutActivitybarLeft className="activities w-7 h-7 text-[#364190]" />
            </button>
            <button onClick={() => handleFormNavigation(eventRow)}>
                <Tooltip target=".form" content="Form" position="right" />
                <FaWpforms className="form w-7 h-7 text-[#364190]" />
            </button>
            </div>
        );
    };

    const handleEventListIfDeanUser = (events) => {
        if (roleId === 9) {
        return _.filter(events, (event) => event?.user?.department_id === decryptedUser?.department_id);
        }
        return events;
    };

    const extractActivities = (events = []) =>
        _.flatMap(events, (evt) => {
            const activities = _.get(evt, 'activity', []);
            return _.map(activities, (act) => ({
            // what you display & search against
            activity_id: act?.id,
            activityName: act?.name ?? '',   // keep original if needed elsewhere
            activity_address: act?.address ?? '',
            activity_description: act?.description ?? '',
            activity_start_date: act?.start_date ?? '',
            activity_end_date: act?.end_date ?? '',
            // make a unique key per activity
            _rowId: `${evt?.id ?? 'e'}-${act?.id ?? act?.code ?? _.uniqueId('a-')}`,
            __event: evt,
            ...evt
        }));
    });
    const rawEvents = needsUserEvents ? myEvents : handleEventListIfDeanUser(allEvents);
    const activeEvents = _.filter(rawEvents, (event) => event.event_status_id === 1);
    const completedEvents = _.filter(rawEvents, (event) => event.event_status_id === 2);
    const activeActivities = extractActivities(activeEvents);
    const completedActivities = extractActivities(completedEvents);

    if (eventLoading || userEventLoading || eventRefetchLoading || userEventRefetchLoading) {
        return (
        <div className="view-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px]">
            Event loading...
        </div>
        );
    }

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
                onInput={(e) =>
                setFilters({
                    global: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS },
                })
                }
            />
            <span className="p-button p-component bg-[#f0f3f5] text-[#5c6873]">
                <FaSearch />
            </span>
            </div>
        </div>

        <DataTable
            value={activeActivities}
            size="normal"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            dataKey="_rowId"
            emptyMessage="Event(s) Not Found."
            className="datatable-responsive min-w-full px-2 py-2"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} active events"
            rows={10}
            paginator
            removableSort
            filters={filters}
            filterDisplay="row"
            globalFilterFields={["activityName"]}
        >
            <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="activityName" header="Event" />
            <Column headerClassName="bg-[#FCA712] text-white" body={actionBodyTemplateForActivity} header="Action" />
        </DataTable>

        <div className="w-full px-4 text-xl font-bold mt-6">
            <h1>Completed</h1>
        </div>
        <div className="w-full flex justify-end items-center">
            <div className="w-[18%] p-inputgroup mr-2">
            <InputText
                className="text-sm p-2"
                placeholder="Search"
                onInput={(e) =>
                setCompletedFilters({
                    global: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS },
                })
                }
            />
            <span className="p-button p-component bg-[#f0f3f5] text-[#5c6873]">
                <FaSearch />
            </span>
            </div>
        </div>

        <DataTable
            value={completedActivities}
            size="normal"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            dataKey="_rowId"
            emptyMessage="Event(s) Not Found."
            className="datatable-responsive min-w-full px-2 py-2"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} completed events"
            rows={10}
            paginator
            removableSort
            filters={completedFilters}
            filterDisplay="row"
            globalFilterFields={["activityName"]}

        >
            <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="activityName" header="Event" />
            <Column headerClassName="bg-[#FCA712] text-white" body={actionBodyTemplateForActivity} header="Action" />
        </DataTable>
        </div>
    );
};
