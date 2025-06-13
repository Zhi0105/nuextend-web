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