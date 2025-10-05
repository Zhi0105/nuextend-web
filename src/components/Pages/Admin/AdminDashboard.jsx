import { useEffect, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { getDashBoardReport, getTerms } from '@_src/services/dashboard';
import { useUserStore } from '@_src/store/auth';
import { DecryptString } from '@_src/utils/helpers';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from 'primereact/card';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const { token } = useUserStore((state) => ({ token: state.token }));
  const decryptedToken = token && DecryptString(token);
  const { data: termData, isLoading: termLoading } = getTerms({ token: decryptedToken });
  const [selectedTerm, setSelectedTerm] = useState(null);

  const { mutate: getReport, isLoading: getReportLoading } = useMutation({
    mutationFn: getDashBoardReport,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      console.log("Report data:", data?.data);
    },
    onError: (err) => {
      console.log("@GDE", err)
    },
  });

  useEffect(() => {
    if (selectedTerm) {
      getReport({ token: decryptedToken, term: selectedTerm });
    }
  }, [selectedTerm, decryptedToken, getReport]);

  if (termLoading || getReportLoading) {
    return (
      <div className="dashboard-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px]">
        Loading....
      </div>
    );
  }

  const termOptions = termData?.terms?.map((term) => ({
    label: `Tri-Sem: ${term.name}`,
    value: term.name,
  })) || [];

  // 👉 Sample chart data (replace later with API data)
  const pieData = [
    { name: "Students", value: 250 },
    { name: "Faculty", value: 70 },
  ];
  const barData = [
    { name: "CBA", volunteers: 120 },
    { name: "Engineering", volunteers: 80 },
    { name: "CS/IT", volunteers: 70 },
    { name: "Nursing", volunteers: 50 },
  ];
  const COLORS = ['#3B3FA8', '#F7B500'];

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

      

      {/* Cards Section */}
      <div className='flex flex-col justify-center items-center'>
        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card title="Total Volunteers" className="shadow-md border border-gray-100">
            <div className="text-4xl font-bold text-indigo-600">320</div>
            <p className="text-sm text-gray-500 mt-1">Students: 250 | Faculty: 70</p>
          </Card>

          <Card title="Active Events" className="shadow-md border border-gray-100">
            <div className="text-4xl font-bold text-indigo-600">12</div>
            <p className="text-sm text-gray-500 mt-1">5 Programs, 7 Projects</p>
          </Card>

          <Card title="Budget Utilized" className="shadow-md border border-gray-100">
            <div className="text-4xl font-bold text-indigo-600">₱150,000</div>
            <p className="text-sm text-gray-500 mt-1">Out of ₱200,000 allocated</p>
          </Card>

          <Card title="Pending Approvals" className="shadow-md border border-gray-100">
            <div className="text-4xl font-bold text-indigo-600">6</div>
            <p className="text-sm text-gray-500 mt-1">Requires Signatory</p>
          </Card>
        </div>

             {/* Existing 3 Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
          <Card title="Events by Status" className="shadow-md border border-gray-100">
            <ul className="text-sm text-gray-700 space-y-1 mt-2">
              <li>✅ Completed: 8</li>
              <li>🟡 Ongoing: 12</li>
              <li>🕓 Pending: 6</li>
              <li>❌ Cancelled: 2</li>
            </ul>
          </Card>

          <Card title="Top Organizations" className="shadow-md border border-gray-100">
            <ul className="text-sm text-gray-700 space-y-1 mt-2">
              <li>🏥 Red Cross Youth – 5 Events</li>
              <li>🎓 NSTP Class – 4 Events</li>
              <li>🏛 Supreme Student Council – 3 Events</li>
            </ul>
          </Card>

          <Card title="Budget by Term" className="shadow-md border border-gray-100">
            <ul className="text-sm text-gray-700 space-y-1 mt-2">
              <li>1st Term: ₱150,000 / ₱200,000</li>
              <li>2nd Term: ₱80,000 / ₱180,000</li>
              <li>3rd Term: ₱0 (Upcoming)</li>
            </ul>
          </Card>
        </div>

        {/* Charts + Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 mt-10 w-full justify-center items-center">
          
          {/* Bar Chart */}
          <Card title="Volunteers per Department" className="shadow-md border border-gray-100 col-span-3">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="volunteers" fill="#3B3FA8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Pie Chart */}
          <Card title="Students vs Faculty" className="shadow-md border border-gray-100  col-span-2 flex justify-center items-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
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

          
        </div>

   
      </div>
    </div>
  );
};
