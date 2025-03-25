import React, { useState, useRef, useEffect } from 'react';
import parse from 'html-react-parser';
import { Send, MessageCircle, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate()
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [botState, setBotState] = useState('stable');
  const messagesEndRef = useRef(null);
  const sessionName = localStorage.getItem('docbot_session_name') || 'Untitled Session';

  // Stable bot image (replace with your actual image path)
  const stableBotImage = "robot_stable.gif";
  
  // Thinking bot image (replace with your actual image path)
  const thinkingBotImage = "robot_thinking.gif";

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleEndSession = () => {
    // Clear messages
    setMessages([]);
    
    // Generate a new session name
    const newSessionName = `Session ${new Date().toLocaleString()}`;
    localStorage.setItem('docbot_session_name', newSessionName);
    
    // Reset other states
    setInput('');
    setIsLoading(false);
    setBotState('stable');
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Set bot to thinking state
    setBotState('thinking');
    
    // Add user message to chat
    const userMessage = { text: input, sender: 'user', timestamp: new Date() };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    
    // Set loading state
    setIsLoading(true);
    
    try {
      // Send request to backend
      const response = await fetch('https://docbot-server.onrender.com/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_input: input,
          session_name: sessionName
        })
      });
      
      if (!response.ok) throw new Error('Failed to get response');
      
      const data = await response.json();
      
      // Add AI response to chat
      const aiMessage = { text: data.response, sender: 'ai', timestamp: new Date() };
      setMessages(prevMessages => [...prevMessages, aiMessage]);
      
      // Set bot back to stable state
      setBotState('stable');
    } catch (error) {
      console.error('Error:', error);
      // Add error message to chat
      const errorMessage = { 
        text: 'Sorry, there was an error processing your request.', 
        sender: 'ai', 
        error: true,
        timestamp: new Date() 
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
      
      // Set bot back to stable state
      setBotState('stable');
    } finally {
      setIsLoading(false);
    }
  };

  // Format timestamp
  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Parse and render formatted AI responses
  const renderFormattedResponse = (text) => {
    text = text.replace(/<think>.*?<\/think>/gs, "").trim();
    return parse(text);
  };

  return (
    <div className="min-h-screen bg-[#030303] flex flex-col lg:flex-row items-center justify-center p-6">
      {/* Desktop Bot Section - Hidden on mobile */}
      <div className="hidden lg:block w-1/3 pr-8 text-center">
        <div className="bg-[#0010400] border-0 border-cyan-400 rounded-2xl p-6 shadow-2xl">
          <img 
            src={botState === 'stable' ? stableBotImage : thinkingBotImage} 
            alt="DocBot"
            className="mx-auto w-64 h-64 object-cover rounded-2xl transition-all duration-300 transform hover:scale-105"
          />
          <h3 className="mt-4 text-2xl font-bold text-cyan-300">
            {botState === 'stable' ? 'DocBot' : 'Thinking...'}
          </h3>
        </div>
      </div>

      {/* Chat Section */}
      <div className="w-full lg:w-2/3 max-w-4xl flex flex-col h-[90vh]">
        {/* Session Header */}
        <div className="bg-[#001040] border-2 border-cyan-400 rounded-t-2xl p-4 shadow-2xl shadow-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center">
            <MessageCircle className="text-cyan-400 mr-4" size={30} />
            <h2 className="text-2xl font-bold text-cyan-300">
              {sessionName}
            </h2>
          </div>
          <button 
            onClick={handleEndSession}
            className="bg-red-700 hover:bg-red-800 text-white p-2 rounded-lg flex items-center justify-center transition-colors"
            title="End Session"
          >
            <X onClick={()=>navigate("/")} size={24} />
          </button>
        </div>
        
        {/* Messages Container */}
        <div className="flex-grow bg-[#001040] border-x-2 border-cyan-400 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-cyan-200 text-center my-auto opacity-70">
              Ask a question about your PDFs to get started
            </div>
          ) : (
            messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] p-4 rounded-2xl shadow-lg ${
                    message.sender === 'user' 
                      ? 'bg-[#004080] text-cyan-100' 
                      : message.error 
                        ? 'bg-red-900 text-red-200' 
                        : 'bg-[#002060] text-purple-100'
                  }`}
                >
                  {message.sender === 'ai' ? (
                    <div className="text-sm">
                      {renderFormattedResponse(message.text)}
                    </div>
                  ) : (
                    <div className="text-sm">{message.text}</div>
                  )}
                  <div className="text-xs text-gray-400 mt-2 text-right">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] p-4 rounded-2xl bg-[#002060]">
                <div className="flex gap-2 items-center">
                  <Loader2 className="animate-spin text-purple-400" size={20} />
                  <span className="text-purple-200">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Form */}
        <form 
          onSubmit={handleSendMessage} 
          className="bg-[#001040] border-2 border-cyan-400 rounded-b-2xl p-4 shadow-2xl shadow-cyan-500/30 flex items-center gap-4"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your PDFs..."
            className="flex-grow p-3 rounded-lg bg-[#002060] text-cyan-200 border-2 border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 placeholder-cyan-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-cyan-600 hover:bg-cyan-700 p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="text-white" size={24} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;