import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, where, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { Send, Paperclip, Bot, Hash, User, Loader2, Image as ImageIcon, FileText, X, Settings, ShieldAlert, Video, Phone, MessageSquare } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { format } from 'date-fns';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

// Safely access the API key
const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      return process.env.GEMINI_API_KEY;
    }
  } catch (e) {}
  return import.meta.env.VITE_GEMINI_API_KEY || '';
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  timestamp: any;
  isAI?: boolean;
  fileUrl?: string;
  fileType?: string;
}

interface ChatUser {
  id: string;
  displayName: string;
  photoURL?: string;
  email: string;
  role: string;
  ocId?: string;
}

export default function OCChat() {
  const { user, isAdmin } = useAuth();
  const [activeChannel, setActiveChannel] = useState<string>('general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inCall, setInCall] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isMasterAdmin = user?.email === 'mdgsty424@gmail.com';

  useEffect(() => {
    if (!user) return;

    // Fetch all users for DM list
    const fetchUsers = async () => {
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ChatUser[];
      const otherUsers = usersData.filter(u => u.id !== user.uid);
      setUsers(otherUsers);

      // Check for 'user' query param to open DM
      const params = new URLSearchParams(window.location.search);
      const targetUserKey = params.get('user');
      if (targetUserKey) {
        // Find user by ocId or id
        const target = usersData.find(u => u.ocId === targetUserKey || u.id === targetUserKey);
        if (target && target.id !== user.uid) {
          setActiveChannel(target.id);
        }
      }
    };
    fetchUsers();

    // Listen to messages for active channel
    let q;
    if (activeChannel === 'general') {
      q = query(collection(db, 'chats', 'general', 'messages'), orderBy('timestamp', 'asc'));
    } else if (activeChannel === 'ai') {
      q = query(collection(db, 'chats', `ai_${user.uid}`, 'messages'), orderBy('timestamp', 'asc'));
    } else {
      // DM channel ID is sorted combination of both UIDs
      const channelId = [user.uid, activeChannel].sort().join('_');
      q = query(collection(db, 'chats', channelId, 'messages'), orderBy('timestamp', 'asc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
      setMessages(msgs);
      setLoading(false);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [user, activeChannel]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startCall = (element: HTMLDivElement | null) => {
    if (!element || !user) return;
    const appID = 1698335343;
    const serverSecret = "827755ef5ec4c06648bc783998a6d0c2";
    const roomID = [user.uid, activeChannel].sort().join('_');
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      roomID,
      user.uid,
      user.displayName || 'User'
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);
    zp.joinRoom({
      container: element,
      scenario: {
        mode: ZegoUIKitPrebuilt.OneONoneCall,
      },
      showScreenSharingButton: true,
      onLeaveRoom: () => setInCall(false),
    });
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      // Cloudinary upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default');
      formData.append('cloud_name', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo');

      const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo'}/auto/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      return { url: data.secure_url, type: data.resource_type };
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        if (acceptedFiles[0].size > 10 * 1024 * 1024) {
          alert('File size must be less than 10MB');
          return;
        }
        setSelectedFile(acceptedFiles[0]);
      }
    },
    maxSize: 10485760, // 10MB
  });

  const handleSend = async () => {
    if (!input.trim() && !selectedFile) return;
    if (!user) return;

    let fileUrl = '';
    let fileType = '';

    if (selectedFile) {
      const uploadResult = await handleFileUpload(selectedFile);
      if (uploadResult) {
        fileUrl = uploadResult.url;
        fileType = uploadResult.type;
      }
      setSelectedFile(null);
    }

    const messageText = input.trim();
    setInput('');

    let collectionPath = '';
    if (activeChannel === 'general') {
      collectionPath = 'chats/general/messages';
    } else if (activeChannel === 'ai') {
      collectionPath = `chats/ai_${user.uid}/messages`;
    } else {
      const channelId = [user.uid, activeChannel].sort().join('_');
      collectionPath = `chats/${channelId}/messages`;
    }

    const newMessage = {
      text: messageText,
      senderId: user.uid,
      senderName: user.displayName || 'User',
      senderPhoto: user.photoURL || '',
      timestamp: serverTimestamp(),
      fileUrl,
      fileType,
    };

    await addDoc(collection(db, collectionPath), newMessage);

    // AI Logic
    if (activeChannel === 'ai' || (activeChannel === 'general' && messageText.toLowerCase().includes('@ai'))) {
      await handleAIResponse(messageText, collectionPath, fileUrl, fileType);
    }
  };

  const handleAIResponse = async (userText: string, collectionPath: string, fileUrl?: string, fileType?: string) => {
    try {
      // Define tools for Master Mode
      const tools: any[] = [];
      if (isMasterAdmin) {
        const deleteUserFunc: FunctionDeclaration = {
          name: 'deleteUser',
          description: 'Delete a user from the database by their email or UID.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              identifier: { type: Type.STRING, description: 'The email or UID of the user to delete.' }
            },
            required: ['identifier']
          }
        };
        const editUserWalletFunc: FunctionDeclaration = {
          name: 'editUserWallet',
          description: 'Edit a user\'s wallet balance.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              uid: { type: Type.STRING, description: 'The UID of the user.' },
              newBalance: { type: Type.NUMBER, description: 'The new wallet balance.' }
            },
            required: ['uid', 'newBalance']
          }
        };
        tools.push({ functionDeclarations: [deleteUserFunc, editUserWalletFunc] });
      }

      const systemInstruction = isMasterAdmin 
        ? "You are the Master AI Assistant for OCSTHAEL. You have full access to manage the system. You can analyze errors, delete/edit user data, and execute database changes based on the Admin's commands. Be precise and confirm actions."
        : "You are the OCSTHAEL AI Assistant. Help users with Registration/Login troubleshooting, checking Wallet Balance, and guiding them through the Withdrawal process. You are a helpful third-party in chats.";

      let contents: any[] = [{ role: 'user', parts: [{ text: userText }] }];
      
      // If there's a file, we might need to process it. For now, we just pass the URL as text context if it's not an image we can inline.
      if (fileUrl) {
        contents[0].parts.push({ text: `Attached file URL: ${fileUrl}` });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents,
        config: {
          systemInstruction,
          tools: tools.length > 0 ? tools : undefined,
        }
      });

      let aiText = response.text || '';

      // Handle function calls
      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const call of response.functionCalls) {
          if (call.name === 'deleteUser') {
            const identifier = call.args?.identifier as string;
            // Find user by email or uid
            let targetUid = identifier;
            if (identifier.includes('@')) {
              const q = query(collection(db, 'users'), where('email', '==', identifier));
              const snap = await getDocs(q);
              if (!snap.empty) targetUid = snap.docs[0].id;
            }
            if (targetUid) {
              await deleteDoc(doc(db, 'users', targetUid));
              aiText += `\n\n[System]: User ${identifier} has been deleted.`;
            } else {
              aiText += `\n\n[System]: User ${identifier} not found.`;
            }
          } else if (call.name === 'editUserWallet') {
            const uid = call.args?.uid as string;
            const newBalance = call.args?.newBalance as number;
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              const wallet = userData.wallet || {};
              await updateDoc(userRef, { wallet: { ...wallet, balance: newBalance } });
              aiText += `\n\n[System]: User ${uid}'s wallet balance updated to ${newBalance} TK.`;
            } else {
              aiText += `\n\n[System]: User ${uid} not found.`;
            }
          }
        }
      }

      await addDoc(collection(db, collectionPath), {
        text: aiText,
        senderId: 'ai-assistant',
        senderName: 'OCSTHAEL AI',
        isAI: true,
        timestamp: serverTimestamp(),
      });

    } catch (error) {
      console.error("AI Error:", error);
      await addDoc(collection(db, collectionPath), {
        text: "Sorry, I encountered an error processing your request.",
        senderId: 'ai-assistant',
        senderName: 'OCSTHAEL AI',
        isAI: true,
        timestamp: serverTimestamp(),
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-32 px-4 text-center bg-[#05070a] text-white flex items-center justify-center">
        <div>
          <h1 className="text-4xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-8">Please log in to access OC-Chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-[#05070a] text-white flex relative">
      {/* Mobile Sidebar Toggle */}
      <button 
        onClick={() => setShowSidebar(!showSidebar)}
        className="md:hidden absolute top-24 left-4 z-50 p-2 bg-brand-blue rounded-lg text-white shadow-lg"
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      {/* Mobile Backdrop */}
      {showSidebar && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`w-64 bg-[#0a0f19] border-r border-gray-800 flex flex-col h-[calc(100vh-5rem)] absolute md:relative z-40 transition-transform duration-300 ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold font-display text-brand-blue">OC-Chat</h2>
          <button onClick={() => setShowSidebar(false)} className="md:hidden text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Channels */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Channels</h3>
            <div className="space-y-1">
              <button
                onClick={() => { setActiveChannel('general'); setShowSidebar(false); }}
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${activeChannel === 'general' ? 'bg-brand-blue/20 text-brand-blue' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
              >
                <Hash className="w-4 h-4 mr-2" /> General
              </button>
              <button
                onClick={() => { setActiveChannel('ai'); setShowSidebar(false); }}
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${activeChannel === 'ai' ? 'bg-brand-pink/20 text-brand-pink' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
              >
                <Bot className="w-4 h-4 mr-2" /> AI Assistant
              </button>
            </div>
          </div>

          {/* Direct Messages */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Direct Messages</h3>
            <div className="space-y-1">
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => { setActiveChannel(u.id); setShowSidebar(false); }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${activeChannel === u.id ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                >
                  <div className="w-6 h-6 rounded-full bg-gray-700 mr-2 overflow-hidden flex-shrink-0">
                    {u.photoURL ? <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" /> : <User className="w-full h-full p-1 text-gray-400" />}
                  </div>
                  <span className="truncate text-sm">{u.displayName || 'User'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User Profile Area */}
        <div className="p-4 border-t border-gray-800 bg-[#0a0f19] flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-800 mr-3 overflow-hidden border border-gray-700">
            {user.photoURL ? <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-gray-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{user.displayName || 'Me'}</p>
            <p className="text-xs text-gray-500 truncate">{isMasterAdmin ? 'Master Admin' : 'User'}</p>
          </div>
          {isMasterAdmin && <ShieldAlert className="w-5 h-5 text-brand-mango" />}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-[calc(100vh-5rem)] bg-[#05070a] relative">
        {/* Chat Header */}
        <div className="h-16 border-b border-gray-800 flex items-center justify-between pl-16 md:pl-6 pr-6 bg-[#0a0f19]/50 backdrop-blur-md z-10">
          <div className="flex items-center">
            {activeChannel === 'general' && <><Hash className="w-5 h-5 mr-2 text-gray-400" /><h2 className="text-lg font-bold">General</h2></>}
            {activeChannel === 'ai' && <><Bot className="w-5 h-5 mr-2 text-brand-pink" /><h2 className="text-lg font-bold">AI Assistant {isMasterAdmin && <span className="ml-2 text-xs bg-brand-mango/20 text-brand-mango px-2 py-1 rounded-full">Master Mode</span>}</h2></>}
            {activeChannel !== 'general' && activeChannel !== 'ai' && (
              <>
                <div className="w-8 h-8 rounded-full bg-gray-800 mr-3 overflow-hidden">
                  {users.find(u => u.id === activeChannel)?.photoURL ? <img src={users.find(u => u.id === activeChannel)?.photoURL} alt="" className="w-full h-full object-cover" /> : <User className="w-full h-full p-1.5 text-gray-400" />}
                </div>
                <h2 className="text-lg font-bold">{users.find(u => u.id === activeChannel)?.displayName || 'User'}</h2>
              </>
            )}
          </div>
          {activeChannel !== 'general' && activeChannel !== 'ai' && (
            <div className="flex items-center space-x-3">
              <button onClick={() => setInCall(true)} className="p-2 bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 rounded-full transition-colors" title="Start Video/Audio Call">
                <Video className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {inCall && (
          <div className="absolute inset-0 z-50 bg-black flex flex-col">
            <div className="flex-1" ref={startCall} />
          </div>
        )}

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.senderId === user.uid;
              const showHeader = idx === 0 || messages[idx - 1].senderId !== msg.senderId || msg.timestamp?.seconds - messages[idx - 1].timestamp?.seconds > 300;

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {showHeader && (
                    <div className={`flex items-center mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-6 h-6 rounded-full overflow-hidden flex-shrink-0 ${isMe ? 'ml-2' : 'mr-2'} ${msg.isAI ? 'bg-brand-pink/20' : 'bg-gray-800'}`}>
                        {msg.isAI ? <Bot className="w-full h-full p-1 text-brand-pink" /> : msg.senderPhoto ? <img src={msg.senderPhoto} alt="" className="w-full h-full object-cover" /> : <User className="w-full h-full p-1 text-gray-400" />}
                      </div>
                      <span className="text-xs font-medium text-gray-400">{msg.senderName}</span>
                      {msg.timestamp && <span className="text-[10px] text-gray-600 mx-2">{format(msg.timestamp.toDate(), 'h:mm a')}</span>}
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl p-3 ${isMe ? 'bg-brand-blue text-white rounded-tr-none' : msg.isAI ? 'bg-[#111827] border border-brand-pink/30 text-gray-200 rounded-tl-none' : 'bg-[#111827] border border-gray-800 text-gray-200 rounded-tl-none'}`}>
                    {msg.fileUrl && (
                      <div className="mb-2">
                        {msg.fileType === 'image' ? (
                          <img src={msg.fileUrl} alt="attachment" className="rounded-lg max-h-60 object-contain" />
                        ) : (
                          <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 bg-black/20 rounded-lg hover:bg-black/40 transition-colors">
                            <FileText className="w-5 h-5 mr-2 text-brand-mango" />
                            <span className="text-sm underline">View Attachment</span>
                          </a>
                        )}
                      </div>
                    )}
                    {msg.text && <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#0a0f19] border-t border-gray-800">
          {selectedFile && (
            <div className="mb-3 flex items-center bg-[#111827] p-2 rounded-lg border border-gray-800 inline-flex">
              <FileText className="w-4 h-4 mr-2 text-brand-blue" />
              <span className="text-sm text-gray-300 truncate max-w-[200px]">{selectedFile.name}</span>
              <button onClick={() => setSelectedFile(null)} className="ml-2 text-gray-500 hover:text-red-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex items-end space-x-2">
            <div {...getRootProps()} className="cursor-pointer p-3 bg-[#111827] rounded-xl border border-gray-800 hover:bg-gray-800 transition-colors text-gray-400 hover:text-brand-blue">
              <input {...getInputProps()} />
              <Paperclip className="w-5 h-5" />
            </div>
            <div className="flex-1 bg-[#111827] border border-gray-800 rounded-xl flex items-center focus-within:border-brand-blue focus-within:ring-1 focus-within:ring-brand-blue transition-all">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={activeChannel === 'ai' ? "Ask the AI Assistant..." : "Type a message..."}
                className="w-full bg-transparent border-none focus:ring-0 text-white px-4 py-3 max-h-32 min-h-[44px] resize-none"
                rows={1}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !selectedFile) || uploading}
              className="p-3 bg-brand-blue text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-600 flex justify-between">
            <span>Press Enter to send, Shift+Enter for new line</span>
            {activeChannel === 'general' && <span>Type @AI to summon the assistant</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
