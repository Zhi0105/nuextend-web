import { useEffect, useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Card } from "primereact/card"
import { Dialog } from "primereact/dialog";
import { useUserStore } from '@_src/store/auth';
import { getUsers } from "@_src/services/user"
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { useForm, Controller } from "react-hook-form";
import { Dropdown } from 'primereact/dropdown';
import { getRoles } from "@_src/services/role";
import { userOrganizationAssign } from "@_src/services/organization";
import { Button } from "primereact/button";
import { toast } from "react-toastify";
import _ from "lodash";
import { FaExclamationTriangle, FaCheckCircle, FaTimes, FaUserPlus } from "react-icons/fa";

export const Addmember = () => {
    const queryClient = useQueryClient()
    const { user, token } = useUserStore((state) => ({ user: state.user, token: state.token }));
    const decryptedToken = token && DecryptString(token)
    const decryptedUser = token && DecryptUser(user)

    // Add state for confirmation dialog
    const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
    const [memberDataToSubmit, setMemberDataToSubmit] = useState(null);

    const { data: userData, isLoading: userLoading, refetch: userRefetch } = getUsers({ token: decryptedToken })
    const { data: roleData, isLoading: roleLoading } = getRoles()

    const { handleSubmit, control, reset, formState: { errors }} = useForm({
        defaultValues: {
            user: "",
            organization: "",
            role: ""
        },
    });
    const { mutate: handleOrganizationAssign, isLoading: assignLoading } = useMutation({
        mutationFn: userOrganizationAssign,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['organization'] });
            toast(data?.message, { type: "success" })
            reset()
            setConfirmDialogVisible(false);
            setMemberDataToSubmit(null);
            }, 
        onError: (error) => {  
            toast(error?.response.data.message, { type: "warning" })
            console.log("@OAE:", error)
            setConfirmDialogVisible(false);
            setMemberDataToSubmit(null);
        },
    });

    
    useEffect(() => {
        if(roleData && !roleLoading) {
            reset({
                user: "",
                organization: "",
                role: _.find(roleData?.data, { id: 8 }) || ""
            });
        }
    }, [roleData, roleLoading, reset])

    useEffect(() => {
        userRefetch()
    }, [userData, userRefetch])

    // Modified onSubmit to show confirmation dialog
    const onSubmit = (data) => {
        setMemberDataToSubmit(data);
        setConfirmDialogVisible(true);
    };

    // Function to actually assign member after confirmation
    const handleConfirmSubmit = () => {
        if (!memberDataToSubmit) return;
        
        handleOrganizationAssign({
            token: decryptedToken,
            user_id: memberDataToSubmit?.user.id,
            organizations: [{
                id: memberDataToSubmit?.organization.id,
                role: memberDataToSubmit?.role.id
            }]
        })
    };

    // Function to cancel submission
    const handleCancelSubmit = () => {
        setConfirmDialogVisible(false);
        setMemberDataToSubmit(null);
    };

    // Make sure this function is defined before it's used
    const setOrganizationList = (organizations) => {
        return _.filter(organizations, (org) => [6, 7].includes(org.pivot.role_id))
    }

    if(userLoading || roleLoading) {
        return (
            <div className="addmember-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] mt-[50px]">
                Loading forms...
            </div>
        )
    }

    if(assignLoading) {
        return (
            <div className="addmember-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] mt-[50px]">
                Assigning new member...
            </div>
        )
    }

    return (
        <div className="addmember-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] mt-[50px]">
            {/* Confirmation Dialog */}
            <Dialog
                visible={confirmDialogVisible}
                onHide={handleCancelSubmit}
                className="confirmation-dialog"
                closable={false}
                showHeader={false}
                modal
                style={{ width: '450px', borderRadius: '12px', overflow: 'hidden' }}
            >
                <div className="bg-white rounded-lg shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-50">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                                <FaUserPlus className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Confirm Member Assignment</h3>
                                <p className="text-sm text-gray-600">Review member details before adding</p>
                            </div>
                        </div>
                        <button
                            onClick={handleCancelSubmit}
                            className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                            <FaTimes className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="text-center mb-4">
                            <p className="text-gray-700 text-lg font-medium mb-2">
                                Are you sure you want to add this member?
                            </p>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-gray-700">Member:</span>
                                        <span className="text-gray-900">
                                            {memberDataToSubmit?.user?.firstname} {memberDataToSubmit?.user?.lastname}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-gray-700">Organization:</span>
                                        <span className="text-gray-900">{memberDataToSubmit?.organization?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-gray-700">Role:</span>
                                        <span className="text-gray-900">{memberDataToSubmit?.role?.name}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <FaExclamationTriangle className="flex-shrink-0 w-4 h-4 text-amber-600" />
                            <p className="text-sm text-amber-800">
                                This member will gain access to the organization's events and resources.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 justify-end p-6 border-t border-gray-200 bg-gray-50">
                        <button
                            onClick={handleCancelSubmit}
                            disabled={assignLoading}
                            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmSubmit}
                            disabled={assignLoading}
                            className="px-6 py-2.5 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {assignLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <FaCheckCircle className="w-3 h-3" />
                                    Yes, Add Member
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Dialog>

            <Card
                title="Add member to organizations:" 
                className="w-1/2"
            >
                <div className="form-container">
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="bg-transparent flex flex-col gap-4"
                    >
                        <div className="bg-transparent flex flex-col justify-center">
                            <Controller
                                control={control}
                                rules={{
                                    required: true,
                                }}
                                render={({ field: { onChange, value } }) => (
                                    <Dropdown
                                        filter
                                        className="w-full md:w-14rem capitalize border shadow-sm" 
                                        value={value} 
                                        onChange={onChange} 
                                        options={_.filter(userData?.data, (user) => (user.id !== decryptedUser.id) && (![1, 10, 11].includes(user.role_id)))} 
                                        optionLabel={`firstname`} 
                                        placeholder="Select member" 
                                        checkmark={true} 
                                        highlightOnSelect={false} 
                                        itemTemplate={(option) => `${option.lastname}, ${option.firstname} ${option.middlename}`}
                                    />
                                )}
                                name="user"
                            />
                            {errors.user && (
                                <p className="text-sm text-red-400 indent-2">Please select a member*</p>
                            )}
                        </div>
                        <div className="organization">
                            <Controller
                                control={control}
                                rules={{
                                    required: true,
                                }}
                                render={({ field: { onChange, value } }) => (
                                    <Dropdown
                                        className="w-full md:w-14rem capitalize border shadow-sm" 
                                        value={value} 
                                        onChange={onChange} 
                                        options={setOrganizationList(decryptedUser?.organizations)} 
                                        optionLabel="name" 
                                        placeholder="Select organization" 
                                        checkmark={true} 
                                        highlightOnSelect={false} 
                                    />
                                )}
                                name="organization"
                            />
                            {errors.organization && (
                                <p className="text-sm text-red-400 indent-2">Please select organization*</p>
                            )}
                        </div>
                        <div className="role">
                            <Controller
                                control={control}
                                rules={{
                                    required: true,
                                }}
                                render={({ field: { onChange, value } }) => (
                                    <Dropdown
                                        className="w-full md:w-14rem capitalize bg-blue-200 border shadow-sm" 
                                        disabled    
                                        value={value} 
                                        onChange={onChange} 
                                        options={roleData?.data} 
                                        optionLabel="name" 
                                        placeholder="Select roles" 
                                        checkmark={true} 
                                        highlightOnSelect={false} 
                                    />
                                )}
                                name="role"
                            />
                            {errors.role && (
                                <p className="text-sm text-red-400 indent-2">Please select role*</p>
                            )}
                        </div>
                        <div className="flex justify-center gap-4">
                            <Button 
                                type="submit"
                                className="bg-[#2211cc] text-[#c7c430] w-full text-center font-bold rounded-lg p-2"
                                label="Add Member" 
                            />
                        </div>
                    </form>
                </div>
            </Card>
        </div>
    )
}