import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link } from 'react-router-dom';

export const FormDownload = () => {

    const downloads = [
        {
            code: "ACD-CE-F-001",
            name: "Program Proposal Format",
            link: "",
        },
        {
            code: "ACD-CE-F-002",
            name: "Project Proposal Format",
            link: "",
        },
        {
            code: "ACD-CE-F-003",
            name: "Outreach Project Proposal Format",
            link: "",
        },
        {
            code: "ACD-CE-F-004",
            name: "Checklist of Criteria for Extension Program Proposal",
            link: "",
        },
        {
            code: "ACD-CE-F-005",
            name: "Checklist of Criteria for Project Proposal",
            link: "",
        },
        {
            code: "ACD-CE-F-006",
            name: "Manifestation of Consent and Cooperation for the Extension Program",
            link: "",
        },
        {
            code: "ACD-CE-F-007",
            name: "Manifestation of Consent and Cooperation for the Outreach Project",
            link: "",
        },
        {
            code: "ACD-CE-F-008",
            name: "Target Group Needs Diagnosis Report Format",
            link: "",
        },
        {
            code: "ACD-CE-F-009",
            name: "Extension Program Evaluation and Terminal Report Format",
            link: "",
        },
        {
            code: "ACD-CE-F-010",
            name: "Outreach Project Evaluation and Documentation Report Format",
            link: "",
        },
        {
            code: "ACD-CE-F-011",
            name: "Extension Program and Project Itinerary of Travel Format",
            link: "",
        },
        {
            code: "ACD-CE-F-012",
            name: "Minutes of the Meeting Format",
            link: "",
        },
        {
            code: "ACD-CE-F-013",
            name: "List of Attendees, Volunteers, and Donors Format",
            link: "",
        },
        {
            code: "ACD-CE-F-014",
            name: "Post-Activity Report Format",
            link: "",
        },
        {
            code: "ACD-CE-F-015",
            name: "Self-Learning Assessment Format",
            link: "",
        },
        
        
    ]

    const downloadTemplate = (rowData) => {
        return (
            <Link
                to={`http://127.0.0.1:8000/storage/pdf/downloadables/${rowData?.code} - ${rowData?.name}.pdf`}
                target='_blank'
                className='text-blue-400 text-sm'
            >
                Download            
            </Link>
        )

    }

    return (
        <div className="formdownload-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] py-20">
            <DataTable 
                value={downloads} 
                size="normal"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                dataKey="id"
                emptyMessage="Form(s) Not Found."
                className="datatable-responsive min-w-full px-2 py-2"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} forms"
                rows={15}
                paginator
                removableSort
            >
                <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="code" header="Code" />
                <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="name" header="Name" />
                <Column headerClassName="bg-[#FCA712] text-white" body={downloadTemplate} header="Downloads"></Column>
            </DataTable>
        </div>
    )
}
