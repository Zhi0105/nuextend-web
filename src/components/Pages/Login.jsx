import { useState, useContext } from "react";
import { AuthContext } from "@_src/contexts/AuthContext";
import { LazyImage } from "../Lazy/Lazy"
import { Controller, useForm } from "react-hook-form";
import { MdOutlineAlternateEmail } from "react-icons/md";
import { MdLockOutline } from "react-icons/md";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link } from "react-router-dom";

export const Login = () => {

    const { handleSubmit, control, formState: { errors }} = useForm({
        defaultValues: {
            email: "",
            password: "",
        },
    });
    const [isPasswordVisible, setisPasswordVisible] = useState(false);
    const { login, loginLoading } = useContext(AuthContext)

    const onSubmit = (data) => {
        login(data)
    };
    
    const handlePasswordVisibility = (isVisible) => {
    setisPasswordVisible(!isVisible);
    };

    if(loginLoading) {
        return (
            <div className="login-main min-h-screen flex justify-center items-center">
                Please wait....
            </div>
        )
    }

    return (
        <div className="login-main min-h-screen flex justify-center items-center">
            <section className="min-w-[25%] flex flex-col items-center justify-center px-2 py-2 mx-auto lg:py-0">
                <LazyImage src={'logo.svg'} alt={"logo"} height={100} width={100} />
                <LazyImage src={'name.webp'} alt={"logo"} height={150} width={150} />
                <h1 className="mt-2 text-[#6c757d]">Login to participate in projects.</h1>
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="w-full form_container mt-2 flex flex-col gap-2"
                >
                        <div className="email_textfield">
                            <Controller
                                control={control}
                                rules={{
                                required: true,
                                pattern: /^\S+@\S+\.\S+$/,
                                }}
                                render={({ field: { onChange, value } }) => (
                                    <div className="flex items-center border border-gray-300 rounded-lg py-2 w-full max-w-sm shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
                                        <MdOutlineAlternateEmail className="h-4 w-8 text-[#2211cc]"/>
                                        <input
                                            value={value}
                                            onChange={onChange}
                                            type="email"
                                            name="email"
                                            id="email"
                                            placeholder="Enter your NU email or email"
                                            className="outline-none bg-transparent sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full px-2"
                                        />
                                    </div>
                                )}
                                name="email"
                            />
                            {errors.email && (
                                <p className="text-sm text-red-400 indent-2">email invalid*</p>
                            )}
                        </div>
                        <div className="relative password_textfield">
                            {isPasswordVisible && (
                                <FaEyeSlash
                                width={50}
                                height={50}
                                className="absolute z-50 text-xl text-gray-500 cursor-pointer top-2 right-6 fa fa-eye"
                                onClick={() => handlePasswordVisibility(isPasswordVisible)}
                                />
                            )}
                            {!isPasswordVisible && (
                                <FaEye
                                width={50}
                                height={50}
                                className="absolute z-50 text-xl text-gray-500 cursor-pointer top-2 right-6 fa fa-eye"
                                onClick={() => handlePasswordVisibility(isPasswordVisible)}
                                />
                            )}

                            <Controller
                                control={control}
                                rules={{
                                required: true,
                                pattern: /[\S\s]+[\S]+/,
                                }}
                                render={({ field: { onChange, value } }) => (
                                <div className="flex items-center border border-gray-300 rounded-lg py-2 w-full max-w-sm shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
                                    <MdLockOutline className="h-4 w-8 text-[#2211cc]"/>
                                    <input
                                        value={value}
                                        onChange={onChange}
                                        type={isPasswordVisible ? "text" : "password"}
                                        name="password"
                                        id="password"
                                        placeholder="••••••••"
                                        autoComplete="true"
                                        className="outline-none bg-transparent sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full px-2"
                                    />
                                </div>
                                )}
                                name="password"
                            />
                        {errors.password && (
                            <p className="text-sm text-red-400 indent-2">
                            password invalid*
                            </p>
                        )}
                        </div>
                        <div className="min-w-[20rem] flex gap-2 mt-4">
                            <button
                                disabled={loginLoading}
                                type="submit"
                                className="w-full text-white bg-black flex justify-center items-center gap-4 cursor-pointer font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2"
                            >
                                Login
                            </button>

                            <Link
                                to="/"
                                className="w-full text-white bg-black flex justify-center items-center gap-4 cursor-pointer font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2"
                            >
                                Back
                            </Link>
                        </div>
                        <h1 className="text-center mt-2 text-sm text-gray-600">Don't have account? <Link to={"/register"} className="text-[#2211cc]">Sign up</Link></h1>
                </form>
            </section>
        </div>
    )
}
