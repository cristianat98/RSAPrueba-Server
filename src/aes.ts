import crypto from 'crypto'

const keyHex = "95442fa551e13eacedea3e79f0ec1e63513cc14a9dbc4939ad70ceb714b44b8f"
const key = Buffer.from(keyHex, 'hex')

export const encrypt = async function (mensaje: string): Promise<any> {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    let ciphertext = cipher.update(mensaje, 'utf8', 'hex')
    ciphertext += cipher.final('hex')
    return {
        cifrado: ciphertext,
        iv: iv
    };
}

export const decrypt = async function (cifrado: string, iv: string): Promise<string> {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    let mensaje = decipher.update(cifrado, 'hex', 'utf8');
    //mensaje += decipher.final('utf8');
    return mensaje;
}