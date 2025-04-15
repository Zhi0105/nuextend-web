import { PageTemplate } from "@_src/templates/PageTemplate"
import { Home } from "../Pages/Home"
import { Link } from "react-router-dom"


export const HomeScreen = () => {
    return (
        <PageTemplate>
            <div className="header fixed w-full top-0 z-10 bg-transparent flex justify-end gap-2 items-center px-12" style={{ height: '8vh', borderBottom: '1px solid #c8ced3' }}>
                <Link to={"/login"} className="bg-[#2211cc] text-[#c7c430] text-center font-bold rounded-full p-2 w-[5rem]">
                    Login
                </Link>
                <Link to={"/register"} className="bg-[#2211cc] text-[#c7c430] text-center font-bold rounded-full p-2 w-[5rem]">
                    Sign up
                </Link>
            </div>
            <Home />
        </PageTemplate>
    )
}
