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