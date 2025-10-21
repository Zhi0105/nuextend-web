import { useCallback } from "react"
import { useLocation } from "react-router-dom"
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import dayjs from "dayjs";
import _ from "lodash";

export const Attendance = () => {
    const location = useLocation()
    const { participant, activity } = location.state
    console.log(activity);
    console.log(participant);

    const setParticipantAttendances = useCallback((startDate, endDate, participant) => {
        const start = dayjs(startDate, 'MM-DD-YYYY');
        const end = dayjs(endDate, 'MM-DD-YYYY');
        const totalDays = end.diff(start, 'day') + 1;
        const today = dayjs();

        // Create a map of attendance records by time_in date for quick lookup
        const attendanceByDate = {};
        participant?.attendance?.forEach(entry => {
            if (entry.is_attended === 1 && entry.time_in) {
                const timeInDate = dayjs(entry.time_in).format('YYYY-MM-DD');
                attendanceByDate[timeInDate] = entry;
            }
        });

        return _.range(totalDays).map(i => {
            const date = start.add(i, 'day');
            const dateStr = date.format('YYYY-MM-DD');
            const isPast = date.isBefore(today, 'day');
            const isToday = date.isSame(today, 'day');
            const isFuture = date.isAfter(today, 'day');

            // Check if attended on this date using time_in date
            const attendanceRecord = attendanceByDate[dateStr];
            
            let title = '';
            let color = '';
            let description = '';

            if (attendanceRecord && attendanceRecord.time_in) {
                // Check if time_out exists and is not null
                if (attendanceRecord.time_out !== null && attendanceRecord.time_out !== undefined) {
                    // Calculate hours attended
                    const timeIn = dayjs(attendanceRecord.time_in);
                    const timeOut = dayjs(attendanceRecord.time_out);
                    const hours = timeOut.diff(timeIn, 'hour', true);
                    
                    title = `Present - ${hours.toFixed(2)}h`;
                    color = 'green';
                    description = `Attended: ${hours.toFixed(2)} hours`;
                } else {
                    // time_in exists but time_out is null or undefined - mark as absent
                    title = 'Absent';
                    color = 'red';
                    description = 'Time in recorded but no time out';
                }
            } else if (isFuture) {
                title = 'Pending';
                color = '#FCA712'; // yellow
                description = 'Future date - Not yet attended';
            } else if (isPast || isToday) {
                title = 'Absent';
                color = 'red';
                description = 'Date passed - Not attended';
            }

            return {
                date: dateStr,
                title: title,
                color: color,
                description: description,
                extendedProps: {
                    hours: attendanceRecord && attendanceRecord.time_in && attendanceRecord.time_out ? 
                        dayjs(attendanceRecord.time_out).diff(dayjs(attendanceRecord.time_in), 'hour', true).toFixed(2) 
                        : '0'
                }
            };
        });
    }, []);

    return (
        <div className="attendance-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] pt-[5rem]">
            <div className="w-full px-4 py-4">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridDay,dayGridWeek,dayGridMonth,listYear'
                    }}
                    views={{
                        dayGridWeek: { buttonText: 'Week' },
                        dayGridDay: { buttonText: 'Day' },
                        dayGridMonth: { buttonText: 'Month' },
                        listYear: { buttonText: 'Year List' }
                    }}
                    events={[...setParticipantAttendances(
                        activity[0]?.start_date, 
                        activity[0]?.end_date,
                        participant
                    )]}
                    eventContent={(eventInfo) => (
                        <div className="text-center p-1">
                            <div className="font-bold text-sm">{eventInfo.event.title}</div>
                        </div>
                    )}
                />
            </div>
        </div>
    )
}