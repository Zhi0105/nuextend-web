import React, { useState } from 'react'
import { useContext } from "react"
import { AuthContext } from "@_src/contexts/AuthContext"
import { FaSignOutAlt } from "react-icons/fa";
import { IoHome } from "react-icons/io5";
import { Link } from 'react-router-dom';
import { FaHome, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { RiCalendarEventFill } from "react-icons/ri";
import { IoIosEye, IoIosCreate  } from "react-icons/io";

export const Sidenav = () => {
    const { logout } = useContext(AuthContext)
    const [visible, setVisible] = useState(false);

    const toggleEventMenu = () => {
        setVisible(!visible)
    };

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
                        onClick={() => toggleEventMenu()}
                    >
                        <div className="flex gap-6">
                            <RiCalendarEventFill 
                                width={5}
                                height={5}
                                className='text-xl text-gray-500'
                            />
                            <span>Events</span>
                        </div>
                        {visible ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                    {visible && (
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
