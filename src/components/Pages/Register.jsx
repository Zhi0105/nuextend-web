import React, { useCallback, useEffect, useRef, useState, useContext } from "react";
import { AuthContext } from "@_src/contexts/AuthContext";
import { useForm, Controller } from "react-hook-form";
import { Stepper } from 'primereact/stepper';
import { StepperPanel } from 'primereact/stepperpanel';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { getRoles } from "@_src/services/role";
import { getDepartments } from "@_src/services/department";
import { getPrograms } from "@_src/services/program";
import { Link } from "react-router-dom";
import _ from "lodash";

export const Register = () => {
    const stepperRef = useRef(null);
    const { register, registerLoading } = useContext(AuthContext)
    const { data: roleData, isLoading: roleLoading } = getRoles()
    const { data: departmentData } = getDepartments()
    const { data: programData } = getPrograms()
    const [ roles, setRoles ] = useState([])


    const { handleSubmit, control, trigger, getValues, watch, formState: { errors }} = useForm({
            defaultValues: {
                role: "",
                schoolID: "",
                firstname: "",
                middlename: "",
                lastname: "",
                contact: "",
                department: "",
                program: "",
                email: "",
                password:""
            },
    });

    const onSubmit = (data) => {
        register(data)
    };


    useEffect(() => {
        if(!roleLoading) {
            console.log(roleData)
            const includeItems = [4, 3, 5, 2]
            const filteredRoles = _.filter(roleData?.data, role => includeItems.includes(role.id))
            const sortedRoles = _.sortBy(filteredRoles, role => includeItems.indexOf(role.id));
            
            // Capitalize role name
            const capitalizedRoles = sortedRoles.map(role => ({
                ...role,
                name: role.name.charAt(0).toUpperCase() + role.name.slice(1).toLowerCase()
            }));
            setRoles(capitalizedRoles)
        }
    }, [roleData, roleLoading])

    const programCallback = useCallback((department) => {
        const filteredProgramList = _.filter(programData?.data, program => program.department_id === department.id)
        return [ ...filteredProgramList ]

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watch('department')])

    const roleCallback = useCallback((role_id) => {
        if(role_id === 2 || role_id === 5) {
            return false
        }
        return true
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watch('role')])

    const schoolIDCallback = useCallback((role_id) => {
        if(role_id === 2) {
            return false
        }
        return true
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watch('role')])
    
    const handleEmailLabelValidation = (role) => {
        if(role === 3 || role === 4) {
            return "NU email" 
        }
        return "Email"
    }
    const handleEmailPlaceHolderValidation = (role) => {
        if(role === 3 || role === 4) {
            return "Enter your NU email or email" 
        }
        return "Enter your email"
    }

    if(registerLoading) {
        return (
            <div className="register-main min-h-screen flex justify-center items-center">
                Registration processing... Please wait....
            </div>
        )
    }

    return (
        <div className="register-main min-h-screen flex justify-center">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-transparent w-3/4 my-4"
            >
                <Stepper ref={stepperRef} linear>
                    <StepperPanel>
                        <div className="bg-transparent flex flex-col justify-center">
                            <Controller
                                control={control}
                                rules={{
                                    required: true,
                                }}
                                render={({ field: { onChange, value } }) => (
                                    <Dropdown
                                        className="w-full md:w-14rem capitalize border shadow-lg" 
                                        value={value} 
                                        onChange={onChange} 
                                        options={roles} 
                                        optionLabel="name" 
                                        placeholder="User type" 
                                        checkmark={true} 
                                        highlightOnSelect={false} 
                                    />
                                )}
                                name="role"
                            />
                            {errors.role && (
                                <p className="text-sm text-red-400 indent-2">Please select your user type*</p>
                            )}
                        
                        </div>
                        <div className="flex pt-4 justify-between px-4">
                            <Link
                                to={"/"}
                                className="bg-[#2211cc] text-[#c7c430] px-4 py-2 rounded-md" 
                            >
                                Back
                            </Link>
                            <Button
                                className="bg-[#2211cc] text-[#c7c430] px-4 py-2" 
                                label="Next" 
                                iconPos="right"
                                onClick={() => {
                                    trigger('role').then((valid) => {
                                        if (valid) stepperRef.current.nextCallback();
                                    });
                                }}
                            />
                        </div>
                    </StepperPanel>
                    <StepperPanel>
                        <div className="bg-transparent flex flex-col gap-6 justify-center items-center">
                            {schoolIDCallback(watch('role.id')) && (
                                <div className="schoolid-field flex flex-col w-1/2">
                                <label>School ID</label>
                                <Controller
                                    control={control}
                                    rules={{
                                    required: true,
                                    // pattern: /^\d{4}-\d{6}$/,
                                    pattern: /^\d{4}-\d+$/

                                    }}
                                    render={({ field: { onChange, value } }) => (
                                    <input
                                        value={value}
                                        onChange={onChange}
                                        name="schoolID"
                                        type="text"
                                        id="schoolID"
                                        placeholder="Enter your School ID"
                                        className={`${errors.schoolID && 'border border-red-500'} bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                                    />
                                    )}
                                    name="schoolID"
                                />
                                {errors.schoolID && (
                                    <p className="text-sm italic mt-1 text-red-400 indent-2">
                                        School ID is invalid.*
                                    </p>
                                )}
                            </div>
                            )}
                            <div className="firstname-field flex flex-col w-1/2">
                                <label>First name</label>
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
                                        name="firstname"
                                        type="text"
                                        id="firstmame"
                                        placeholder="Enter your first name"
                                        className={`${errors.firstname && 'border border-red-500'} bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                                    />
                                    )}
                                    name="firstname"
                                />
                                {errors.firstname && (
                                    <p className="text-sm italic mt-1 text-red-400 indent-2">
                                        First name is required.*
                                    </p>
                                )}
                            </div>
                            <div className="middlename-field flex flex-col w-1/2">
                                <label>Middle name</label>
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
                                        name="middlename"
                                        type="text"
                                        id="middlename"
                                        placeholder="Enter your middle name"
                                        className={`${errors.middlename && 'border border-red-500'} bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                                    />
                                    )}
                                    name="middlename"
                                />
                                {errors.middlename && (
                                    <p className="text-sm italic mt-1 text-red-400 indent-2">
                                        Middle name is required.*
                                    </p>
                                )}
                            </div>
                            <div className="lastname-field flex flex-col w-1/2">
                                <label>Last name</label>
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
                                        name="lastname"
                                        type="text"
                                        id="lastname"
                                        placeholder="Enter your last name"
                                        className={`${errors.lastname && 'border border-red-500'} bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                                    />
                                    )}
                                    name="lastname"
                                />
                                {errors.lastname && (
                                    <p className="text-sm italic mt-1 text-red-400 indent-2">
                                        Last name is required.*
                                    </p>
                                )}
                            </div>
                            <div className="contact-field flex flex-col w-1/2">
                                <label>Phone number</label>
                                <Controller
                                    control={control}
                                    rules={{
                                    required: true,
                                    pattern: /^0\d{10}$/,
                                    }}
                                    render={({ field: { onChange, value } }) => (
                                    <input
                                        value={value}
                                        onChange={onChange}
                                        name="contact"
                                        type="text"
                                        id="contact"
                                        placeholder="Enter your phone number"
                                        className={`${errors.contact && 'border border-red-500'} bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                                    />
                                    )}
                                    name="contact"
                                />
                                {errors.contact && (
                                    <p className="text-sm italic mt-1 text-red-400 indent-2">
                                        Contact is invalid.*
                                    </p>
                                )}
                            </div>
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
                    </StepperPanel>
                    {roleCallback(watch("role.id")) && (
                        <StepperPanel>
                            <div className="bg-transparent flex flex-col gap-6 justify-center items-center">
                                <div className="department-field flex flex-col w-1/2">
                                    <label>Department</label>
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
                                                options={departmentData.data} 
                                                optionLabel="name" 
                                                placeholder="Select department" 
                                                checkmark={true} 
                                                highlightOnSelect={false} 
                                            />
                                        )}
                                        name="department"
                                    />
                                    {errors.department && (
                                        <p className="text-sm text-red-400 indent-2">Please select your department*</p>
                                    )}
                                </div>
                                <div className="program-field flex flex-col w-1/2">
                                    <label>Program</label>
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
                                                options={programCallback(getValues('department'))} 
                                                optionLabel="name" 
                                                placeholder="Select program" 
                                                checkmark={true} 
                                                highlightOnSelect={false} 
                                            />
                                        )}
                                        name="program"
                                    />
                                    {errors.program && (
                                        <p className="text-sm text-red-400 indent-2">Please select your program*</p>
                                    )}
                                </div>
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
                        </StepperPanel>
                    )}
                    <StepperPanel>
                        <div className="bg-transparent flex flex-col gap-6 justify-center items-center">
                            <div className="email-field flex flex-col w-1/2">
                                    <label>{handleEmailLabelValidation(getValues("role.id"))}</label>
                                    <Controller
                                        control={control}
                                        rules={{
                                        required: true,
                                            ...(getValues("role.id") === 2 && {
                                                pattern: {
                                                    value: /^\S+@\S+\.\S+$/,
                                                },
                                            }),
                                            ...(getValues("role.id") === 3 && {
                                                pattern: {
                                                    value: /^[a-zA-Z0-9._%+-]+@students\.nu-baliwag\.edu\.ph$/,
                                                },
                                            }),
                                            ...(getValues("role.id") === 4 && {
                                                pattern: {
                                                    value: /^[a-zA-Z0-9._%+-]+@nu-baliwag\.edu\.ph$/,
                                                },
                                            }),
                                            ...(getValues("role.id") === 5 && {
                                                pattern: {
                                                    value: /^\S+@\S+\.\S+$/,
                                                },
                                            })
                                        }}
                                        render={({ field: { onChange, value } }) => (
                                        <input
                                            value={value}
                                            onChange={onChange}
                                            type="email"
                                            name="email"
                                            id="email"
                                            placeholder={handleEmailPlaceHolderValidation(getValues("role.id"))}
                                            className={`${errors.email && 'border border-red-500'} bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                                        />
                                        )}
                                        name="email"
                                    />
                                    {errors.email && (
                                        <p className="text-sm italic mt-1 text-red-400 indent-2">
                                            Email is not valid.*
                                        </p>
                                    )}
                            </div>
                            <div className="password-field flex flex-col w-1/2">
                                    <label>Password</label>
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
                                            type="password"
                                            name="password"
                                            id="password"
                                            placeholder="Enter your password"
                                            autoComplete="true"
                                            className={`${errors.password && 'border border-red-500'} bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                                        />
                                        )}
                                        name="password"
                                    />
                                    {errors.password && (
                                        <p className="text-sm italic mt-1 text-red-400 indent-2">
                                            Password is required.*
                                        </p>
                                    )}
                            </div>
                        </div>
                        <div className="flex pt-4 justify-between">
                            <Button 
                                className="bg-[#2211cc] text-[#c7c430] px-4 py-2" 
                                label="Back" 
                                severity="secondary" 
                                onClick={() => stepperRef.current.prevCallback()} 
                            />
                            <Button
                                disabled={registerLoading}
                                type="submit" 
                                className="bg-[#2211cc] text-[#c7c430] px-4 py-2" 
                                label="Register" 
                                iconPos="right" 
                            />
                        </div>
                    </StepperPanel>
                </Stepper>
            </form>

        </div>
    )
}
