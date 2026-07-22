export {}

declare global {
  interface PuterAI {
    chat(
      messages: string | Array<{ role: string; content: string }>,
      opts?: { model?: string; stream?: boolean }
    ): Promise<unknown>
    txt2img(prompt: string): Promise<HTMLImageElement>
    txt2speech(text: string): Promise<HTMLAudioElement>
    img2txt(file: File | string): Promise<string>
  }

  interface PuterAuth {
    signIn(): Promise<void>
    signOut(): Promise<void>
    getUser(): Promise<{ username: string; email?: string }>
    isSignedIn(): boolean
  }

  interface PuterKV {
    set(key: string, value: string): Promise<void>
    get(key: string): Promise<string | null>
    del(key: string): Promise<void>
  }

  interface Puter {
    ai: PuterAI
    auth: PuterAuth
    kv: PuterKV
  }

  var puter: Puter
  interface Window {
    puter: Puter
  }
}
