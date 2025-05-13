import { useContext } from "react";
import { AuthContext } from "@_src/contexts/AuthContext";
import { Button } from "primereact/button";
import { useForm, Controller } from "react-hook-form";


export const Dean = () => {
    const { deanRegister, deanLoading } = useContext(AuthContext)
    const { handleSubmit, control, reset, formState: { errors }} = useForm({
        defaultValues: {
            role: { id: 9 },
            firstname: "",
            middlename: "",
            lastname: "",
            email: "",
            password:"",
            contact: ""
        },
    });
    
    const onSubmit = (data) => {
        deanRegister(data)
        reset()
    };


    if(deanLoading) {
        return (
            <div className="dean-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] py-20">
                Registration processing... Please wait....
            </div>
        )
    }

    return (
        <div className="dean-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] py-20">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-transparent w-3/4 my-4 flex flex-col items-center"
            >
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
                <div className="email-field flex flex-col w-1/2">
                    <label>Nu-email</label>
                    <Controller
                        control={control}
                        rules={{
                        required: true,
                            pattern: {
                                value: /^[a-zA-Z0-9._%+-]+@nu-baliwag\.edu\.ph$/,
                            },
                        }}
                        render={({ field: { onChange, value } }) => (
                        <input
                            value={value}
                            onChange={onChange}
                            type="email"
                            name="email"
                            id="email"
                            placeholder={"Nu-email"}
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
                <div className="flex pt-4 w-1/2">
                    <Button
                        disabled={deanLoading}
                        type="submit" 
                        className="bg-[#2211cc] text-[#c7c430] px-4 py-2 w-full" 
                        label="Submit" 
                    />
                </div>
            </form>

        </div>
    )
}
