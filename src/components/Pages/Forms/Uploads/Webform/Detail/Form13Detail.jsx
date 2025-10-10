import React, { useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { format, isWithinInterval, parseISO, isSameDay } from "date-fns";

const ActivityAttendance = ({ data, eventMembers }) => {
  const [selectedDate, setSelectedDate] = useState("");

  const mergedParticipants = useMemo(() => {
    if (!selectedDate) return [];
    const targetDate = new Date(selectedDate);

    // Collect participants from all activities that match the date
    const allParticipants = data.flatMap((activity) => {
      const isInActivityRange = isWithinInterval(targetDate, {
        start: new Date(activity.start_date),
        end: new Date(activity.end_date),
      });

      if (!isInActivityRange) return [];

      const attended = activity.participants
        .map((p) => ({
          ...p,
          activityName: activity.name,
          attendance: p.attendance.filter((a) =>
            isSameDay(parseISO(a.attendance_date), targetDate)
          ),
        }))
        .filter((p) => p.attendance.length > 0);

      return attended;
    });

    return allParticipants;
  }, [data, selectedDate]);

  return (
    <div className="p-6 space-y-8 w-full max-w-5xl">
      <h2 className="text-xl font-semibold">Activity Attendance Filter</h2>

      {/* Filter Section */}
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-sm text-gray-600">Select Date</label>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {/* Attendance Table */}
      <div className="space-y-6 mt-6 w-full">
        {selectedDate && mergedParticipants.length === 0 ? (
          <p className="text-gray-500 italic">
            No participants attended any activity on{" "}
            {format(new Date(selectedDate), "PPP")}.
          </p>
        ) : selectedDate ? (
          <div className="border rounded-lg p-4 shadow bg-white overflow-x-auto">
            <h3 className="text-lg font-semibold mb-4">
              Attendance on {format(new Date(selectedDate), "PPP")}
            </h3>

            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700 border-b">
                    Participant Name
                  </th>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700 border-b">
                    Department
                  </th>
                </tr>
              </thead>
              <tbody>
                {mergedParticipants.map((p, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-2 px-4 text-gray-800 capitalize border-b">
                      {p?.user
                        ? `${p.user.lastname}, ${p.user.firstname} ${p.user.middlename || ""}`
                        : "Unknown"}
                    </td>
                    <td className="py-2 px-4 text-gray-800 border-b">
                      {p?.user?.department?.name || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 italic">Please select a date to filter.</p>
        )}
      </div>

      {/* Event Members Table */}
      {eventMembers && eventMembers.length > 0 && (
        <div className="border rounded-lg p-4 shadow bg-white overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4">Event Members</h3>
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700 border-b">
                  Full Name
                </th>
                <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700 border-b">
                  Department
                </th>
                <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700 border-b">
                  Role
                </th>
              </tr>
            </thead>
            <tbody>
              {eventMembers.map((member, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-2 px-4 text-gray-800 capitalize border-b">
                    {member?.user
                      ? `${member.user.lastname}, ${member.user.firstname} ${member.user.middlename || ""}`
                      : "Unknown"}
                  </td>
                  <td className="py-2 px-4 text-gray-800 border-b">
                    {member?.user?.department?.name || "—"}
                  </td>
                  <td className="py-2 px-4 text-gray-800 border-b capitalize">
                    {member?.role || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// 🔹 Main Form13Detail Component
export const Form13Detail = () => {
  const { state } = useLocation();
  const { event } = state || {};

  console.log("activity", event?.activity);
  console.log("participants", event?.participants);
  console.log("eventmember", event?.eventmember);

  // Combine activities and participants
  const data = event?.activity
    ? event.activity.map((act) => ({
        ...act,
        participants: event.participants || [],
      }))
    : [];

  return (
    <div className="form13-detail-main min-h-screen bg-white w-full flex flex-col items-center sm:pl-[200px] py-20">
      {data.length > 0 ? (
        <ActivityAttendance
          data={data}
          eventMembers={event?.eventmember || []}
        />
      ) : (
        <p className="text-gray-500 italic">No activity data available.</p>
      )}
    </div>
  );
};
