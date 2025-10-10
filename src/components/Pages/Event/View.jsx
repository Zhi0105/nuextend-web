import { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEvents, getUserEvents, eventPost, eventTerminate } from "@_src/services/event";
import { EventContext } from "@_src/contexts/EventContext";
import { useUserStore } from "@_src/store/auth";
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { FilterMatchMode } from "primereact/api";
import { InputText } from "primereact/inputtext"; 
import { Dropdown } from "primereact/dropdown";
import { Tooltip } from "primereact/tooltip";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { getUsers } from "@_src/services/user";
import { toast } from "react-toastify";
import _ from "lodash";

import { PiNotePencil, PiListMagnifyingGlass, PiCertificate } from "react-icons/pi";
import { VscLayoutActivitybarLeft } from "react-icons/vsc";
import { RiIndeterminateCircleLine } from "react-icons/ri";
import { MdOutlinePostAdd } from "react-icons/md";
import { FaSearch, FaWpforms, FaTrash, FaBullhorn } from "react-icons/fa";
import { useCertificatePreview } from "@_src/utils/useCertificatePreview";

export const View = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const previewCertificates = useCertificatePreview();
  const { user, token } = useUserStore((state) => ({
    user: state.user,
    token: state.token,
  }));
  const { removeEvent, removeEventLoading } = useContext(EventContext);

  const decryptedToken = useMemo(() => (token ? DecryptString(token) : null), [token]);
  const decryptedUser = useMemo(() => (token ? DecryptUser(user) : null), [token, user]);
  const roleId = decryptedUser?.role_id;
  const { data: userData, loading: userLoading } = getUsers({ token: decryptedToken }) 

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

  const deanFilteredEvents = useMemo(() => {
    if (roleId !== 9) return allEvents;
    const deanDeptId = decryptedUser?.department_id;
    if (!deanDeptId) return [];
    return (allEvents ?? []).filter((evt) => {
      const ownerDept = _.get(evt, "user.department_id") ?? _.get(evt, "department_id");
      return ownerDept === deanDeptId;
    });
  }, [roleId, decryptedUser?.department_id, allEvents]);

  // Unified list with computed fields
  const rawEvents = needsUserEvents ? myEvents : deanFilteredEvents;
  const mergedEvents = useMemo(() => {
    const statusText = (row) => {
      const s = _.get(row, "eventstatus.name");
      if (s) return s;
      const id = _.get(row, "event_status_id");
      if (id === 1) return "Active";
      if (id === 2) return "Completed";
      if (id === 10) return "Ongoing";
      return "Unknown";
    };
    return (rawEvents ?? []).map((e) => {
      const creatorRoleId = _.get(e, "user.role_id");
      const creatorRoleName = _.get(e, "user.role.name") || "—";
      const isAdmin = creatorRoleId === 1 || creatorRoleName.toLowerCase() === "admin";
      return {
        ...e,
        _rowId: e?.id ?? `${e?.name}-${e?.event_status_id}-${e?.user?.id ?? "u"}`,
        computedStatus: statusText(e),
        createdByAdmin: !!isAdmin,
        creatorRoleName,
      };
    });
  }, [rawEvents]);

  // Filters state (external UI controls)
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    computedStatus: { value: null, matchMode: FilterMatchMode.EQUALS },
    createdByAdmin: { value: null, matchMode: FilterMatchMode.EQUALS },
  });

  const statusOptions = [
    { label: "All statuses", value: null },
    { label: "Pending/Planing", value: "Pending/Planning" },
    { label: "Ongoing", value: "Ongoing" },
    { label: "Completed", value: "Completed" },
  ];
  const createdByAdminOptions = [
    { label: "All creators", value: null },
    { label: "Admin only", value: true },
    { label: "Non-admin only", value: false },
  ];

  const onGlobalSearch = (val) =>
    setFilters((prev) => ({ ...prev, global: { value: val, matchMode: FilterMatchMode.CONTAINS } }));
  const onStatusChange = (val) =>
    setFilters((prev) => ({ ...prev, computedStatus: { value: val, matchMode: FilterMatchMode.EQUALS } }));
  const onCreatedByAdminChange = (val) =>
    setFilters((prev) => ({ ...prev, createdByAdmin: { value: val, matchMode: FilterMatchMode.EQUALS } }));

  // Mutations
  const { mutate: handleEventpost, isLoading: eventPostLoading } = useMutation({
    mutationFn: eventPost,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["post-event"] });
      toast(data.message, { type: "success" });
      navigate("/admin/event/view");
    },
    onError: (error) => {
      toast(error?.response?.data.message, { type: "warning" });
      console.log("@EPE:", error);
    },
  });

  const { mutate: handleEventTerminate, isLoading: eventTerminateLoading } = useMutation({
    mutationFn: eventTerminate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["terminate-event"] });
      toast(data.message, { type: "success" });
      navigate("/admin/event/view");
    },
    onError: (error) => {
      console.log("@ETE:", error);
    },
  });

  const handleTerminate = (data) => {
    const validateTermination = _.some(data?.forms, (item) => {
      return (
        (_.endsWith(_.get(item, "code"), "009") || _.endsWith(_.get(item, "code"), "010")) &&
        _.get(item, "is_commex") &&
        _.get(item, "is_dean") &&
        _.get(item, "is_asd") &&
        _.get(item, "is_ad")
      );
    });

    if (!validateTermination) {
      toast("Unable to terminate, incomplete event process.", { type: "warning" });
    } else {
      handleEventTerminate({ token: decryptedToken, id: data?.id });
    }
  };

  const handleGenerateCertificates = (eventData) => {
  const participants = _.get(eventData, "participants", []);
  const eventMembers = _.get(eventData, "eventmember", []);
  const eventOwner = _.get(eventData, "user");
  const users = userData?.data

  // Helper to format full name
  const formatName = (user) => {
    if (!user) return null;
    const lastname = user.lastname || "";
    const firstname = user.firstname || "";
    const middlename = user.middlename || "";
    return `${lastname}, ${firstname}${middlename ? " " + middlename : ""}`.trim();
  };

  // Participants → default role "volunteer"
  const participantData = participants
    .map((p) => ({
      name: formatName(p.user),
      role: "volunteer",
    }))
    .filter((p) => p.name);

  // Event members → use their specific role
  const memberData = eventMembers
    .map((m) => ({
      name: formatName(m.user),
      role: m.role || "volunteer",
    })).filter((p) => p.name);


  // Owner → also treated as "volunteer" (or you can change to "organizer" if desired)
  const ownerData = eventOwner
    ? [{ name: formatName(eventOwner), role: "volunteer" }]
    : [];

  // Merge and deduplicate by name
  const allPeople = _.uniqBy(
    [...participantData, ...memberData, ...ownerData],
    "name"
  );

  if (!allPeople.length) {
    toast("Unable to generate certificates: no valid names found.", {
      type: "warning",
    });
    return;
  }

  // Get implementation date
  const implementDate =
    _.get(eventData, "implement_date") ||
    _.get(eventData, "implementation_date") ||
    _.get(eventData, "date") ||
    _.get(eventData, "created_at") ||
    null;

  previewCertificates({
    users,
    people: allPeople, // array of { name, role }
    implementDate,
    title: eventData?.eventName,
    location: eventData?.location,
    term: eventData?.term
  });
};

  const handleUpdateEventNavigation = (rowData) => {
    if (roleId === 1) navigate("/admin/event/update", { state: rowData });
    else navigate("/event/update", { state: rowData });
  };

  const handleDetailEventNavigation = (rowData) => {
    if (roleId === 1) navigate("/admin/event/detail", { state: rowData });
    else navigate("/event/detail", { state: rowData });
  };

  const handleFormNavigation = (rowData) => {
    if (rowData.model_id === 1) navigate("/event/form/outreach", { state: { event: rowData } });
    if (rowData.model_id === 2) navigate("/event/form/project", { state: { event: rowData } });
    if (rowData.model_id === 3) navigate("/event/form/program", { state: { event: rowData } });
  };

  const actionBodyTemplateForActivity = (rowData) => {
    const eventRow = rowData?.__event || rowData;

    if ([1].includes(roleId)) {
      return (
        <div className="flex gap-8">
          <button onClick={() => handleUpdateEventNavigation(eventRow)}>
          <Tooltip target=".edit" content="Edit" position="right" />
          <PiNotePencil className="edit w-7 h-7 text-[#364190]" />
        </button>
          <button onClick={() => handleDetailEventNavigation(eventRow)}>
            <Tooltip target=".view" content="View" position="right" />
            <PiListMagnifyingGlass className="view w-7 h-7 text-[#364190]" />
          </button>
          <button onClick={() => navigate("/event/activities", { state: eventRow })}>
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
          <button onClick={() => navigate("/event/announcement", { state: { event_id: eventRow.id } })}>
          <Tooltip target=".announcement" content="Announcements" position="right" />
          <FaBullhorn className="announcement w-7 h-7 text-[#364190]" />
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
          <button
            disabled={removeEventLoading}
            onClick={() => removeEvent({ token: decryptedToken, id: eventRow?.id })}
          >
            <Tooltip target=".remove" content="remove" position="right" />
            <FaTrash className="remove w-7 h-7 text-[#364190]" />
          </button>
          
        </div>
      );
    }

    if ([9, 10, 11].includes(roleId)) {
      return (
        <div className="flex gap-8">
          <button onClick={() => handleFormNavigation(eventRow)}>
            <Tooltip target=".form" content="Form" position="right" />
            <FaWpforms className="form w-7 h-7 text-[#364190]" />
          </button>
          <button onClick={() => navigate("/event/activities", { state: eventRow, creatorUserId: eventRow.user?.id })}>
            <Tooltip target=".activities" content="Activities" position="right" />
            <VscLayoutActivitybarLeft className="activities w-7 h-7 text-[#364190]" />
          </button>
        </div>
      );
    }

    return (
      <div className="flex gap-8">
        <button onClick={() => handleUpdateEventNavigation(eventRow)}>
          <Tooltip target=".edit" content="Edit" position="right" />
          <PiNotePencil className="edit w-7 h-7 text-[#364190]" />
        </button>
        <button onClick={() => handleDetailEventNavigation(eventRow)}>
          <Tooltip target=".view" content="View" position="right" />
          <PiListMagnifyingGlass className="view w-7 h-7 text-[#364190]" />
        </button>
        <button onClick={() => navigate("/event/activities", { state: eventRow })}>
          <Tooltip target=".activities" content="Activities" position="right" />
          <VscLayoutActivitybarLeft className="activities w-7 h-7 text-[#364190]" />
        </button>
        <button onClick={() => handleFormNavigation(eventRow)}>
          <Tooltip target=".form" content="Form" position="right" />
          <FaWpforms className="form w-7 h-7 text-[#364190]" />
        </button>
        <button onClick={() => navigate("/event/announcement", { state: { event_id: eventRow.id } })}>
          <Tooltip target=".announcement" content="Announcements" position="right" />
          <FaBullhorn className="announcement w-7 h-7 text-[#364190]" />
        </button>

        <button
          disabled={removeEventLoading}
          onClick={() => removeEvent({ token: decryptedToken, id: eventRow?.id })}
        >
          <Tooltip target=".remove" content="remove" position="right" />
          <FaTrash className="remove w-7 h-7 text-[#364190]" />
        </button>
      </div>
    );
  };

  
  const pesoFormat = (value) => {
      if (value == null) return "—";
      return new Intl.NumberFormat("en-PH", {
          style: "currency",
          currency: "PHP",
          minimumFractionDigits: 2,
      }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };


  // cell renderers
  const creatorBody = (row) => {
    const u = _.get(row, "user");
    if (!u) return "—";
    const last = _.get(u, "lastname", "");
    const first = _.get(u, "firstname", "");
    const middle = _.get(u, "middlename", "");
    const name = `${last}${last ? ", " : ""}${first}${middle ? " " + middle : ""}`.trim();
    return name || "—";
  };
  const modelBody = (row) => _.get(row, "model.name") || "—";
  const statusBody = (row) => row?.computedStatus || "Unknown";
  const departmentBody = (row) =>
    _.get(row, "department.name") || _.get(row, "user.department.name") || "—";
  const roleBody = (row) => _.get(row, "user.role.name") || "—";
  const organizationBody = (row) => _.get(row, "organization.name") || "—";
  const budgetProposalBody = (row) => pesoFormat(row?.budget_proposal);
  const createdAtBody = (row) => formatDate(row?.created_at);



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
        <h1>Events</h1>
      </div>

      {/* External filters (visible) */}
      <div className="w-full flex gap-3 justify-end items-center px-2">
        <div className="w-[18%] p-inputgroup">
          <InputText
            className="text-sm p-2"
            placeholder="Search"
            onInput={(e) => onGlobalSearch(e.target.value)}
          />
          <span className="p-button p-component bg-[#f0f3f5] text-[#5c6873]">
            <FaSearch />
          </span>
        </div>

        <div className="w-[18%]">
          <Dropdown
            className="w-full"
            options={statusOptions}
            optionLabel="label"
            optionValue="value"
            value={filters.computedStatus.value}
            onChange={(e) => onStatusChange(e.value)}
            placeholder="Filter by status"
            showClear
          />
        </div>

        <div className="w-[18%]">
          <Dropdown
            className="w-full"
            options={createdByAdminOptions}
            optionLabel="label"
            optionValue="value"
            value={filters.createdByAdmin.value}
            onChange={(e) => onCreatedByAdminChange(e.value)}
            placeholder="Creator role"
            showClear
          />
        </div>
      </div>

    
      <div className="w-full overflow-x-auto">
        <DataTable
          value={mergedEvents}
          size="normal"
          paginator
          rows={10}
          dataKey="_rowId"
          emptyMessage="Event(s) Not Found."
          className="datatable-responsive min-w-full px-2 py-2 text-sm"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} events"
          removableSort
          /* keep filters active, but hide per-column UI */
          filterDisplay="menu"       /* or "row"; column UIs are suppressed below */
          filters={filters}
          globalFilterFields={[
            "name",
            "model.name",
            "eventstatus.name",
            "computedStatus",
            "creatorRoleName",
            "user.lastname",
            "user.firstname",
            "department.name",
            "user.role.name",
            "user.department.name",
            "organization.name",        // <-- add for global search
            "budget_proposal",          // <-- add for global search
          ]}
        >
          <Column
            headerClassName="bg-[#364190] text-white text-sm"
            className="capitalize font-bold"
            field="name"
            header="Event"
            sortable
          />
          <Column headerClassName="bg-[#364190] text-white text-sm" header="Creator" body={creatorBody} sortable />
          <Column headerClassName="bg-[#364190] text-white text-sm" header="Model" body={modelBody} sortable />
          <Column headerClassName="bg-[#364190] text-white text-sm" header="Department" body={departmentBody} sortable />
          <Column
            headerClassName="bg-[#364190] text-white text-sm"
            header="Status"
            body={statusBody}
            field="computedStatus"
            sortable
            /* hide column filter UI, but still filter via external dropdown */
            filter
            showFilterMenu={false}
            showFilterOperator={false}
            showClearButton={false}
          />
          <Column headerClassName="bg-[#364190] text-white text-sm" header="Role" body={roleBody} sortable />

          {/* Hidden utility column: used for Admin filter; UI hidden but filter active via external dropdown */}
          <Column
            field="createdByAdmin"
            header="Created by Admin"
            headerClassName="bg-[#364190] text-white text-sm"
            style={{ display: "none" }}
            filter
            dataType="boolean"
            showFilterMenu={false}
            showFilterOperator={false}
            showClearButton={false}
          />
          <Column
              headerClassName="bg-[#364190] text-white text-sm"
              header="Budget Proposal"
              body={budgetProposalBody}
              sortable
          />
          <Column
              headerClassName="bg-[#364190] text-white text-sm"
              header="Organization"
              body={organizationBody}
              sortable
          />

          <Column
            headerClassName="bg-[#364190] text-white text-sm"
            header="Date"
            body={createdAtBody}
            field="created_at"
            sortable
          />

          <Column headerClassName="bg-[#FCA712] text-white text-sm" body={actionBodyTemplateForActivity} header="Action" />
        </DataTable>
      </div>
  
    </div>
  );
};
