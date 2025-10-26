import { useEffect, useRef, useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useLocation } from "react-router-dom"
import { useUserStore } from '@_src/store/auth';
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { changeRole, getMembers, removeMember } from "@_src/services/organization"
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { getRoles } from "@_src/services/role";
import { Button } from "primereact/button";
import { OverlayPanel } from 'primereact/overlaypanel'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Dialog } from "primereact/dialog"; // Add this import
import { Link } from 'react-router-dom';
import { toast } from "react-toastify";
import _ from "lodash";


export const Member = () => {
    const location = useLocation()
    const queryClient = useQueryClient()
    const { organization, role } = location.state
    const { user, token } = useUserStore((state) => ({ user: state.user, token: state.token }));
    const decryptedToken = token && DecryptString(token)    
    const decryptedUser = token && DecryptUser(user)
    
    // Add state for remove confirmation dialog
    const [removeDialogVisible, setRemoveDialogVisible] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState(null);
    
    const { data: roleData } = getRoles()
    const { data: memberData, isLoading: memberLoading, refetch, isRefetching } = getMembers({
        token: decryptedToken,
        organization_id: organization.id
    })
    const { mutate: handleRemoveMember, isLoading: removeMemberLoading } = useMutation({
        mutationFn: removeMember,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            toast(data?.message, {type: "success" })
            setRemoveDialogVisible(false);
            setMemberToRemove(null);
            }, 
        onError: (error) => {  
            console.log("@RME:", error)
            toast(error?.response.data.message, {type: "warning" })
            setRemoveDialogVisible(false);
            setMemberToRemove(null);
        },
    });

    useEffect(() => {
        refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Function to show remove confirmation
    const confirmRemove = (rowData) => {
        setMemberToRemove(rowData);
        setRemoveDialogVisible(true);
    };

    // Function to execute remove after confirmation
    const executeRemove = () => {
        if (memberToRemove) {
            handleRemoveMember({
                token: decryptedToken,
                user_id: memberToRemove?.id,
                role: memberToRemove?.pivot.role_id
            })
        }
    };

    // Function to cancel remove
    const cancelRemove = () => {
        setRemoveDialogVisible(false);
        setMemberToRemove(null);
    };

    
    const hasRole = (organization) => {
        return _.some(organization, (org) => [6, 7].includes(org.pivot.role_id))
    }

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

        const { mutate: changeRoleMutate } = useMutation({
            mutationFn: changeRole,
            onSuccess: (data) => {
                queryClient.invalidateQueries({ queryKey: ['members'] });
                console.log(data)
                setSelectedRole(pendingRole)
                }, 
            onError: (error) => {  
                console.log("@CRE:", error)
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
    const actionTemplate = (rowData) => {
        return (
            <div className="action-main flex gap-4">
                <Button
                    onClick={() => confirmRemove(rowData)}
                    className="text-red-400 px-4 py-2"
                >
                    {rowData.pivot.role_id === 6 ? "leave" : "remove"}
                </Button>
            </div>  
        )
    }

    if(memberLoading || isRefetching || removeMemberLoading) {
        return (
            <div className="member-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] pt-[5rem]">
                Loading members...
            </div>
        )
    }
    // #FCA712

    if(!memberLoading && memberData) {
            const members = memberData?.data
        return (
            <div className="member-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] pt-[5rem]">
                {/* Remove Confirmation Dialog */}
                <Dialog
                    header="Confirm Removal"
                    visible={removeDialogVisible}
                    style={{ width: '400px' }}
                    onHide={cancelRemove}
                    footer={
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={cancelRemove}
                                disabled={removeMemberLoading}
                                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeRemove}
                                disabled={removeMemberLoading}
                                className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                            >
                                {removeMemberLoading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Removing...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <i className="pi pi-trash text-sm"></i>
                                        Remove Member
                                    </span>
                                )}
                            </button>
                        </div>
                    }
                >
                    <div className="confirmation-content flex align-items-center">
                        <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem', color: '#e74c3c' }} />
                        <span>
                            Are you sure you want to remove <strong>{memberToRemove?.firstname} {memberToRemove?.lastname}</strong> from the organization?
                        </span>
                    </div>
                </Dialog>

                {hasRole(decryptedUser?.organizations) && (
                    <div className="w-full flex justify-end px-2">
                        <Link
                            to="/organization/member/add"
                            className="bg-blue-200 px-4 py-2"
                        >
                            Member
                        </Link>
                    </div>
                )}
                <div className="w-full">
                    <DataTable 
                    value={members} 
                    size="normal"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    dataKey="id"
                    emptyMessage="Member(s) Not Found."
                    className="datatable-responsive min-w-full px-2 py-2"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} members"
                    rows={10}
                    paginator
                    removableSort
                >
                    <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" body={nameTemplate} header="Name" />
                    <Column headerClassName="bg-[#364190] text-white" body={(rowData) => <RoleTemplate rowData={rowData} />} header="Role"></Column>
                    <Column headerClassName="bg-[#FCA712] text-white" body={actionTemplate} header="Action"></Column>
                    </DataTable>
                    <ConfirmDialog 
                        pt={{
                        acceptButton: { className: "text-white bg-[#5b9bd1] border border-[#5b9bd1] border-none py-1 px-3" },
                        rejectButton: { className: "text-white bg-[#5b9bd1] border-none py-1 px-3 mr-4" }
                        }}
                    /> 
                </div>
            </div>
        )
    }
}