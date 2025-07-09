"use client"

import React, { useState, useRef, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import {
  MessageCircle,
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile, 
  ArrowLeft,
  Lock, 
  Shield, 
  Star,
  Check, 
  CheckCheck, 
  Mic, 
  Settings,
  Plus,
  Archive,
  Bookmark,
  Moon,
  Sun,
  Bell,
  User,
  Edit3,
  Camera,
  Image,
  File,
  MapPin,
  Heart,
  ThumbsUp,
  Laugh,
  Angry,
  Zap,
  Wifi,
  WifiOff,
  LogIn,
  LogOut
} from 'lucide-react'

interface User {
  id: string
  username: string
  fullName: string
  avatar?: string
  isOnline: boolean
  lastSeen: string
  bio?: string
  isVerified?: boolean
  status?: string
}

interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: Date
  type: 'text' | 'image' | 'file' | 'audio'
  isRead: boolean
  reactions?: { emoji: string; count: number }[]
  isForwarded?: boolean
  replyTo?: {
    id: string
    content: string
    senderName: string
  }
  chatId?: string // Added for new_message event
}

interface Chat {
  id: string
  name: string
  avatar?: string
  lastMessage?: Message
  unreadCount: number
  isGroup: boolean
  participants: User[]
  isOnline?: boolean
  lastSeen?: string
  isPinned?: boolean
  isMuted?: boolean
  isArchived?: boolean
  type?: string
  description?: string
}

