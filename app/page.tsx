"use client"

import { useState, useEffect, useRef } from "react"
import {
  MessageCircle,
  Users,
  Settings,
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  Wifi,
  WifiOff,
  Paperclip,
  UserPlus,
  Eye,
  EyeOff,
  Shield,
  Lock,
  Mail,
  Trash2,
  Bell,
  Copy,
  Reply,
  X,
  Info,
  Menu,
  ArrowLeft,
  Star,
  Smile,
  Zap,
} from "lucide-react"
import { io, type Socket } from "socket.io-client"

// Интерфейсы
interface User {
  id: string
  username: string
  email: string
  fullName: string
  avatar?: string
  bio?: string
  isOnline: boolean
  lastSeen: Date
  isVerified: boolean
  status: "online" | "away" | "busy" | "offline"
}

interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  chatId: string
  timestamp: Date
  type: "text" | "image" | "file" | "audio" | "video"
  fileUrl?: string
  fileName?: string
  fileSize?: number
  isEncrypted: boolean
  reactions?: { emoji: string; userId: string; username: string }[]
  replyTo?: {
    id: string
    content: string
    senderName: string
  }
  isEdited?: boolean
  readBy?: string[]
}

interface Chat {
  id: string
  name: string
  avatar?: string
  description?: string
  lastMessage?: Message
  unreadCount: number
  isGroup: boolean
  participants: User[]
  messageCount: number
  type: "private" | "group" | "channel"
  isEncrypted: boolean
  createdBy: string
  createdAt: Date
  isPinned?: boolean
  isMuted?: boolean
  theme?: string
}

// Языки
const languages = [
  { code: "uz", name: "O'zbek", flag: "🇺🇿" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "en", name: "English", flag: "🇺🇸" },
]

