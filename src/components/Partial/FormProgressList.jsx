import React from "react";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";

export const FormProgressList = ({
    eventList = []
}) => {
    const forms = [
  {
    id: 1,
    name: "Company Townhall",
    nextApprover: "Jane Dela Cruz",
    role: "HR Manager",
    remarks: "Pending budget approval",
  },
  {
    id: 2,
    name: "Marketing Summit 2025",
    nextApprover: "John Santos",
    role: "Marketing Head",
    remarks: "Revised agenda submitted",
  },
  {
    id: 3,
    name: "IT Security Workshop",
    nextApprover: "Mia Reyes",
    role: "IT Director",
    remarks: "Waiting for venue confirmation",
  },
];


    eventList?.length && console.log(eventList)

    return (
        <div className="form-progress-main">
            <Card title="Form Progress Report">
                <div className=" w-full flex flex-wrap gap-10 items-center justify-center">
                        {forms.map((form) => (
                                <div key={form.id}>
                                    <Card
                                        title={form.name}
                                        subTitle={`Next Approver: ${form.nextApprover}`}
                                        className="shadow-3 border-round-xl"
                                    >
                                        <p className="m-0 text-sm text-gray-700 mb-2">
                                        <strong>Role:</strong> {form.role}
                                        </p>
                                        <p className="m-0 text-sm text-gray-700">
                                        <strong>Revision Remarks:</strong> {form.remarks}
                                        </p>

                                        <Divider />

                                        <div className="flex justify-content-between align-items-center">
                                        <Tag value="In Progress" severity="info" />
                                        {/* <Button
                                            label="View Details"
                                            icon="pi pi-eye"
                                            className="p-button-sm p-button-text"
                                        /> */}
                                        </div>
                                    </Card>
                                </div>
                        ))}
                </div>
            </Card>
        </div>
    );
}