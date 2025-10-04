'use client'

import { MessageCircle } from 'lucide-react'

// Simple test component to verify rendering
export function SimpleChatbotTest() {
  return (
    <div 
      className="fixed bottom-6 right-6 z-50"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        background: 'blue',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
      }}
      onClick={() => alert('Chatbot clicked!')}
    >
      <MessageCircle style={{ color: 'white', width: '30px', height: '30px' }} />
    </div>
  )
}
