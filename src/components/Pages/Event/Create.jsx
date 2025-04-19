import { useContext } from "react";
import { EventContext } from "@_src/contexts/EventContext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { useUserStore } from '@_src/store/auth';
import { useForm, Controller } from "react-hook-form";
import { getModels } from "@_src/services/model";
import { getEventStatus, getEventTypes } from "@_src/services/event";
import { getUnsdgs } from "@_src/services/unsdgs";
import { getSkills } from "@_src/services/skills";
import { getOrganizations } from "@_src/services/organization";
import { InputText } from "primereact/inputtext";
import { MultiSelect } from 'primereact/multiselect';
import { Calendar } from 'primereact/calendar';
import { Button } from "primereact/button";
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import _ from "lodash";

export const Create = () => {
    const { createEvent, createEventLoading } = useContext(EventContext)
    const { user, token } = useUserStore((state) => ({ user: state.user, token: state.token }));
    const decryptedToken = token && DecryptString(token)
    const decryptedUser = token && DecryptUser(user)
    const { data: modelData, isLoading: modelLoading } = getModels()
    const { data: orgData, isLoading: orgLoading } = getOrganizations()
    const { data: typeData, isLoading: typeLoading } = getEventTypes()
    const { data: statusData, isLoading: statusLoading } = getEventStatus()
    const { data: unsdgData, isLoading: unsdgLoading } = getUnsdgs()
    const { data: skillData, isLoading: skillLoading } = getSkills()


    const setTermValue = () => {
        const currentDate = dayjs();
        const year = currentDate.year();
        dayjs.extend(isBetween);

        // Define the date ranges for each term
        const firstTermStart = dayjs(`${year}-08-01`);
        const firstTermEnd = dayjs(`${year}-10-31`);
        const secondTermStart = dayjs(`${year}-11-01`);
        const secondTermEnd = dayjs(`${year + 1}-02-28`); // Second term spans into the next year
        const thirdTermStart = dayjs(`${year}-03-01`);
        const thirdTermEnd = dayjs(`${year}-06-30`);

        // Check which term the current date falls into
        if (currentDate.isBetween(firstTermStart, firstTermEnd, null, '[]')) {
            return `${year} 1st term`;
        } else if (currentDate.isBetween(secondTermStart, secondTermEnd, null, '[]')) {
            return `${year} 2nd term`;
        } else if (currentDate.isBetween(thirdTermStart, thirdTermEnd, null, '[]')) {
            return `${year} 3rd term`;
        }
      
        return 'Out of range'; // If no term is matched (shouldn't happen)
    }

    const setFormatDate = (date) => {
        return dayjs(new Date(date)).format('MM-DD-YYYY')
    }

    const { handleSubmit, control, reset, formState: { errors }} = useForm({
            defaultValues: {
                term: setTermValue(),
                name: "",
                address: "",
                description: "",
                organization: "",
                model: "",
                event_type: "",
                event_status: "",
                unsdgs: [],
                skills: [],
                duration: []
            },
    });


    const onSubmit = (data) => {
        const { organization, model, event_type, event_status, name, address, term, duration, description, skills, unsdgs } = data
        const payload = {
            token: decryptedToken,
            user_id: decryptedUser?.id,
            organization_id: organization?.id,
            model_id: model?.id,
            event_type_id: event_type?.id,
            event_status_id: event_status?.id,
            name,
            address,
            term,
            start_date: setFormatDate(duration[0]),
            end_date: setFormatDate(duration[1]),
            description,
            skills: _.map(skills, 'id'),
            unsdgs: _.map(unsdgs, 'id')
        }

        createEvent(payload, {
            onSuccess: () => {
                reset();
            }
        })
    };

    


    if(modelLoading || orgLoading || typeLoading || statusLoading || unsdgLoading || skillLoading) {
        return (
            <div className="create-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] mt-[50px]">
                Initializing form....
            </div>
        )
    }

    if(createEventLoading) {
        return (
            <div className="create-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] mt-[50px]">
                Creating event please wait.....
            </div>
        )
    }

    return (
        <div className="create-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] mt-[50px]">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-transparent flex flex-col gap-4 w-1/2 my-8"
            >  
                <label className="text-base">
                    Create event:
                </label>
                <div className="term">
                    <Controller
                        control={control}
                        render={({ field: { value } }) => (
                        <InputText
                            disabled
                            value={value}
                            name="term"
                            type="text"
                            id="term"
                            placeholder="Enter event term"
                            className={`${errors.term && 'border border-red-500'} bg-blue-100 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                        />
                        )}
                        name="term"
                    />
                    {errors.term && (
                        <p className="text-sm italic mt-1 text-red-400 indent-2">
                            event term is required.*
                        </p>
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
                                className="w-full md:w-14rem capitalize border border-gray-400" 
                                value={value} 
                                onChange={onChange} 
                                options={orgData?.data} 
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
                <div className="models">
                    <Controller
                        control={control}
                        rules={{
                            required: true,
                        }}
                        render={({ field: { onChange, value } }) => (
                            <Dropdown
                                className="w-full md:w-14rem capitalize border border-gray-400" 
                                value={value} 
                                onChange={onChange} 
                                options={modelData?.data} 
                                optionLabel="name" 
                                placeholder="Select model" 
                                checkmark={true} 
                                highlightOnSelect={false} 
                            />
                        )}
                        name="model"
                    />
                    {errors.model && (
                        <p className="text-sm text-red-400 indent-2">Please select your model*</p>
                    )}
                </div>
                <div className="eventype">
                    <Controller
                        control={control}
                        rules={{
                            required: true,
                        }}
                        render={({ field: { onChange, value } }) => (
                            <Dropdown
                                className="w-full md:w-14rem capitalize border border-gray-400" 
                                value={value} 
                                onChange={onChange} 
                                options={typeData?.data} 
                                optionLabel="name" 
                                placeholder="Select Type" 
                                checkmark={true} 
                                highlightOnSelect={false} 
                            />
                        )}
                        name="event_type"
                    />
                    {errors.event_type && (
                        <p className="text-sm text-red-400 indent-2">Please select your event type*</p>
                    )}
                </div>
                <div className="eventstatus">
                    <Controller
                        control={control}
                        rules={{
                            required: true,
                        }}
                        render={({ field: { onChange, value } }) => (
                            <Dropdown
                                className="w-full md:w-14rem capitalize border border-gray-400" 
                                value={value} 
                                onChange={onChange} 
                                options={statusData?.data} 
                                optionLabel="name" 
                                placeholder="Select event status" 
                                checkmark={true} 
                                highlightOnSelect={false} 
                            />
                        )}
                        name="event_status"
                    />
                    {errors.event_status && (
                        <p className="text-sm text-red-400 indent-2">Please select your event status*</p>
                    )}
                </div>
                <div className="unsdgs">
                    <Controller
                        control={control}
                        rules={{
                            required: true,
                        }}
                        render={({ field: { onChange, value } }) => (
                            <MultiSelect 
                                value={value} 
                                onChange={onChange} 
                                options={unsdgData?.data}
                                optionLabel="name" 
                                display="chip" 
                                placeholder="Select unsdg type" 
                                maxSelectedLabels={3} 
                                className="w-full md:w-20rem border border-gray-500" 
                            />
                        )}
                        name="unsdgs"
                    />
                    {errors.unsdgs && (
                        <p className="text-sm text-red-400 indent-2">Please select unsdgs*</p>
                    )}
                </div>
                <div className="skills">
                    <Controller
                        control={control}
                        rules={{
                            required: true,
                        }}
                        render={({ field: { onChange, value } }) => (
                            <MultiSelect 
                                value={value} 
                                onChange={onChange} 
                                options={skillData?.data} 
                                optionLabel="name" 
                                display="chip" 
                                placeholder="Select skill needed for the event" 
                                maxSelectedLabels={3} 
                                className="w-full md:w-20rem border border-gray-500" 
                            />
                        )}
                        name="skills"
                    />
                    {errors.skills && (
                        <p className="text-sm text-red-400 indent-2">Please select skills needed for your event*</p>
                    )}
                </div>
                <div className="name">
                    <Controller
                        control={control}
                        rules={{
                        required: true,
                        pattern: /[\S\s]+[\S]+/,
                        }}
                        render={({ field: { onChange, value } }) => (
                        <InputText
                            value={value}
                            onChange={onChange}
                            name="name"
                            type="text"
                            id="name"
                            placeholder="Enter your event name"
                            className={`${errors.name && 'border border-red-500'} bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                        />
                        )}
                        name="name"
                    />
                    {errors.name && (
                        <p className="text-sm italic mt-1 text-red-400 indent-2">
                            event name is required.*
                        </p>
                    )}
                </div>
                <div className="location">
                    <Controller
                        control={control}
                        rules={{
                        required: true,
                        pattern: /[\S\s]+[\S]+/,
                        }}
                        render={({ field: { onChange, value } }) => (
                        <InputText
                            value={value}
                            onChange={onChange}
                            name="address"
                            type="text"
                            id="address"
                            placeholder="Enter your event location"
                            className={`${errors.address && 'border border-red-500'} bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                        />
                        )}
                        name="address"
                    />
                    {errors.address && (
                        <p className="text-sm italic mt-1 text-red-400 indent-2">
                            event location is required.*
                        </p>
                    )}
                </div>
                <div className="description">
                    <Controller
                        control={control}
                        rules={{
                        required: true,
                        }}
                        render={({ field: { onChange, value } }) => (
                            <InputTextarea
                                className={`${errors.description && 'border border-red-500'} bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                                name="description"
                                value={value} 
                                onChange={onChange}
                                rows={4}
                                placeholder="Enter your event description"
                            />
                        )}
                        name="description"
                    />
                    {errors.description && (
                        <p className="text-sm italic mt-1 text-red-400 indent-2">
                            description is required.*
                        </p>
                    )}
                </div>
                <div className="duration">
                    <Controller
                        control={control}
                        rules={{
                        required: true,
                        }}
                        render={({ field: { onChange, value } }) => (
                            <Calendar
                                className="w-1/2"
                                value={value} 
                                onChange={onChange} 
                                selectionMode="range" 
                                readOnlyInput 
                                hideOnRangeSelection 
                                placeholder="please select event dates"
                            />                    
                        )}
                        name="duration"
                    />
                    {errors.duration && (
                        <p className="text-sm italic mt-1 text-red-400 indent-2">
                            Please select duration dates for your event.*
                        </p>
                    )}
                </div>
                <div>
                    <Button
                        disabled={createEventLoading}
                        type="submit"
                        className="bg-[#2211cc] text-[#c7c430] flex justify-center font-bold rounded-full p-2 w-full"
                    >
                        submit
                    </Button>
                </div>
            </form>
        </div>
    )
}
