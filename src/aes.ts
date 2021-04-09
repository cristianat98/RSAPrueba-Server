import crypto from 'crypto'
import * as bigintConversion from 'bigint-conversion'

const keyHex = "95442fa551e13eacedea3e79f0ec1e63513cc14a9dbc4939ad70ceb714b44b8f"
const key = Buffer.from(keyHex, 'hex')

export const encrypt = async function (mensaje: Buffer): Promise<any> {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    const ciphertext = Buffer.concat([cipher.update(mensaje), cipher.final()])
    const cipherstring = bigintConversion.bufToHex(ciphertext)
    return {
        cifrado: cipherstring,
        iv: iv.toString("hex"),
        authTag: cipher.getAuthTag().toString('hex')
    };
}

export const decrypt = async function (cifrado: Buffer, iv: Buffer, authTag: Buffer): Promise<Buffer> {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag)
    const mensaje = Buffer.concat([decipher.update(cifrado), decipher.final()]);
    return mensaje
}