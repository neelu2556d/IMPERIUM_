'use client'

import { useState } from 'react'
import { useBusinessStore } from '../useBusinessStore'
import styles from './views.module.css'

/** AiView — conversational business mentor built on
 *  business_conversations. Shows the morning briefing (if one
 *  exists for today) and a chat input that appends user messages
 *  and renders assistant replies as they arrive.
 *  The AI call itself is server-side; this view only reads the
 *  cached conversation rows.
 */
export default function AiView() {
  const {
    conversations, conversationsLoading, morningBriefings,
    generateMorningBriefing, sendConversation,
  } = useBusinessStore()
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  const userMsgs = conversations.filter((c) => c.role === 'user')
  const assistantMsgs = conversations.filter((c) => c.role === 'assistant')
  const todayBrief = morningBriefings[0]?.content

  async function handleSend() {
    const text = input.trim()
    if (!text) return
    setSending(true)
    await sendConversation(text)
    setInput('')
    setSending(false)
  }

  return (
    <div className={styles.section}>
      {/* Morning briefing */}
      <div className={styles.briefCard}>
        <div className={styles.briefHead}>
          <h3 className={styles.subhead}>Morning briefing</h3>
          <button
            className={styles.addBtn}
            onClick={async () => await generateMorningBriefing()}
          >
            Generate
          </button>
        </div>
        {todayBrief ? (
          <p className={styles.muted}>{typeof todayBrief === 'string' ? todayBrief : '—'}</p>
        ) : (
          <p className={styles.muted}>No briefing yet — tap Generate.</p>
        )}
      </div>

      {/* Chat */}
      <div className={styles.chat}>
        {assistantMsgs.map((m) => (
          <div className={styles.bubbleAssist} key={m.id}>
            <p className={styles.bubbleText}>{m.content}</p>
          </div>
        ))}
        {userMsgs.map((m) => (
          <div className={styles.bubbleUser} key={m.id}>
            <p className={styles.bubbleText}>{m.content}</p>
          </div>
        ))}
        {sending && <div className={styles.bubbleAssist}><p className={styles.bubbleText}>…</p></div>}
      </div>

      <div className={styles.chatBar}>
        <input
          className={styles.search}
          placeholder="Ask about your business…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button className={styles.addBtn} onClick={handleSend} disabled={sending || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  )
}