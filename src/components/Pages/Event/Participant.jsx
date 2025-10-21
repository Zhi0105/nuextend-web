import { useLocation } from "react-router-dom"
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FaRegCalendarCheck } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom'
import { Tooltip } from 'primereact/tooltip';

export const Participant = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const {participants, activity} = location.state 

    // Function to calculate hours attended
    const calculateHoursAttended = (rowData) => {
        if (!rowData?.attendance || rowData.attendance.length === 0) {
            return "0 hours";
        }

        let totalHours = 0;
        
        rowData.attendance.forEach(attendanceRecord => {
            if (attendanceRecord.is_attended && attendanceRecord.time_in && attendanceRecord.time_out) {
                const timeIn = new Date(attendanceRecord.time_in);
                const timeOut = new Date(attendanceRecord.time_out);
                
                // Calculate difference in milliseconds and convert to hours
                const diffMs = timeOut - timeIn;
                const diffHours = diffMs / (1000 * 60 * 60);
                
                totalHours += diffHours;
            }
        });

        // Format to 2 decimal places
        return `${totalHours.toFixed(2)} hours`;
    }

    const nameTemplate = (rowData) => {
        return (
            <div>
                {rowData?.user.lastname}, {rowData?.user.firstname} {rowData?.user.middlename}
            </div>
        )
    }

    // Template for displaying hours attended
    const hoursTemplate = (rowData) => {
        return (
            <div className="font-medium">
                {calculateHoursAttended(rowData)}
            </div>
        )
    }

    const actionBodyTemplate = (rowData) => {
    return (
        <div className="flex gap-8">
            <Tooltip target=".attendance" content="Attendance" position="right" />
            <button onClick={() => navigate('/event/participants/attendance', {
                state: {
                    participant: rowData,
                    activity: activity
                }
            })}>
                <FaRegCalendarCheck className="attendance w-7 h-7 text-[#364190]"/>
            </button>
        </div>
    )
}

    return (
        <div className="participant-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] pt-[5rem]">
            <DataTable 
                value={participants} 
                size="normal"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                dataKey="id"
                emptyMessage="Participant(s) Not Found."
                className="datatable-responsive min-w-full px-2 py-2"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} participants"
                rows={10}
                paginator
                removableSort
                filterDisplay="row"
            >
                <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" body={nameTemplate} header="Participant" />
                <Column headerClassName="bg-[#FCA712] text-white" body={hoursTemplate} header="Hours Attended" />
                <Column headerClassName="bg-[#FCA712] text-white" body={actionBodyTemplate} header="Action"></Column>
            </DataTable>
        </div>
    )
}