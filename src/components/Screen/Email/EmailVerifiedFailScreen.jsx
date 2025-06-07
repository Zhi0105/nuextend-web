import { PageTemplate } from "@_src/templates/PageTemplate"
import { RxCrossCircled } from "react-icons/rx";

export const EmailVerifiedFailScreen = () => {
    return (
        <PageTemplate>
            <div className="min-h-screen flex flex-col justify-center items-center">
                <RxCrossCircled 
                    className="text-red-400 h-20 w-20"
                />
                <h1>Email verification</h1>
                <h2>Your email address was not yet verified.</h2>
            </div>
        </PageTemplate>
    )
}
