import * as rsa from './rsa'

export interface DatosCifrado {
    cifrado: string
    iv: string
    authTag: string
}

export interface MensajeOutput {
    usuario: string
    mensaje: string
    iv?: string
  }

export interface Usuario {
    nombre: string
    publicKey: rsa.RsaPublicKey
}