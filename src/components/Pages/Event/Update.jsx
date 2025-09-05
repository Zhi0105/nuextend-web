import { useEffect, useContext } from "react";
import { useLocation } from "react-router-dom"
import { useUserStore } from "@_src/store/auth";
import { EventContext } from "@_src/contexts/EventContext";
import { useForm, Controller } from "react-hook-form";
import { DecryptString, DecryptUser, SetTermValue } from "@_src/utils/helpers";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { MultiSelect } from 'primereact/multiselect';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { getModels } from "@_src/services/model";
import { getEventTypes } from "@_src/services/event";
import { getUnsdgs } from "@_src/services/unsdgs";
import { getSkills } from "@_src/services/skills";
import { getOrganizations } from "@_src/services/organization";
import dayjs from 'dayjs';
import _ from "lodash";

export const Update = () => {
    const location = useLocation();
    const event = location.state
    const { user, token } = useUserStore((state) => ({ user: state.user, token: state.token }));
    const decryptedToken = token && DecryptString(token)
    const decryptedUser = token && DecryptUser(user)
    const { updateEvent, updateEventLoading } = useContext(EventContext)
    const { data: modelData, isLoading: modelLoading } = getModels()
    const { data: orgData, isLoading: orgLoading } = getOrganizations()
    const { data: typeData, isLoading: typeLoading } = getEventTypes()
    const { data: unsdgData, isLoading: unsdgLoading } = getUnsdgs()
    const { data: skillData, isLoading: skillLoading } = getSkills()

    const { handleSubmit, control, reset, formState: { errors }} = useForm({
        defaultValues: {
            term:  "",
            target_group: "",
            name:  "",
            address:  "",
            description: "",
            budget_proposal: 0,
            organization: "",
            model: "",
            event_type: "",
            unsdgs: [],
            skills: [],
            duration: []
        },
    });

    useEffect(() => {
        if ( orgData && modelData && typeData && unsdgData && skillData && event) {
                const filteredUNSDG = unsdgData.data.filter((item) => event.unsdgs.some((evItem) => evItem.name === item.name))
                const filteredSkills = skillData.data.filter((item) => event.skills.some((evItem) => evItem.name === item.name))
            reset({
                term: SetTermValue() || "",
                target_group: event?.target_group ?? "",
                name: event?.activityName || "",
                address: event?.activity_address || "",
                description: event?.activity_description || "",
                budget_proposal: event?.budget_proposal || 0,
                organization: _.find(orgData.data, { id: event.organization_id }) || "",
                model:  _.find(modelData.data, { id: event.model_id }) || "",
                event_type: event?.event_type_id ?? "",
                unsdgs: [ ...filteredUNSDG ],
                skills: [ ...filteredSkills ],
                duration: [ new Date(event?.activity_start_date), new Date(event?.activity_end_date) ]
            });
        }
    }, [ orgData, modelData, typeData, event, unsdgData, skillData, reset ]);

    useEffect(() => {
        console.log(event)
    }, [event])

    const setFormatDate = (date) => {
        return dayjs(new Date(date)).format('MM-DD-YYYY')
    }
    const onSubmit = (data) => {
        const { organization, target_group, model, event_type, name, address, term, duration, description, budget_proposal, skills, unsdgs } = data
        const payload = {
            token: decryptedToken,
            user_id: decryptedUser?.id,
            id: event?.id,
            activity_id: event?.activity_id,
            organization_id: organization?.id,
            model_id: model?.id,
            event_type_id: event_type,
            target_group,
            name,
            address,
            term,
            start_date: setFormatDate(duration[0]),
            end_date: setFormatDate(duration[1]),
            description,
            budget_proposal,
            skills: _.map(skills, 'id'),
            unsdgs: _.map(unsdgs, 'id')
        }

        updateEvent(payload)
    };

    
    if(modelLoading || orgLoading || typeLoading || unsdgLoading || skillLoading) {
        return (
            <div className="create-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] mt-[50px]">
                Initializing form....
            </div>
        )
    }
    
    if(updateEventLoading) {
        return (
            <div className="edit-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] mt-[50px]">
                Updating event please wait.....
            </div>
        )
    }

    return (
        <div className="edit-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] mt-[50px]">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-transparent flex flex-col gap-4 w-1/2 my-8"
            >
                <label className="text-base">
                    Update event:
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
                            required: false,
                        }}
                        render={({ field: { onChange, value } }) => (
                            <Dropdown
                                disabled={decryptedUser?.role_id === 1}
                                className={`w-full md:w-14rem capitalize ${decryptedUser?.role_id === 1 && 'bg-blue-100'} border border-gray-400`} 
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
                                options={typeData} 
                                optionLabel="label" 
                                optionValue="value" 
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
                <div className="target_group">
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
                            name="target_group"
                            type="text"
                            id="target_group"
                            placeholder="Enter your target group name"
                            className={`${errors.target_group && 'border border-red-500'} bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                        />
                        )}
                        name="target_group"
                    />
                    {errors.target_group && (
                        <p className="text-sm italic mt-1 text-red-400 indent-2">
                            event target group name is required.*
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
                <div className="budget">
                    <Controller
                        control={control}
                        rules={{
                        required: true,
                        }}
                        render={({ field: { onChange, value } }) => (
                            <InputNumber
                                inputClassName={`${errors.budget_proposal && 'border border-red-500'} bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                                name="budget_proposal"
                                value={value} 
                                onValueChange={onChange}
                                rows={4}
                                placeholder="Enter your budget proposal"
                            />
                        )}
                        name="budget_proposal"
                    />
                    {errors.budget_proposal && (
                        <p className="text-sm italic mt-1 text-red-400 indent-2">
                            budget is required.*
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
                        // disabled={createEventLoading}
                        type="submit"
                        className="bg-[#2211cc] text-[#c7c430] flex justify-center font-bold rounded-full p-2 w-full"
                    >
                        Update
                    </Button>
                </div>
            </form>
        </div>
    )
}
