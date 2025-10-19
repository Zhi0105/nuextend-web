import { PageTemplate } from "@_src/templates/PageTemplate"
import { Home } from "../Pages/Home"
import { Link } from "react-router-dom"
import { FaDownload } from "react-icons/fa"

export const HomeScreen = () => {
    
    // Function to handle APK download
    const handleDownloadAPK = () => {
        // Replace with your actual APK file URL
        const apkUrl = 'https://www.mediafire.com/file/q7posava5l8k5hv/nuextend.apk/file';
        window.open(apkUrl, '_blank');
    };

    return (
        <PageTemplate>
            <div className="header fixed w-full top-0 z-10 bg-transparent flex justify-between items-center px-12" style={{ height: '8vh', borderBottom: '1px solid #c8ced3' }}>
                {/* Download APK Button - Left side */}
                <button
                    onClick={handleDownloadAPK}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 justify-center font-bold rounded-full p-2 w-auto px-4 transition-colors duration-200"
                >
                    <FaDownload className="text-sm" />
                    Download App
                </button>
                
                {/* Login/Signup buttons - Right side */}
                <div className="flex gap-2">
                    <Link to={"/login"} className="bg-[#2211cc] text-[#c7c430] text-center font-bold rounded-full p-2 w-[5rem]">
                        Login
                    </Link>
                    <Link to={"/register"} className="bg-[#2211cc] text-[#c7c430] text-center font-bold rounded-full p-2 w-[5rem]">
                        Sign up
                    </Link>
                </div>
            </div>
            <Home />
        </PageTemplate>
    )
}