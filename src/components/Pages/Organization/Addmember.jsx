import { useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Card } from "primereact/card"
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

export const Addmember = () => {
    const queryClient = useQueryClient()
    const { user, token } = useUserStore((state) => ({ user: state.user, token: state.token }));
    const decryptedToken = token && DecryptString(token)
    const decryptedUser = token && DecryptUser(user)

    const { data: userData, isLoading: userLoading } = getUsers({ token: decryptedToken })
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
            }, 
        onError: (error) => {  
            toast(error?.response.data.message, { type: "warning" })
            console.log("@OAE:", error)
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

    const onSubmit = (data) => {
        handleOrganizationAssign({
            token: decryptedToken,
            user_id: data?.user.id,
            organizations: [{
                id: data?.organization.id,
                role: data?.role.id
            }]
        })
    };
    
    const setUsersList = (users) => {
        return _.filter(users, (user) => user.id !== decryptedUser?.id)
    }

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
                                        options={setUsersList(userData?.data)} 
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
                                label="Add" 
                            />
                        </div>
                    </form>
                </div>
            </Card>
        </div>
    )
}