const translations = {
  uz: {
    appName: "ACTOGRAM",
    welcome: "Xush kelibsiz",
    login: "Kirish",
    register: "Ro'yxatdan o'tish",
    email: "Email",
    password: "Parol",
    username: "Foydalanuvchi nomi",
    fullName: "To'liq ism",
    bio: "Haqida",
    online: "Onlayn",
    offline: "Oflayn",
    typing: "yozmoqda...",
    send: "Yuborish",
    search: "Qidirish...",
    newChat: "Yangi chat",
    settings: "Sozlamalar",
    profile: "Profil",
    darkMode: "Tungi rejim",
    notifications: "Bildirishnomalar",
    language: "Til",
    save: "Saqlash",
    cancel: "Bekor qilish",
    delete: "O'chirish",
    edit: "Tahrirlash",
    reply: "Javob berish",
    copy: "Nusxalash",
    forward: "Yuborish",
    pin: "Mahkamlash",
    mute: "Ovozsiz",
    archive: "Arxiv",
    block: "Bloklash",
    report: "Shikoyat",
    logout: "Chiqish",
    connecting: "Ulanmoqda...",
    connected: "Ulandi",
    disconnected: "Uzildi",
    encrypted: "Shifrlangan",
    verified: "Tasdiqlangan",
    members: "a'zolar",
    messages: "xabarlar",
    noMessages: "Xabarlar yo'q",
    startChat: "Suhbatni boshlang",
    searchUsers: "Foydalanuvchilarni qidiring",
    addMembers: "A'zolar qo'shish",
    createGroup: "Guruh yaratish",
    groupName: "Guruh nomi",
    groupDescription: "Guruh tavsifi",
    selectPhoto: "Rasm tanlash",
    takePhoto: "Rasm olish",
    chooseFromGallery: "Galereyadan tanlash",
    uploadFile: "Fayl yuklash",
    recording: "Yozib olish...",
    playback: "Ijro etish",
    fileSize: "Fayl hajmi",
    downloading: "Yuklab olish...",
    uploaded: "Yuklandi",
    failed: "Xatolik",
    retry: "Qayta urinish",
    comingSoon: "Tez orada...",
    beta: "Beta",
    pro: "Pro",
    premium: "Premium",
    free: "Bepul",
  },
  ru: {
    appName: "ACTOGRAM",
    welcome: "Добро пожаловать",
    login: "Войти",
    register: "Регистрация",
    email: "Email",
    password: "Пароль",
    username: "Имя пользователя",
    fullName: "Полное имя",
    bio: "О себе",
    online: "Онлайн",
    offline: "Оффлайн",
    typing: "печатает...",
    send: "Отправить",
    search: "Поиск...",
    newChat: "Новый чат",
    settings: "Настройки",
    profile: "Профиль",
    darkMode: "Темная тема",
    notifications: "Уведомления",
    language: "Язык",
    save: "Сохранить",
    cancel: "Отмена",
    delete: "Удалить",
    edit: "Редактировать",
    reply: "Ответить",
    copy: "Копировать",
    forward: "Переслать",
    pin: "Закрепить",
    mute: "Без звука",
    archive: "Архив",
    block: "Заблокировать",
    report: "Пожаловаться",
    logout: "Выйти",
    connecting: "Подключение...",
    connected: "Подключено",
    disconnected: "Отключено",
    encrypted: "Зашифровано",
    verified: "Подтвержден",
    members: "участников",
    messages: "сообщений",
    noMessages: "Нет сообщений",
    startChat: "Начните общение",
    searchUsers: "Поиск пользователей",
    addMembers: "Добавить участников",
    createGroup: "Создать группу",
    groupName: "Название группы",
    groupDescription: "Описание группы",
    selectPhoto: "Выбрать фото",
    takePhoto: "Сделать фото",
    chooseFromGallery: "Выбрать из галереи",
    uploadFile: "Загрузить файл",
    recording: "Запись...",
    playback: "Воспроизведение",
    fileSize: "Размер файла",
    downloading: "Загрузка...",
    uploaded: "Загружено",
    failed: "Ошибка",
    retry: "Повторить",
    comingSoon: "Скоро...",
    beta: "Бета",
    pro: "Про",
    premium: "Премиум",
    free: "Бесплатно",
  },
  en: {
    appName: "ACTOGRAM",
    welcome: "Welcome",
    login: "Login",
    register: "Register",
    email: "Email",
    password: "Password",
    username: "Username",
    fullName: "Full Name",
    bio: "Bio",
    online: "Online",
    offline: "Offline",
    typing: "typing...",
    send: "Send",
    search: "Search...",
    newChat: "New Chat",
    settings: "Settings",
    profile: "Profile",
    darkMode: "Dark Mode",
    notifications: "Notifications",
    language: "Language",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    reply: "Reply",
    copy: "Copy",
    forward: "Forward",
    pin: "Pin",
    mute: "Mute",
    archive: "Archive",
    block: "Block",
    report: "Report",
    logout: "Logout",
    connecting: "Connecting...",
    connected: "Connected",
    disconnected: "Disconnected",
    encrypted: "Encrypted",
    verified: "Verified",
    members: "members",
    messages: "messages",
    noMessages: "No messages",
    startChat: "Start chatting",
    searchUsers: "Search users",
    addMembers: "Add members",
    createGroup: "Create group",
    groupName: "Group name",
    groupDescription: "Group description",
    selectPhoto: "Select photo",
    takePhoto: "Take photo",
    chooseFromGallery: "Choose from gallery",
    uploadFile: "Upload file",
    recording: "Recording...",
    playback: "Playback",
    fileSize: "File size",
    downloading: "Downloading...",
    uploaded: "Uploaded",
    failed: "Failed",
    retry: "Retry",
    comingSoon: "Coming soon...",
    beta: "Beta",
    pro: "Pro",
    premium: "Premium",
    free: "Free",
  },
}

// Эмодзи для реакций
const reactionEmojis = ["❤️", "👍", "👎", "😂", "😮", "😢", "😡", "🔥", "👏", "🎉"]

