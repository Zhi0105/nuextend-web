import { useContext, useRef, useEffect, useCallback } from "react";
import { EventContext } from "@_src/contexts/EventContext";
import { Dropdown } from "primereact/dropdown";
import { useUserStore } from '@_src/store/auth';
import { useForm, Controller, useFieldArray  } from "react-hook-form";
import { getModels } from "@_src/services/model";
import { getEventTypes } from "@_src/services/event";
import { getUnsdgs } from "@_src/services/unsdgs";
import { getSkills } from "@_src/services/skills";
import { InputText } from "primereact/inputtext";
import { MultiSelect } from 'primereact/multiselect';
import { Button } from "primereact/button";
import { Stepper } from 'primereact/stepper';
import { StepperPanel } from 'primereact/stepperpanel';
import { InputNumber } from "primereact/inputnumber";
import { DecryptString, DecryptUser, SetTermValue } from "@_src/utils/helpers";
import { Activity } from "@_src/components/Partial/Activity";
import dayjs from 'dayjs';
import _ from "lodash";


export const Create = () => {
    const stepperRef = useRef(null);
    const { createEvent, createEventLoading } = useContext(EventContext)
    const { user, token } = useUserStore((state) => ({ user: state.user, token: state.token }));
    const decryptedToken = token && DecryptString(token)
    const decryptedUser = token && DecryptUser(user)
    const { data: modelData, isLoading: modelLoading } = getModels()
    const { data: typeData, isLoading: typeLoading } = getEventTypes()
    const { data: unsdgData, isLoading: unsdgLoading } = getUnsdgs()
    const { data: skillData, isLoading: skillLoading } = getSkills()

    const setFormatDate = (date) => {
        return dayjs(new Date(date)).format('MM-DD-YYYY')
    }

    const { handleSubmit, control, trigger, watch, setValue, getValues, reset, formState: { errors }} = useForm({
        defaultValues: {
            term: SetTermValue() || "",
            target_group: "",
            budget_proposal: 0,
            organization: "",
            name: "",
            model: "",
            event_type: null,
            unsdgs: [],
            skills: [],
            activities: []
        },
    });
    const { fields, append, remove } = useFieldArray({ control, name: "activities" });

    const activitiesValues = watch("activities") || [];
    const modelId = watch("model.id");

    const handleAddActivity = useCallback(() => {
        append({ name: "", address: "" , description: "", duration: null  })
    }, [append])
    const handleRemoveActivity = useCallback((index) => {
        remove(index);
    }, [remove]);
    const handleActivityChange = (index, key, value) => {
        setValue(`activities.${index}.${key}`, value, {
            shouldDirty: true,
            shouldValidate: true,
        });
    };

    const onSubmit = (data) => {
        const { target_group, organization, model, event_type, name, term, activities, budget_proposal, skills, unsdgs } = data
        const updatedActivities = _.map(activities, (activity) => ({
            name: activity.name,
            description: activity.description,
            address: activity.address,
            start_date: setFormatDate(activity.duration[0]),
            end_date: setFormatDate(activity.duration[1])
        }));

        const payload = {
            token: decryptedToken,
            user_id: decryptedUser?.id,
            organization_id: organization?.id,
            model_id: model?.id,
            event_type_id: event_type,   
            event_status_id: decryptedUser?.role_id === 1 ? 2 : 1,
            target_group,
            name,
            term,
            budget_proposal,
            skills: _.map(skills, 'id'),
            unsdgs: _.map(unsdgs, 'id'),
            activities: [...updatedActivities],
        }
        createEvent(payload, {
            onSuccess: (data) => {
                if(data?.data.model_id !== 3) {
                    reset()
                } else {

                    reset({
                        organization: getValues("organization"),
                        model:getValues("model"),
                        event_type: "",
                        term: getValues("term"),
                        target_group: "",
                        name: "",
                        budget_proposal: 0,
                        skills: [],
                        unsdgs: [],
                        activities: []
                    })
                }
            }
        })
    };

    const setOrganizationList = (organizations) => {
        return _.filter(organizations, (org) => [6, 7].includes(org.pivot.role_id))
    }
    
    useEffect(() => {
        if (decryptedUser?.role_id === 1) {
            reset({
                term: SetTermValue(),
                organization: _.find(decryptedUser.organizations, (org) => org.name.toLowerCase() === 'comex') || "",
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (modelId && modelId !== 3) {
            // clear all activities first
            remove(); 
            // then append 1 empty activity
            handleAddActivity();
        }
    }, [modelId, handleAddActivity, remove]);


    if(modelLoading || typeLoading || unsdgLoading || skillLoading) {
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
                <Stepper ref={stepperRef} linear>
                    <StepperPanel>
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
                        <div className="flex pt-4 justify-end px-4">
                            <Button 
                                className="bg-[#2211cc] text-[#c7c430] px-4 py-2" 
                                label="Next" 
                                iconPos="right" 
                                onClick={() => {
                                    trigger('model').then((valid) => {
                                        if (valid) stepperRef.current.nextCallback();
                                    });
                                }}
                            />
                        </div>
                    </StepperPanel>
                    <StepperPanel>
                        <div className="flex flex-col gap-4">
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
                                            disabled={decryptedUser?.role_id === 1}
                                            className={`w-full md:w-14rem capitalize ${decryptedUser?.role_id === 1 && 'bg-blue-100'} border border-gray-400`} 
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
                                            placeholder="UNSDG" 
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
                            <div className="flex pt-4 justify-between px-4">
                                <Button 
                                    className="bg-[#2211cc] text-[#c7c430] px-4 py-2" 
                                    label="Back" 
                                    severity="secondary" 
                                    onClick={() => stepperRef.current.prevCallback()} 
                                />
                                <Button 
                                    className="bg-[#2211cc] text-[#c7c430] px-4 py-2" 
                                    label="Next" 
                                    iconPos="right" 
                                    onClick={() => {
                                        trigger().then((valid) => {
                                            if (valid) stepperRef.current.nextCallback();
                                        });
                                    }}
                                />
                            </div>
                        </div>
                    </StepperPanel> 
                    <StepperPanel>
                        <div>
                            <div className="w-full capitalize flex flex-col gap-2">
                                <Activity 
                                    modelId={modelId}
                                    activities={activitiesValues}
                                    activityKeys={fields.map(f => f.id)}
                                    onRemove={handleRemoveActivity}
                                    onChange={handleActivityChange}
                                />
                                {modelId === 3 && (
                                    <span
                                        className="text-[25px] text-[#5b9bd1] cursor-pointer"
                                        onClick={handleAddActivity}
                                    >
                                    +
                                    </span>
                                )}
                            </div>
                            <div className="flex pt-4 justify-between">
                                <Button 
                                    className="bg-[#2211cc] text-[#c7c430] px-4 py-2" 
                                    label="Back" 
                                    severity="secondary" 
                                    onClick={() => stepperRef.current.prevCallback()} 
                                />
                                <Button
                                    disabled={createEventLoading}
                                    type="submit" 
                                    className="bg-[#2211cc] text-[#c7c430] px-4 py-2" 
                                    label="Submit" 
                                    iconPos="right" 
                                />
                            </div>
                        </div>
                    </StepperPanel>
                </Stepper>
            </form>
        </div>
    )
}
