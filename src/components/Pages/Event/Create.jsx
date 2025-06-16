import { useContext, useRef, useEffect, useCallback, useState } from "react";
import { EventContext } from "@_src/contexts/EventContext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { useUserStore } from '@_src/store/auth';
import { useForm, Controller } from "react-hook-form";
import { getModels } from "@_src/services/model";
import { getEventTypes } from "@_src/services/event";
import { getUnsdgs } from "@_src/services/unsdgs";
import { getSkills } from "@_src/services/skills";
import { InputText } from "primereact/inputtext";
import { MultiSelect } from 'primereact/multiselect';
import { Calendar } from 'primereact/calendar';
import { Button } from "primereact/button";
import { Stepper } from 'primereact/stepper';
import { StepperPanel } from 'primereact/stepperpanel';
import { DecryptString, DecryptUser, SetTermValue } from "@_src/utils/helpers";
import { getTargetGroups } from "@_src/services/targetgroup";
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
    const { data: targetgroupData, isLoading: targetgroupLoading, refetch: targetGroupreFetch } = getTargetGroups()
    const [filteredTargetGroups, setFilteredTargetGroups] = useState([]);

    const setFormatDate = (date) => {
        return dayjs(new Date(date)).format('MM-DD-YYYY')
    }

    const { handleSubmit, control, trigger, watch, getValues, reset, formState: { errors }} = useForm({
            defaultValues: {
                program_model_name: "",
                term: SetTermValue() || "",
                target_group_name: "",
                name: "",
                address: "",
                description: "",
                organization: "",
                model: "",
                event_type: "",
                target_group: "",
                unsdgs: [],
                skills: [],
                duration: []
            },
    });
    const selectedTargetGroup = useRef([]);
    const watchedProgramName = watch("program_model_name");
    const onSubmit = (data) => {
        const { program_model_name, target_group_name, target_group, organization, model, event_type, name, address, term, duration, description, skills, unsdgs } = data
        const payload = {
            token: decryptedToken,
            user_id: decryptedUser?.id,
            target_group_id: target_group?.id,
            organization_id: organization?.id,
            model_id: model?.id,
            event_type_id: event_type?.id,
            event_status_id: decryptedUser?.role_id === 1 ? 2 : 1,
            program_model_name,
            target_group_name,
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
            onSuccess: (data) => {
                if(data?.data.model_id !== 3) {
                    reset()
                } else {
                    selectedTargetGroup.current.push(data?.data.target_group_id);

                    const updatedTargetGroups = _.filter(targetgroupData.data, (target) => 
                        !selectedTargetGroup.current.includes(target.id)
                    );

                    setFilteredTargetGroups(updatedTargetGroups);
                    reset({
                        term: getValues("term"),
                        model:getValues("model"),
                        program_model_name: getValues("program_model_name"),
                        target_group: "",
                        organization: getValues("organization"),
                        event_type: "",
                        name: "",
                        address: "",
                        duration: [],
                        description: "",
                        skills: [],
                        unsdgs: [],
                    })
                }
            }
        })
    };


    const modelCallback = useCallback((model) => {
        if(model !== 3) {
            return false
        }
        return true
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watch('model')])

    
    const targetgroupCallback = useCallback((model) => {
        if(model !== 1) {
            return false
        }
        return true
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watch('model')])

    const targetgroupIDCallback = useCallback((model) => {
        if(model === 1) {
            targetGroupreFetch()
            return false
        }
        return true
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watch('model')])

    const setOrganizationList = (organizations) => {
        return _.filter(organizations, (org) => [6, 7].includes(org.pivot.role_id))
    }
;
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
        const subscription = watch((value, { name }) => {
            if (name === "organization") {
                const selectedOrgId = value?.organization?.id || value?.organization_id || value?.organization?.value?.id;
                if (selectedOrgId && targetgroupData?.data) {
                    const filtered = _.filter(targetgroupData.data, item => item.organization_id === selectedOrgId);
                    setFilteredTargetGroups(filtered);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [watch, targetgroupData]);

    useEffect(() => {
        // Reset excluded target group IDs and re-include all
        selectedTargetGroup.current = [];

        if (targetgroupData?.data) {
            const filteredTargetGroup = _.filter(targetgroupData?.data, (item) => item.organization_id === watch("organization.id"))
            setFilteredTargetGroups([...filteredTargetGroup]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watchedProgramName, watch("organization.id")]);

    if(modelLoading || typeLoading || unsdgLoading || skillLoading || targetgroupLoading) {
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
                    {modelCallback(watch("model.id")) && (
                        <StepperPanel>
                            <div className="program_model_name">
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
                                        name="program_model_name"
                                        type="text"
                                        id="program_model_name"
                                        placeholder="Enter your program model name"
                                        className={`${errors.program_model_name && 'border border-red-500'} bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                                    />
                                    )}
                                    name="program_model_name"
                                />
                                {errors.program_model_name && (
                                    <p className="text-sm italic mt-1 text-red-400 indent-2">
                                        program model name is required.*
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
                                        trigger('program_model_name').then((valid) => {
                                            if (valid) stepperRef.current.nextCallback();
                                        });
                                    }}
                                />
                            </div>
                        </StepperPanel>
                    )}
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
                            {targetgroupIDCallback(watch("model.id")) && (
                                <div className="targetgroup">
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
                                                options={filteredTargetGroups} 
                                                optionLabel="name" 
                                                placeholder="Select target group" 
                                                checkmark={true} 
                                                highlightOnSelect={false} 
                                            />
                                        )}
                                        name="target_group"
                                    />
                                    {errors.target_group && (
                                        <p className="text-sm text-red-400 indent-2">Please select target group*</p>
                                    )}
                                </div>
                            )}
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
                            {targetgroupCallback(watch("model.id")) && (
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
                                            className={`${errors.target_group_name && 'border border-red-500'} bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                                        />
                                        )}
                                        name="target_group_name"
                                    />
                                    {errors.target_group_name && (
                                        <p className="text-sm italic mt-1 text-red-400 indent-2">
                                            event target group name is required.*
                                        </p>
                                    )}
                                </div>
                            )}
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
