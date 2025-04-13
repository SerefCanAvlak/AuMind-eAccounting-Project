import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Loader2, ArrowLeft, Download, Share2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAccountingBot } from "../hooks/useAccountingBot"

function ChatPage() {
  const { messages, addMessage } = useAccountingBot()
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const navigate = useNavigate()

  // OpenAI API key ve url
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const apiUrl = import.meta.env.VITE_OPENAI_API_URL;

  // Mesajlar güncellendiğinde otomatik olarak en alta kaydır
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "") return

    // Kullanıcı mesajını ekle
    const userMessage = { role: "user", content: inputMessage }
    addMessage(userMessage)
    setInputMessage("")
    setIsLoading(true)

    try {
      // OpenAI API'ye istek
      const systemMessage = {
        role: "system",
        content:
          "Sen AuMind Muhasebe yazılımının bir parçası olan muhasebe asistanısın. Muhasebe, finans, vergi ve işletme konularında uzmansın. Türkiye'deki muhasebe mevzuatı, vergi kanunları ve finansal raporlama standartları hakkında güncel bilgilere sahipsin. Kullanıcılara kısa, net ve doğru bilgiler ver. Muhasebe terimleri kullan ama açıklamalarını da ekle.",
      }

      // API isteği için mesajları hazırla
      // Kullanıcı ve asistan mesajlarını filtrele
      const messagesToSend = [
        systemMessage,
        ...messages.filter((msg) => msg.role === "user" || msg.role === "assistant"),
        userMessage,
      ]

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",  // gpt 4o modelini kullanıyoruz
          messages: messagesToSend,
          temperature: 0.7,
          max_tokens: 500,
        }),
      })

      if (!response.ok) {
        throw new Error(`API hatası: ${response.status}`)
      }

      const data = await response.json()
      const botResponse = {
        role: "assistant",
        content: data.choices[0].message.content,
      }

      addMessage(botResponse)
    } catch (error) {
      console.error("API hatası:", error)

      // API hatası durumunda yedek yanıt mekanizması
      const fallbackResponse = {
        role: "assistant",
        content: "Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyiniz.",
      }

      // Basit anahtar kelime tabanlı yedek yanıtlar
      if (apiKey && inputMessage.toLowerCase().includes("kdv")) {
        fallbackResponse.content =
          "KDV (Katma Değer Vergisi), mal ve hizmet alımlarında ödenen bir vergi türüdür. Türkiye'de genel KDV oranı %18'dir, ancak bazı ürün ve hizmetlerde %1 veya %8 gibi indirimli oranlar uygulanabilir. KDV beyannamesi her ay düzenli olarak verilmelidir."
      } else if (apiKey && inputMessage.toLowerCase().includes("fatura")) {
        fallbackResponse.content =
          "Faturalar, ticari işlemlerin kaydını tutan önemli belgelerdir. E-fatura sistemine kayıtlı mükellefler arasında elektronik ortamda düzenlenir. Faturalar, düzenleme tarihinden itibaren 5 yıl süreyle saklanmalıdır. Sistemimizde 'Fatura Ekle' bölümünden yeni fatura oluşturabilirsiniz."
      } else if (!apiKey) {
        fallbackResponse.content = "API anahtarı bulunamadı. Lütfen sistem yöneticinizle iletişime geçin."
      }

      addMessage(fallbackResponse)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleDownloadChat = () => {
    // Sohbet geçmişini indirme işlemi
    const chatHistory = messages
      .map((msg) => `${msg.role === "assistant" ? "Asistan" : "Kullanıcı"}: ${msg.content}`)
      .join("\n\n")
    const blob = new Blob([chatHistory], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `muhasebe-asistani-sohbet-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleShareChat = () => {
    // Sohbet paylaşım işlemi - örnek olarak kopyalama işlemi yapıyoruz
    const chatHistory = messages
      .map((msg) => `${msg.role === "assistant" ? "Asistan" : "Kullanıcı"}: ${msg.content}`)
      .join("\n\n")
    navigator.clipboard
      .writeText(chatHistory)
      .then(() => {
        alert("Sohbet geçmişi panoya kopyalandı!")
      })
      .catch((err) => {
        console.error("Kopyalama hatası:", err)
        alert("Sohbet geçmişi kopyalanamadı.")
      })
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4 hover:bg-gray-700 p-2 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center">
            <Bot size={24} className="mr-2 text-cyan-400" />
            <h1 className="text-xl font-bold">AuMind Muhasebe Asistanı</h1>
          </div>
        </div>
        <div className="flex items-center">
          <button
            onClick={handleDownloadChat}
            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-md mr-2 flex items-center"
            title="Sohbeti indir"
          >
            <Download size={18} className="mr-1" />
            <span className="hidden sm:inline">İndir</span>
          </button>
          <button
            onClick={handleShareChat}
            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-md flex items-center"
            title="Sohbeti paylaş"
          >
            <Share2 size={18} className="mr-1" />
            <span className="hidden sm:inline">Paylaş</span>
          </button>
        </div>
      </header>

      {/* Mesajlar */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {messages.map((message, index) => (
            <div key={index} className={`mb-6 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === "user"
                    ? "bg-cyan-500 text-white rounded-br-none"
                    : "bg-white text-gray-800 rounded-bl-none shadow"
                }`}
              >
                <div className="flex items-center mb-2">
                  {message.role === "assistant" ? (
                    <Bot size={20} className="mr-2 text-cyan-500" />
                  ) : (
                    <User size={20} className="mr-2" />
                  )}
                  <span className="font-medium">{message.role === "assistant" ? "Muhasebe Asistanı" : "Siz"}</span>
                </div>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-6">
              <div className="bg-white text-gray-800 rounded-lg rounded-bl-none p-4 shadow max-w-[80%]">
                <div className="flex items-center mb-2">
                  <Bot size={20} className="mr-2 text-cyan-500" />
                  <span className="font-medium">Muhasebe Asistanı</span>
                </div>
                <div className="flex items-center">
                  <Loader2 size={20} className="animate-spin text-cyan-500 mr-2" />
                  <span>Yanıt yazılıyor...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Mesaj Giriş Alanı */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Muhasebe asistanına bir soru sorun..."
              className="flex-1 border border-gray-300 rounded-l-md p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              rows={2}
            />
            <button
              onClick={handleSendMessage}
              disabled={inputMessage.trim() === "" || isLoading}
              className="bg-cyan-500 hover:bg-cyan-600 text-white p-3 rounded-r-md h-full disabled:bg-gray-300"
            >
              <Send size={24} />
            </button>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Muhasebe, vergi, finans ve işletme konularında sorularınızı sorabilirsiniz. Asistan Türkiye'deki muhasebe
            mevzuatı hakkında bilgi sahibidir.
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatPage
