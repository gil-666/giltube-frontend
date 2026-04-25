const base64UrlToUint8Array = (base64url: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4)
  const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) {
    bytes[i] = raw.charCodeAt(i)
  }
  return bytes
}

const arrayBufferToBase64Url = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj)) as T

export const prepareCredentialCreationOptions = (options: any) => {
  const prepared = clone(options)
  prepared.challenge = base64UrlToUint8Array(prepared.challenge)
  prepared.user.id = base64UrlToUint8Array(prepared.user.id)

  if (Array.isArray(prepared.excludeCredentials)) {
    prepared.excludeCredentials = prepared.excludeCredentials.map((item: any) => ({
      ...item,
      id: base64UrlToUint8Array(item.id)
    }))
  }

  return prepared
}

export const prepareCredentialRequestOptions = (options: any) => {
  const prepared = clone(options)
  prepared.challenge = base64UrlToUint8Array(prepared.challenge)

  if (Array.isArray(prepared.allowCredentials)) {
    prepared.allowCredentials = prepared.allowCredentials.map((item: any) => ({
      ...item,
      id: base64UrlToUint8Array(item.id)
    }))
  }

  return prepared
}

export const serializeRegistrationCredential = (credential: PublicKeyCredential) => {
  const response = credential.response as AuthenticatorAttestationResponse
  return {
    id: credential.id,
    rawId: arrayBufferToBase64Url(credential.rawId),
    type: credential.type,
    response: {
      attestationObject: arrayBufferToBase64Url(response.attestationObject),
      clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
      transports: typeof response.getTransports === 'function' ? response.getTransports() : []
    },
    clientExtensionResults: credential.getClientExtensionResults()
  }
}

export const serializeAuthenticationCredential = (credential: PublicKeyCredential) => {
  const response = credential.response as AuthenticatorAssertionResponse
  return {
    id: credential.id,
    rawId: arrayBufferToBase64Url(credential.rawId),
    type: credential.type,
    response: {
      authenticatorData: arrayBufferToBase64Url(response.authenticatorData),
      clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
      signature: arrayBufferToBase64Url(response.signature),
      userHandle: response.userHandle ? arrayBufferToBase64Url(response.userHandle) : null
    },
    clientExtensionResults: credential.getClientExtensionResults()
  }
}

export const supportsWebAuthn = (): boolean => {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential && !!navigator.credentials
}
