import { AES, enc } from "crypto-js";


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