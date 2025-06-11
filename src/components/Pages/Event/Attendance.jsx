import { useCallback } from "react"
import { useLocation } from "react-router-dom"
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid'; // optional if you want time-based week/day
import listPlugin from '@fullcalendar/list'; // optional
import dayjs from "dayjs";
import _ from "lodash";

export const Attendance = () => {
    const location = useLocation()
    const participant = location.state

    const setParticipantAttendances = useCallback((startDate, endDate, participant) => {
        const start = dayjs(startDate)
        const end = dayjs(endDate)
        const totalDays = end.diff(start, 'day') + 1;

          // Convert attendance list to Set for faster lookup
        const presentDates = new Set(
            participant?.attendance
            .filter(entry => entry.is_attended === 1)
            .map(entry => dayjs(entry.attendance_date).format('YYYY-MM-DD'))
        );

        return _.range(totalDays).map(i => {
            const date = start.add(i, 'day').format('YYYY-MM-DD');
            const title = presentDates.has(date) ? `Present-${participant?.user.firstname}` : `Absent-${participant?.user.firstname}`;
            const color = presentDates.has(date) ? 'green' : 'red';
            return { date, title, color };
        });
    }, [])

    return (
        <div className="attendance-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] pt-[5rem]">
            <div className="w-full px-4 py-4">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridDay,dayGridWeek,dayGridMonth,listYear' // 'listYear' is a decent year alternative
                    }}
                    views={{
                        dayGridWeek: { buttonText: 'Week' },
                        dayGridDay: { buttonText: 'Day' },
                        dayGridMonth: { buttonText: 'Month' },
                        listYear: { buttonText: 'Year List' }
                    }}
                    events={[...setParticipantAttendances(
                        dayjs(participant?.event.start_date).format('YYYY-MM-DD'), 
                        dayjs(participant?.event.end_date).format('YYYY-MM-DD'),
                        participant
                    )]}
                    // dateClick={(info) => handleDateClick(info.dateStr)}
                />
            </div>
        </div>
    )
}
``