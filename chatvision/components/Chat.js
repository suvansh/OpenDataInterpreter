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
    <div className="border-2 border-gray-300 p-4 flex flex-col">
      <div className="overflow-y-scroll h-128 flex flex-col space-y-2">
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message.text} isUser={message.isUser} images={message.images} />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="border-2 border-gray-300 rounded-md px-2 py-1 w-full"
          placeholder="Type a message"
          disabled={isSubmitting}
        />
      </form>
    </div>
  );
}

export default Chat;
