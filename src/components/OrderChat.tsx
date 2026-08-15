'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Send } from 'lucide-react';

interface OrderChatProps {
  orderId: string;
  currentUserId: string;
  userRole: 'customer' | 'driver' | 'owner';
}

interface OrderMessage {
  id: string;
  order_id: string;
  sender_user_id: string;
  sender_role: string;
  message: string;
  created_at: string;
}

export default function OrderChat({ orderId, currentUserId, userRole }: OrderChatProps) {
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isReadOnly, setIsReadOnly] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    let ignore = false;

    const checkOrderStatus = async () => {
      const { data } = await supabase.from('orders').select('status').eq('id', orderId).single();
      if (!ignore && data && (data.status === 'DELIVERED' || data.status === 'CANCELLED')) {
        setIsReadOnly(true);
      }
    };
    checkOrderStatus();

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('order_messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      if (!ignore && data) {
        setMessages(data);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    };
    fetchMessages();

    const channel = supabase.channel(`chat-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_messages', filter: `order_id=eq.${orderId}` },
        (payload) => {
          setMessages(prev => {
            // Avoid duplicates if we inserted it
            const newMsg = payload.new as OrderMessage;
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          if (payload.new.status === 'DELIVERED' || payload.new.status === 'CANCELLED') {
            setIsReadOnly(true);
          }
        }
      )
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, [orderId, supabase]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isReadOnly) return;

    const msg = newMessage.trim();
    setNewMessage('');

    // Optimistic UI
    const optimisticMsg = {
      id: crypto.randomUUID(),
      order_id: orderId,
      sender_user_id: currentUserId,
      sender_role: userRole,
      message: msg,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    const { error } = await supabase.from('order_messages').insert({
      id: optimisticMsg.id,
      order_id: orderId,
      sender_user_id: currentUserId,
      sender_role: userRole,
      message: msg
    });

    if (error) {
      console.error("Error sending message", error);
      // Rollback optimistic update
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    }
  };

  return (
    <div className="flex flex-col bg-white border border-[#E8D5A8] rounded-2xl shadow-sm overflow-hidden mt-6 h-[400px]">
      <div className="bg-[#FFF7E5] p-4 border-b border-[#E8D5A8]">
        <h3 className="font-bold font-mono text-[#3A2418]">Chat con {userRole === 'customer' ? 'tu repartidor' : 'el cliente'}</h3>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAFAFA]">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-neutral-400 mt-10">No hay mensajes aún.</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_user_id === currentUserId;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${isMe ? 'bg-[#A94F2F] text-white rounded-tr-sm' : 'bg-neutral-200 text-[#3A2418] rounded-tl-sm'}`} style={{ wordBreak: 'break-word' }}>
                  {msg.message}
                </div>
                <span className="text-[10px] text-neutral-400 mt-1 mx-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {!isReadOnly ? (
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-[#E8D5A8] flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-neutral-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A94F2F]"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 bg-[#A94F2F] text-white rounded-full disabled:opacity-50 transition-opacity"
          >
            <Send size={18} />
          </button>
        </form>
      ) : (
        <div className="p-3 bg-neutral-100 border-t border-neutral-200 text-center text-xs text-neutral-500 font-mono">
          El chat está cerrado
        </div>
      )}
    </div>
  );
}
