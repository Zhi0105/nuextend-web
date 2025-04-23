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