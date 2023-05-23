import { useState } from 'react';
import ChatMessage from './ChatMessage';

function Chat({ messages, onSendMessage, isSubmitting }) {
  const [newMessage, setNewMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting || !newMessage) return;
    onSendMessage(e, newMessage);
    setNewMessage('');
  };

  return (
    <div className="border-2 border-gray-300 p-4 flex flex-col h-full justify-between">
      <div className="overflow-y-scroll h-128 flex flex-col space-y-2">
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message.text} isUser={message.isUser} images={message.images} />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="border-2 border-gray-300 rounded-md px-2 py-1 flex-grow"
            placeholder="Type a message"
          />
          <button type="submit" className="ml-2 bg-blue-500 text-white px-3 py-1 rounded-md" disabled={isSubmitting} style={{ opacity: isSubmitting ? 0.5 : 1 }}>
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default Chat;
