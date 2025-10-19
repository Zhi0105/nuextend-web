import { useEffect, useMemo, useState } from 'react';
import { getEvents } from '@_src/services/event';
import { Dropdown } from 'primereact/dropdown';
import { Button } from "primereact/button";
import { getDashBoardReport, getTerms } from '@_src/services/dashboard';
import { useUserStore } from '@_src/store/auth';
import { DecryptString, DecryptUser } from '@_src/utils/helpers';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from 'primereact/card';
import { SetTermValue } from '@_src/utils/helpers';
import { 
  getTotalVolunteer, 
  getTotalRoleCount, 
  getAllActiveStatusEvents,
  getModelCount,
  getTotalUtilizedBudget,
  getAllPendingEvents,
  getEventStatus,
  getTop3Org,
  getVolunteerPerDepartment,
  getVolunteerPerRole
} from '@_src/utils/dashboard';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FormProgressList } from '@_src/components/Partial/FormProgressList';
import { ApproverNotificationList } from "@_src/components/Partial/ApproverNotificationList";
import _ from 'lodash';

export const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const { user, token } = useUserStore((state) => ({ user: state.user, token: state.token }));
  const decryptedUser = useMemo(() => (token ? DecryptUser(user) : null), [token, user]);
  const decryptedToken = useMemo(() => (token ? DecryptString(token) : null), [token]);
  const { data: termData, isLoading: termLoading } = getTerms({ token: decryptedToken });
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [reports, setReports] = useState([])
  const roleId = decryptedUser?.role_id;
  const departmentId = decryptedUser?.department_id;
  const [notificationDialogVisible, setNotificationDialogVisible] = useState(true);

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

  const needsAllEvents = useMemo(() => [1, 9, 10, 11].includes(roleId), [roleId]);

  const {
    data: allEvents = [],
    isLoading: eventLoading,
    isRefetching: eventRefetchLoading,
  } = getEvents({
    token: decryptedToken,
    enabled: needsAllEvents,
  });

  const filteredEvents = _.filter(allEvents, (e) => e.event_status_id !== 2);

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

  // 👉 Sample chart data (replace later with API data)
  const pieData = [
    { name: "Students", value: 250 },
    { name: "Faculty", value: 70 },
  ];

  const COLORS = ['#3B3FA8', '#F7B500'];

  
  if (termLoading || getReportLoading || eventRefetchLoading || eventLoading) {
    return (
      <div className="dashboard-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px]">
        Dashboard Loading....
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

      <div className='my-4'>
            {/* Approver Notification Dialog */}
            <ApproverNotificationList 
                eventList={filteredEvents}
                currentUserRoleId={roleId}
                currentUserDepartmentId={departmentId}
                visible={notificationDialogVisible}
                onHide={() => setNotificationDialogVisible(false)}
            />

            {/* Show regular form progress list */}
            <FormProgressList 
                eventList={filteredEvents}
                currentUserRoleId={roleId}
                currentUserDepartmentId={departmentId}
            />
        </div>

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

          <Card title="Budget Utilized" className="shadow-md border border-gray-100">
            <div className="text-4xl font-bold text-indigo-600">{reports?.length && getTotalUtilizedBudget(reports)}</div>
          </Card>

          <Card title="Pending/Planning" className="shadow-md border border-gray-100">
            <div className="text-4xl font-bold text-indigo-600">{reports?.length && getAllPendingEvents(reports)}</div>
            <p className="text-sm text-gray-500 mt-1">Requires Approval</p>
          </Card>
        </div>

             {/* Existing 3 Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          <Card title="Events by Status" className="shadow-md border border-gray-100">
            <ul className="text-sm text-gray-700 space-y-1 mt-2">
              <li>✅ Completed: {reports?.length && getEventStatus(reports, 2)}</li>
              <li>🟡 Ongoing: {reports?.length && getEventStatus(reports, 10)}</li>
              <li>🕓 Pending: {reports?.length && getEventStatus(reports, 1)}</li>
            </ul>
          </Card>

          <Card title="Top Organizations" className="shadow-md border border-gray-100">
            <ul className="text-sm text-gray-700 space-y-1 mt-2">
              {reports && (
                getTop3Org(reports).map((item, idx) => {
                  return(
                    <li key={idx}>{item.name} - {item.count} Events</li>
                  )
                })
              )}
            </ul>
          </Card>

        </div>

        {/* Charts + Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 mt-10 w-full justify-center items-center">
          
          {/* Bar Chart */}
          {getVolunteerPerDepartment(reports)?.length > 0 && (
            <Card title="Volunteers per Department" className="shadow-md border border-gray-100 col-span-3">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={getVolunteerPerDepartment(reports)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="volunteers" fill="#3B3FA8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          )}

          {/* Pie Chart */}
        {getVolunteerPerRole(reports)?.length > 0 && (
          <Card title="Students vs Faculty" className="shadow-md border border-gray-100  col-span-2 flex justify-center items-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={getVolunteerPerRole(reports)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
          
        </div>
      </div>
    </div>
  );
};
