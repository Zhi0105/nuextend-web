import { getUserEvents } from "@_src/services/event";
import { useUserStore } from "@_src/store/auth";
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getDashBoardReport, getTerms } from '@_src/services/dashboard';
import { FormProgressList } from "../Partial/FormProgressList";
import { useEffect, useMemo, useState } from "react";
import { SetTermValue } from '@_src/utils/helpers';
import { 
  getTotalVolunteer, 
  getTotalRoleCount, 
  getAllActiveStatusEvents,
  getModelCount,
  getAllPendingEvents,
  getEventStatus,
} from '@_src/utils/dashboard';
import _ from 'lodash';
import { Dropdown } from "primereact/dropdown";
import { Card } from "primereact/card";

export const Dashboard = () => {
    const queryClient = useQueryClient();
    const { user, token } = useUserStore((state) => ({
        user: state.user,
        token: state.token,
    }));

    const { mutate: getReport, isLoading: getReportLoading } = useMutation({
    mutationFn: getDashBoardReport,
    onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        // console.log("Report data:", data?.data);
        setReports(data?.data)
    },
    onError: (err) => {
        console.log("@GDE", err)
    },
    });
    

    const decryptedToken = useMemo(() => (token ? DecryptString(token) : null), [token]);
    const decryptedUser = useMemo(() => (token ? DecryptUser(user) : null), [token, user]);
    const { data: termData, isLoading: termLoading } = getTerms({ token: decryptedToken });
    const [selectedTerm, setSelectedTerm] = useState(null);
    const [reports, setReports] = useState([])
    const roleId = decryptedUser?.role_id;

    const needsAllEvents = useMemo(() => [1, 9, 10, 11].includes(roleId), [roleId]);
    const needsUserEvents = !needsAllEvents;

    const {
        data: myEvents = [],
        isLoading: userEventLoading,
        isRefetching: userEventRefetchLoading,
        } = getUserEvents({
        token: decryptedToken,
        user_id: decryptedUser?.id,
        enabled: needsUserEvents,
    });

    const filteredEvents = _.filter(myEvents, (e) => e.event_status_id !== 2);

     useEffect(() => {
        if (selectedTerm) {
          getReport({ token: decryptedToken, term: selectedTerm });
        }
      }, [selectedTerm, decryptedToken, getReport]);
    
      useEffect(() => {
      if (termData && termData.terms && !selectedTerm) {
        const defaultTerm = SetTermValue(); // your helper’s returned term name
        const foundTerm = termData.terms.find(term => term.name === defaultTerm);
    
        if (foundTerm) {
          setSelectedTerm(foundTerm.name);
        }
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [termData]);
    
        
    const termOptions = termData?.terms?.map((term) => ({
        label: `Tri-Sem: ${term.name}`,
        value: term.name,
    })) || [];

    if ( termLoading || getReportLoading || userEventLoading || userEventRefetchLoading) {
        return (
        <div className="view-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px]">
            Dashboard loading...
        </div>
        );
    }

    return (
        <div className="dashboard-main min-h-screen bg-white w-full flex flex-col xs:pl-[0px] sm:pl-[200px] p-20 mx-2">
       {/* Header */}
                <div className='flex items-center gap-2 mb-10'>
                <h1 className='font-bold text-xl'>Admin Dashboard</h1>
                <Dropdown
                    value={selectedTerm}
                    options={termOptions}
                    onChange={(e) => setSelectedTerm(e.value)}
                    placeholder="Select a Term"
                    className='bg-[#384090] w-64'
                    valueTemplate={(option) => (
                    <div className="font-bold text-white bg-[#384090] rounded px-2">
                        {option ? option?.label : "Select a term"}
                    </div>
                    )}
                />
                </div>
                <FormProgressList 
                    eventList={filteredEvents}
                />

                {/* Cards Section */}
                <div className='flex flex-col justify-center items-center'>
                    {/* Top Stat Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <Card title="Total Volunteers" className="shadow-md border border-gray-100">
                        <div className="text-4xl font-bold text-indigo-600">{reports?.length && getTotalVolunteer(reports)}</div>
                        <p className="text-sm text-gray-500 mt-1">Students: {reports?.length && getTotalRoleCount(reports, "student")} | Faculty: {reports?.length && getTotalRoleCount(reports, "faculty")}</p>
                        </Card>
            
                        <Card title="Active Events" className="shadow-md border border-gray-100">
                        <div className="text-4xl font-bold text-indigo-600">{reports?.length && getAllActiveStatusEvents(reports)}</div>
                        <p className="text-sm text-gray-500 mt-1">{reports?.length && getModelCount(reports, 1)} Outreach, {reports?.length && getModelCount(reports, 2)} Project</p>
                        <p className="text-sm text-gray-500 mt-1">{reports?.length && getModelCount(reports, 3)} Program, {reports?.length && getModelCount(reports, 4)} Emergency</p>
                        </Card>
            
                        <Card title="Pending/Planning" className="shadow-md border border-gray-100">
                        <div className="text-4xl font-bold text-indigo-600">{reports?.length && getAllPendingEvents(reports)}</div>
                        <p className="text-sm text-gray-500 mt-1">Requires Approval</p>
                        </Card>
                        <Card title="Events by Status" className="shadow-md border border-gray-100">
                        <ul className="text-sm text-gray-700 space-y-1 mt-2">
                            <li>✅ Completed: {reports?.length && getEventStatus(reports, 2)}</li>
                            <li>🟡 Ongoing: {reports?.length && getEventStatus(reports, 10)}</li>
                            <li>🕓 Pending: {reports?.length && getEventStatus(reports, 1)}</li>
                        </ul>
                        </Card>
                    </div>
                </div>
        </div>
    )
}
