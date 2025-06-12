import React, { useState, useContext } from 'react'
import { AuthContext } from "@_src/contexts/AuthContext"
import { useUserStore } from '@_src/store/auth';
import { FaSignOutAlt } from "react-icons/fa";
import { IoHome } from "react-icons/io5";
import { Link } from 'react-router-dom';
import { FaHome, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { RiCalendarEventFill } from "react-icons/ri";
import { IoIosEye, IoIosCreate  } from "react-icons/io";
import { DecryptUser } from '@_src/utils/helpers';
import _ from 'lodash';
import { PiDownloadSimpleBold } from 'react-icons/pi';

export const AdminSidenav = () => {
    const { logout } = useContext(AuthContext)
    const [eventVisible, setEventVisible] = useState(false);
    const [skillVisible, setSkillVisible] = useState(false)
    const { user, token } = useUserStore((state) => ({ user: state.user, token: state.token }));
    const decryptedUser = token && DecryptUser(user)

    const toggleEvents = () => {
        setEventVisible(!eventVisible)
    };
    const toggleSkills = () => {
        setSkillVisible(!skillVisible)
    };
    
    const handleEventMenuValidation = (role) => {
        if([9, 10, 11].includes(role)) {
            return false
        } 
        return true
    }
        
    return (
        <div className='sidenav-main text-white h-screen mt-10'>
            <ul className="flex flex-col gap-4 cursor-pointer">
                <li>
                    <Link
                        to="/admin/dashboard"
                        className="flex gap-6 cursor-pointer"
                        >
                        <IoHome
                            width={5}
                            height={5}
                            className="text-xl text-gray-500"
                        />
                        <span>Home</span>
                    </Link>
                </li>
                {decryptedUser?.role_id === 1 && (
                    <li>
                        <Link
                            to="/admin/create/dean"
                            className="flex gap-6 cursor-pointer"
                            >
                            <IoIosCreate 
                                width={5}
                                height={5}
                                className='text-xl text-gray-500'
                            />
                            <span>Dean Account</span>
                        </Link>
                    </li>
                )}
                <li>
                    <div
                        className="flex items-center justify-between rounded cursor-pointer"
                        onClick={() => toggleEvents()}
                    >
                        <div className="flex gap-6">
                            <RiCalendarEventFill 
                                width={5}
                                height={5}
                                className='text-xl text-gray-500'
                            />
                            <span>Events</span>
                        </div>
                        {eventVisible ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                    {eventVisible && (
                        <ul className="ml-6 mt-1 space-y-1">
                            <li>
                                <Link
                                    to="/admin/event/view"
                                    className="flex gap-6 cursor-pointer"
                                    >
                                    <IoIosEye 
                                        width={5}
                                        height={5}
                                        className='text-xl text-gray-500'
                                    />
                                    <span>View</span>
                                </Link>
                            </li>
                            {handleEventMenuValidation(decryptedUser?.role_id) && (
                                <li>
                                    <Link
                                        to="/admin/event/create"
                                        className="flex gap-6 cursor-pointer"
                                        >
                                        <IoIosCreate 
                                            width={5}
                                            height={5}
                                            className='text-xl text-gray-500'
                                        />
                                        <span>Create</span>
                                    </Link>
                                </li>
                            )}
                        </ul>
                    )}
                </li>

                {handleEventMenuValidation(decryptedUser?.role_id) && (
                    <li>
                        <div
                            className="flex items-center justify-between rounded cursor-pointer"
                            onClick={() => toggleSkills()}
                        >
                            <div className="flex gap-6">
                                <RiCalendarEventFill 
                                    width={5}
                                    height={5}
                                    className='text-xl text-gray-500'
                                />
                                <span>Skills</span>
                            </div>
                            {skillVisible ? <FaChevronUp /> : <FaChevronDown />}
                        </div>
                        {skillVisible && (
                            <ul className="ml-6 mt-1 space-y-1">
                                <li>
                                    <Link
                                        to="/skill/view"
                                        className="flex gap-6 cursor-pointer"
                                        >
                                        <IoIosEye 
                                            width={5}
                                            height={5}
                                            className='text-xl text-gray-500'
                                        />
                                        <span>View</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/skill/create"
                                        className="flex gap-6 cursor-pointer"
                                        >
                                        <IoIosCreate 
                                            width={5}
                                            height={5}
                                            className='text-xl text-gray-500'
                                        />
                                        <span>Create</span>
                                    </Link>
                                </li>
                            </ul>
                        )}
                    </li>
                )}

                {handleEventMenuValidation(decryptedUser?.role_id) && (
                    <li>
                        <div className="flex gap-6">
                            <RiCalendarEventFill 
                                width={5}
                                height={5}
                                className='text-xl text-gray-500'
                            />
                            <Link
                                to="/organization/view"
                                className="flex gap-6 cursor-pointer"
                            >
                                <span>Organization</span>
                            </Link>
                        </div>
                    </li>
                )}
                {decryptedUser?.role_id === 1 && (
                    <li>
                        <div className="flex gap-6">
                            <PiDownloadSimpleBold 
                                width={5}
                                height={5}
                                className='text-xl text-gray-500'
                            />
                            <Link
                                to="/event/form/download"
                                className="flex gap-6 cursor-pointer"
                            >
                                <span>Downloads</span>
                            </Link>
                        </div>
                    </li>
                )}
                <li
                    onClick={logout}
                    className="flex gap-6 cursor-pointer"
                    >
                    <FaSignOutAlt
                        width={5}
                        height={5}
                        className="text-xl text-gray-500"
                    />
                    <span>Logout</span>
                </li>
            </ul>
        </div>
    )
}