const API_BASE = 'https://actogr.onrender.com'

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [darkMode, setDarkMode] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [showAuth, setShowAuth] = useState(true)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    username: '',
    fullName: ''
  })
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [showSearch, setShowSearch] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check for existing token on load
  useEffect(() => {
    const savedToken = localStorage.getItem('actogram_token')
    const savedUser = localStorage.getItem('actogram_user')
    
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      setShowAuth(false)
    }
  }, [])

  // Initialize socket connection
  useEffect(() => {
    if (token && user) {
      const newSocket = io(API_BASE, {
        auth: { token }
      })

      newSocket.on('connect', () => {
        console.log('Connected to server')
        setIsConnected(true)
      })

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server')
        setIsConnected(false)
      })

      newSocket.on('my_chats', (chatList: Chat[]) => {
        setChats(chatList)
      })

      newSocket.on('chat_messages', (data: { chatId: string; messages: Message[] }) => {
        if (selectedChat?.id === data.chatId) {
          setMessages(data.messages)
        }
      })

      newSocket.on('new_message', (message: Message) => {
        if (selectedChat?.id === message.chatId) {
          setMessages(prev => [...prev, message])
        }
        // Update chat list with new message
        setChats(prev => prev.map(chat => {
          if (chat.id === message.chatId) {
            return { ...chat, lastMessage: message }
          }
          return chat
        }))
      })

      newSocket.on('user_typing', (data: { userId: string; username: string; chatId: string }) => {
        if (selectedChat?.id === data.chatId) {
          setTypingUsers(prev => [...prev, data.username])
        }
      })

      newSocket.on('user_stop_typing', (data: { userId: string; chatId: string }) => {
        if (selectedChat?.id === data.chatId) {
          setTypingUsers(prev => prev.filter(name => name !== data.userId))
        }
      })

      newSocket.on('search_results', (results: User[]) => {
        setSearchResults(results)
      })

      setSocket(newSocket)

      // Get user's chats
      newSocket.emit('get_my_chats', user.id)

      return () => {
        newSocket.disconnect()
      }
    }
  }, [token, user])

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setShowSidebar(!mobile)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const handleAuth = async (mode: 'login' | 'register') => {
    try {
      const response = await fetch(`${API_BASE}/api/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: mode,
          ...authData
        }),
      })

      const data = await response.json()

      if (data.success) {
        setToken(data.token)
        setUser(data.user)
        setShowAuth(false)
        localStorage.setItem('actogram_token', data.token)
        localStorage.setItem('actogram_user', JSON.stringify(data.user))
      } else {
        alert(data.error || 'Ошибка авторизации')
      }
    } catch (error) {
      console.error('Auth error:', error)
      alert('Ошибка подключения к серверу')
    }
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
    setChats([])
    setSelectedChat(null)
    setMessages([])
    setShowAuth(true)
    localStorage.removeItem('actogram_token')
    localStorage.removeItem('actogram_user')
    if (socket) {
      socket.disconnect()
      setSocket(null)
    }
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat || !socket) return

    const messageData = {
      chatId: selectedChat.id,
      content: newMessage.trim(),
      type: 'text',
      isEncrypted: false
    }

    socket.emit('send_message', messageData)
    setNewMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat)
    if (isMobile) setShowSidebar(false)
    
    if (socket) {
      socket.emit('join_chat', chat.id)
      socket.emit('get_messages', { chatId: chat.id, userId: user?.id })
    }
  }

  const handleSearchUsers = (query: string) => {
    if (socket && query.length >= 2) {
      socket.emit('search_users', query)
    } else {
      setSearchResults([])
    }
  }

  const handleCreatePrivateChat = (otherUser: User) => {
    if (!socket || !user) return

    const chatId = `private_${user.id}_${otherUser.id}`
    
    socket.emit('create_private_chat', {
      userId: otherUser.id,
      chatId,
      createdBy: user.id
    })
    
    setShowSearch(false)
    setSearchQuery('')
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatLastSeen = (lastSeen: string) => {
    if (lastSeen === 'online') return 'в сети'
    if (lastSeen === 'вчера') return 'был(а) вчера'
    return `был(а) в ${lastSeen}`
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      'from-red-500 to-pink-500',
      'from-blue-500 to-cyan-500', 
      'from-green-500 to-emerald-500',
      'from-purple-500 to-violet-500',
      'from-orange-500 to-yellow-500',
      'from-indigo-500 to-blue-500',
      'from-pink-500 to-rose-500',
      'from-teal-500 to-green-500'
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Authentication Modal
  if (showAuth) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ACTOGRAM</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {authMode === 'login' ? 'Войдите в аккаунт' : 'Создайте аккаунт'}
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleAuth(authMode) }}>
            {authMode === 'register' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username (@username)
                  </label>
                  <input
                    type="text"
                    value={authData.username}
                    onChange={(e) => setAuthData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="@username"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Полное имя
                  </label>
                  <input
                    type="text"
                    value={authData.fullName}
                    onChange={(e) => setAuthData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ваше имя"
                    required
                  />
                </div>
              </>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={authData.email}
                onChange={(e) => setAuthData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Пароль
              </label>
              <input
                type="password"
                value={authData.password}
                onChange={(e) => setAuthData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Минимум 8 символов"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {authMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-blue-500 hover:text-blue-600 text-sm"
            >
              {authMode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Есть аккаунт? Войти'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-screen flex ${darkMode ? 'dark' : ''}`}>
      <div className="h-screen flex bg-gray-100 dark:bg-gray-900 w-full relative overflow-hidden">
        
        {/* Sidebar */}
        <div className={`${
          isMobile ? 'fixed inset-y-0 left-0 z-50 w-full' : 'w-80 min-w-80'
        } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ${
          isMobile && !showSidebar ? '-translate-x-full' : 'translate-x-0'
        }`}>
          
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-white" />
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">ACTOGRAM</h1>
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    {isConnected ? (
                      <>
                        <Wifi className="h-3 w-3 text-green-500" />
                        <span>Подключено</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3 w-3 text-red-500" />
                        <span>Нет соединения</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <button 
                  onClick={() => setShowSearch(!showSearch)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Поиск чатов"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* User Search Results */}
          {showSearch && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Поиск пользователей..."
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleCreatePrivateChat(user)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <div className={`w-8 h-8 bg-gradient-to-br ${getAvatarColor(user.fullName)} rounded-full flex items-center justify-center`}>
                      <span className="text-white font-semibold text-sm">
                        {user.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {user.fullName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {user.username}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {filteredChats.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Нет чатов</p>
                <p className="text-sm">Начните общение с кем-нибудь</p>
              </div>
            ) : (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleChatSelect(chat)}
                  className={`p-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    selectedChat?.id === chat.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={`w-12 h-12 bg-gradient-to-br ${getAvatarColor(chat.name)} rounded-full flex items-center justify-center shadow-sm`}>
                        <span className="text-white font-semibold text-lg">
                          {chat.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {chat.participants[0]?.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                      )}
                      {chat.isPinned && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center">
                          <Star className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {chat.name}
                          </h3>
                          {chat.participants[0]?.isVerified && (
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <Check className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                          {chat.isMuted && (
                            <Bell className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                        {chat.lastMessage && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(chat.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                      
                      {chat.lastMessage && (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 dark:text-gray-300 truncate flex-1">
                            {chat.lastMessage.type === 'image' ? '📷 фотография' : chat.lastMessage.content}
                          </p>
                          <div className="flex items-center gap-1 ml-2">
                            {chat.lastMessage.senderId === user?.id && (
                              chat.lastMessage.isRead ? (
                                <CheckCheck className="h-3 w-3 text-blue-500" />
                              ) : (
                                <Check className="h-3 w-3 text-gray-400" />
                              )
                            )}
                            {chat.unreadCount > 0 && (
                              <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded-full text-xs font-medium min-w-[18px] text-center">
                                {chat.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col min-w-0 ${isMobile && showSidebar ? 'hidden' : 'flex'}`}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {isMobile && (
                      <button
                        onClick={() => setShowSidebar(true)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                    )}
                    
                    <div className="relative">
                      <div className={`w-10 h-10 bg-gradient-to-br ${getAvatarColor(selectedChat.name)} rounded-full flex items-center justify-center`}>
                        <span className="text-white font-semibold">
                          {selectedChat.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {selectedChat.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-gray-900 dark:text-white">
                          {selectedChat.name}
                        </h2>
                        {selectedChat.participants[0]?.isVerified && (
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {typingUsers.length > 0 
                          ? `${typingUsers.join(', ')} печатает...`
                          : selectedChat.isOnline 
                            ? 'в сети' 
                            : formatLastSeen(selectedChat.lastSeen || '')
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <Phone className="h-4 w-4" />
                    </button>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <Video className="h-4 w-4" />
                    </button>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Нет сообщений</p>
                    <p className="text-sm">Начните общение</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md group relative ${
                          message.senderId === user?.id
                            ? 'bg-blue-500 text-white ml-12'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white mr-12'
                        }`}
                      >
                        {message.senderId !== user?.id && (
                          <p className="text-xs font-semibold mb-1 text-blue-600 dark:text-blue-400">
                            {message.senderName}
                          </p>
                        )}
                        
                        <div className="whitespace-pre-wrap break-words leading-relaxed text-sm">
                          {message.content}
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs opacity-70">
                            {formatTime(message.timestamp)}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            {message.senderId === user?.id && (
                              message.isRead ? (
                                <CheckCheck className="h-3 w-3 opacity-70" />
                              ) : (
                                <Check className="h-3 w-3 opacity-70" />
                              )
                            )}
                          </div>
                        </div>

                        {/* Reaction button */}
                        <button className="absolute -bottom-2 right-2 w-5 h-5 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110">
                          <Heart className="h-2.5 w-2.5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {typingUsers.length > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {typingUsers.join(', ')} печатает...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <input type="file" ref={fileInputRef} className="hidden" accept="*/*" />
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Paperclip className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </button>
                  
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Сообщение"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full px-4 py-2 pr-10 bg-gray-100 dark:bg-gray-700 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                    >
                      <Smile className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                  
                  {newMessage.trim() ? (
                    <button
                      onClick={handleSendMessage}
                      className="w-9 h-9 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors"
                    >
                      <Send className="h-4 w-4 text-white" />
                    </button>
                  ) : (
                    <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <Mic className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center space-y-4 max-w-md mx-auto p-8">
                {isMobile && (
                  <button
                    onClick={() => setShowSidebar(true)}
                    className="mb-6 px-6 py-3 bg-blue-500 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  >
                    <MessageCircle className="h-5 w-5 mr-2 inline" />
                    Открыть чаты
                  </button>
                )}
                
                <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <MessageCircle className="h-12 w-12 text-white" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Добро пожаловать в ACTOGRAM
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Выберите чат, чтобы начать общение
                  </p>
                </div>
                
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>Безопасно</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span>Быстро</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Lock className="h-4 w-4 text-blue-500" />
                    <span>Зашифровано</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
