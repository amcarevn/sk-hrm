import React, { useState, useEffect, useRef } from 'react';
import { Chatbot, Message, Conversation } from '../utils/api';
import { websocketClient, ChatMessage, ChatResponse } from '../utils/websocket';
import { conversationsAPI } from '../utils/api';

interface ChatInterfaceProps {
  chatbot: Chatbot;
  conversation?: Conversation;
  onConversationUpdate?: (conversation: Conversation) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  chatbot,
  conversation,
  onConversationUpdate,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<
    Conversation | undefined
  >(conversation);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation messages and join room
  useEffect(() => {
    if (currentConversation) {
      loadMessages();
      // Join the conversation room
      websocketClient.joinConversation(currentConversation.id);
      console.log('Joined conversation room:', currentConversation.id);
    }
  }, [currentConversation]);

  // WebSocket event listeners
  useEffect(() => {
    const handleChatResponse = (data: ChatResponse) => {
      if (data.originalMessage?.conversationId === currentConversation?.id) {
        console.log('[DEBUG] Chat response data:', data);

        // NEW: Handle message_segments if available (JSON format)
        if (
          data.metadata?.message_segments &&
          Array.isArray(data.metadata.message_segments)
        ) {
          console.log(
            '[DEBUG] Multi-message format detected:',
            data.metadata.message_segments.length
          );

          // Create separate messages for each segment
          const newMessages: Message[] = data.metadata.message_segments
            .filter((segment: any) => segment.message_type === 'content')
            .map((segment: any, index: number) => ({
              id: `${data.id}_segment_${segment.order || index + 1}`,
              conversationId: data.originalMessage?.conversationId || '',
              role: 'ASSISTANT' as const,
              content: segment.content,
              metadata: {
                ...data.metadata,
                segmentOrder: segment.order || index + 1,
                isSegmented: true,
                totalSegments: data.metadata.message_segments.length,
              },
              createdAt: new Date(data.timestamp).toISOString(),
            }));

          // Add all segments at once
          setMessages((prev) => [...prev, ...newMessages]);
          console.log('[DEBUG] Added', newMessages.length, 'message segments');
        } else {
          // FALLBACK: Single message format
          console.log('[DEBUG] Single message format');
          const newMessage: Message = {
            id: data.id,
            conversationId: data.originalMessage?.conversationId || '',
            role: 'ASSISTANT',
            content: data.response,
            metadata: data.metadata,
            createdAt: new Date(data.timestamp).toISOString(),
          };

          setMessages((prev) => [...prev, newMessage]);
        }

        setIsLoading(false);
      }
    };

    const handleChatError = (data: { message: string; error: string }) => {
      console.error('Chat error:', data);
      setIsLoading(false);
      // You can show an error toast here
    };

    websocketClient.on('chat:response', handleChatResponse);
    websocketClient.on('chat:error', handleChatError);

    return () => {
      websocketClient.off('chat:response', handleChatResponse);
      websocketClient.off('chat:error', handleChatError);

      // Leave conversation room on cleanup
      if (currentConversation) {
        websocketClient.leaveConversation(currentConversation.id);
        console.log('Left conversation room:', currentConversation.id);
      }
    };
  }, [currentConversation]);

  const loadMessages = async () => {
    if (!currentConversation) return;

    try {
      const conversationData = await conversationsAPI.getById(
        currentConversation.id
      );
      setMessages(conversationData.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const createNewConversation = async () => {
    try {
      const newConversation = await conversationsAPI.create({
        title: `Chat with ${chatbot.name}`,
        chatbotId: chatbot.id,
      });
      setCurrentConversation(newConversation);
      setMessages([]);
      onConversationUpdate?.(newConversation);

      // Join the conversation room
      websocketClient.joinConversation(newConversation.id);
      console.log('Joined conversation room:', newConversation.id);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Create conversation if none exists
    if (!currentConversation) {
      await createNewConversation();
      return;
    }

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId: currentConversation.id,
      role: 'USER',
      content: inputMessage,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    // REMOVED: setIsLoading(true) - Allow continuous message sending

    try {
      // Send message via WebSocket
      const chatMessage: ChatMessage = {
        id: userMessage.id,
        conversationId: currentConversation.id,
        chatbotId: chatbot.id,
        userId: currentConversation.userId,
        message: userMessage.content,
        timestamp: new Date(),
      };

      console.log('Sending chat message via WebSocket:', chatMessage);
      websocketClient.sendChatMessage(chatMessage);
    } catch (error) {
      console.error('Failed to send message:', error);
      // No need to set isLoading false anymore
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">
              {chatbot.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{chatbot.name}</h3>
            <p className="text-sm text-gray-500">
              {currentConversation ? 'Đang trò chuyện' : 'Không có trò chuyện'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!currentConversation && (
            <button
              onClick={createNewConversation}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Bắt đầu trò chuyện
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {currentConversation ? (
              <p>Không có tin nhắn. Bắt đầu trò chuyện!</p>
            ) : (
              <p>Nhấn "Bắt đầu trò chuyện" để bắt đầu trò chuyện mới</p>
            )}
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.id}-${index}`}
              className={`flex ${
                message.role === 'USER' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'USER'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.role === 'USER' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div
                    key="dot1"
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  />
                  <div
                    key="dot2"
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  />
                  <div
                    key="dot3"
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                </div>
                <span className="text-sm">Đang suy nghĩ...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyUp={handleKeyPress}
            placeholder={
              currentConversation
                ? 'Nhập tin nhắn...'
                : "Nhấn 'Bắt đầu trò chuyện' để bắt đầu"
            }
            disabled={!currentConversation}
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || !currentConversation}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
