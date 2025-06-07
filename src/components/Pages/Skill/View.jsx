import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { getSkills } from "@_src/services/skills"
import { PiNotePencil } from 'react-icons/pi';
import { FaTrash } from "react-icons/fa";
import { useNavigate } from 'react-router-dom'
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { removeSkill } from '@_src/services/skills';
import { DecryptString } from "@_src/utils/helpers";
import { useUserStore } from '@_src/store/auth';
import { toast } from "react-toastify"

export const View = () => {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { token } = useUserStore((state) => ({ user: state.user, token: state.token }));
    const decryptedToken = token && DecryptString(token)
    const { data: skillData, isLoading: skillLoading } = getSkills()

    const { mutate: handleRemoveSkill, isLoading: removeSkillLoading } = useMutation({
        mutationFn: removeSkill,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['skills'] });
            toast('skill removed!', { type: "success" })
            }, 
        onError: (error) => {  
            console.log("@CSE:", error)
        },
    });

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-8">
                <button onClick={() => navigate('/skill/update', { state: rowData })}>
                    <PiNotePencil className="w-7 h-7 text-[#364190]"/>
                </button>
                <button onClick={() => handleRemoveSkill({ token: decryptedToken, id: rowData?.id })}>
                    <FaTrash className="w-7 h-7 text-[#364190]"/>
                </button>
            </div>
        )
    }

    if(skillLoading || removeSkillLoading) {
        return (
            <div className="skill-view-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] mt-[50px]">
                Loading Skills...
            </div>
        )
    }

    if(!skillLoading) {
        const skills = skillData?.data
        return (
            <div className="skill-view-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] mt-[50px]">
                <DataTable 
                    value={skills} 
                    size="normal"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    dataKey="id"
                    emptyMessage="Skill(s) Not Found."
                    className="datatable-responsive min-w-full px-2 py-2 mt-10"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} skills"
                    rows={10}
                    paginator
                    removableSort
                    filterDisplay="row"
                >
                    <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="name" header="Skill" />
                    <Column headerClassName="bg-[#FCA712] text-white" body={actionBodyTemplate} header="Action"></Column>

                </DataTable>
            </div>
        )
    }
}
