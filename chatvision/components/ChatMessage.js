import Image from 'next/image';

function ChatMessage({ message, isUser, images }) {
  if (isUser) {
    return (
      <div className="rounded-lg px-4 py-2 m-2 max-w-xs bg-blue-500 text-white self-end">
        {message}
      </div>
    );
  }
  else {
    return (
      <>
        <div className="rounded-lg px-4 py-2 m-2 max-w-xs bg-gray-300 text-black self-start" dangerouslySetInnerHTML={{__html: message}} />
        {images && (
          <div>
            {images.map((image, index) => (
              <div key={index} style={{ maxWidth: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '1500px' }}>
                    <a href={image} target="_blank" rel="nofollow noreferrer">
                        <Image
                            src={image}
                            alt="Image for user query"
                            width={1200}
                            height={800}
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
