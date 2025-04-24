
export const DashboardTemplate = ({ children, sidenav, header }) => {
    return (
        <div className="dashboard_template_main flex min-h-screen">
            <aside className="fixed min-h-[92vh] bg-[#2f353a] flex flex-col w-[200px] px-4 text-sm shadow-2xl xs:hidden sm:flex md:flex lg:flex xl:flex">{sidenav}</aside>
            <main className="min-h-screen w-[calc(100%-200px)] bg-[#e4e5e6]" style={{ flexGrow: 1 }}>
                <div className="flex flex-col">
                    <div>
                        {header}
                    </div>
                    {children}                
                </div>
            </main>
        </div>
    )
}