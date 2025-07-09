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
}

interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: Date
  type: 'text' | 'image' | 'file' | 'audio'
  isRead: boolean
  chatId?: string
  reactions?: { emoji: string; count: number }[]
  isForwarded?: boolean
  replyTo?: {
    id: string
    content: string
    senderName: string
  }
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
}

// Оставляю только нужных пользователей и переименовываю Telegram на Actogram
const mockUsers: User[] = [
  {
    id: '1',
    username: 'Actogram',
    fullName: 'Actogram',
    isOnline: true,
    lastSeen: 'online',
    bio: 'Служебные уведомления',
    isVerified: true
  },
  {
    id: '3',
    username: 'Избранное',
    fullName: 'Избранное',
    isOnline: true,
    lastSeen: 'online',
    isVerified: true
  }
]

const mockChats: Chat[] = [
  {
    id: '1',
    name: 'Actogram',
    unreadCount: 0,
    isGroup: false,
    participants: [mockUsers[0]],
    isOnline: true,
    isPinned: true,
    lastMessage: {
      id: '1',
      senderId: '1',
      senderName: 'Actogram',
      content: 'Actogram Web A Digest Many new features and use...',
      timestamp: new Date('2024-01-15T09:05:00'),
      type: 'text',
      isRead: true
    }
  },
  {
    id: '3',
    name: 'Избранное',
    unreadCount: 0,
    isGroup: false,
    participants: [mockUsers[1]],
    lastMessage: {
      id: '3',
      senderId: '3',
      senderName: 'Избранное',
      content: 'FOREx',
      timestamp: new Date('2024-01-14T08:37:00'),
      type: 'text',
      isRead: true
    }
  }
]

const mockMessages: Message[] = [
  {
    id: '1',
    senderId: '1',
    senderName: 'Telegram',
    content: `📱 Messages.
• Read-Time in Private Chats

• You can now replace media when editing messages.
• The app learned to preserve the selected mode for topics in groups.

• Whenever you create a small group, Web A suggests a name for it based on users' name you have added.

📢 Channels
• Added custom channel reactions.
• Implemented channel stories stats.
• Channel emoji statuses.
• Similar Channels.

👥 Groups
• 9 new features for groups.

🤖 Bots
• Edit your bots info right from their profile.

📖 Stories
• Added support for forwarded stories and channel posts in stories.

✨ Extra
• Giveaway Improvements: displaying winners list and additional prizes.

March

📢 Channels
• Admins will soon be able to launch giveaways in their channels.

✨ Extra
• Added support for Emoji v15.1.
• Some design enhancements for shared contacts, links preview and more.`,
    timestamp: new Date('2024-01-15T09:05:00'),
    type: 'text',
    isRead: true
  }
]

const reactionEmojis = ['❤️', '👍', '😂', '😮', '😢', '😡', '🔥', '👏', '🎉', '💯']

const API_BASE = 'https://actogr.onrender.com'

// --- AUTH FORM COMPONENT ---
import { Mail, Eye, EyeOff, ArrowRight, Github, Apple, Chrome, Globe } from 'lucide-react'

// Types for AuthForm
 type Language = 'ru' | 'uz' | 'en';
 interface Translations {
   appName: string; tagline: string; features: { messaging: string; connect: string; encryption: string; };
   signIn: string; signUp: string; fullName: string; emailAddress: string; password: string; confirmPassword: string;
   forgotPassword: string; createAccount: string; continueWith: string; termsText: string; termsOfService: string; privacyPolicy: string; and: string;
 }
 const translations: Record<Language, Translations> = {
   en: { appName: 'Actogram', tagline: 'Connect, Share, Inspire', features: { messaging: 'Real-time messaging', connect: 'Connect with friends', encryption: 'End-to-end encryption' }, signIn: 'Sign In', signUp: 'Sign Up', fullName: 'Full Name', emailAddress: 'Email Address', password: 'Password', confirmPassword: 'Confirm Password', forgotPassword: 'Forgot Password?', createAccount: 'Create Account', continueWith: 'or continue with', termsText: 'By signing up, you agree to our', termsOfService: 'Terms of Service', privacyPolicy: 'Privacy Policy', and: 'and' },
   ru: { appName: 'Актограм', tagline: 'Общайтесь, Делитесь, Вдохновляйте', features: { messaging: 'Сообщения в реальном времени', connect: 'Общение с друзьями', encryption: 'Сквозное шифрование' }, signIn: 'Войти', signUp: 'Регистрация', fullName: 'Полное имя', emailAddress: 'Электронная почта', password: 'Пароль', confirmPassword: 'Подтвердите пароль', forgotPassword: 'Забыли пароль?', createAccount: 'Создать аккаунт', continueWith: 'или продолжить с', termsText: 'Регистрируясь, вы соглашаетесь с нашими', termsOfService: 'Условиями использования', privacyPolicy: 'Политикой конфиденциальности', and: 'и' },
   uz: { appName: 'Aktogram', tagline: 'Bog\'lanish, Ulashish, Ilhomlantirish', features: { messaging: 'Jonli xabar almashish', connect: 'Do\'stlar bilan aloqa', encryption: 'To\'liq shifrlash' }, signIn: 'Kirish', signUp: 'Ro\'yxatga olish', fullName: 'Ism familiya', emailAddress: 'Elektron pochta', password: 'Parol', confirmPassword: 'Parolni tasdiqlang', forgotPassword: 'Parolni unutdingiz?', createAccount: 'Akkaunt yaratish', continueWith: 'yoki boshqa usul bilan', termsText: 'Ro\'yxatga olish orqali siz bizning', termsOfService: 'Foydalanish shartlari', privacyPolicy: 'Maxfiylik nizomi', and: 'va' }
 };
 const languageNames: Record<Language, string> = { en: 'English', ru: 'Русский', uz: 'O\'zbekcha' };
 const languageFlags: Record<Language, string> = { en: '🇺🇸', ru: '🇷🇺', uz: '🇺🇿' };

