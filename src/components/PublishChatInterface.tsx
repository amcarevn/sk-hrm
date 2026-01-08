import React, { useState, useEffect, useRef } from 'react';
import { Chatbot, Message, Conversation } from '../utils/api';
import { websocketClient, ChatMessage, ChatResponse } from '../utils/websocket';
import './PublishChatInterface.css';

interface PublishChatInterfaceProps {
  chatbot: Chatbot;
  apiKey: string;
  isWebviewMode?: boolean;
}

const PublishChatInterface: React.FC<PublishChatInterfaceProps> = ({
  chatbot,
  apiKey,
  isWebviewMode = false,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsConnecting, setWsConnecting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Connect WebSocket on component mount
  useEffect(() => {
    connectWebSocket();
  }, []);

  // Create new conversation after WebSocket is connected
  useEffect(() => {
    if (wsConnected && !currentConversation) {
      createNewConversation();
    }
  }, [wsConnected, currentConversation]);

  // Load conversation messages and join room
  useEffect(() => {
    if (currentConversation && wsConnected) {
      // Join the conversation room
      try {
        websocketClient.joinConversation(currentConversation.id);
        console.log('Joined conversation room:', currentConversation.id);
      } catch (error) {
        console.error('Failed to join conversation room:', error);
      }
    }
  }, [currentConversation, wsConnected]);

  // WebSocket event listeners
  useEffect(() => {
    const handleChatResponse = (data: ChatResponse) => {
      console.log('[handleChatResponse] Chat response:', data);

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

          // Add all segments at once with small delay between them for better UX
          newMessages.forEach((msg, index) => {
            setTimeout(() => {
              setMessages((prev) => [...prev, msg]);
            }, index * 300); // 300ms delay between segments for natural typing effect
          });

          console.log(
            '[DEBUG] Added',
            newMessages.length,
            'message segments with typing effect'
          );
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

    const handleConnect = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
      setWsConnecting(false);
    };

    const handleDisconnect = (reason: string) => {
      console.log('WebSocket disconnected:', reason);
      setWsConnected(false);
    };

    const handleConnectError = (error: Error) => {
      console.error('WebSocket connection error:', error);
      setWsConnected(false);
      setWsConnecting(false);
      // Retry connection after 2 seconds
      setTimeout(() => {
        if (!wsConnected && !wsConnecting) {
          connectWebSocket();
        }
      }, 2000);
    };

    websocketClient.on('chat:response', handleChatResponse);
    websocketClient.on('chat:error', handleChatError);
    websocketClient.on('connect', handleConnect);
    websocketClient.on('disconnect', handleDisconnect);
    websocketClient.on('connect_error', handleConnectError);

    return () => {
      websocketClient.off('chat:response', handleChatResponse);
      websocketClient.off('chat:error', handleChatError);
      websocketClient.off('connect', handleConnect);
      websocketClient.off('disconnect', handleDisconnect);
      websocketClient.off('connect_error', handleConnectError);

      // Leave conversation room on cleanup
      if (currentConversation && wsConnected) {
        try {
          websocketClient.leaveConversation(currentConversation.id);
          console.log('Left conversation room:', currentConversation.id);
        } catch (error) {
          console.error('Failed to leave conversation room:', error);
        }
      }
    };
  }, [currentConversation, wsConnected, wsConnecting]);

  const connectWebSocket = async () => {
    if (wsConnecting || wsConnected) return;

    // Check retry limit
    if (retryCount >= maxRetries) {
      console.log('Max retry attempts reached');
      return;
    }

    try {
      setWsConnecting(true);
      console.log(
        `Connecting to WebSocket... (attempt ${retryCount + 1}/${maxRetries})`
      );

      // Disconnect any existing connection first and wait for it to complete
      if (websocketClient.isConnectedToServer()) {
        console.log('Disconnecting existing WebSocket connection...');
        websocketClient.disconnect();
        // Wait a bit for disconnect to complete
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Use API key as token for WebSocket connection
      await websocketClient.connect(apiKey);

      // Reset retry count on successful connection
      setRetryCount(0);
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setWsConnecting(false);
      setRetryCount((prev) => prev + 1);

      // Retry connection after 3 seconds (only if under max retries)
      if (retryCount < maxRetries - 1) {
        setTimeout(() => {
          if (!wsConnected && !wsConnecting) {
            connectWebSocket();
          }
        }, 3000);
      }
    }
  };

  const createNewConversation = async () => {
    if (!wsConnected) {
      console.log('Waiting for WebSocket connection...');
      return;
    }

    try {
      console.log('Creating new conversation...');

      // Create conversation using the publish endpoint
      const response = await fetch(
        `${import.meta.env.VITE_MANAGEMENT_API_URL || 'https://cbbackend.runagent.io'}/api/v1/publish/conversation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            apiKey,
            chatbotId: chatbot.id,
            title: `Chat with ${chatbot.name}`,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create conversation');
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to create conversation');
      }

      setCurrentConversation(data.data.conversation);
      setMessages([]);

      console.log('Conversation created:', data.data.conversation.id);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      // Retry after 2 seconds
      setTimeout(() => {
        if (wsConnected && !currentConversation) {
          createNewConversation();
        }
      }, 2000);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentConversation || !wsConnected) {
      if (!wsConnected) {
        console.log('WebSocket not connected, retrying...');
        connectWebSocket();
      }
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

      // If WebSocket error, try to reconnect
      if (
        error instanceof Error &&
        error.message.includes('WebSocket not connected')
      ) {
        console.log('WebSocket disconnected, attempting to reconnect...');
        setWsConnected(false);
        connectWebSocket();
      }
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

  // Show loading state while connecting
  if (wsConnecting) {
    return (
      <div className="flex flex-col h-[80vh] bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to chat server...</p>
        </div>
      </div>
    );
  }

  // Show error state if WebSocket failed to connect after max retries
  if (!wsConnected && !wsConnecting && retryCount >= maxRetries) {
    return (
      <div className="flex flex-col h-[80vh] bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Connection Failed
          </h3>
          <p className="text-gray-600 mb-4">
            Unable to connect to chat server after {maxRetries} attempts
          </p>
          <button
            onClick={() => {
              setRetryCount(0);
              connectWebSocket();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Webview mode: minimal layout with only chat messages and input
  if (isWebviewMode) {
    return (
      <div className="flex flex-col h-screen bg-white webview-mode">
        {/* Messages Area - Full height minus input area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 messages-container">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="text-gray-600 text-sm">
                Bắt đầu cuộc trò chuyện...
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isUser = message.role === 'USER';
              return (
                <div key={`${message.id}-${index}`}>
                  {/* Message */}
                  <div
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
                  >
                    <div
                      className={`flex items-start space-x-2 max-w-[80%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      <div
                        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                          isUser
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {isUser ? 'U' : chatbot.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Message Content */}
                      <div
                        className={`inline-block px-3 py-2 rounded-lg ${
                          isUser
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                  {chatbot.name.charAt(0).toUpperCase()}
                </div>
                <div className="inline-block px-3 py-2 rounded-lg bg-gray-100 text-gray-900">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      ></div>
                      <div
                        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Minimal Input Area */}
        <div className="p-3 border-t border-gray-200 bg-white">
          <div className="flex space-x-3 items-start">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyUp={handleKeyPress}
                placeholder={
                  wsConnected ? 'Type your message here...' : 'Connecting...'
                }
                disabled={!currentConversation || !wsConnected}
                className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
                rows={1}
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>

            <button
              onClick={sendMessage}
              disabled={
                !inputMessage.trim() || !currentConversation || !wsConnected
              }
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <div className="flex items-center space-x-2">
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
                <span className="font-medium">Send</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[80vh] bg-gray-50">
      {/* Simple Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {chatbot.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {chatbot.name}
            </h3>
            <p className="text-sm text-gray-600 flex items-center">
              <span
                className={`w-2 h-2 rounded-full mr-2 ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}
              ></span>
              {wsConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
        </div>

        <button
          onClick={createNewConversation}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>New Chat</span>
          </div>
        </button>
      </div>

      {/* Messages Area - Inspired by ConversationShow.tsx */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Start a conversation
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Ask me anything! I'm here to help you with information, answer
              questions, or just have a friendly chat.
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isUser = message.role === 'USER';
            const showDate =
              index === 0 ||
              formatTime(message.createdAt) !==
                formatTime(messages[index - 1]?.createdAt);

            return (
              <div key={`${message.id}-${index}`}>
                {/* Date Separator */}
                {showDate && (
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-gray-100 px-3 py-1 rounded-full">
                      <span className="text-xs text-gray-500 font-medium">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Message */}
                <div
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
                >
                  <div
                    className={`flex items-start space-x-3 max-w-2xl ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {isUser ? (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      ) : (
                        <span className="text-sm font-bold">
                          {chatbot.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Message Content */}
                    <div
                      className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}
                    >
                      <div
                        className={`inline-block px-4 py-3 rounded-2xl ${
                          isUser
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </div>

                        {/* Message Metadata */}
                        <div
                          className={`text-xs mt-2 flex items-center justify-between ${
                            isUser ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          <span>{formatTime(message.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3 max-w-2xl">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-gray-600">
                  {chatbot.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="inline-block px-4 py-3 rounded-2xl bg-gray-100 text-gray-900">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">
                      AI is thinking...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Simple Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex space-x-3 items-start">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyUp={handleKeyPress}
              placeholder={
                wsConnected ? 'Type your message here...' : 'Connecting...'
              }
              disabled={!currentConversation || isLoading || !wsConnected}
              className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>

          <button
            onClick={sendMessage}
            disabled={
              !inputMessage.trim() ||
              !currentConversation ||
              isLoading ||
              !wsConnected
            }
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <div className="flex items-center space-x-2">
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
              <span className="font-medium">Send</span>
            </div>
          </button>
        </div>

        {/* Status Info */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>💬 Real-time chat</span>
            <span>🔒 Secure connection</span>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}
            ></span>
            <span>{wsConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublishChatInterface;
