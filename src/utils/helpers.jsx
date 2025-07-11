/* eslint-disable react-refresh/only-export-components */
import { AES, enc } from "crypto-js";
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';


export const EncryptUser = (user) => {
    const encryptedUser = AES.encrypt(JSON.stringify({ ...user }), "user").toString()
    return encryptedUser
}
export const EncryptString = ( string ) => {
    const encryptedString = AES.encrypt(JSON.stringify(string), "string").toString()
    return encryptedString
}
export const DecryptUser = ( data ) => {
    const decryptedUser = AES.decrypt(`${data}`, "user").toString(enc.Utf8)
    const userdata = JSON.parse(decryptedUser)
    return userdata
}
export const DecryptString = ( data ) => {
    const decryptedString= AES.decrypt(`${data}`, "string").toString(enc.Utf8)
    const string = JSON.parse(decryptedString)
    return string
}
export const SetTermValue = () => {
    const currentDate = dayjs();
    const year = currentDate.year();
    dayjs.extend(isBetween);

    // Define the date ranges for each term
    const firstTermStart = dayjs(`${year}-08-01`);
    const firstTermEnd = dayjs(`${year}-10-31`);
    const secondTermStart = dayjs(`${year}-11-01`);
    const secondTermEnd = dayjs(`${year + 1}-02-28`); // Second term spans into the next year
    const thirdTermStart = dayjs(`${year}-03-01`);
    const thirdTermEnd = dayjs(`${year}-06-30`);

    // Check which term the current date falls into
    if (currentDate.isBetween(firstTermStart, firstTermEnd, null, '[]')) {
        return `${year} 1st term`;
    } else if (currentDate.isBetween(secondTermStart, secondTermEnd, null, '[]')) {
        return `${year} 2nd term`;
    } else if (currentDate.isBetween(thirdTermStart, thirdTermEnd, null, '[]')) {
        return `${year} 3rd term`;
    }
  
    return 'Out of range'; // If no term is matched (shouldn't happen)
}
// eslint-disable-next-line react-refresh/only-export-components
export const CodeList = [
    { id: 1, name: "NUB-ACD-CMX-F-001" },
    { id: 2, name: "NUB-ACD-CMX-F-002" },
    { id: 3, name: "NUB-ACD-CMX-F-003" },
    { id: 4, name: "NUB-ACD-CMX-F-004" },
    { id: 5, name: "NUB-ACD-CMX-F-005" },
    { id: 6, name: "NUB-ACD-CMX-F-006" },
    { id: 7, name: "NUB-ACD-CMX-F-007" },
    { id: 8, name: "NUB-ACD-CMX-F-008" },
    { id: 9, name: "NUB-ACD-CMX-F-009" },
    { id: 10, name: "NUB-ACD-CMX-F-010" },
    { id: 11, name: "NUB-ACD-CMX-F-011" },
    { id: 12, name: "NUB-ACD-CMX-F-012" },
    { id: 13, name: "NUB-ACD-CMX-F-013" },
    { id: 14, name: "NUB-ACD-CMX-F-014" },
    { id: 15, name: "NUB-ACD-CMX-F-015" },

]
export const OutreachProcess = [
    {
        title: "Before Implementation",
        description: "Submit the following forms to initiate the outreach project:",
        forms: ["Form 3", "Form 5", "Form 7", "Form 8", "Form 11", "Form 12"],
        note: "These forms are mandatory prior to project approval and implementation.",
    },
    {
        title: "During and After Implementation",
        description: "After the outreach project has started and activities have been carried out, submit:",
        forms: ["Form 13", "Form 14"],
        note: "These forms document the outreach activities and outcomes.",
    },
    {
        title: "Termination Process",
        description: "To conclude the outreach project, submit:",
        forms: ["Form 10"],
        note: "This final form completes the process and officially terminates the outreach project.",
    },
]
export const ProjectProcess = [
    {
        title: "Before Implementation",
        description: "Submit the following forms to initiate the project:",
        forms: ["Form 2", "Form 5", "Form 7", "Form 8", "Form 11", "Form 12"],
        note: "These are required for the project to be approved and launched.",
    },
    {
        title: "During and After Implementation",
        description: "Once the project is approved and executed, submit:",
        forms: ["Form 13", "Form 14"],
        note: "These serve as post-activity documentation and evaluation.",
    },
    {
        title: "Termination Process",
        description: "To officially end the project, submit:",
        forms: ["Form 10"],
        note: "This is the final reporting and closure form for the project.",
    },
]
export const ProgramProcess = [
    {
        title: "Before Implementation",
        description: "Submit the following forms to initiate the program:",
        forms: ["Form 1", "Form 4", "Form 6", "Form 8", "Form 11", "Form 12"],
        note: "These are prerequisites for program approval. Only upon approval can implementation begin.",
    },
    {
        title: "During and After Implementation",
        description: "Once the program is approved and carried out, submit::",
        forms: ["Form 13", "Form 14"],
        note: "These forms cover documentation and reporting of activities conducted.",
    },
    {
        title: "Termination Process",
        description: "To formally conclude the program, submit:",
        forms: ["Form 9"],
        note: "This final form signals the official termination of the program.",
    },
]