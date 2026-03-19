import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, doc, setDoc, updateDoc, where } from 'firebase/firestore';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { GoogleGenAI } from '@google/genai';
import { Search, Phone, Video, Send, Plus, X, UserPlus, LogOut, MessageSquare, PhoneIncoming, PhoneOff, FileText, Image as ImageIcon, MoreVertical, MessageCircle, Users, UsersRound, CircleDashed, Bot, Settings, ChevronLeft, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';

// ZegoCloud Config
const APP_ID = 1698335343;
const SERVER_SECRET = "827755ef5ec4c06648bc783998a6d0c2";

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  timestamp: any;
  fileUrl?: string;
  fileType?: string;
}

interface ChatUser {
  id: string;
  displayName: string;
  photoURL?: string;
  email: string;
  lastMessage?: string;
  lastMessageTime?: any;
}

interface Group {
  id: string;
  name: string;
  members: string[];
  createdBy: string;
  lastMessage?: string;
  lastMessageTime?: any;
}

interface IncomingCall {
  callerId: string;
  callerName: string;
  callerPhoto?: string;
  roomId: string;
  type: 'audio' | 'video';
  isGroup: boolean;
}

export default function OCChat() {
  const { user } = useAuth();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChat, setActiveChat] = useState<{ id: string, type: 'user' | 'group', name: string, photo?: string } | null>(null);
  const [activeTab, setActiveTab] = useState('chats');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'account' | 'privacy' | 'notifications'>('account');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPhotoURL, setNewPhotoURL] = useState('');

  // Call State
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [outgoingCall, setOutgoingCall] = useState<{ id: string, receiverId: string, receiverName: string, receiverPhoto: string, type: 'audio' | 'video', isGroup: boolean } | null>(null);
  const [inCall, setInCall] = useState(false);
  const callContainerRef = useRef<HTMLDivElement>(null);
  const zpRef = useRef<any>(null);

  // Request Notification Permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // Fetch Users & Groups
  useEffect(() => {
    if (!user) return;

    const fetchUsers = async () => {
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ChatUser[];
      setUsers(usersData.filter(u => u.id !== user.uid));
    };

    const fetchGroups = () => {
      const q = query(collection(db, 'groups'), where('members', 'array-contains', user.uid));
      return onSnapshot(q, (snapshot) => {
        const groupsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Group[];
        setGroups(groupsData);
      });
    };

    fetchUsers();
    const unsubGroups = fetchGroups();

    return () => unsubGroups();
  }, [user]);

  // Listen to outgoing call status
  useEffect(() => {
    if (!user || !outgoingCall || outgoingCall.isGroup) return;
    const unsubscribe = onSnapshot(doc(db, 'calls', outgoingCall.receiverId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.status === 'ended' || data.status === 'rejected') {
          if (zpRef.current) {
            try {
              zpRef.current.destroy();
            } catch (e) {
              console.error(e);
            }
            zpRef.current = null;
          }
          setInCall(false);
          setOutgoingCall(null);
        } else if (data.status === 'answered') {
          joinCallRoom(data.roomId, data.type, false, outgoingCall.receiverId);
          setOutgoingCall(null);
        }
      }
    });
    return () => unsubscribe();
  }, [user, outgoingCall]);

  // Listen for Incoming Calls
  useEffect(() => {
    if (!user) return;
    const callDocRef = doc(db, 'calls', user.uid);
    const unsubscribe = onSnapshot(callDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.status === 'ringing') {
          setIncomingCall({
            callerId: data.callerId,
            callerName: data.callerName,
            callerPhoto: data.callerPhoto,
            roomId: data.roomId,
            type: data.type,
            isGroup: data.isGroup || false
          });
          
          // Trigger Browser Notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Incoming ${data.type} call from ${data.callerName}`, {
              icon: data.callerPhoto || '/favicon.ico',
              body: 'Click to answer or decline',
            });
          }
          // Play ringtone (vibrate)
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200]);
          }
        } else {
          setIncomingCall(null);
        }
      }
    });

    return () => {
      unsubscribe();
      if (zpRef.current) {
        try {
          zpRef.current.destroy();
        } catch (e) {
          console.error('Failed to destroy Zego instance on unmount:', e);
        }
      }
    };
  }, [user]);

  // Listen to Messages
  useEffect(() => {
    if (!user || !activeChat) return;

    let channelId = '';
    if (activeChat.id === 'ai_bot') {
      channelId = [user.uid, 'ai_bot'].sort().join('_');
    } else if (activeChat.type === 'user') {
      channelId = [user.uid, activeChat.id].sort().join('_');
    } else {
      channelId = activeChat.id;
    }

    const q = query(collection(db, 'chats', channelId, 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
      setMessages(msgs);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [user, activeChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // File Upload
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
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
        if (acceptedFiles[0].size > 40 * 1024 * 1024) {
          alert('File size must be less than 40MB');
          return;
        }
        setSelectedFile(acceptedFiles[0]);
      }
    },
    maxSize: 41943040,
  });

  const handleSend = async () => {
    if (!input.trim() && !selectedFile) return;
    if (!user || !activeChat) return;

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

    let channelId = '';
    if (activeChat.id === 'ai_bot') {
      channelId = [user.uid, 'ai_bot'].sort().join('_');
    } else if (activeChat.type === 'user') {
      channelId = [user.uid, activeChat.id].sort().join('_');
    } else {
      channelId = activeChat.id;
    }

    await addDoc(collection(db, 'chats', channelId, 'messages'), {
      text: messageText,
      senderId: user.uid,
      senderName: user.displayName || 'User',
      senderPhoto: user.photoURL || '',
      timestamp: serverTimestamp(),
      ...(fileUrl && { fileUrl, fileType })
    });

    // AI Chime-in Logic
    if (activeChat.id === 'ai_bot') {
      triggerAIResponse(channelId, messageText, user.displayName || 'User', true);
    } else if (messageText && (messageText.toLowerCase().includes('@ai') || Math.random() < 0.3)) {
      triggerAIResponse(channelId, messageText, user.displayName || 'User', false);
    }
  };

  const triggerAIResponse = async (channelId: string, userMessage: string, userName: string, isDirectChat: boolean) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = isDirectChat 
        ? `You are OCSTHAEL AI, a helpful and friendly AI assistant. The user ${userName} said: "${userMessage}". Reply directly to them.`
        : `You are a fun, witty AI assistant hanging out in a chat between friends. The user ${userName} just said: "${userMessage}". Reply with a short, funny, or relevant comment (in Bengali or English) as if you are a 3rd friend chiming in. Keep it under 2 sentences.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      if (response.text) {
        await addDoc(collection(db, 'chats', channelId, 'messages'), {
          text: response.text,
          senderId: 'ai_bot',
          senderName: 'OCSTHAEL AI',
          senderPhoto: 'https://api.dicebear.com/7.x/bottts/svg?seed=ocsthael',
          timestamp: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("AI Response Error:", error);
    }
  };

  // Call Logic
  const initiateCall = async (type: 'audio' | 'video') => {
    if (!user || !activeChat || inCall) return;

    const roomId = activeChat.type === 'user' 
      ? [user.uid, activeChat.id].sort().join('_')
      : activeChat.id;

    // Notify receiver(s)
    if (activeChat.type === 'user') {
      await setDoc(doc(db, 'calls', activeChat.id), {
        callerId: user.uid,
        callerName: user.displayName || 'User',
        callerPhoto: user.photoURL || '',
        roomId,
        type,
        isGroup: false,
        status: 'ringing',
        timestamp: serverTimestamp()
      });
      setOutgoingCall({ 
        id: activeChat.id, 
        receiverId: activeChat.id, 
        receiverName: activeChat.name, 
        receiverPhoto: activeChat.photo || '', 
        type, 
        isGroup: false 
      });
    } else {
      // Notify group members
      const group = groups.find(g => g.id === activeChat.id);
      if (group) {
        const promises = group.members
          .filter(m => m !== user.uid)
          .map(memberId => setDoc(doc(db, 'calls', memberId), {
            callerId: user.uid,
            callerName: `${user.displayName} (Group Call)`,
            callerPhoto: user.photoURL || '',
            roomId,
            type,
            isGroup: true,
            status: 'ringing',
            timestamp: serverTimestamp()
          }));
        await Promise.all(promises);
        setOutgoingCall({ 
          id: activeChat.id, 
          receiverId: activeChat.id, 
          receiverName: activeChat.name, 
          receiverPhoto: activeChat.photo || '', 
          type, 
          isGroup: true 
        });
      }
    }

    if (activeChat.type === 'group') {
      joinCallRoom(roomId, type, true);
    }
  };

  const answerCall = () => {
    if (!incomingCall || !user || inCall) return;
    setDoc(doc(db, 'calls', user.uid), { status: 'answered' }, { merge: true });
    joinCallRoom(incomingCall.roomId, incomingCall.type, incomingCall.isGroup, user.uid);
    setIncomingCall(null);
  };

  const rejectCall = () => {
    if (!user) return;
    setDoc(doc(db, 'calls', user.uid), { status: 'ended' }, { merge: true });
    setIncomingCall(null);
  };

  const endOutgoingCall = () => {
    if (!outgoingCall || !user) return;
    if (!outgoingCall.isGroup) {
      setDoc(doc(db, 'calls', outgoingCall.receiverId), { status: 'ended' }, { merge: true });
    }
    setOutgoingCall(null);
  };

  const joinCallRoom = (roomId: string, type: 'audio' | 'video', isGroup: boolean, targetCallDocId?: string) => {
    if (!user || !callContainerRef.current) return;

    if (zpRef.current) {
      try {
        zpRef.current.destroy();
      } catch (e) {
        console.error('Failed to destroy previous Zego instance:', e);
      }
    }

    setInCall(true);

    setTimeout(() => {
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        APP_ID,
        SERVER_SECRET,
        roomId,
        user.uid,
        user.displayName || 'User'
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zpRef.current = zp;

      zp.joinRoom({
        container: callContainerRef.current,
        scenario: {
          mode: isGroup ? ZegoUIKitPrebuilt.GroupCall : ZegoUIKitPrebuilt.OneONoneCall,
        },
        turnOnMicrophoneWhenJoining: true,
        turnOnCameraWhenJoining: type === 'video',
        showMyCameraToggleButton: type === 'video', // Hide camera toggle for audio calls
        showAudioVideoSettingsButton: true,
        showScreenSharingButton: type === 'video',
        showTextChat: true,
        showUserList: true,
        maxUsers: isGroup ? 50 : 2,
        layout: isGroup ? "Grid" : "Auto",
        showLayoutButton: isGroup,
        onLeaveRoom: () => {
          setInCall(false);
          setOutgoingCall(null);
          if (zpRef.current) {
            try {
              zpRef.current.destroy();
            } catch (e) {
              console.error(e);
            }
            zpRef.current = null;
          }
          if (targetCallDocId) {
            setDoc(doc(db, 'calls', targetCallDocId), { status: 'ended' }, { merge: true });
          }
        },
      });
    }, 100);
  };

  const createGroup = async () => {
    if (!groupName.trim() || !user || selectedMembers.length === 0) return;
    
    await addDoc(collection(db, 'groups'), {
      name: groupName.trim(),
      members: [user.uid, ...selectedMembers],
      createdBy: user.uid,
      createdAt: serverTimestamp()
    });

    setShowGroupModal(false);
    setGroupName('');
    setSelectedMembers([]);
  };

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'chats', icon: MessageCircle, label: 'Chats' },
    { id: 'calls', icon: Phone, label: 'Calls' },
    { id: 'people', icon: Users, label: 'People' },
    { id: 'groups', icon: UsersRound, label: 'Groups' },
    { id: 'stories', icon: CircleDashed, label: 'Stories' },
    { id: 'ai', icon: Bot, label: 'AI' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white overflow-hidden font-sans">
      <div className="flex flex-1 overflow-hidden relative">
        {/* 1. LEFT SIDEBAR (Inbox / Tabs) */}
        <div className={`w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex flex-col ${activeChat || inCall ? 'hidden md:flex' : 'flex'}`}>
          {/* Top Bar */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors" title="Go Back">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 capitalize">{activeTab}</h2>
          </div>
          {activeTab === 'groups' && (
            <button onClick={() => setShowGroupModal(true)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors" title="Create Group">
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Search Engine */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-full focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'chats' && (
            <>
              {groups.length > 0 && (
                <div className="mb-2">
                  <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Groups</h3>
                  {groups.map(group => (
                    <div
                      key={group.id}
                      onClick={() => setActiveChat({ id: group.id, type: 'group', name: group.name })}
                      className={`flex items-center space-x-3 px-4 py-3 cursor-pointer transition-colors ${
                        activeChat?.id === group.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                          {group.name?.charAt(0)?.toUpperCase() || 'G'}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">{group.name}</h4>
                        </div>
                        <p className="text-sm text-gray-500 truncate">Tap to view group chat</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Direct Messages</h3>
                {filteredUsers.map(u => (
                  <div
                    key={u.id}
                    onClick={() => setActiveChat({ id: u.id, type: 'user', name: u.displayName, photo: u.photoURL })}
                    className={`flex items-center space-x-3 px-4 py-3 cursor-pointer transition-colors ${
                      activeChat?.id === u.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="relative">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt={u.displayName} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg">
                          {u.displayName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{u.displayName}</h4>
                        <span className="text-xs text-gray-400">Just now</span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">Say hi to {u.displayName ? u.displayName.split(' ')[0] : 'User'}!</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'calls' && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center">
              <Phone className="w-12 h-12 mb-4 opacity-20" />
              <p>No recent calls</p>
            </div>
          )}

          {activeTab === 'people' && (
            <div>
              {filteredUsers.map(u => (
                <div
                  key={u.id}
                  onClick={() => setActiveChat({ id: u.id, type: 'user', name: u.displayName, photo: u.photoURL })}
                  className={`flex items-center space-x-3 px-4 py-3 cursor-pointer transition-colors ${
                    activeChat?.id === u.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="relative">
                    {u.photoURL ? (
                      <img src={u.photoURL} alt={u.displayName} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg">
                        {u.displayName?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{u.displayName}</h4>
                    <p className="text-sm text-gray-500 truncate">{u.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'groups' && (
            <div>
              {groups.map(group => (
                <div
                  key={group.id}
                  onClick={() => setActiveChat({ id: group.id, type: 'group', name: group.name })}
                  className={`flex items-center space-x-3 px-4 py-3 cursor-pointer transition-colors ${
                    activeChat?.id === group.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                      {group.name?.charAt(0)?.toUpperCase() || 'G'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{group.name}</h4>
                    <p className="text-sm text-gray-500 truncate">{group.members.length} members</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'stories' && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center">
              <CircleDashed className="w-12 h-12 mb-4 opacity-20" />
              <p>No recent stories</p>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center">
              <Bot className="w-12 h-12 mb-4 text-blue-500" />
              <p className="text-gray-900 font-medium mb-2">OCSTHAEL AI Assistant</p>
              <p className="text-sm mb-4">Your personal AI companion. Ask me anything!</p>
              <button 
                onClick={() => setActiveChat({ id: 'ai_bot', type: 'user', name: 'OCSTHAEL AI', photo: 'https://api.dicebear.com/7.x/bottts/svg?seed=ocsthael' })}
                className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
              >
                Start Chat
              </button>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-6">
              <div className="flex flex-col items-center mb-6">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-24 h-24 rounded-full object-cover mb-4" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl font-bold mb-4">
                    {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900">{user?.displayName}</h3>
                <p className="text-gray-500">{user?.email}</p>
              </div>
              <div className="space-y-2">
                <button onClick={() => { setActiveSettingsTab('account'); setNewDisplayName(user?.displayName || ''); setNewPhotoURL(user?.photoURL || ''); setShowSettingsModal(true); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 font-medium text-gray-700">Account Settings</button>
                <button onClick={() => { setActiveSettingsTab('privacy'); setShowSettingsModal(true); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 font-medium text-gray-700">Privacy & Safety</button>
                <button onClick={() => { setActiveSettingsTab('notifications'); setShowSettingsModal(true); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 font-medium text-gray-700">Notifications</button>
                <button 
                  onClick={async () => {
                    await signOut(auth);
                    navigate('/login');
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 font-medium text-red-600 flex items-center"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Bar (Desktop) */}
        <div className="hidden md:flex items-center justify-between px-2 py-2 border-t border-gray-200 bg-white overflow-x-auto hide-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'ai') {
                  setActiveChat({ id: 'ai_bot', type: 'user', name: 'OCSTHAEL AI', photo: 'https://api.dicebear.com/7.x/bottts/svg?seed=ocsthael' });
                } else {
                  setActiveChat(null);
                }
              }}
              className={`flex flex-col items-center p-2 min-w-[48px] rounded-lg transition-colors ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <tab.icon className={`w-6 h-6 mb-1 ${activeTab === tab.id ? 'fill-blue-100' : ''}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. MIDDLE (Message Area) */}
      <div className={`flex-1 flex flex-col bg-white relative ${!activeChat && !inCall ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            {/* Header */}
            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4 md:px-6 bg-white shadow-sm z-10">
              <div className="flex items-center space-x-3">
                <button onClick={() => setActiveChat(null)} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="relative">
                  {activeChat.photo ? (
                    <img src={activeChat.photo} alt={activeChat.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                      {activeChat.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  {activeChat.type === 'user' && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 leading-tight">{activeChat.name}</h2>
                  <p className="text-xs text-green-500 font-medium">Active now</p>
                </div>
              </div>
              
              {/* Call Icons */}
              <div className="flex items-center space-x-4 text-blue-600">
                {activeChat.id !== 'ai_bot' && (
                  <>
                    <button onClick={() => initiateCall('audio')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <Phone className="w-6 h-6" fill="currentColor" />
                    </button>
                    <button onClick={() => initiateCall('video')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <Video className="w-7 h-7" fill="currentColor" />
                    </button>
                  </>
                )}
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                  <MoreVertical className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
              {messages.map((msg, index) => {
                const isMe = msg.senderId === user?.uid;
                const showHeader = index === 0 || messages[index - 1].senderId !== msg.senderId;

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                      {!isMe && showHeader && (
                        <div className="flex-shrink-0 mr-2 mb-1">
                          {msg.senderPhoto ? (
                            <img src={msg.senderPhoto} alt={msg.senderName} className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-white">
                              {msg.senderName?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          )}
                        </div>
                      )}
                      <div className={`${!isMe && !showHeader ? 'ml-9' : ''} flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`px-4 py-2 text-[15px] ${
                            isMe 
                              ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm' 
                              : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm'
                          }`}
                        >
                          {msg.fileUrl && (
                            <div className="mb-2">
                              {msg.fileType === 'image' ? (
                                <img src={msg.fileUrl} alt="attachment" className="max-w-xs rounded-lg" />
                              ) : (
                                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-sm underline">
                                  <FileText className="w-4 h-4" />
                                  <span>Attachment</span>
                                </a>
                              )}
                            </div>
                          )}
                          {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
                        </div>
                        {/* Time */}
                        <span className="text-[11px] text-gray-400 mt-1 px-1">
                          {msg.timestamp?.toDate ? format(msg.timestamp.toDate(), 'h:mm a') : 'Sending...'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Footer (Input) */}
            <div className="p-4 bg-white border-t border-gray-200">
              {selectedFile && (
                <div className="mb-3 flex items-center justify-between bg-blue-50 p-2 rounded-lg border border-blue-100 max-w-sm">
                  <div className="flex items-center space-x-2 text-sm text-blue-700">
                    <ImageIcon className="w-4 h-4" />
                    <span className="truncate">{selectedFile.name}</span>
                  </div>
                  <button onClick={() => setSelectedFile(null)} className="text-blue-500 hover:text-blue-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              <div className="flex items-end space-x-2">
                {/* File Share Icon (+) */}
                <div {...getRootProps()} className="p-2 text-blue-600 hover:bg-gray-100 rounded-full cursor-pointer transition-colors mb-1">
                  <input {...getInputProps()} />
                  <Plus className="w-6 h-6" />
                </div>
                
                {/* Text Box */}
                <div className="flex-1 bg-gray-100 rounded-3xl border border-transparent focus-within:border-blue-300 focus-within:bg-white transition-all overflow-hidden flex items-center px-4 py-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Aa"
                    className="w-full max-h-32 bg-transparent border-none focus:ring-0 resize-none text-[15px] py-1"
                    rows={1}
                  />
                </div>
                
                {/* Send Icon */}
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && !selectedFile) || uploading}
                  className="p-2 text-blue-600 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-1"
                >
                  <Send className="w-6 h-6" fill="currentColor" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-white">
            <MessageSquare className="w-20 h-20 mb-6 text-gray-200" />
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">No chat selected</h3>
            <p className="text-gray-500">Choose a user or group from the left to start messaging.</p>
          </div>
        )}

        {/* ZegoCloud Call Container (Video/Audio Grid) */}
        <div 
          ref={callContainerRef} 
          className={`fixed inset-0 z-[200] bg-gray-900 ${inCall ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        />
      </div>
      </div>

      {/* Bottom Navigation Bar (Mobile) */}
      <div className="flex md:hidden items-center justify-between px-2 py-2 border-t border-gray-200 bg-white overflow-x-auto hide-scrollbar z-50">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'ai') {
                setActiveChat({ id: 'ai_bot', type: 'user', name: 'OCSTHAEL AI', photo: 'https://api.dicebear.com/7.x/bottts/svg?seed=ocsthael' });
              } else {
                setActiveChat(null);
              }
            }}
            className={`flex flex-col items-center p-2 min-w-[48px] rounded-lg transition-colors ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <tab.icon className={`w-6 h-6 mb-1 ${activeTab === tab.id ? 'fill-blue-100' : ''}`} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* OUTGOING CALL OVERLAY (Full Screen) */}
      <AnimatePresence>
        {outgoingCall && !inCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center"
          >
            <div className="relative mb-8">
              {outgoingCall.receiverPhoto ? (
                <img src={outgoingCall.receiverPhoto} alt={outgoingCall.receiverName} className="w-40 h-40 rounded-full border-4 border-gray-700 object-cover shadow-2xl z-10 relative" />
              ) : (
                <div className="w-40 h-40 rounded-full border-4 border-gray-700 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-6xl font-bold text-white shadow-2xl z-10 relative">
                  {outgoingCall.receiverName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping opacity-30 scale-150"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-20 scale-125" style={{ animationDelay: '0.2s' }}></div>
            </div>
            
            <h2 className="text-4xl font-bold text-white mb-2">{outgoingCall.receiverName}</h2>
            <p className="text-gray-400 text-lg flex items-center justify-center mb-16">
              {outgoingCall.type === 'video' ? <Video className="w-5 h-5 mr-2" /> : <Phone className="w-5 h-5 mr-2" />}
              Calling...
            </p>
            
            <div className="flex flex-col items-center">
              <button
                onClick={endOutgoingCall}
                className="w-20 h-20 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 hover:scale-105 transition-all shadow-lg shadow-red-500/30 mb-3"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
              <span className="text-white font-medium">End Call</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. INCOMING CALL OVERLAY (Full Screen) */}
      <AnimatePresence>
        {incomingCall && !inCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center"
          >
            {/* Big Logo */}
            <div className="relative mb-8">
              {incomingCall.callerPhoto ? (
                <img src={incomingCall.callerPhoto} alt={incomingCall.callerName} className="w-40 h-40 rounded-full border-4 border-gray-700 object-cover shadow-2xl z-10 relative" />
              ) : (
                <div className="w-40 h-40 rounded-full border-4 border-gray-700 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-6xl font-bold text-white shadow-2xl z-10 relative">
                  {incomingCall.callerName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              {/* Ripple Effect */}
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping opacity-30 scale-150"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-20 scale-125" style={{ animationDelay: '0.2s' }}></div>
            </div>
            
            {/* Name & Status */}
            <h2 className="text-4xl font-bold text-white mb-2">{incomingCall.callerName}</h2>
            <p className="text-gray-400 text-lg flex items-center justify-center mb-16">
              {incomingCall.type === 'video' ? <Video className="w-5 h-5 mr-2" /> : <Phone className="w-5 h-5 mr-2" />}
              Incoming {incomingCall.type} call...
            </p>
            
            {/* Big Buttons (Accept / Decline) */}
            <div className="flex space-x-16">
              <div className="flex flex-col items-center">
                <button
                  onClick={rejectCall}
                  className="w-20 h-20 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 hover:scale-105 transition-all shadow-lg shadow-red-500/30 mb-3"
                >
                  <PhoneOff className="w-8 h-8" />
                </button>
                <span className="text-white font-medium">Decline</span>
              </div>
              
              <div className="flex flex-col items-center">
                <button
                  onClick={answerCall}
                  className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 hover:scale-105 transition-all shadow-lg shadow-green-500/30 animate-bounce mb-3"
                >
                  <PhoneIncoming className="w-8 h-8" />
                </button>
                <span className="text-white font-medium">Accept</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Group Creation Modal */}
      <AnimatePresence>
        {showGroupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Create New Group</h3>
                <button onClick={() => setShowGroupModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Enter group name"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Members</label>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                    {users.map(u => (
                      <label key={u.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(u.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMembers([...selectedMembers, u.id]);
                            } else {
                              setSelectedMembers(selectedMembers.filter(id => id !== u.id));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div className="ml-3 flex items-center">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt={u.displayName} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                              {u.displayName?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                          <span className="ml-2 text-sm font-medium text-gray-900">{u.displayName}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-100 flex justify-end space-x-2 bg-gray-50">
                <button
                  onClick={() => setShowGroupModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={createGroup}
                  disabled={!groupName.trim() || selectedMembers.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Group
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 capitalize">{activeSettingsTab} Settings</h3>
                <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4">
                {activeSettingsTab === 'account' && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                      <input
                        type="text"
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Enter new display name"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
                      <input
                        type="text"
                        value={newPhotoURL}
                        onChange={(e) => setNewPhotoURL(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Enter new photo URL"
                      />
                    </div>
                  </>
                )}
                {activeSettingsTab === 'privacy' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Read Receipts</h4>
                        <p className="text-xs text-gray-500">Let others know when you've read their messages.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Online Status</h4>
                        <p className="text-xs text-gray-500">Show when you are active.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                )}
                {activeSettingsTab === 'notifications' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Push Notifications</h4>
                        <p className="text-xs text-gray-500">Receive notifications for new messages.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Sound</h4>
                        <p className="text-xs text-gray-500">Play a sound for incoming messages and calls.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-100 flex justify-end space-x-2 bg-gray-50">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {activeSettingsTab === 'account' ? 'Cancel' : 'Close'}
                </button>
                {activeSettingsTab === 'account' && (
                  <button
                    onClick={async () => {
                      if (!user) return;
                      try {
                      const { updateProfile } = await import('firebase/auth');
                      await updateProfile(user, {
                        displayName: newDisplayName || user.displayName,
                        photoURL: newPhotoURL || user.photoURL
                      });
                      // Also update user document in firestore
                      const { doc, updateDoc } = await import('firebase/firestore');
                      await updateDoc(doc(db, 'users', user.uid), {
                        displayName: newDisplayName || user.displayName,
                        photoURL: newPhotoURL || user.photoURL
                      });
                      setShowSettingsModal(false);
                      alert('Profile updated successfully!');
                    } catch (error) {
                      console.error('Error updating profile:', error);
                      alert('Failed to update profile.');
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
