import React, { useState, useContext } from 'react'
import { useUserStore } from '@_src/store/auth';
import { AuthContext } from "@_src/contexts/AuthContext"
import { FaSignOutAlt } from "react-icons/fa";
import { IoHome } from "react-icons/io5";
import { Link } from 'react-router-dom';
import { FaHome, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { RiCalendarEventFill } from "react-icons/ri";
import { IoIosEye, IoIosCreate  } from "react-icons/io";
import { DecryptUser } from '@_src/utils/helpers';
import _ from 'lodash';

export const Sidenav = () => {
    const { logout } = useContext(AuthContext)
    const [eventVisible, setEventVisible] = useState(false);
    const [orgVisible, setOrgVisible] = useState(false);
    const { user, token } = useUserStore((state) => ({ user: state.user, token: state.token }));
    const decryptedUser = token && DecryptUser(user)

    const toggleEvents = () => {
        setEventVisible(!eventVisible)
    };
    const toggleOrg = () => {
        setOrgVisible(!orgVisible)
    };

    const hasRole = (organization) => {
        return _.some(organization, (org) => [6, 7].includes(org.pivot.role_id))
    }

    return (
        <div className='sidenav-main text-white h-screen mt-10'>
            <ul className="flex flex-col gap-4 cursor-pointer">
                <li>
                    <Link
                        to="/dashboard"
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
                                    to="/event/view"
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
                            {hasRole(decryptedUser?.organizations) && (
                                <li>
                                    <Link
                                        to="/event/create"
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
                <li>
                    <div
                        className="flex items-center justify-between rounded cursor-pointer"
                        onClick={() => toggleOrg()}
                    >
                        <div className="flex gap-6">
                            <RiCalendarEventFill 
                                width={5}
                                height={5}
                                className='text-xl text-gray-500'
                            />
                            <span>Organization</span>
                        </div>
                        {orgVisible ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                    {orgVisible && (
                        <ul className="ml-6 mt-1 space-y-1">
                            <li>
                                <Link
                                    to="/organization/view"
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
                            {!hasRole(decryptedUser?.organizations) && (
                                <li>
                                    <Link
                                        to="/organization/create"
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

                            {hasRole(decryptedUser?.organizations) && (
                                <li>
                                    <Link
                                        to="/organization/member/add"
                                        className="flex gap-6 cursor-pointer"
                                        >
                                        <IoIosCreate 
                                            width={5}
                                            height={5}
                                            className='text-xl text-gray-500'
                                        />
                                        <span>Add member</span>
                                    </Link>
                                </li>
                            )}
                        </ul>
                    )}
                </li>
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
