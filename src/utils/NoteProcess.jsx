import React from 'react'

export const NoteProcess = ({ processSteps }) => {
    return (
        <div className="max-w-3xl mx-auto p-6 text-gray-800">
        {processSteps.map((step, index) => (
            <div key={index} className="mb-8">
                <h2 className="font-bold text-lg mb-2">
                    {index + 1}. {step.title}
                </h2>
                <p className="mb-2">{step.description}</p>
                <p className="font-semibold mb-1">{step.forms.join(", ")}</p>
                <p className="text-sm text-gray-600">➤ {step.note}</p>
            </div>
        ))}
        </div>
    )
}
