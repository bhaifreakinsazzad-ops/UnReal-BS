'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { ChevronDown, FileCode, Play, Send, Sparkles, Folder, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePuterAI } from '@/hooks/usePuterAI'

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then(m => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Editor লোড হচ্ছে...</span>
      </div>
    ),
  }
)

interface FileTreeFile {
  name: string
  type: 'file'
  lang: string
}

interface FileTreeFolder {
  name: string
  type: 'folder'
  children: FileTreeFile[]
}

const fileTree: (FileTreeFile | FileTreeFolder)[] = [
  { name: 'src', type: 'folder', children: [
    { name: 'index.html', type: 'file', lang: 'html' },
    { name: 'app.js', type: 'file', lang: 'javascript' },
    { name: 'styles.css', type: 'file', lang: 'css' },
  ]},
  { name: 'package.json', type: 'file', lang: 'json' },
]

const initialCode = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>আমার অ্যাপ</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>স্বাগতম!</h1>
    <p>আপনার অ্যাপ এখানে তৈরি হচ্ছে...</p>
    <button onclick="handleClick()">ক্লিক করুন</button>
  </div>
  <script src="app.js"></script>
</body>
</html>`

interface ChatMsg { id: string; role: 'user' | 'assistant'; content: string }

const CODE_SYSTEM = `You are UnReal AI, an expert web developer assistant.
When generating code: return only the code, properly formatted.
When explaining: be concise and use Bengali if the user writes in Bengali.
Focus on HTML, CSS, JavaScript. Generate production-quality code.`

export function AppDeveloper() {
  const [code, setCode] = useState(initialCode)
  const [aiInput, setAiInput] = useState('')
  const [aiMessages, setAiMessages] = useState<ChatMsg[]>([
    { id: '0', role: 'assistant', content: 'আমি UnReal AI। আপনার অ্যাপ তৈরিতে কিভাবে সাহায্য করতে পারি? কোড জেনারেট, বাগ ফিক্স বা ডিজাইন — সব বলুন!' },
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['src'])
  const [activeFile, setActiveFile] = useState('index.html')
  const [activeLang, setActiveLang] = useState<string>('html')
  const aiEndRef = useRef<HTMLDivElement>(null)
  const { isReady, sendMessage } = usePuterAI()

  useEffect(() => {
    aiEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages, isTyping])

  function selectFile(name: string, lang: string) {
    setActiveFile(name)
    setActiveLang(lang)
  }

  function toggleFolder(name: string) {
    setExpandedFolders(prev =>
      prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]
    )
  }

  async function handleAISend() {
    if (!aiInput.trim() || isTyping || !isReady) return
    const userContent = aiInput
    setAiMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userContent }])
    setAiInput('')
    setIsTyping(true)

    try {
      const contextPrompt = `Current code in ${activeFile}:\n\`\`\`\n${code.slice(0, 2000)}\n\`\`\`\n\nUser request: ${userContent}`
      const reply = await sendMessage(contextPrompt, CODE_SYSTEM)
      setAiMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: reply }])

      // Auto-apply if reply looks like code
      const codeMatch = reply.match(/```(?:\w+)?\n([\s\S]+?)```/)
      if (codeMatch) setCode(codeMatch[1].trim())
    } catch {
      setAiMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'দুঃখিত, সাময়িক সমস্যা। আবার চেষ্টা করুন।',
      }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#0D0D1A]">
      {/* File Tree */}
      <div className="w-48 bg-[#13132B] border-r border-white/10 flex-shrink-0 overflow-y-auto">
        <div className="px-3 py-3 border-b border-white/10">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ফাইল এক্সপ্লোরার</p>
        </div>
        <div className="p-2">
          {fileTree.map(item => (
            <div key={item.name}>
              {item.type === 'folder' ? (
                <>
                  <button onClick={() => toggleFolder(item.name)}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg text-sm transition-colors">
                    <ChevronDown className={cn('w-3 h-3 transition-transform', !expandedFolders.includes(item.name) && '-rotate-90')} />
                    <Folder className="w-3.5 h-3.5 text-yellow-400" />
                    <span>{item.name}</span>
                  </button>
                  {expandedFolders.includes(item.name) && item.children && (
                    <div className="ml-4">
                      {item.children.map(child => (
                        <button key={child.name}
                          onClick={() => selectFile(child.name, child.lang)}
                          className={cn(
                            'w-full flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-lg transition-colors',
                            activeFile === child.name ? 'bg-[#7C3AED]/20 text-[#A78BFA]' : 'text-gray-400 hover:text-white hover:bg-white/5'
                          )}>
                          <FileCode className="w-3.5 h-3.5" />
                          <span>{child.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <button onClick={() => selectFile(item.name, item.lang)}
                  className={cn(
                    'w-full flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-lg transition-colors',
                    activeFile === item.name ? 'bg-[#7C3AED]/20 text-[#A78BFA]' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}>
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{item.name}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-white/10">
        <div className="flex items-center border-b border-white/10 flex-shrink-0 bg-[#13132B]">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b-2 border-[#7C3AED] bg-[#0D0D1A]">
            <FileCode className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-sm text-gray-300">{activeFile}</span>
          </div>
          <div className="ml-auto px-3 py-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00C875] text-black text-xs font-bold rounded-lg hover:bg-[#00B368] transition-colors">
              <Play className="w-3 h-3" />
              রান করুন
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <MonacoEditor
            height="100%"
            language={activeLang}
            theme="vs-dark"
            value={code}
            onChange={v => setCode(v ?? '')}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              wordWrap: 'on',
              padding: { top: 12, bottom: 12 },
              scrollBeyondLastLine: false,
              fontFamily: 'JetBrains Mono, monospace',
            }}
          />
        </div>
      </div>

      {/* Preview + AI Panel */}
      <div className="w-72 flex flex-col flex-shrink-0">
        {/* Preview */}
        <div className="h-48 border-b border-white/10 bg-white flex flex-col flex-shrink-0">
          <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500">লাইভ প্রিভিউ</p>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
          </div>
          <iframe
            srcDoc={activeLang === 'html' ? code : `<pre style="padding:8px;font-size:12px">${code.replace(/</g,'&lt;')}</pre>`}
            className="flex-1 w-full border-0"
            sandbox="allow-scripts"
            title="Preview"
          />
        </div>

        {/* AI Panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#13132B]">
          <div className="px-3 py-2.5 border-b border-white/10 flex items-center gap-2 flex-shrink-0">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#00C875] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-xs font-semibold text-gray-300">UnReal AI</p>
            <span className={cn('ml-auto w-2 h-2 rounded-full', isReady ? 'bg-[#00C875] animate-pulse' : 'bg-gray-600')} />
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {aiMessages.map(msg => (
              <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap',
                  msg.role === 'user' ? 'bg-[#7C3AED] text-white' : 'bg-white/10 text-gray-300'
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/10 px-3 py-2 rounded-xl">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={aiEndRef} />
          </div>

          <div className="p-3 flex-shrink-0">
            <form onSubmit={e => { e.preventDefault(); handleAISend() }} className="flex gap-2">
              <input
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                placeholder={isReady ? 'কী তৈরি করতে চান...' : 'AI লোড হচ্ছে...'}
                disabled={!isReady}
                className="flex-1 px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-xs text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-[#7C3AED] disabled:opacity-50"
              />
              <button type="submit" disabled={!aiInput.trim() || isTyping || !isReady}
                className="w-8 h-8 rounded-lg bg-[#7C3AED] flex items-center justify-center hover:bg-[#6D28D9] disabled:opacity-40 flex-shrink-0">
                {isTyping ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
