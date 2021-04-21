import crypto from 'crypto'
import * as bigintConversion from 'bigint-conversion'

const keyHex: string = "95442fa551e13eacedea3e79f0ec1e63513cc14a9dbc4939ad70ceb714b44b8f"
const key: Buffer = Buffer.from(keyHex, 'hex')

export interface DatosCifrado {
    cifrado: string
    iv: string
    authTag: string
}

export const encrypt = async function (mensaje: Buffer): Promise<DatosCifrado> {
    const iv: Buffer = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    const ciphertext: Buffer = Buffer.concat([cipher.update(mensaje), cipher.final()])
    const cipherString: string = bigintConversion.bufToHex(ciphertext)
    return {
        cifrado: cipherString,
        iv: iv.toString("hex"),
        authTag: cipher.getAuthTag().toString('hex')
    };
}

export const decrypt = async function (cifrado: Buffer, iv: Buffer, authTag: Buffer, keyTemporal?: Buffer): Promise<Buffer> {
    let decipher;
    if (keyTemporal == undefined)
        decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    
    else
        decipher = crypto.createDecipheriv('aes-256-gcm', keyTemporal, iv)

    decipher.setAuthTag(authTag)
    const mensaje: Buffer = Buffer.concat([decipher.update(cifrado), decipher.final()])
    return mensaje
}