const LanguageSelector: React.FC<{ currentLanguage: Language; onLanguageChange: (language: Language) => void; }> = ({ currentLanguage, onLanguageChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-white hover:bg-white/20 transition-all duration-300">
        <Globe size={16} />
        <span className="text-sm font-medium">{languageFlags[currentLanguage]} {languageNames[currentLanguage]}</span>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
            {(Object.keys(languageNames) as Language[]).map((lang) => (
              <button key={lang} onClick={() => { onLanguageChange(lang); setIsOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 ${currentLanguage === lang ? 'bg-purple-50 text-purple-600' : 'text-gray-700'}`}>
                <span className="text-lg">{languageFlags[lang]}</span>
                <span className="font-medium">{languageNames[lang]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// AuthForm component
const AuthForm: React.FC<{ onAuthSuccess: (token: string, user: any) => void }> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('uz');
  const [formData, setFormData] = useState({ email: '', password: '', name: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = translations[currentLanguage];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('https://actogr.onrender.com/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isLogin ? 'login' : 'register',
          email: formData.email,
          password: formData.password,
          fullName: formData.name,
          username: isLogin ? undefined : '@' + (formData.email.split('@')[0] || 'user'),
        })
      });
      const data = await res.json();
      if (data.success && data.token && data.user) {
        onAuthSuccess(data.token, data.user);
      } else {
        setError(data.error || 'Ошибка авторизации');
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="absolute top-6 right-6 z-30">
        <LanguageSelector currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
      </div>
      <div className="relative w-full max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="flex flex-col lg:flex-row min-h-[600px]">
            <div className="lg:w-1/2 bg-gradient-to-br from-purple-600 to-blue-600 p-8 lg:p-12 flex flex-col justify-center items-center text-white relative overflow-hidden">
              <div className="relative z-10 text-center">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <MessageCircle size={40} className="text-white" />
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">{t.appName}</h1>
                  <p className="text-lg opacity-90 mb-8">{t.tagline}</p>
                </div>
                <div className="space-y-4 text-left">
                  <div className="flex items-center space-x-3"><div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><MessageCircle size={16} /></div><span className="text-sm">{t.features.messaging}</span></div>
                  <div className="flex items-center space-x-3"><div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><User size={16} /></div><span className="text-sm">{t.features.connect}</span></div>
                  <div className="flex items-center space-x-3"><div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><Lock size={16} /></div><span className="text-sm">{t.features.encryption}</span></div>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 p-8 lg:p-12">
              <div className="max-w-md mx-auto">
                <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
                  <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-300 ${isLogin ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-600 hover:text-gray-900'}`}>{t.signIn}</button>
                  <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-300 ${!isLogin ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-600 hover:text-gray-900'}`}>{t.signUp}</button>
                </div>
                {error && <div className="mb-4 text-red-500 text-center text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {!isLogin && (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User className="h-5 w-5 text-gray-400" /></div>
                      <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder={t.fullName} className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-300 bg-gray-50 hover:bg-white" required={!isLogin} />
                    </div>
                  )}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder={t.emailAddress} className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-300 bg-gray-50 hover:bg-white" required />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
                    <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} placeholder={t.password} className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-300 bg-gray-50 hover:bg-white" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                  </div>
                  {!isLogin && (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
                      <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} placeholder={t.confirmPassword} className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-300 bg-gray-50 hover:bg-white" required={!isLogin} />
                    </div>
                  )}
                  {isLogin && (
                    <div className="flex justify-end">
                      <button type="button" className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200">{t.forgotPassword}</button>
                    </div>
                  )}
                  <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl group disabled:opacity-60 disabled:cursor-not-allowed">
                    <span className="flex items-center justify-center space-x-2">
                      <span>{isLogin ? t.signIn : t.createAccount}</span>
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-200" />
                    </span>
                  </button>
                </form>
                <div className="my-8 flex items-center"><div className="flex-1 border-t border-gray-200"></div><span className="px-4 text-gray-500 text-sm">{t.continueWith}</span><div className="flex-1 border-t border-gray-200"></div></div>
                <div className="grid grid-cols-3 gap-4">
                  <button className="flex items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-300 group"><Chrome size={24} className="text-gray-600 group-hover:text-blue-600" /></button>
                  <button className="flex items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-300 group"><Apple size={24} className="text-gray-600 group-hover:text-black" /></button>
                  <button className="flex items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-300 group"><Github size={24} className="text-gray-600 group-hover:text-black" /></button>
                </div>
                {!isLogin && (<p className="text-xs text-gray-500 text-center mt-6">{t.termsText} <a href="#" className="text-purple-600 hover:text-purple-700">{t.termsOfService}</a> {t.and} <a href="#" className="text-purple-600 hover:text-purple-700">{t.privacyPolicy}</a></p>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [chats, setChats] = useState<Chat[]>(mockChats)
  const [selectedChat, setSelectedChat] = useState<Chat | null>(mockChats[0])
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [darkMode, setDarkMode] = useState(true) // По умолчанию ночная тема
  const [isConnected, setIsConnected] = useState(true)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [showAuth, setShowAuth] = useState(false)
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
        if (chatList.length > 0) {
          setChats(chatList)
          setSelectedChat(chatList[0])
        }
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
    setChats(mockChats)
    setSelectedChat(mockChats[0])
    setMessages(mockMessages)
    setShowAuth(false)
    localStorage.removeItem('actogram_token')
    localStorage.removeItem('actogram_user')
    if (socket) {
      socket.disconnect()
      setSocket(null)
    }
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return

    if (socket && user) {
      // Отправка через Socket.IO если подключен
      const messageData = {
        chatId: selectedChat.id,
        content: newMessage.trim(),
        type: 'text',
        isEncrypted: false
      }
      socket.emit('send_message', messageData)
    } else {
      // Fallback на моковые данные
      const message: Message = {
        id: Date.now().toString(),
        senderId: 'me',
        senderName: 'Вы',
        content: newMessage.trim(),
        timestamp: new Date(),
        type: 'text',
        isRead: false
      }
      setMessages(prev => [...prev, message])
    }
    
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
    
    if (socket && user) {
      socket.emit('join_chat', chat.id)
      socket.emit('get_messages', { chatId: chat.id, userId: user.id })
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

  // Tabs state
  const [activeTab, setActiveTab] = useState<'all' | 'private' | 'foryou' | 'new'>('all')

  // Фильтрация чатов по табу
  const filteredChats = chats.filter(chat => {
    if (activeTab === 'all') return chat
    if (activeTab === 'private') return !chat.isGroup
    if (activeTab === 'foryou') return chat.name === 'Избранное'
    if (activeTab === 'new') return chat.unreadCount > 0
    return chat
  }).filter(chat => chat.name.toLowerCase().includes(searchQuery.toLowerCase()))

  // Состояние для модального окна настроек
  const [showSettings, setShowSettings] = useState(false)

  // Authentication Modal
  if (showAuth) {
    return <AuthForm onAuthSuccess={(token, user) => {
      setToken(token);
      setUser(user);
      setShowAuth(false);
      localStorage.setItem('actogram_token', token);
      localStorage.setItem('actogram_user', JSON.stringify(user));
    }} />
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
                {user ? (
                  <button 
                    onClick={() => setShowSearch(!showSearch)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowAuth(true)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                  </button>
                )}
                {user && (
                  <button 
                    onClick={handleLogout}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => setShowSettings(true)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Поиск"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* User Search Results */}
          {showSearch && user && (
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

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button onClick={() => setActiveTab('all')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>Все <span className="ml-1 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">{chats.length}</span></button>
            <button onClick={() => setActiveTab('private')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'private' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>Личные</button>
            <button onClick={() => setActiveTab('foryou')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'foryou' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>Для вас</button>
            <button onClick={() => setActiveTab('new')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'new' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>Новые <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white rounded text-xs">{chats.filter(c => c.unreadCount > 0).length}</span></button>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {filteredChats.map((chat) => (
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
                          {chat.lastMessage.senderId === 'me' && (
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
            ))}
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
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md group relative ${
                        message.senderId === 'me'
                          ? 'bg-blue-500 text-white ml-12'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white mr-12'
                      }`}
                    >
                      {message.senderId !== 'me' && (
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
                          {message.senderId === 'me' && (
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
                ))}

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
      {/* Модальное окно настроек */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md relative">
            <button onClick={() => setShowSettings(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">✕</button>
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Настройки</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Тёмная тема</span>
                <button onClick={() => setDarkMode(!darkMode)} className="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center px-1">
                  <span className={`inline-block w-4 h-4 rounded-full transition-transform ${darkMode ? 'bg-blue-500 translate-x-4' : 'bg-gray-400 translate-x-0'}`}></span>
                </button>
              </div>
              {/* Здесь можно добавить другие настройки */}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
