import { useEffect, useRef, useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useLocation } from "react-router-dom"
import { useUserStore } from '@_src/store/auth';
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { changeRole, getMembers } from "@_src/services/organization"
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { getRoles } from "@_src/services/role";
import { Button } from "primereact/button";
import { OverlayPanel } from 'primereact/overlaypanel'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { toast } from "react-toastify";
import _ from "lodash";


export const Member = () => {
    const location = useLocation()
    const queryClient = useQueryClient()
    const { organization, role } = location.state
    const { user, token } = useUserStore((state) => ({ user: state.user, token: state.token }));
    const decryptedToken = token && DecryptString(token)    
    const decryptedUser = token && DecryptUser(user)
    
    const { data: roleData } = getRoles()
    const { data: memberData, isLoading: memberLoading, refetch, isRefetching } = getMembers({
        token: decryptedToken,
        organization_id: organization.id
    })
  
    

    useEffect(() => {
        refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    const nameTemplate = (rowData) => {
        return (
            <div className="text-base">
                {rowData?.lastname}, {rowData?.firstname} {rowData?.middlename}
            </div>
        )
    }
    const RoleTemplate = ({ rowData }) => {
        const op = useRef<OverlayPanel>(null);
        const [selectedRole, setSelectedRole] = useState(
            _.find(_.filter(roleData?.data, (role) => [6, 7, 8].includes(role.id)), (i) => i.id === rowData?.pivot.role_id)
        );
        const [pendingRole, setPendingRole] = useState(null); // temporary selected value

        const { mutate: changeRoleMutate, } = useMutation({
            mutationFn: changeRole,
            onSuccess: (data) => {
                queryClient.invalidateQueries({ queryKey: ['members'] });
                console.log(data)
                setSelectedRole(pendingRole)
                }, 
            onError: (error) => {  
                console.log("@COE:", error)
                toast(error?.response.data.message, {type: "warning" })
            },
        });

        const accept = (value) => {
            setPendingRole(value) // set temporary value
            changeRoleMutate({
                token: decryptedToken,
                organization_id: organization.id,
                assigner_id: decryptedUser?.id,
                assigner_role: role,
                assignee_id: rowData?.id,
                assignee_role: value.id
            })
            op.current?.hide()
        }
        const reject = () => {
            op.current?.hide()
        }
        const handleChangeRole = (value) => {
            confirmDialog({
                message: 'Are you sure to change role?',
                header: 'Confirmation',
                icon: "pi pi-exclamation-triangle",
                accept: () => accept(value),
                reject
            });
        }
        return (
            <div className="text-base">
                <Dropdown
                    disabled={role === 8} 
                    value={selectedRole} 
                    onChange={(e) => handleChangeRole(e.value)} 
                    options={_.filter(roleData?.data, (role) => [6, 7, 8].includes(role.id))} 
                    optionLabel="name" 
                    placeholder="role selection" 
                    className="w-full md:w-14rem" 
                />
            </div>
        )
    }
    if(memberLoading || isRefetching) {
        return (
            <div className="member-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] pt-[5rem]">
                Loading members...
            </div>
        )
    }

    if(!memberLoading && memberData) {
            const members = memberData?.data
        return (
            <div className="member-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] pt-[5rem]">
                <DataTable 
                    value={members} 
                    size="normal"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    dataKey="id"
                    emptyMessage="Event(s) Not Found."
                    className="datatable-responsive min-w-full px-2 py-2"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} members"
                    rows={10}
                    paginator
                    removableSort
                >
                    <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" body={nameTemplate} header="Name" />
                <Column headerClassName="bg-[#FCA712] text-white" body={(rowData) => <RoleTemplate rowData={rowData} />} header="Role"></Column>
                </DataTable>
                <ConfirmDialog 
                    pt={{
                    acceptButton: { className: "text-white bg-[#5b9bd1] border border-[#5b9bd1] border-none py-1 px-3" },
                    rejectButton: { className: "text-white bg-[#C62E2E] border-none py-1 px-3 mr-4" }
                    }}
                />  
            </div>
        )
    }
}
