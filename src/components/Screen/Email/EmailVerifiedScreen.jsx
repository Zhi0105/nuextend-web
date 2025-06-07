import { PageTemplate } from "@_src/templates/PageTemplate"
import { HiMiniCheckCircle } from "react-icons/hi2";
import { Link } from "react-router-dom";

export const EmailVerifiedScreen = () => {
    return (
        <PageTemplate>
            <div className="min-h-screen flex flex-col justify-center items-center">
                <HiMiniCheckCircle 
                    className="text-green-400 h-20 w-20"
                />
                <h1>Email verification</h1>
                <h2>Your email address was successfully verified.</h2>
                <Link
                    to={"/login"}
                    className="bg-[#2211cc] text-[#c7c430] px-10 py-2 mt-4 rounded-lg"
                >
                    OK
                </Link>
            </div>
        </PageTemplate>
    )
}
