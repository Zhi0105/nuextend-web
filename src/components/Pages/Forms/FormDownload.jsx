import { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link } from 'react-router-dom';
import { Dropdown } from 'primereact/dropdown';
import { getModels } from "@_src/services/model";
        
export const FormDownload = () => {
    const [ selectedModel, setSelectedModel ] = useState(null)
    const { data: modelData, isLoading: modelLoading } = getModels()
    const downloads = [
        {
            code: "NUB-ACD-CMX-F-001",
            name: "Program Proposal Format",
        },
        {
            code: "NUB-ACD-CMX-F-002",
            name: "Project Proposal Format",
        },
        {
            code: "NUB-ACD-CMX-F-003",
            name: "Outreach Project Proposal Format",
        },
        {
            code: "NUB-ACD-CMX-F-004",
            name: "Checklist of Criteria for Extension Program Proposal",
        },
        {
            code: "NUB-ACD-CMX-F-005",
            name: "Checklist of Criteria for Project Proposal",
        },
        {
            code: "NUB-ACD-CMX-F-006",
            name: "Manifestation of Consent and Cooperation for the Extension Program",
        },
        {
            code: "NUB-ACD-CMX-F-007",
            name: "Manifestation of Consent and Cooperation for the Outreach Project",
        },
        {
            code: "NUB-ACD-CMX-F-008",
            name: "Target Group Needs Diagnosis Report Format",
        },
        {
            code: "NUB-ACD-CMX-F-009",
            name: "Extension Program Evaluation and Terminal Report Format",
        },
        {
            code: "NUB-ACD-CMX-F-010",
            name: "Outreach Project Evaluation and Documentation Report Format",
        },
        {
            code: "NUB-ACD-CMX-F-011",
            name: "Extension Program and Project Itinerary of Travel Format",
        },
        {
            code: "NUB-ACD-CMX-F-012",
            name: "Minutes of the Meeting Format",
        },
        {
            code: "NUB-ACD-CMX-F-013",
            name: "List of Attendees, Volunteers, and Donors Format",
        },
        {
            code: "NUB-ACD-CMX-F-014",
            name: "Post-Activity Report Format",
        },
        {
            code: "NUB-ACD-CMX-F-015",
            name: "Self-Learning Assessment Format",
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

    const modelMap = {
        1: [2, 4, 6, 7, 10, 11, 12, 13, 9], // based on index
        2: [1, 4, 6, 7, 10, 11, 12, 13, 9],
        3: [0, 3, 5, 7, 10, 11, 12, 13, 8]
    };

    const filteredDownloads = selectedModel?.id
        ? downloads.filter((_, idx) => modelMap[selectedModel.id]?.includes(idx))
        : downloads;

    
    if(modelLoading) {
        <div className="formdownload-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] py-20">
            Loading models...
        </div>
    }

    return (
        <div className="formdownload-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] py-20">
            <div className='w-full px-2'>
                <Dropdown
                    className="text-left md:w-14rem capitalize border border-gray-400" 
                    value={selectedModel} 
                    onChange={(e) => setSelectedModel(e.value)}
                    options={modelData?.data} 
                    optionLabel="name" 
                    placeholder="filter by model" 
                    checkmark={true} 
                    highlightOnSelect={false} 
                />
            </div>
            <DataTable 
                value={filteredDownloads} 
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
