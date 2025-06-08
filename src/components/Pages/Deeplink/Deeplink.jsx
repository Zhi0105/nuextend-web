import { PageTemplate } from "@_src/templates/PageTemplate"
import { HiMiniCheckCircle } from "react-icons/hi2";


export const Deeplink = () => {
    return (
        <PageTemplate>
            <div className="min-h-screen flex flex-col justify-center items-center">
                <HiMiniCheckCircle 
                    className="text-green-400 h-20 w-20"
                />
                <h1>Email verification</h1>
                <h2>Your email address was successfully verified.</h2>
                <h2>You may now re open your application.</h2>
            </div>
        </PageTemplate>
    )
}
