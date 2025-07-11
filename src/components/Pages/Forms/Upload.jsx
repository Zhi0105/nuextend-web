import { useEffect } from "react";
import { useUserStore } from '@_src/store/auth'
import { useLocation, useNavigate } from "react-router-dom"
import { Controller, useForm } from "react-hook-form";
import { Dropdown } from "primereact/dropdown";
import { CodeList, DecryptString, ProgramProcess, ProjectProcess } from "@_src/utils/helpers";
import { FileUpload } from "primereact/fileupload";
import { Button } from "primereact/button";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify"
import { uploadForm } from "@_src/services/event";
import { OutreachProcess } from "@_src/utils/helpers";
import _ from "lodash";
import { NoteProcess } from "@_src/utils/NoteProcess";

export const Upload = () => {``
    const location = useLocation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { event, forms } = location.state || {} 
    const { token } = useUserStore((state) => ({  token: state.token }));
    const decryptedToken = token && DecryptString(token)


    const { handleSubmit, control, setValue, watch, formState: { errors }} = useForm({
        defaultValues: {
            name: "",
            code: "",
            file: null
        },
    });
    const { mutate: handleUploadForm, isLoading: uploadLoading } = useMutation({
            mutationFn: uploadForm,
            onSuccess: (data) => {
                queryClient.invalidateQueries({ queryKey: ['upload'] });
                toast(data.message, { type: "success" })
                navigate('/event/view')
                }, 
            onError: (error) => {  
                console.log("@UE:", error)
                toast(error.response.data.message, { type: "warning" })
            },
    });

    const setFormNameList = () => {
        const ExtractedFormCode = _.map(forms, item => parseInt(item.code.split('-').pop(), 10));
        const nameList = [ 
            { id: 1, name: "Program Proposal Format" },
            { id: 2,name: "Project Proposal Format" },
            { id: 3, name: "Outreach Project Proposal Format" },
            { id: 4, name: "Checklist of Criteria for Extension Program Proposal" },
            { id: 5, name: "Checklist of Criteria for Project Proposal" },
            { id: 6, name: "Manifestation of Consent and Cooperation for the Extension Program" },
            { id: 7, name: "Manifestation of Consent and Cooperation for the Outreach Project" },
            { id: 8, name: "Target Group Needs Diagnosis Report Format" },
            { id: 9, name: "Extension Program Evaluation and Terminal Report Format" },
            { id: 10, name: "Outreach Project Evaluation and Documentation Report Format" },
            { id: 11, name: "Extension Program and Project Itinerary of Travel Format" },
            { id: 12, name: "Minutes of the Meeting Format.pdf" },
            { id: 13, name: "List of Attendees, Volunteers, and Donors Format" },
            { id: 14, name: "Post-Activity Report Format" },
            { id: 15, name: "Self-Learning Assessment Formatt" },
        ]

        const modelFormSequences = {
            1: { first: [3, 5, 7, 8, 11, 12], second: [13, 14], third: [10] }, // Outreach
            2: { first: [2, 5, 7, 8, 11, 12], second: [13, 14], third: [10] }, // Project
            3: { first: [1, 4, 6, 8, 11, 12], second: [13, 14], third: [9] },  // Program
        };

        const getFilteredSequence = (ids) =>
            _.filter(nameList, name => ids.includes(name.id) && !ExtractedFormCode.includes(name.id));

        if (modelFormSequences[event.model_id]) {
            const { first, second, third } = modelFormSequences[event.model_id];

            const firstList = getFilteredSequence(first);
            if (firstList.length > 0) return firstList;

            const secondList = getFilteredSequence(second);
            if (secondList.length > 0) return secondList;

            return getFilteredSequence(third);
        }

        return nameList;
    }

    const onSubmit = (data) => {
        handleUploadForm({
            token: decryptedToken,
            event_id: event.id,
            name: data.name.name,
            code: data.code,
            file: data.file
        })
    };

    const Note = () => {
        const formInstructions = {
        1: OutreachProcess,
        2: ProjectProcess,
        3: ProgramProcess
        };

        return (
            <div className="note-main flex flex-col text-sm gap-2 w-full bg-[#d2eef7] py-2 px-12">
                <div className="w-full flex flex-col gap-2 pt-4">
                <h1 className="uppercase text-sm text-[#115770]">Instruction:</h1>
                    {(event?.model_id || model?.model_id) && (
                        <NoteProcess 
                            processSteps={formInstructions[event?.model_id || model?.model_id]}
                        />
                    )}
                </div>
            </div>
        )
    }

    useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (name === 'name' && value.name) {
                const filteredCode = _.find(CodeList, {id: value.name.id})
                setValue('code', filteredCode.name);

            }
        });
    return () => subscription.unsubscribe();
    }, [watch, setValue]);

    if(uploadLoading) {
        return (
            <div className="formlist-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
                Uploading... Please wait....
            </div>
        )
    }

    return (
        <div className="formlist-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
            <div className="w-full py-8">
                <Note />
            </div>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="w-[40%] bg-transparent flex flex-col gap-4"
            >
                <div className="code-field flex flex-col w-full">
                    <Controller
                        control={control}
                        rules={{
                        required: true,
                        pattern: /[\S\s]+[\S]+/,
                        }}
                        render={({ field }) => (
                        <input
                            {...field}  
                            disabled
                            name="code"
                            type="text"
                            id="code"
                            placeholder="Form code"
                            className={`bg-blue-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                        />
                        )}
                        name="code"
                    />
                    {errors.code && (
                        <p className="text-sm italic mt-1 text-red-400 indent-2">
                            Form code is required.*
                        </p>
                    )}
                </div>
                <div className="name-field flex flex-col w-full">
                    <Controller
                        control={control}
                        rules={{
                        required: true,
                        pattern: /[\S\s]+[\S]+/,
                        }}
                        render={({ field: { onChange, value } }) => (
                            <Dropdown
                                className={`w-full md:w-14rem capitalize border border-gray-400`} 
                                value={value} 
                                onChange={onChange} 
                                options={setFormNameList()} 
                                optionLabel="name" 
                                placeholder="form name" 
                                checkmark={true} 
                                highlightOnSelect={false} 
                            />
                        )}
                        name="name"
                    />
                    {errors.name && (
                        <p className="text-sm italic mt-1 text-red-400 indent-2">
                            Form name is required.*
                        </p>
                    )}
                </div>
                <div className="file-field fle flex-col w-full">
                    <Controller
                            name="file"
                            control={control}
                            render={({ field: { onChange } }) => (
                            <FileUpload
                                mode="advanced"
                                name="file"
                                auto
                                customUpload
                                uploadHandler={(e) => {
                                const file = e.files[0]; // or e.files if multiple
                                onChange(file);
                                }}
                                chooseLabel="Upload File"
                                emptyTemplate={<p className="m-0">Drag and drop files to here to upload.</p>}
                            />
                            )}
                        />
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
    )
}
