import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Loader2, ArrowLeft, Download, Share2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAccountingBot } from "../hooks/useAccountingBot"
import { useGetChatSummaryMutation } from "../store/api/aiChatApi"

function ChatPage() {
  const { messages, addMessage } = useAccountingBot()
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const navigate = useNavigate()
  const [getChatSummary] = useGetChatSummaryMutation()

  // Mesajlar güncellendiğinde otomatik olarak en alta kaydır
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // JSON yanıtını parse et ve message içeriğini al
  const parseResponse = (response) => {
    try {
      // Eğer response zaten string ise ve JSON formatında değilse direkt döndür
      if (typeof response === 'string' && !response.trim().startsWith('{')) {
        return response;
      }

      // JSON string'i parse et
      const jsonResponse = typeof response === 'string' ? JSON.parse(response) : response;
      
      // Eğer tablo verisi varsa, HTML tablosuna dönüştür
      if (jsonResponse.table) {
        const { columns, rows } = jsonResponse.table;
        const tableHtml = `
          <div class="mb-4">${jsonResponse.message || ''}</div>
          <table>
            <thead>
              <tr>
                ${columns.map(col => `<th>${col}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map(row => `
                <tr>
                  ${row.map(cell => `<td>${cell}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        return tableHtml;
      }
      
      // Tablo yoksa message alanını döndür
      return jsonResponse.message || jsonResponse;
    } catch (error) {
      console.error('Yanıt parse hatası:', error);
      return response; // Parse edilemezse orijinal yanıtı döndür
    }
  };

  // HTML içeriğini güvenli bir şekilde render et
  const renderMessageContent = (content) => {
    // HTML içeriğini güvenli bir şekilde render et
    return (
      <div 
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ 
          __html: content
            .replace(/<table/g, '<table class="min-w-full divide-y divide-gray-200 overflow-x-auto"')
            .replace(/<th/g, '<th class="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"')
            .replace(/<td/g, '<td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-t border-gray-200"')
            .replace(/<div class="mb-4">/g, '<div class="mb-4 text-gray-700">')
        }} 
      />
    );
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "") return

    // Kullanıcı mesajını ekle
    const userMessage = { role: "user", content: inputMessage }
    addMessage(userMessage)
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await getChatSummary(inputMessage).unwrap()
      
      // Yanıtı parse et
      const parsedContent = parseResponse(response);
      
      const botResponse = {
        role: "assistant",
        content: parsedContent,
      }

      addMessage(botResponse)
    } catch (error) {
      console.error("API hatası:", error)

      // API hatası durumunda yedek yanıt mekanizması
      const fallbackResponse = {
        role: "assistant",
        content: error.message || "Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyiniz.",
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
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadChat}
            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-md flex items-center"
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
                <div className="text-sm leading-relaxed">
                  {message.role === "assistant" 
                    ? renderMessageContent(message.content)
                    : message.content}
                </div>
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
