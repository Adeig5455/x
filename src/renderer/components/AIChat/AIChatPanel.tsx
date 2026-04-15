import React, { useState } from 'react';
import { useAppStore } from '../../store';
import { generateId } from '../../../shared/utils';
import type { AIMessage } from '../../../shared/types';

export const AIChatPanel: React.FC = () => {
  const [input, setInput] = useState('');
  const { aiMessages, aiLoading, addAIMessage, setAILoading } = useAppStore();

  const handleSend = async () => {
    if (!input.trim() || aiLoading) return;

    const userMessage: AIMessage = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };
    addAIMessage(userMessage);
    setInput('');
    setAILoading(true);

    // TODO: Integrate with AI API service
    setTimeout(() => {
      const assistantMessage: AIMessage = {
        id: generateId(),
        role: 'assistant',
        content: 'AI response placeholder - connect to AI API service',
        timestamp: Date.now(),
      };
      addAIMessage(assistantMessage);
      setAILoading(false);
    }, 1000);
  };

  return (
    <div className="ai-chat-panel">
      <div className="ai-chat-header">
        <span>AI Chat</span>
      </div>
      <div className="ai-chat-messages">
        {aiMessages.map((msg) => (
          <div key={msg.id} className={`ai-message ai-message-${msg.role}`}>
            <div className="ai-message-content">{msg.content}</div>
          </div>
        ))}
        {aiLoading && <div className="ai-loading">Thinking...</div>}
      </div>
      <div className="ai-chat-input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask AI anything..."
        />
        <button onClick={handleSend} disabled={aiLoading}>
          Send
        </button>
      </div>
    </div>
  );
};
