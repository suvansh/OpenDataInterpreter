import Image from 'next/image';
import CodeBlock from './CodeBlock';
import SqlResultTable from './SqlResultTable';

function ChatMessage({ index, message, runSqlQuery }) {
  if (message.isUser) {
    return (
      <div className="rounded-lg px-4 py-2 m-2 max-w-xs bg-blue-500 text-white self-end">
        {message.text}
      </div>
    );
  }
  else {
    try {
      var message_text_obj = JSON.parse(message.text);
    } catch (e) {
      console.log(e);
      console.log(message);
      var message_text_obj = {"columns":["ERR"],"values":[["Error parsing SQL response."]]};
    }
    return (
      <>
        <CodeBlock index={index} initialCodeString={message.code} language={message.lang} runSqlQuery={runSqlQuery} />
        <div className="rounded-lg px-4 py-2 m-2 max-w-xl bg-gray-300 text-black self-start" >
          {message.lang == "sql" ? 
              <SqlResultTable data={message_text_obj} /> 
              : 
              <div dangerouslySetInnerHTML={{__html: message.text}} />
          }
        </div>

        {message.images && (
          <div>
            {message.images.map((image, index) => (
              <div key={index} className="flex flex-col items-center max-w-full">
                <div className="relative w-full max-w-6xl">
                  <a href={image} target="_blank" rel="noopener noreferrer">
                    <Image
                      src={image}
                      alt="Image for user query"
                      width={800}
                      height={600}
                    />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }  
}

export default ChatMessage;
