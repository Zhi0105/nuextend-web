import { useState } from "react";
import { useGetForm, attachForm } from "@_src/services/form"
import { useUserStore } from '@_src/store/auth';
import { DecryptString } from "@_src/utils/helpers";
import { Dropdown } from "primereact/dropdown";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import _ from "lodash";
import { toast } from "react-toastify";

export const AttachForm = () => {
    const queryClient = useQueryClient()
    const location = useLocation()
    const event = location.state
    const { token } = useUserStore((state) => ({ token: state.token }));
    const decryptedToken = token && DecryptString(token)
    const { data: formData, isLoading: formLoading } = useGetForm(decryptedToken);
    const [selectedForm, setSelectedForm] = useState(null);

    const { mutate: handleAttachForm, isLoading: attachFormLoading } = useMutation({
        mutationFn: attachForm,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['attach-form'] });
            toast(data.message, { type: "success" })
            }, 
        onError: (error) => {
            toast(error?.response.data.message, { type: "warning" })

            console.log("@RFE:", error)
        },
    });

    if(formLoading || attachFormLoading) {
        return (
            <div className="attach-form-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] pt-[5rem]">
                Loading.....
            </div>
        )
    }

    if(!formLoading || !attachFormLoading) {
        const filteredForms = _.filter(formData?.data, (form) =>
            form?.events?.some(
                (e) =>
                    e?.program_model_name?.toLowerCase() ===
                    event?.program_model_name?.toLowerCase()
            )
        );
        return (
            <div className="attach-form-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] pt-[5rem]">
                <div className="w-1/2 flex flex-col gap-8">
                    <Dropdown 
                        value={selectedForm} 
                        onChange={(e) => setSelectedForm(e.value)} 
                        options={filteredForms} 
                        optionLabel="name" 
                        placeholder="Select a form" 
                        className="w-full md:w-14rem capitalize border border-gray-400" 
                    />
                    <button
                        disabled={attachFormLoading}
                        onClick={() =>
                            handleAttachForm({ 
                                token:decryptedToken, 
                                event_id: event?.id, 
                                form_id: selectedForm?.id 
                            })
                        }
                        className="w-full bg-[#2211cc] text-[#c7c430] font-bold px-4 py-2 rounded-lg" 
                    >
                        attach form
                    </button>
                </div>
            </div>
        )
    }
}
