'use client'

export function requestPasswordReverification(message: string): Promise<string | null> {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog')
    dialog.className = 'w-[min(92vw,420px)] rounded-2xl border border-slate-200 bg-white p-0 text-slate-950 shadow-2xl backdrop:bg-slate-950/70'
    dialog.setAttribute('aria-labelledby', 'unreal-reverify-title')

    const form = document.createElement('form')
    form.method = 'dialog'
    form.className = 'space-y-4 p-5'
    const title = document.createElement('h2')
    title.id = 'unreal-reverify-title'
    title.className = 'text-lg font-bold'
    title.textContent = 'Confirm it is you'
    const description = document.createElement('p')
    description.className = 'text-sm text-slate-600'
    description.textContent = message
    const label = document.createElement('label')
    label.className = 'block text-sm font-semibold'
    label.textContent = 'Password'
    const input = document.createElement('input')
    input.type = 'password'
    input.required = true
    input.autocomplete = 'current-password'
    input.maxLength = 200
    input.className = 'mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200'
    label.append(input)
    const actions = document.createElement('div')
    actions.className = 'flex justify-end gap-2'
    const cancel = document.createElement('button')
    cancel.type = 'button'
    cancel.className = 'rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold'
    cancel.textContent = 'Cancel'
    const confirm = document.createElement('button')
    confirm.type = 'submit'
    confirm.className = 'rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white'
    confirm.textContent = 'Verify password'
    actions.append(cancel, confirm)
    form.append(title, description, label, actions)
    dialog.append(form)
    document.body.append(dialog)

    let settled = false
    const finish = (value: string | null) => {
      if (settled) return
      settled = true
      dialog.close()
      dialog.remove()
      resolve(value)
    }
    cancel.addEventListener('click', () => finish(null))
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault()
      finish(null)
    })
    form.addEventListener('submit', (event) => {
      event.preventDefault()
      const password = input.value
      input.value = ''
      finish(password || null)
    })
    dialog.showModal()
    input.focus()
  })
}
