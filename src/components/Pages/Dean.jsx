import { useContext, useState } from "react";
import { AuthContext } from "@_src/contexts/AuthContext";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { useForm, Controller } from "react-hook-form";
import { getDepartments } from "@_src/services/department";
import { getUsers } from "@_src/services/user";
import { Dropdown } from "primereact/dropdown";
import { DecryptString } from "@_src/utils/helpers";
import { useUserStore } from '@_src/store/auth';

export const Dean = () => {
    const { user, deanRegister, deanLoading } = useContext(AuthContext);
    const { token } = useUserStore((state) => ({ token: state.token }));
    const decryptedToken = token && DecryptString(token);
    
    // State to control dialog visibility
    const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
    
    const { handleSubmit, control, reset, watch, formState: { errors }} = useForm({
        defaultValues: {
            role: { id: 9 }, // Keep as object like original working version 
            department: "", // Keep as "department" like original working version
            firstname: "",
            middlename: "",
            lastname: "",
            email: "",
            password: "",
            contact: ""
        },
    });
    
    // Watch role to conditionally show department field
    const selectedRole = watch("role");
    const selectedRoleId = selectedRole?.id;
    
    const { data: departmentData } = getDepartments();
    const { data: usersData, isLoading: usersLoading, error: usersError } = getUsers({ 
        token: decryptedToken 
    });

    console.log(usersData);
    
    const filteredUsers = usersData?.data?.filter(user => 
        [9, 10, 11].includes(user.role_id)
    ) || [];

    // Role options as objects to match original structure
    const roleOptions = [
        { id: 9, name: "Dean" },
        { id: 10, name: "Academic Service Director" },
        { id: 11, name: "Academic Director" }
    ];

    const onSubmit = (data) => {
        console.log("Form data being submitted:", data);
        
        // Send the exact same data structure as the original working form
        // The backend Register function expects this structure
        deanRegister(data);
        reset();
        setShowRegistrationDialog(false);
    };

    const getRoleDisplayName = (user) => {
        if (user.role?.name) return user.role.name;
        if (user.role_name) return user.role_name;
        
        const roleMap = {
            9: 'Dean',
            10: 'Academic Service Director', 
            11: 'Academic Director'
        };
        return roleMap[user.role_id] || `Role ${user.role_id}`;
    };

    const getDepartmentDisplayName = (user) => {
        if (user.department?.name) return user.department.name;
        if (user.department_name) return user.department_name;
        return 'N/A';
    };

    // Dialog footer
    const dialogFooter = (
        <div className="flex justify-end gap-2">
            <Button
                type="button"
                label="Cancel"
                icon="pi pi-times"
                onClick={() => {
                    setShowRegistrationDialog(false);
                    reset();
                }}
                className="p-button-text"
            />
            <Button
                type="submit"
                label="Register User"
                icon="pi pi-check"
                loading={deanLoading}
                form="registration-form"
                className="bg-[#2211cc] text-[#c7c430] hover:bg-[#1a0da3] transition-colors"
            />
        </div>
    );

    if (deanLoading) {
        return (
            <div className="dean-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] py-20">
                Registration processing... Please wait....
            </div>
        );
    }

    return (
        <div className="dean-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] py-20">
            {/* Header Section */}
            <div className="w-3/4 my-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Signatories Management</h1>
                    <Button
                        onClick={() => setShowRegistrationDialog(true)}
                        className="bg-[#2211cc] text-white px-6 py-3 font-medium rounded-lg hover:bg-[#1a0da3] transition-colors"
                        label="Add Signatories"
                        icon="pi pi-plus"
                    />
                </div>
            
                {/* Users Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {!decryptedToken && (
                        <div className="text-center py-8 text-red-500 bg-red-50">
                            Authentication required. Please log in again.
                        </div>
                    )}
                    
                    {usersError && (
                        <div className="text-center py-8 text-red-500 bg-red-50">
                            Error loading users: {usersError.message}
                        </div>
                    )}
                    
                    {usersLoading ? (
                        <div className="text-center py-8 text-gray-500">Loading users...</div>
                    ) : filteredUsers.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                            Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                            Department
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                            Email / Account
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {`${user.firstname} ${user.middlename} ${user.lastname}`.trim()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {getDepartmentDisplayName(user)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {getRoleDisplayName(user)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button className="text-blue-600 hover:text-blue-900 font-medium text-xs py-1 px-2 rounded border border-blue-600 hover:bg-blue-50 transition-colors">
                                                        Edit
                                                    </button>
                                                    <button className="text-red-600 hover:text-red-900 font-medium text-xs py-1 px-2 rounded border border-red-600 hover:bg-red-50 transition-colors">
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            {decryptedToken ? "No users found with the specified roles." : "Please log in to view users."}
                        </div>
                    )}
                </div>
            </div>

            {/* Registration Dialog */}
            <Dialog
                header="Register New User"
                visible={showRegistrationDialog}
                style={{ width: '50vw' }}
                footer={dialogFooter}
                onHide={() => {
                    setShowRegistrationDialog(false);
                    reset();
                }}
                draggable={false}
                resizable={false}
            >
                <form
                    id="registration-form"
                    onSubmit={handleSubmit(onSubmit)}
                    className="bg-transparent w-full flex flex-col items-center"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        {/* Role Field - as object like original */}
                        <div className="role-field flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-2">Role *</label>
                            <Controller
                                control={control}
                                rules={{
                                    required: "Role is required",
                                }}
                                render={({ field: { onChange, value } }) => (
                                    <Dropdown
                                        className="w-full border border-gray-300 rounded-lg" 
                                        value={value} 
                                        onChange={onChange} 
                                        options={roleOptions} 
                                        optionLabel="name" 
                                        placeholder="Select role" 
                                        checkmark={true} 
                                        highlightOnSelect={false} 
                                    />
                                )}
                                name="role"
                            />
                            {errors.role && (
                                <p className="text-sm text-red-400 indent-2 mt-1">Please select a role*</p>
                            )}
                        </div>

                        {/* Department Field - Only show for Dean (role_id 9) */}
                        {selectedRoleId === 9 && (
                            <div className="department-field flex flex-col">
                                <label className="text-sm font-medium text-gray-700 mb-2">Department *</label>
                                <Controller
                                    control={control}
                                    rules={{
                                        required: selectedRoleId === 9 ? "Department is required for Dean" : false,
                                    }}
                                    render={({ field: { onChange, value } }) => (
                                        <Dropdown
                                            className="w-full border border-gray-300 rounded-lg" 
                                            value={value} 
                                            onChange={onChange} 
                                            options={departmentData?.data} 
                                            optionLabel="name" 
                                            placeholder="Select department" 
                                            checkmark={true} 
                                            highlightOnSelect={false} 
                                        />
                                    )}
                                    name="department"
                                />
                                {errors.department && (
                                    <p className="text-sm text-red-400 indent-2 mt-1">{errors.department.message}</p>
                                )}
                            </div>
                        )}

                        {/* First Name Field */}
                        <div className="firstname-field flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-2">First name *</label>
                            <Controller
                                control={control}
                                rules={{
                                required: "First name is required",
                                pattern: {
                                    value: /[\S\s]+[\S]+/,
                                    message: "First name is required"
                                },
                                }}
                                render={({ field: { onChange, value } }) => (
                                <input
                                    value={value}
                                    onChange={onChange}
                                    name="firstname"
                                    type="text"
                                    id="firstname"
                                    placeholder="Enter your first name"
                                    className={`${errors.firstname && 'border border-red-500'} bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5`}
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

                        {/* Middle Name Field */}
                        <div className="middlename-field flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-2">Middle name *</label>
                            <Controller
                                control={control}
                                rules={{
                                required: "Middle name is required",
                                pattern: {
                                    value: /[\S\s]+[\S]+/,
                                    message: "Middle name is required"
                                },
                                }}
                                render={({ field: { onChange, value } }) => (
                                <input
                                    value={value}
                                    onChange={onChange}
                                    name="middlename"
                                    type="text"
                                    id="middlename"
                                    placeholder="Enter your middle name"
                                    className={`${errors.middlename && 'border border-red-500'} bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5`}
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

                        {/* Last Name Field */}
                        <div className="lastname-field flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-2">Last name *</label>
                            <Controller
                                control={control}
                                rules={{
                                required: "Last name is required",
                                pattern: {
                                    value: /[\S\s]+[\S]+/,
                                    message: "Last name is required"
                                },
                                }}
                                render={({ field: { onChange, value } }) => (
                                <input
                                    value={value}
                                    onChange={onChange}
                                    name="lastname"
                                    type="text"
                                    id="lastname"
                                    placeholder="Enter your last name"
                                    className={`${errors.lastname && 'border border-red-500'} bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5`}
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

                        {/* Contact Field */}
                        <div className="contact-field flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-2">Phone number *</label>
                            <Controller
                                control={control}
                                rules={{
                                required: "Phone number is required",
                                pattern: {
                                    value: /^0\d{10}$/,
                                    message: "Phone number must start with 0 and have 11 digits"
                                },
                                }}
                                render={({ field: { onChange, value } }) => (
                                <input
                                    value={value}
                                    onChange={onChange}
                                    name="contact"
                                    type="text"
                                    id="contact"
                                    placeholder="09XXXXXXXXX"
                                    className={`${errors.contact && 'border border-red-500'} bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5`}
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

                        {/* Email Field */}
                        <div className="email-field flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-2">Nu-email *</label>
                            <Controller
                                control={control}
                                rules={{
                                required: "Email is required",
                                    pattern: {
                                        value: /^[a-zA-Z0-9._%+-]+@nu-baliwag\.edu\.ph$/,
                                        message: "Must be a valid nu-baliwag.edu.ph email"
                                    },
                                }}
                                render={({ field: { onChange, value } }) => (
                                <input
                                    value={value}
                                    onChange={onChange}
                                    type="email"
                                    name="email"
                                    id="email"
                                    placeholder="username@nu-baliwag.edu.ph"
                                    className={`${errors.email && 'border border-red-500'} bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5`}
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

                        {/* Password Field */}
                        <div className="password-field flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-2">Password *</label>
                            <Controller
                                control={control}
                                rules={{
                                required: "Password is required",
                                pattern: {
                                    value: /[\S\s]+[\S]+/,
                                    message: "Password is required"
                                },
                                minLength: {
                                    value: 6,
                                    message: "Password must be at least 6 characters"
                                }
                                }}
                                render={({ field: { onChange, value } }) => (
                                <input
                                    value={value}
                                    onChange={onChange}
                                    type="password"
                                    name="password"
                                    id="password"
                                    placeholder="Enter your password"
                                    autoComplete="new-password"
                                    className={`${errors.password && 'border border-red-500'} bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5`}
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
                </form>
            </Dialog>
        </div>
    );
};