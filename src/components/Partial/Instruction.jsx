import { OutreachProcess, ProgramProcess, ProjectProcess } from "@_src/utils/helpers";
import { NoteProcess } from "@_src/utils/NoteProcess";

export const Instruction = ({ model_id }) => {
    const formInstructions = {
        1: OutreachProcess,
        2: ProjectProcess,
        3: ProgramProcess
    };

    return (
        <div className="note-main flex flex-col text-sm gap-2 w-full bg-[#d2eef7] py-2 px-12">
            <div className="w-full flex flex-col gap-2 pt-4">
            <h1 className="uppercase text-sm text-[#115770]">Instruction:</h1>
                {(model_id) && (
                    <NoteProcess 
                        processSteps={formInstructions[model_id]}
                    />
                )}
            </div>
        </div>
    )
}
