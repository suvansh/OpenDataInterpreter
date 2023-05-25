import { useState } from 'react';
import ChatMessage from './ChatMessage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';


function Chat({ messages, setMessages, newMessage, setNewMessage, onSendMessage, isSubmitting, sqlDb }) {
  

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting || !newMessage) return;
    onSendMessage(e, newMessage);
    setNewMessage('');
  };

  const handleClearMessages = () => {
    setMessages([]);
  };

  const runSqlQuery = async (sqlQuery, index, setErrorMessage) => {
    try {
      var result = sqlDb.exec(sqlQuery);
    } catch (e) {
      setErrorMessage(e.message);
      return;
    }
    setErrorMessage(null);

    let sqlOut;
    if (result.length === 0) {
      sqlOut = { columns: ["<Empty>"], values: [["<Empty>"]] };
    } else {
      sqlOut = result[0];
    }
    
    let asstMsg = JSON.stringify(sqlOut);
    // update indexth message with new message
    let newMessages = [...messages];
    newMessages[index].text = asstMsg;
    setMessages(newMessages);
  }

  return (
    <div className="border-2 border-gray-300 p-4 flex flex-col h-full justify-between">
      <div className="overflow-y-scroll h-128 flex flex-col space-y-2">
        {messages.map((message, index) => (
          <ChatMessage key={index} index={index} message={message} runSqlQuery={runSqlQuery} />
        ))}
      </div>

      <div className="flex items-center justify-between mt-4">
        <button type="button" title="Clear conversation" className="bg-red-500 text-white px-3 py-1 rounded-md mr-2" disabled={isSubmitting} onClick={handleClearMessages}>
          <FontAwesomeIcon icon={ faTrash } />
        </button>

        <form onSubmit={handleSubmit} className="flex-grow" >
          <div className="flex items-center">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="border-2 border-gray-300 rounded-md px-2 py-1 flex-grow"
              placeholder="Ask for stats, tables, or graphs..."
              style={{ minWidth: '10rem' }}
            />
            <button type="submit" className="ml-2 bg-blue-500 text-white px-3 py-1 rounded-md" disabled={isSubmitting} style={{ opacity: isSubmitting ? 0.5 : 1 }}>
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Chat;
