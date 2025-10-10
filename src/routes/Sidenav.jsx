import React, { useContext } from 'react'
import { useUserStore } from '@_src/store/auth';
import { AuthContext } from "@_src/contexts/AuthContext"
import { FaSignOutAlt } from "react-icons/fa";
import { IoHome } from "react-icons/io5";
import { Link } from 'react-router-dom';
import { FaHome, FaChevronDown, FaChevronUp, FaRegFilePdf } from "react-icons/fa";
import { RiCalendarEventFill } from "react-icons/ri";
import { IoIosEye, IoIosCreate  } from "react-icons/io";
import { PiDownloadSimpleBold } from "react-icons/pi";
import { MdOutlinePictureAsPdf } from "react-icons/md";
import { CgProfile } from "react-icons/cg";
import { DecryptUser } from '@_src/utils/helpers';
import _ from 'lodash';

export const Sidenav = () => {
    
    const { logout } = useContext(AuthContext)
    const { user, token } = useUserStore((state) => ({ user: state.user, token: state.token }));
    const decryptedUser = token && DecryptUser(user)
    // const [generateVisible, setGenerateVisible] = useState(false);
    
    // const toggleGenerate = () => {
    //     setGenerateVisible(!generateVisible)
    // };

    const validateUserRole = (role) => {
        if(role === 3) {
            return true
        }
        if(role === 4) {
            return true
        }
        return false
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
                    <Link
                        to="/profile"
                        className="flex gap-6 cursor-pointer"
                        >
                        <CgProfile
                            width={5}
                            height={5}
                            className="text-xl text-gray-500"
                        />
                        <span>Profile</span>
                    </Link>
                </li>

                {validateUserRole(decryptedUser?.role_id) && (
                    <>
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
                            <span>View Event</span>
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
                            <span>Create Event</span>
                        </Link>
                    </li>
                    </>
                )}
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
                            <span>Format</span>
                        </Link>
                    </div>
                </li>

                {/* <li>
                    <div
                        className="flex items-center justify-between rounded cursor-pointer"
                        onClick={() => toggleGenerate()}
                    >
                        <div className="flex gap-6">
                            <MdOutlinePictureAsPdf 
                                width={5}
                                height={5}
                                className='text-xl text-gray-500'
                            />
                            <span>Generate pdf</span>
                        </div>
                        {generateVisible ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                    {generateVisible && (
                        <ul className="ml-6 mt-1 space-y-1">
                            <li>
                                <Link
                                    to="/event/form/generate/outreach"
                                    className="flex gap-6 cursor-pointer"
                                    >
                                    <FaRegFilePdf 
                                        width={5}
                                        height={5}
                                        className='text-xl text-gray-500'
                                    />
                                    <span>Outreach</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/event/form/generate/project"
                                    className="flex gap-6 cursor-pointer"
                                    >
                                    <FaRegFilePdf 
                                        width={5}
                                        height={5}
                                        className='text-xl text-gray-500'
                                    />
                                    <span>Project</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/event/form/generate/program"
                                    className="flex gap-6 cursor-pointer"
                                    >
                                    <FaRegFilePdf 
                                        width={5}
                                        height={5}
                                        className='text-xl text-gray-500'
                                    />
                                    <span>Program</span>
                                </Link>
                            </li>
                        </ul>
                    )}
                </li> */}

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
