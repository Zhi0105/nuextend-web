import { Controller, useForm } from "react-hook-form";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useUserStore } from '@_src/store/auth';
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { createSkill } from "@_src/services/skills";
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { toast } from "react-toastify"

export const Create = () => {
    const queryClient = useQueryClient()
    const { token } = useUserStore((state) => ({ user: state.user, token: state.token }));
    const decryptedToken = token && DecryptString(token)

    const { handleSubmit, control, reset, formState: { errors }} = useForm({
        defaultValues: {
            name: "",
        },
    });

    const { mutate: handleCreateSkill, isLoading: skillLoading } = useMutation({
        mutationFn: createSkill,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['skills'] });
            toast('new skill created!', { type: "success" })
            reset()
            }, 
        onError: (error) => {  
            console.log("@CSE:", error)
        },
    });

    const onSubmit = (data) => {
        handleCreateSkill({
            token: decryptedToken,
            name: data.name
        })
    };

    if(skillLoading) {
        return (
            <div className="skill-create-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] mt-[50px]">
                Creating skill please wait.....
            </div>
        )
    }


    return (
        <div className="create-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] mt-[50px]">
            <Card 
                title="Create Skill" 
                
                className="w-1/2"
            >
        
                <div className="form-container">
                    <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="bg-transparent flex flex-col gap-4"
                        >
                        <div className="name-field flex flex-col w-full">
                            <Controller
                                control={control}
                                rules={{
                                required: true,
                                pattern: /[\S\s]+[\S]+/,
                                }}
                                render={({ field: { onChange, value } }) => (
                                <input
                                    value={value}
                                    onChange={onChange}
                                    name="name"
                                    type="text"
                                    id="name"
                                    placeholder="Enter your skill name"
                                    className={`${errors.name && 'border border-red-500'} bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                                />
                                )}
                                name="name"
                            />
                            {errors.name && (
                                <p className="text-sm italic mt-1 text-red-400 indent-2">
                                    Skill name is required.*
                                </p>
                            )}
                        </div>
                        <div className="flex justify-center gap-4">
                            <Button 
                                type="submit"
                                className="bg-[#2211cc] text-[#c7c430] w-full text-center font-bold rounded-lg p-2"
                                label="Save" 
                            />
                        </div>
                    </form>
                </div>
            </Card>
        </div>
    )
}