// Темы чата
const chatThemes = [
  { id: "default", name: "Default", colors: ["#3B82F6", "#1E40AF"] },
  { id: "purple", name: "Purple", colors: ["#8B5CF6", "#5B21B6"] },
  { id: "green", name: "Green", colors: ["#10B981", "#047857"] },
  { id: "pink", name: "Pink", colors: ["#EC4899", "#BE185D"] },
  { id: "orange", name: "Orange", colors: ["#F59E0B", "#D97706"] },
]

// Утилиты шифрования
const encryptMessage = (message: string): string => {
  return btoa(unescape(encodeURIComponent(message)))
}

const decryptMessage = (encrypted: string): string => {
  try {
    return decodeURIComponent(escape(atob(encrypted)))
  } catch {
    return encrypted
  }
}

// Основной компонент
export default function ActogramChat() {
  // Состояния
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    fullName: "",
    bio: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [activeUsers, setActiveUsers] = useState<User[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [language, setLanguage] = useState<"uz" | "ru" | "en">("uz")
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [selectedTheme, setSelectedTheme] = useState("default")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isRecording, setIsRecording] = useState(false)

  // Refs
  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)

  const t = translations[language]

  // Проверка мобильного устройства
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setShowSidebar(!mobile)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Загрузка настроек
  useEffect(() => {
    const savedSettings = localStorage.getItem("actogram_settings")
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setDarkMode(settings.darkMode || false)
      setLanguage(settings.language || "uz")
      setNotifications(settings.notifications !== false)
      setSelectedTheme(settings.theme || "default")
    }

    const savedUser = localStorage.getItem("actogram_user")
    if (savedUser) {
      const user = JSON.parse(savedUser)
      console.log("🔍 Загружен пользователь из localStorage:", user)
      setCurrentUser(user)
      setIsAuthenticated(true)
    }
  }, [])

  // Применение темной темы
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode)
  }, [darkMode])

  // Подключение к серверу
  useEffect(() => {
    if (!isAuthenticated || !currentUser) return

    const serverUrl = "https://actogr.onrender.com"
    socketRef.current = io(serverUrl, {
      transports: ["websocket", "polling"],
      auth: {
        token: localStorage.getItem("actogram_token"),
        userId: currentUser.id,
      },
    })

    const socket = socketRef.current

    socket.on("connect", () => {
      setIsConnected(true)
      loadChats()
      
      // Отправляем heartbeat каждые 10 секунд
      const heartbeatInterval = setInterval(() => {
        if (socket.connected) {
          socket.emit("heartbeat")
        }
      }, 10000)
      
      // Очищаем интервал при отключении
      socket.on("disconnect", () => {
        clearInterval(heartbeatInterval)
      })
    })

    socket.on("disconnect", () => {
      setIsConnected(false)
    })

    socket.on("new_message", (message: Message) => {
      console.log("📨 Получено новое сообщение:", message)
      if (message.isEncrypted) {
        message.content = decryptMessage(message.content)
        console.log("🔓 Расшифрованное сообщение:", message.content)
      }
      setMessages((prev) => [...prev, message])
      updateChatLastMessage(message)
      if (notifications && message.senderId !== currentUser.id) {
        showNotification(message.senderName, message.content)
      }
    })

    socket.on("message_edited", (message: Message) => {
      setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)))
    })

    socket.on("message_deleted", (messageId: string) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
    })

    socket.on("user_typing", (data: { userId: string; username: string; chatId: string }) => {
      if (data.chatId === selectedChat?.id && data.userId !== currentUser.id) {
        setTypingUsers((prev) => [...prev.filter((u) => u !== data.username), data.username])
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u !== data.username))
        }, 3000)
      }
    })

    socket.on("user_stop_typing", (data: { userId: string; chatId: string }) => {
      setTypingUsers((prev) => prev.filter((u) => u !== data.userId))
    })

    socket.on("users_update", (users: User[]) => {
      setActiveUsers(users)
    })

    socket.on("search_results", (results: User[]) => {
      setSearchResults(results)
    })

    socket.on("my_chats", (userChats: Chat[]) => {
      // Расшифровываем последние сообщения в чатах
      const decryptedChats = userChats.map(chat => ({
        ...chat,
        lastMessage: chat.lastMessage ? {
          ...chat.lastMessage,
          content: chat.lastMessage.isEncrypted ? decryptMessage(chat.lastMessage.content) : chat.lastMessage.content
        } : undefined
      }))
      setChats(decryptedChats)
    })

    socket.on("chat_messages", (data: { chatId: string; messages: Message[] }) => {
      if (data.chatId === selectedChat?.id) {
        setMessages(data.messages)
      }
    })

    socket.on("new_private_chat", (chat: Chat) => {
      console.log("🔍 Получен новый приватный чат:", chat)
      setChats((prev) => {
        const existingChat = prev.find((c) => c.id === chat.id)
        if (!existingChat) {
          return [...prev, chat]
        }
        return prev
      })
    })

          return () => {
        socket.disconnect()
      }
  }, [isAuthenticated, currentUser, selectedChat?.id, notifications])

  // Автоскролл
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Функции
  const showNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" })
    }
  }

  const updateChatLastMessage = (message: Message) => {
    setChats((prev) => prev.map((chat) => {
      if (chat.id === message.chatId) {
        return {
          ...chat,
          lastMessage: {
            ...message,
            content: message.isEncrypted ? decryptMessage(message.content) : message.content
          }
        }
      }
      return chat
    }))
  }

  const handleAuth = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("https://actogr.onrender.com/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isLoginMode ? "login" : "register",
          ...formData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error)
        return
      }

      console.log("🔍 Ответ сервера при аутентификации:", data)
      
      const user: User = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        fullName: data.user.fullName,
        avatar: data.user.avatar,
        bio: data.user.bio,
        isOnline: true,
        lastSeen: new Date(),
        isVerified: data.user.isVerified,
        status: "online",
      }

      console.log("🔍 Созданный пользователь:", user)
      
      setCurrentUser(user)
      setIsAuthenticated(true)
      setSuccess(isLoginMode ? "Успешный вход!" : "Регистрация завершена!")

      localStorage.setItem("actogram_user", JSON.stringify(user))
      localStorage.setItem("actogram_token", data.token)

      if ("Notification" in window) {
        Notification.requestPermission()
      }
    } catch (error) {
      setError("Ошибка подключения к серверу")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("actogram_user")
    localStorage.removeItem("actogram_token")
    setCurrentUser(null)
    setIsAuthenticated(false)
    setChats([])
    setMessages([])
    setSelectedChat(null)
    socketRef.current?.disconnect()
  }

  const loadChats = async () => {
    if (!currentUser) return
    
    try {
      // Загружаем чаты через REST API
      const token = localStorage.getItem("actogram_token")
      const response = await fetch("https://actogr.onrender.com/api/chats", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })
      
      if (response.ok) {
        const chats = await response.json()
        console.log("🔍 Загружены чаты из API:", chats)
        
        // Расшифровываем последние сообщения в чатах
        const decryptedChats = chats.map((chat: Chat) => ({
          ...chat,
          lastMessage: chat.lastMessage ? {
            ...chat.lastMessage,
            content: chat.lastMessage.isEncrypted ? decryptMessage(chat.lastMessage.content) : chat.lastMessage.content
          } : undefined
        }))
        
        setChats(decryptedChats)
      } else {
        console.error("❌ Ошибка загрузки чатов:", response.status)
      }
    } catch (error) {
      console.error("❌ Ошибка загрузки чатов:", error)
    }
    
    // Также запрашиваем через Socket.IO для обновления в реальном времени
    if (socketRef.current && currentUser) {
      socketRef.current.emit("get_my_chats", currentUser.id)
    }
  }

  const loadMessages = async (chatId: string) => {
    if (!currentUser) return
    
    try {
      // Загружаем сообщения через REST API
      const token = localStorage.getItem("actogram_token")
      const response = await fetch(`https://actogr.onrender.com/api/messages/${chatId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })
      
      if (response.ok) {
        const messages = await response.json()
        console.log("🔍 Загружены сообщения из API:", messages)
        setMessages(messages)
      } else {
        console.error("❌ Ошибка загрузки сообщений:", response.status)
      }
    } catch (error) {
      console.error("❌ Ошибка загрузки сообщений:", error)
    }
    
    // Также запрашиваем через Socket.IO для обновления в реальном времени
    if (socketRef.current && currentUser) {
      socketRef.current.emit("get_messages", { chatId, userId: currentUser.id })
    }
  }

  const sendMessage = () => {
    console.log("🔍 Отладка sendMessage:", {
      currentUser: currentUser,
      currentUserId: currentUser?.id,
      selectedChat: selectedChat,
      newMessage: newMessage.trim(),
      socketRef: !!socketRef.current
    })
    
    if (!newMessage.trim() || !selectedChat || !currentUser || !socketRef.current) {
      console.log("❌ Не удается отправить сообщение:", {
        hasMessage: !!newMessage.trim(),
        hasChat: !!selectedChat,
        hasUser: !!currentUser,
        hasSocket: !!socketRef.current
      })
      return
    }

    console.log("📤 Отправка сообщения:", {
      content: newMessage.trim(),
      chatId: selectedChat.id,
      userId: currentUser.id,
      username: currentUser.username
    })

    const messageData = {
      content: encryptMessage(newMessage.trim()),
      chatId: selectedChat.id,
      type: "text",
      isEncrypted: true,
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            content: replyingTo.content,
            senderName: replyingTo.senderName,
          }
        : undefined,
    }

    console.log("📤 Данные сообщения для отправки:", messageData)
    socketRef.current.emit("send_message", messageData)
    setNewMessage("")
    setReplyingTo(null)
    stopTyping()
  }

  const selectChat = (chat: Chat) => {
    setSelectedChat(chat)
    setReplyingTo(null)
    setEditingMessage(null)
    loadMessages(chat.id)
    if (isMobile) setShowSidebar(false)
    if (socketRef.current) {
      socketRef.current.emit("join_chat", chat.id)
    }
  }

  const startTyping = () => {
    if (selectedChat && socketRef.current && currentUser) {
      socketRef.current.emit("typing", {
        chatId: selectedChat.id,
        userId: currentUser.id,
        username: currentUser.username,
      })

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(stopTyping, 1000)
    }
  }

  const stopTyping = () => {
    if (selectedChat && socketRef.current) {
      socketRef.current.emit("stop_typing", { chatId: selectedChat.id })
    }
  }

  const searchUsers = (query: string) => {
    if (!query.trim() || !socketRef.current) {
      setSearchResults([])
      return
    }
    socketRef.current.emit("search_users", query)
  }

  const startPrivateChat = (user: User) => {
    if (!currentUser || !socketRef.current) return

    const chatId = `private_${[currentUser.id, user.id].sort().join("_")}`
    const existingChat = chats.find((chat) => chat.id === chatId)

    if (existingChat) {
      selectChat(existingChat)
      setShowUserSearch(false)
      return
    }

    const newChat: Chat = {
      id: chatId,
              name: user.username,
      avatar: user.avatar,
      isGroup: false,
      participants: [currentUser, user],
      unreadCount: 0,
      messageCount: 0,
      type: "private",
      isEncrypted: true,
      createdBy: currentUser.id,
      createdAt: new Date(),
    }

    setChats((prev) => [...prev, newChat])
    selectChat(newChat)
    setShowUserSearch(false)

    console.log("🔍 Создание приватного чата:", {
      userId: user.id,
      chatId,
      createdBy: currentUser.id,
    })
    
    socketRef.current.emit("create_private_chat", {
      userId: user.id,
      chatId,
      createdBy: currentUser.id,
    })
  }

  const addReaction = (messageId: string, emoji: string) => {
    if (!currentUser || !socketRef.current) return

    socketRef.current.emit("add_reaction", {
      messageId,
      emoji,
      userId: currentUser.id,
      username: currentUser.username,
    })
  }

  // Функция для сохранения настроек
  const saveSettings = () => {
    localStorage.setItem(
      "actogram_settings",
      JSON.stringify({
        darkMode,
        language,
        notifications,
        theme: selectedTheme,
      })
    )
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const filteredChats = chats.filter((chat) => chat.name.toLowerCase().includes(searchQuery.toLowerCase()))

  // Стили
  const gradientBg = `bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900`
  const cardStyle = `backdrop-blur-lg bg-white/80 dark:bg-gray-800/80 border border-white/20 dark:border-gray-700/50 shadow-xl`
  const buttonStyle = `transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl`
  const inputStyle = `backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-400`

  // Проверка домена
  const hostname = typeof window !== "undefined" ? window.location.hostname : ""
  const allowedDomains = ["vercel.app", "render.com", "localhost"]
  const isDomainAllowed = allowedDomains.some((domain) => hostname.includes(domain) || hostname === "localhost")

  if (!isDomainAllowed) {
    return (
      <div className={`min-h-screen ${gradientBg} flex items-center justify-center p-4`}>
        <div className={`max-w-md ${cardStyle}`}>
          <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{t.appName}</h1>
                  <p className="text-xs text-blue-100">
                    {isConnected ? (
                      <span className="flex items-center gap-1">
                        <Wifi className="h-3 w-3" />
                        {t.connected}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <WifiOff className="h-3 w-3" />
                        {t.disconnected}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-6 w-6" />
                  Доступ ограничен
                </div>
              </div>
            </div>
          </div>
          <div className="p-4">
            <p>ACTOGRAM доступен только с разрешенных доменов</p>
            <p className="text-sm text-gray-500 mt-2">Проверка безопасности домена</p>
          </div>
        </div>
      </div>
    )
  }

  // Экран аутентификации
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen ${gradientBg} flex items-center justify-center p-4`}>
        <div className={`w-full max-w-md ${cardStyle} animate-in fade-in-50 duration-500`}>
          <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {t.appName}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">{t.welcome}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm">
                <Lock className="h-4 w-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400">End-to-End Encrypted</span>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t.email}
              </div>
              <input
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={inputStyle}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                {t.password}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={`${inputStyle} pr-10`}
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4" />
              {t.email}
            </div>
            <div className="flex gap-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className={`${buttonStyle} ${language === lang.code ? "bg-blue-600 text-white" : "bg-white/20 text-white"}`}
                  onClick={() => setLanguage(lang.code as "uz" | "ru" | "en")}
                >
                  {lang.flag}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800">
              <p className="text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}

          <button
            onClick={handleAuth}
            className={`w-full ${buttonStyle} bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700`}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                {t.connecting}
              </div>
            ) : isLoginMode ? (
              t.login
            ) : (
              t.register
            )}
          </button>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              {isLoginMode ? "Нет аккаунта?" : "Есть аккаунт?"}{" "}
              <button
                onClick={() => setIsLoginMode(!isLoginMode)}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {isLoginMode ? t.register : t.login}
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Основной интерфейс чата
  return (
    <div className={`h-screen flex ${darkMode ? "dark" : ""}`}>
      <div className={`h-screen flex ${gradientBg} w-full relative overflow-hidden`}>
        {/* Боковая панель */}
        <div
          className={`${
            isMobile ? "fixed inset-y-0 left-0 z-50 w-full" : "w-80 min-w-80"
          } ${cardStyle} border-r flex flex-col transition-all duration-300 ${
            isMobile && !showSidebar ? "-translate-x-full" : "translate-x-0"
          }`}
        >
          {/* Заголовок */}
          <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{t.appName}</h1>
                  <p className="text-xs text-blue-100">
                    {isConnected ? (
                      <span className="flex items-center gap-1">
                        <Wifi className="h-3 w-3" />
                        {t.connected}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <WifiOff className="h-3 w-3" />
                        {t.disconnected}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-6 w-6" />
                  Доступ ограничен
                </div>
              </div>
            </div>
          </div>

          {/* Поиск */}
          <div className="p-3 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 ${inputStyle}`}
              />
            </div>
            <div className={`${cardStyle}`}>
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 mr-2" />
                {t.newChat}
              </div>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  placeholder="@username или имя"
                  onChange={(e) => searchUsers(e.target.value)}
                  className={`pl-10 ${inputStyle}`}
                />
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => startPrivateChat(user)}
                    className={`flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200 ${buttonStyle}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{user.username}</h4>
                        {user.isVerified && <Star className="h-3 w-3 text-yellow-500" />}
                      </div>
                      <p className="text-sm text-gray-500">{user.username}</p>
                      {user.bio && <p className="text-xs text-gray-400 truncate">{user.bio}</p>}
                    </div>
                    <div className={`w-3 h-3 rounded-full ${user.isOnline ? "bg-green-500" : "bg-gray-300"}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Список чатов */}
          <div className="flex-1 overflow-y-auto">
            {filteredChats.map((chat) => {
              const isPrivate = chat.type === "private";
              const otherUser = isPrivate ? chat.participants.find((u) => u.id !== currentUser?.id) : null;
              const chatDisplayName = isPrivate
                ? (otherUser?.fullName || otherUser?.username || "Неизвестно")
                : chat.name;
              const chatAvatarFallback = isPrivate ? (otherUser?.username?.charAt(1) || "?") : (chat.name?.charAt(0) || "?");
              return (
                <div
                  key={chat.id}
                  onClick={() => selectChat(chat)}
                  className={`p-4 border-b cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    selectedChat?.id === chat.id
                      ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-l-4 border-l-blue-500"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <MessageCircle className="h-6 w-6 text-white" />
                      </div>
                      {!chat.isGroup && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{chatDisplayName}</h3>
                          {chat.isEncrypted && <Lock className="h-3 w-3 text-green-500" />}
                          {chat.isPinned && <Star className="h-3 w-3 text-yellow-500" />}
                        </div>
                        {chat.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {new Date(chat.lastMessage.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      {chat.lastMessage && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                          {chat.lastMessage.senderName}: {chat.lastMessage.isEncrypted ? decryptMessage(chat.lastMessage.content) : chat.lastMessage.content}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <span>
                            {chat.participants.length} {t.members}
                          </span>
                          <span>•</span>
                          <span>
                            {chat.messageCount} {t.messages}
                          </span>
                        </div>
                        {chat.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">{chat.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Область чата */}
        <div className={`flex-1 flex flex-col min-w-0 ${isMobile && showSidebar ? "hidden" : "flex"}`}>
          {selectedChat ? (
            <>
              {/* Заголовок чата */}
              <div className={`p-4 ${cardStyle} border-b flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  {isMobile && (
                    <button
                      onClick={() => setShowSidebar(true)}
                      className={`${buttonStyle}`}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  )}
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold">
                        {selectedChat.type === "private" 
                          ? (() => {
                              const otherUser = selectedChat.participants.find((u) => u.id !== currentUser?.id)
                              return otherUser?.username || selectedChat.name
                            })()
                          : selectedChat.name
                        }
                      </h2>
                      {selectedChat.isEncrypted && <Lock className="h-4 w-4 text-green-500" />}
                    </div>
                    <p className="text-sm text-gray-500">
                      {selectedChat.isGroup
                        ? `${selectedChat.participants.length} ${t.members}`
                        : typingUsers.length > 0
                          ? `${typingUsers.join(", ")} ${t.typing}`
                          : t.online}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className={buttonStyle}>
                    <Phone className="h-4 w-4" />
                  </button>
                  <button className={buttonStyle}>
                    <Video className="h-4 w-4" />
                  </button>
                  <div className="relative">
                    <button className={buttonStyle}>
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5`}>
                      <div className="py-1">
                        <button className="flex w-full items-center px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                          <Info className="h-4 w-4 mr-2" />
                          Информация о чате
                        </button>
                        <button className="flex w-full items-center px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                          <Star className="h-4 w-4 mr-2" />
                          Закрепить чат
                        </button>
                        <button className="flex w-full items-center px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                          <Bell className="h-4 w-4 mr-2" />
                          Отключить уведомления
                        </button>
                        <div className="border-t border-gray-200 dark:border-gray-700" />
                        <button className="flex w-full items-center px-2 py-2 text-sm text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Очистить чат
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Сообщения */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                        <MessageCircle className="h-10 w-10 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{t.noMessages}</h3>
                        <p className="text-gray-500">{t.startChat}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === currentUser?.id ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl group ${
                          message.senderId === currentUser?.id
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                            : `${cardStyle}`
                        }`}
                      >
                        {message.replyTo && (
                          <div className="mb-2 p-2 rounded-xl bg-black/10 border-l-2 border-white/30">
                            <p className="text-xs font-medium">{message.replyTo.senderName}</p>
                            <p className="text-xs opacity-80 truncate">{message.replyTo.content}</p>
                          </div>
                        )}

                        {message.senderId !== currentUser?.id && (
                          <p className="text-xs font-medium mb-1 opacity-70">{message.senderName}</p>
                        )}

                        <p className="break-words">{message.content}</p>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            {message.reactions && message.reactions.length > 0 && (
                              <div className="flex gap-1">
                                {message.reactions.slice(0, 3).map((reaction, idx) => (
                                  <span key={idx} className="text-xs">
                                    {reaction.emoji}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs opacity-70">
                              {new Date(message.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {message.isEncrypted && <Lock className="h-3 w-3 opacity-70" />}
                            <div className="relative">
                              <button className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-3 w-3" />
                              </button>
                              <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5`}>
                                <div className="py-1">
                                  <button className="flex w-full items-center px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <Reply className="h-4 w-4 mr-2" />
                                    {t.reply}
                                  </button>
                                  <button className="flex w-full items-center px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <Copy className="h-4 w-4 mr-2" />
                                    {t.copy}
                                  </button>
                                  <div className="border-t border-gray-200 dark:border-gray-700" />
                                  <div className="flex gap-1 p-2">
                                    {reactionEmojis.slice(0, 5).map((emoji) => (
                                      <button
                                        key={emoji}
                                        onClick={() => addReaction(message.id, emoji)}
                                        className="hover:scale-125 transition-transform"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {typingUsers.length > 0 && (
                  <div className="flex justify-start">
                    <div className={`px-4 py-2 rounded-2xl ${cardStyle}`}>
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                          <div
                            className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          />
                          <div
                            className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {typingUsers.join(", ")} {t.typing}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Поле ответа */}
              {replyingTo && (
                <div className={`px-4 py-2 ${cardStyle} border-t`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Reply className="h-4 w-4 text-blue-500" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-600">Ответ для {replyingTo.senderName}</p>
                        <p className="text-gray-600 truncate max-w-xs">{replyingTo.content}</p>
                      </div>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="h-4 w-4">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Поле ввода */}
              <div className={`p-4 ${cardStyle} border-t`}>
                <div className="flex items-center gap-2">
                  <input type="file" ref={fileInputRef} className="hidden" accept="*/*" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={buttonStyle}
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <div className="flex-1 relative">
                    <input
                      ref={messageInputRef}
                      placeholder={`${t.send}...`}
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value)
                        if (e.target.value.length > 0) {
                          startTyping()
                        }
                      }}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      className={`${inputStyle} pr-20`}
                      disabled={!isConnected}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                      <button className="h-8 w-8 p-0">
                        <Smile className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || !isConnected}
                    className={`${buttonStyle} bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700`}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        {t.connected}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        {t.disconnected}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Lock className="h-3 w-3 text-green-500" />
                    <span>{t.encrypted}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-6">
                {isMobile && (
                  <button
                    onClick={() => setShowSidebar(true)}
                    className={`mb-4 ${buttonStyle}`}
                  >
                    <Menu className="h-4 w-4 mr-2" />
                    Чаты
                  </button>
                )}
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                  <MessageCircle className="h-16 w-16 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {t.welcome} в {t.appName}
                  </h3>
                  <p className="text-gray-500 mt-2">{t.startChat}</p>
                </div>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">{isConnected ? "🟢 Подключено" : "🔴 Отключено"}</div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-green-500" />
                    <span>End-to-End шифрование</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span>Быстрая доставка</span>
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
