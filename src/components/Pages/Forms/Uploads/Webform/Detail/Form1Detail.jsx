import { useLocation, useNavigate } from "react-router-dom"


export const Form1Detail = () => {
    const location = useLocation()
    const navigate = useNavigate()

    const { data } = location.state
  return (
      <div className="program-detail-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
        <button
            onClick={() => navigate('/event/form/001', { state: { formdata: data } })}
            className="inline-flex items-center rounded-md bg-[#013a63] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
            Update
        </button>
    </div>
  )
}
