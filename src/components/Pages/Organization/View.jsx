import { getUserOrganizations } from "@_src/services/organization"
import { DataTable } from 'primereact/datatable';
import { useUserStore } from '@_src/store/auth';
import { Column } from 'primereact/column';
import { FaUserGroup } from "react-icons/fa6";
import { BsFillCalendarEventFill } from "react-icons/bs";
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { useNavigate } from 'react-router-dom'
import { Button } from "primereact/button";
import { Link } from 'react-router-dom';
import { useEffect } from "react";

export const View = () => {
    const navigate = useNavigate()
    const { user, token } = useUserStore((state) => ({ user: state.user, token: state.token }));
    const decryptedUser = token && DecryptUser(user)
    const decryptedToken = token && DecryptString(token)
    const { data: organizationData, isLoading: organizationLoading, refetch: orgRefetch, isRefetching: orgRefetchLoading } = getUserOrganizations({
        token: decryptedToken,
        user_id: decryptedUser?.id
    })

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-8">
            <button onClick={() =>  navigate('/organization/member', { state: { organization: rowData, role: rowData.pivot.role_id } })} className="flex gap-2 justify-center items-center cursor-pointer">
                    <FaUserGroup className="w-4 h-4 text-[#364190]"/>
                    <label className="text-xs text-[#FCA712]">Members</label>
                </button>
                <button onClick={() => console.log(rowData)} className="flex gap-2 justify-center items-center cursor-pointer">
                    <BsFillCalendarEventFill className="w-4 h-4 text-[#364190]"/>
                    <label className="text-xs text-[#FCA712]">Events</label>
                </button>
                
            </div>
        )
    }

    useEffect(() => {
        orgRefetch()
    }, [orgRefetch])

    if(organizationLoading || orgRefetchLoading) {
        return (
            <div className="orgview-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] pt-[5rem]">
                Organization loading...
            </div>
        )
    }
    if(!organizationData|| !orgRefetchLoading || organizationData) { 
        const organizations = organizationData?.data
        return (
            <div className="orgview-main min-h-screen bg-white w-full flex flex-col xs:pl-[0px] sm:pl-[200px] pt-[5rem]">
                <div className="flex justify-end px-2">
                    <Link
                        to={"/organization/create"}
                        className="bg-blue-200 px-4 py-2"
                    >
                        Organization
                    </Link>
                </div>
                <div>
                    <DataTable 
                        value={organizations} 
                        size="normal"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        dataKey="id"
                        emptyMessage="Organization(s) Not Found."
                        className="datatable-responsive min-w-full px-2 py-2"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} organizations"
                        rows={10}
                        paginator
                        removableSort
                    >
                    <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="name" header="Organization" />
                    <Column headerClassName="bg-[#FCA712] text-white" body={actionBodyTemplate} header="Action"></Column>

                    </DataTable>
                </div>
            </div>
        )
    }
}
