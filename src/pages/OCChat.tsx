import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, doc, setDoc, updateDoc, where, getDoc } from 'firebase/firestore';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey } from '../services/apiKeys';
import { Search, Phone, Video, Send, Plus, X, UserPlus, LogOut, MessageSquare, PhoneIncoming, PhoneOff, FileText, Image as ImageIcon, MoreVertical, MessageCircle, Users, UsersRound, CircleDashed, Bot, Settings, ChevronLeft, ArrowLeft, Mic, Smile, Reply, Forward, History, Trash2, Check, CheckCheck, ArrowDownLeft, ArrowUpRight, Play, Pause } from 'lucide-react';
import { format } from 'date-fns';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { sendPushNotification, broadcastAutoNotifications } from '../lib/messaging';

// ZegoCloud Config
const APP_ID = Number(process.env.ZEGO_APP_ID || 0);
const SERVER_SECRET = process.env.ZEGO_SERVER_SECRET || "";

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  timestamp: any;
  fileUrl?: string;
  fileType?: string;
  waveformData?: number[];
  duration?: number;
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
  reactions?: { [emoji: string]: string[] };
}

interface CallLog {
  id: string;
  callerId: string;
  callerName: string;
  callerPhoto?: string;
  receiverId: string;
  receiverName: string;
  receiverPhoto?: string;
  type: 'audio' | 'video';
  status: 'incoming' | 'outgoing' | 'missed' | 'answered' | 'rejected' | 'ended';
  timestamp: any;
  duration?: string;
  isGroup?: boolean;
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

const formatTime = (time: number) => {
  if (isNaN(time)) return "0:00";
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface ChatConfig {
  voiceBubbleWidth: number;
  voiceBubblePadding: number;
  voiceBubbleRadius: number;
  voiceSentColor: string;
  voiceReceivedColor: string;
  messageTextSize: number;
  voiceWaveformColor: string;
  voiceProgressColor: string;
  voiceDurationSize: number;
  recordingBubbleColor: string;
  voiceWaveformHeight: number;
  voiceIconSize: number;
  voiceIconBgColor: string;
  voiceIconColor: string;
}

const DEFAULT_CONFIG: ChatConfig = {
  voiceBubbleWidth: 280,
  voiceBubblePadding: 12,
  voiceBubbleRadius: 16,
  voiceSentColor: '#22c55e', // green-500
  voiceReceivedColor: '#f3f4f6', // gray-100
  messageTextSize: 15,
  voiceWaveformColor: '#94a3b8', // slate-400
  voiceProgressColor: '#ffffff',
  voiceDurationSize: 10,
  recordingBubbleColor: '#ef4444', // red-500
  voiceWaveformHeight: 32,
  voiceIconSize: 40,
  voiceIconBgColor: '#ffffff',
  voiceIconColor: '#22c55e',
};

const VoiceMessage = ({ url, isMe, waveformData: initialWaveformData, duration: initialDuration, timestamp, config = DEFAULT_CONFIG }: { 
  url: string; 
  isMe: boolean; 
  waveformData?: number[]; 
  duration?: number;
  timestamp?: any;
  config?: ChatConfig;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [peaks, setPeaks] = useState<number[]>(initialWaveformData || []);

  useEffect(() => {
    if (initialWaveformData && initialWaveformData.length > 0) {
      setPeaks(initialWaveformData);
      return;
    }
    const generatePeaks = async () => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const rawData = audioBuffer.getChannelData(0);
        const samples = 40;
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData = [];
        for (let i = 0; i < samples; i++) {
          let blockStart = blockSize * i;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum = sum + Math.abs(rawData[blockStart + j]);
          }
          filteredData.push(sum / blockSize);
        }
        
        const max = Math.max(...filteredData);
        const normalizedData = filteredData.map(n => Math.max(0.1, n / max));
        setPeaks(normalizedData);
      } catch (e) {
        setPeaks([...Array(40)].map(() => Math.random() * 0.8 + 0.1));
      }
    };
    if (url) generatePeaks();
  }, [url, initialWaveformData]);

  const togglePlay = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          if (audioRef.current.ended) {
            audioRef.current.currentTime = 0;
          }
          await audioRef.current.play();
          setIsPlaying(true);
        }
      } catch (err) {
        console.error("Playback failed:", err);
      }
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const onEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const isDarkColor = (color: string) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  };

  const bubbleColor = isMe ? config.voiceSentColor : config.voiceReceivedColor;
  const textColor = isDarkColor(bubbleColor) ? 'text-white' : 'text-gray-800';
  const subTextColor = isDarkColor(bubbleColor) ? 'text-white/70' : 'text-gray-500';

  return (
    <div 
      onClick={(e) => togglePlay(e)}
      style={{ 
        minWidth: `${config.voiceBubbleWidth}px`,
        padding: `${config.voiceBubblePadding}px`,
        borderRadius: `${config.voiceBubbleRadius}px`,
        backgroundColor: bubbleColor
      }}
      className={`flex items-center space-x-3 max-w-full cursor-pointer transition-all hover:opacity-95 active:scale-[0.98] border border-black/5 shadow-sm ${textColor}`}
    >
      <button 
        onClick={(e) => {
          e.stopPropagation();
          togglePlay(e);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        style={{ 
          width: `${config.voiceIconSize}px`, 
          height: `${config.voiceIconSize}px`,
          backgroundColor: isMe ? config.voiceIconBgColor : '#2563eb', // default blue for received if not configured
          color: isMe ? config.voiceIconColor : '#ffffff'
        }}
        className="rounded-full flex items-center justify-center shadow-sm transition-transform active:scale-90 flex-shrink-0"
      >
        {isPlaying ? <Pause size={config.voiceIconSize * 0.5} fill="currentColor" /> : <Play size={config.voiceIconSize * 0.5} className="ml-0.5" fill="currentColor" />}
      </button>
      
        <div className="flex-1 flex flex-col space-y-1 pointer-events-none">
        <div className="flex items-center space-x-1 overflow-hidden" style={{ height: `${config.voiceWaveformHeight}px` }}>
          {(peaks.length > 0 ? peaks : [...Array(40)].fill(0.1)).map((peak, i) => {
            const isActive = (i / peaks.length) * 100 <= progress;
            return (
              <div 
                key={i} 
                className="w-1 rounded-full transition-all duration-200"
                style={{ 
                  height: `${Math.max(15, peak * 100)}%`,
                  backgroundColor: isActive ? config.voiceProgressColor : config.voiceWaveformColor
                }} 
              />
            );
          })}
        </div>
        <div 
          className="flex justify-between items-center font-bold tabular-nums"
          style={{ fontSize: `${config.voiceDurationSize}px`, color: isDarkColor(bubbleColor) ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }}
        >
          <span>
            {isPlaying ? formatTime(audioRef.current?.currentTime || 0) : formatTime(duration)}
          </span>
          {timestamp && (
             <span>
               {format(timestamp.toDate(), 'h:mm a')}
             </span>
          )}
        </div>
      </div>
      <audio 
        ref={audioRef} 
        src={url} 
        onTimeUpdate={onTimeUpdate} 
        onLoadedMetadata={onLoadedMetadata} 
        onEnded={onEnded}
        className="hidden"
        preload="auto"
      />
    </div>
  );
};

export default function OCChat() {
  const { user } = useAuth();
  const [chatConfig, setChatConfig] = useState<ChatConfig>(DEFAULT_CONFIG);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const isAdmin = user?.email === 'mdgsty424@gmail.com';

  // Listen to Global Chat Config
  useEffect(() => {
    broadcastAutoNotifications();
    const unsubConfig = onSnapshot(doc(db, 'config', 'chat'), (snapshot) => {
      if (snapshot.exists()) {
        setChatConfig({ ...DEFAULT_CONFIG, ...snapshot.data() });
      }
    });
    return () => unsubConfig();
  }, []);
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

  // New Features State
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null); // messageId
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const typingTimeoutRef = useRef<any>(null);

  const emojis = ['❤️', '😂', '😮', '😢', '😡', '👍', '🔥', '🙏'];

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

  // Listen to Messages & Typing
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
    const unsubMessages = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
      setMessages(msgs);
      scrollToBottom();
    });

    // Typing Indicator Listener
    let unsubTyping: () => void;
    if (activeChat.type === 'group') {
      const typingQuery = query(collection(db, 'chats', channelId, 'typing'), where('isTyping', '==', true));
      unsubTyping = onSnapshot(typingQuery, (snapshot) => {
        const typingUsers = snapshot.docs
          .filter(doc => doc.id !== user.uid)
          .map(doc => {
            const u = users.find(u => u.id === doc.id);
            return u ? u.displayName : 'Someone';
          });
        setOtherUserTyping(typingUsers.length > 0);
        // You could also store the names of typing users to show "X is typing..."
      });
    } else {
      const otherUserId = activeChat.id === 'ai_bot' ? 'ai_bot' : activeChat.id;
      unsubTyping = onSnapshot(doc(db, 'chats', channelId, 'typing', otherUserId), (snapshot) => {
        if (snapshot.exists()) {
          setOtherUserTyping(snapshot.data().isTyping);
        } else {
          setOtherUserTyping(false);
        }
      });
    }

    return () => {
      unsubMessages();
      unsubTyping();
    };
  }, [user, activeChat]);

  // Fetch Call Logs
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'callLogs'),
      where('participants', 'array-contains', user.uid)
    );
    return onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CallLog[];
      // Sort client-side to avoid index requirement
      logs.sort((a, b) => {
        const timeA = a.timestamp?.toMillis?.() || 0;
        const timeB = b.timestamp?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setCallLogs(logs);
    });
  }, [user]);

  // Handle Typing Status
  const handleTyping = () => {
    if (!user || !activeChat) return;
    
    let channelId = '';
    if (activeChat.id === 'ai_bot') {
      channelId = [user.uid, 'ai_bot'].sort().join('_');
    } else if (activeChat.type === 'user') {
      channelId = [user.uid, activeChat.id].sort().join('_');
    } else {
      channelId = activeChat.id;
    }

    if (!isTyping) {
      setIsTyping(true);
      setDoc(doc(db, 'chats', channelId, 'typing', user.uid), { isTyping: true }, { merge: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setDoc(doc(db, 'chats', channelId, 'typing', user.uid), { isTyping: false }, { merge: true });
    }, 3000);
  };

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
    if ((!input.trim() && !selectedFile) || !user || !activeChat) return;

    let fileUrl = '';
    let fileType = '';
    let finalWaveformData: number[] | null = null;
    let finalDuration: number | null = null;

    if (selectedFile) {
      const isAudio = selectedFile.type.startsWith('audio/') || selectedFile.name.endsWith('.webm');
      const uploadResult = await handleFileUpload(selectedFile);
      if (uploadResult) {
        fileUrl = uploadResult.url;
        fileType = isAudio ? 'audio' : uploadResult.type;
        
        if (isAudio && waveformData.length > 0) {
          const samples = 40;
          const blockSize = Math.max(1, Math.floor(waveformData.length / samples));
          const downsampled = [];
          for (let i = 0; i < samples; i++) {
            let blockStart = blockSize * i;
            let sum = 0;
            let count = 0;
            for (let j = 0; j < blockSize && (blockStart + j) < waveformData.length; j++) {
              sum += waveformData[blockStart + j];
              count++;
            }
            downsampled.push(count > 0 ? sum / count : 0.1);
          }
          finalWaveformData = downsampled;
          finalDuration = recordingDuration;
        }
      }
      setSelectedFile(null);
      setWaveformData([]);
      setRecordingDuration(0);
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

    const messageData: any = {
      text: messageText,
      senderId: user.uid,
      senderName: user.displayName || 'User',
      senderPhoto: user.photoURL || '',
      timestamp: serverTimestamp(),
      ...(fileUrl && { fileUrl, fileType }),
      ...(finalWaveformData && { waveformData: finalWaveformData }),
      ...(finalDuration && { duration: finalDuration })
    };

    if (replyTo) {
      messageData.replyTo = {
        id: replyTo.id,
        text: replyTo.text || (replyTo.fileUrl ? 'Attachment' : ''),
        senderName: replyTo.senderName
      };
    }

    await addDoc(collection(db, 'chats', channelId, 'messages'), messageData);
    
    // Send Push Notification
    if (activeChat.id !== 'ai_bot') {
      if (activeChat.type === 'user') {
        const recipientDoc = await getDoc(doc(db, 'users', activeChat.id));
        const recipientData = recipientDoc.data();
        if (recipientData?.fcmToken) {
          await sendPushNotification(
            [recipientData.fcmToken],
            user.displayName || 'New Message',
            messageText || (fileUrl ? 'Sent an attachment' : ''),
            { url: '/oc-chat', type: 'message' }
          );
        }
      } else if (activeChat.type === 'group') {
        // For groups, we'd need to fetch tokens for all members except self
        const group = groups.find(g => g.id === activeChat.id);
        if (group) {
          const otherMembers = group.members.filter(m => m !== user.uid);
          const memberTokens: string[] = [];
          for (const memberId of otherMembers) {
            const memberDoc = await getDoc(doc(db, 'users', memberId));
            const token = memberDoc.data()?.fcmToken;
            if (token) memberTokens.push(token);
          }
          if (memberTokens.length > 0) {
            await sendPushNotification(
              memberTokens,
              `${group.name}: ${user.displayName}`,
              messageText || (fileUrl ? 'Sent an attachment' : ''),
              { url: '/oc-chat', type: 'message' }
            );
          }
        }
      }
    }

    // Clear typing status
    setIsTyping(false);
    setDoc(doc(db, 'chats', channelId, 'typing', user.uid), { isTyping: false }, { merge: true });
    setReplyTo(null);

    // AI Chime-in Logic
    if (activeChat.id === 'ai_bot') {
      triggerAIResponse(channelId, messageText, user.displayName || 'User', true);
    } else if (messageText && (messageText.toLowerCase().includes('@ai') || Math.random() < 0.3)) {
      triggerAIResponse(channelId, messageText, user.displayName || 'User', false);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user || !activeChat) return;
    
    let channelId = '';
    if (activeChat.id === 'ai_bot') {
      channelId = [user.uid, 'ai_bot'].sort().join('_');
    } else if (activeChat.type === 'user') {
      channelId = [user.uid, activeChat.id].sort().join('_');
    } else {
      channelId = activeChat.id;
    }

    const msgRef = doc(db, 'chats', channelId, 'messages', messageId);
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;

    const currentReactions = msg.reactions || {};
    const usersWhoReacted = currentReactions[emoji] || [];

    if (usersWhoReacted.includes(user.uid)) {
      currentReactions[emoji] = usersWhoReacted.filter(id => id !== user.uid);
      if (currentReactions[emoji].length === 0) delete currentReactions[emoji];
    } else {
      currentReactions[emoji] = [...usersWhoReacted, user.uid];
    }

    await updateDoc(msgRef, { reactions: currentReactions });
    setShowEmojiPicker(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      const chunks: Blob[] = [];

      // Setup AudioContext for waveform
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      analyserRef.current = analyser;
      audioContextRef.current = audioContext;
      setWaveformData([]);
      startTimeRef.current = Date.now();

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const captureAmplitude = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(1, average / 128);
        
        setWaveformData(prev => [...prev, normalized]);
        setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
        
        animationFrameRef.current = requestAnimationFrame(captureAmplitude);
      };

      captureAmplitude();

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'voice_message.webm', { type: 'audio/webm' });
        setSelectedFile(audioFile);
        setRecording(false);
        
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        analyserRef.current = null;
        audioContextRef.current = null;
      };

      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleForward = async (targetId: string, targetType: 'user' | 'group') => {
    if (!forwardMessage || !user) return;

    let channelId = '';
    if (targetType === 'user') {
      channelId = [user.uid, targetId].sort().join('_');
    } else {
      channelId = targetId;
    }

    await addDoc(collection(db, 'chats', channelId, 'messages'), {
      text: forwardMessage.text,
      senderId: user.uid,
      senderName: user.displayName || 'User',
      senderPhoto: user.photoURL || '',
      timestamp: serverTimestamp(),
      fileUrl: forwardMessage.fileUrl || '',
      fileType: forwardMessage.fileType || '',
      isForwarded: true
    });

    setForwardMessage(null);
  };

  const triggerAIResponse = async (channelId: string, userMessage: string, userName: string, isDirectChat: boolean) => {
    console.log("AI: triggerAIResponse called", { channelId, isDirectChat });
    try {
      const apiKey = await getGeminiApiKey();
      console.log("AI: API Key present?", !!apiKey);
      
      if (!apiKey) {
        console.error("AI Error: API Key is missing. Please set it in Admin Panel -> API Keys.");
        return;
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const prompt = isDirectChat 
        ? `You are OCSTHAEL AI, a helpful and friendly AI assistant. The user ${userName} said: "${userMessage}". Reply directly to them.`
        : `You are a fun, witty AI assistant hanging out in a chat between friends. The user ${userName} just said: "${userMessage}". Reply with a short, funny, or relevant comment (in Bengali or English) as if you are a 3rd friend chiming in. Keep it under 2 sentences.`;
      
      console.log("AI: Sending request to Gemini...");
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      console.log("AI: Response received", response.text ? "Success" : "Empty");

      if (response.text) {
        await addDoc(collection(db, 'chats', channelId, 'messages'), {
          text: response.text,
          senderId: 'ai_bot',
          senderName: 'OCSTHAEL AI',
          senderPhoto: 'https://api.dicebear.com/7.x/bottts/svg?seed=ocsthael',
          timestamp: serverTimestamp(),
        });
        
        // Send Push Notification
        if (user?.uid) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const token = userDoc.data()?.fcmToken;
          if (token) {
            await sendPushNotification([token], 'OCSTHAEL AI', response.text, { url: '/oc-chat', type: 'message' });
          }
        }
        console.log("AI: Message added to Firestore");
      }
    } catch (error: any) {
      console.error("AI Response Error:", error);
      // If the error is about the model not being found, try a fallback model
      if (error.message?.includes('model') || error.message?.includes('not found')) {
        try {
          console.log("AI: Retrying with gemini-flash-latest...");
          const apiKey = await getGeminiApiKey();
          const ai = new GoogleGenAI({ apiKey: apiKey! });
          const prompt = isDirectChat 
            ? `You are OCSTHAEL AI, a helpful and friendly AI assistant. The user ${userName} said: "${userMessage}". Reply directly to them.`
            : `You are a fun, witty AI assistant hanging out in a chat between friends. The user ${userName} just said: "${userMessage}". Reply with a short, funny, or relevant comment (in Bengali or English) as if you are a 3rd friend chiming in. Keep it under 2 sentences.`;
          
          const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
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
        } catch (retryError) {
          console.error("AI Fallback Error:", retryError);
        }
      }
    }
  };

  // Call Logic
  const initiateCall = async (targetId: string, targetName: string, targetPhoto: string, isVideo: boolean, isGroup: boolean = false) => {
    if (!user || inCall) return;
    const roomId = Math.random().toString(36).substring(7);
    const callType = isVideo ? 'video' : 'audio';

    setOutgoingCall({
      id: roomId,
      receiverId: targetId,
      receiverName: targetName,
      receiverPhoto: targetPhoto,
      type: callType,
      isGroup
    });

    if (isGroup) {
      const group = groups.find(g => g.id === targetId);
      if (group) {
        // Notify all members except self
        const otherMembers = group.members.filter(m => m !== user.uid);
        for (const memberId of otherMembers) {
          await setDoc(doc(db, 'calls', memberId), {
            callerId: user.uid,
            callerName: user.displayName || 'User',
            callerPhoto: user.photoURL || '',
            roomId,
            type: callType,
            status: 'ringing',
            timestamp: serverTimestamp(),
            isGroup: true,
            groupName: targetName
          });

          // Send Push Notification for Group Call
          const memberDoc = await getDoc(doc(db, 'users', memberId));
          const token = memberDoc.data()?.fcmToken;
          if (token) {
            await sendPushNotification(
              [token],
              `Group ${callType} call from ${user.displayName}`,
              `Join the call in ${targetName}`,
              { url: '/oc-chat', type: 'call', roomId }
            );
          }
        }
        // Join immediately for group calls
        joinCallRoom(roomId, callType, true);
      }
    } else {
      await setDoc(doc(db, 'calls', targetId), {
        callerId: user.uid,
        callerName: user.displayName || 'User',
        callerPhoto: user.photoURL || '',
        roomId,
        type: callType,
        status: 'ringing',
        timestamp: serverTimestamp(),
        isGroup: false
      });

      // Send Push Notification for Private Call
      const recipientDoc = await getDoc(doc(db, 'users', targetId));
      const token = recipientDoc.data()?.fcmToken;
      if (token) {
        await sendPushNotification(
          [token],
          `Incoming ${callType} call from ${user.displayName}`,
          'Tap to answer',
          { url: '/oc-chat', type: 'call', roomId }
        );
      }
    }

    // Log the call
    await addDoc(collection(db, 'callLogs'), {
      callerId: user.uid,
      callerName: user.displayName || 'User',
      callerPhoto: user.photoURL || '',
      receiverId: targetId,
      receiverName: targetName,
      receiverPhoto: targetPhoto,
      type: callType,
      status: 'outgoing',
      timestamp: serverTimestamp(),
      participants: isGroup ? groups.find(g => g.id === targetId)?.members || [user.uid] : [user.uid, targetId],
      isGroup
    });
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
        showPreJoinView: false,
        turnOnMicrophoneWhenJoining: true,
        turnOnCameraWhenJoining: type === 'video',
        showMyCameraToggleButton: type === 'video',
        showAudioVideoSettingsButton: true,
        showScreenSharingButton: type === 'video',
        showTextChat: false,
        showUserList: false,
        maxUsers: isGroup ? 50 : 2,
        layout: isGroup ? "Grid" : "Auto",
        showLayoutButton: isGroup,
        onJoinRoom: () => {
          console.log('Joined call room successfully');
        },
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
    { id: 'ai', icon: Bot, label: 'AI' },
    ...(isAdmin ? [{ id: 'admin', icon: Settings, label: 'Admin' }] : []),
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
            <div className="divide-y divide-gray-100">
              {callLogs.length > 0 ? (
                callLogs.map(log => {
                  const isIncoming = log.receiverId === user?.uid;
                  const otherPartyName = isIncoming ? log.callerName : log.receiverName;
                  const otherPartyPhoto = isIncoming ? log.callerPhoto : log.receiverPhoto;
                  const otherPartyId = isIncoming ? log.callerId : log.receiverId;

                  return (
                    <div key={log.id} className="flex items-center space-x-3 px-4 py-4 hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="relative">
                        {log.isGroup ? (
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                            {log.receiverName?.charAt(0)?.toUpperCase() || 'G'}
                          </div>
                        ) : otherPartyPhoto ? (
                          <img src={otherPartyPhoto} alt={otherPartyName} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg">
                            {otherPartyName?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 p-1 rounded-full border-2 border-white ${log.status === 'missed' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                          {log.status === 'missed' ? <PhoneOff size={10} /> : <Phone size={10} />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h4 className={`text-sm font-semibold truncate ${log.status === 'missed' ? 'text-red-600' : 'text-gray-900'}`}>
                            {log.isGroup ? log.receiverName : otherPartyName}
                          </h4>
                          <span className="text-xs text-gray-400">{log.timestamp?.toDate ? format(log.timestamp.toDate(), 'MMM d, h:mm a') : ''}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500 mt-0.5">
                          {log.status === 'incoming' && <ArrowDownLeft className="w-3 h-3 mr-1 text-blue-500" />}
                          {log.status === 'outgoing' && <ArrowUpRight className="w-3 h-3 mr-1 text-green-500" />}
                          {log.status === 'missed' && <PhoneOff className="w-3 h-3 mr-1 text-red-500" />}
                          <span className="capitalize">{log.status} {log.type} {log.isGroup ? 'group' : ''} call</span>
                          {log.duration && <span className="ml-2">• {log.duration}</span>}
                        </div>
                      </div>
                      <button 
                        onClick={() => initiateCall(log.isGroup ? log.receiverId : otherPartyId, log.isGroup ? log.receiverName : otherPartyName, log.isGroup ? log.receiverPhoto || '' : otherPartyPhoto || '', log.type === 'video', log.isGroup)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      >
                        {log.type === 'video' ? <Video size={18} /> : <Phone size={18} />}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center">
                  <Phone className="w-12 h-12 mb-4 opacity-20" />
                  <p>No recent calls</p>
                </div>
              )}
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

          {activeTab === 'admin' && isAdmin && (
            <div className="p-6 space-y-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Chat Design Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Voice Bubble Width ({chatConfig.voiceBubbleWidth}px)</label>
                  <input 
                    type="range" min="200" max="400" step="10"
                    value={chatConfig.voiceBubbleWidth}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setChatConfig(prev => ({ ...prev, voiceBubbleWidth: val }));
                      updateDoc(doc(db, 'config', 'chat'), { voiceBubbleWidth: val });
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Voice Bubble Padding ({chatConfig.voiceBubblePadding}px)</label>
                  <input 
                    type="range" min="4" max="24" step="2"
                    value={chatConfig.voiceBubblePadding}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setChatConfig(prev => ({ ...prev, voiceBubblePadding: val }));
                      updateDoc(doc(db, 'config', 'chat'), { voiceBubblePadding: val });
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Voice Bubble Radius ({chatConfig.voiceBubbleRadius}px)</label>
                  <input 
                    type="range" min="4" max="40" step="2"
                    value={chatConfig.voiceBubbleRadius}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setChatConfig(prev => ({ ...prev, voiceBubbleRadius: val }));
                      updateDoc(doc(db, 'config', 'chat'), { voiceBubbleRadius: val });
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message Text Size ({chatConfig.messageTextSize}px)</label>
                  <input 
                    type="range" min="10" max="24" step="1"
                    value={chatConfig.messageTextSize}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setChatConfig(prev => ({ ...prev, messageTextSize: val }));
                      updateDoc(doc(db, 'config', 'chat'), { messageTextSize: val });
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Voice Duration Size ({chatConfig.voiceDurationSize}px)</label>
                  <input 
                    type="range" min="8" max="16" step="1"
                    value={chatConfig.voiceDurationSize}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setChatConfig(prev => ({ ...prev, voiceDurationSize: val }));
                      updateDoc(doc(db, 'config', 'chat'), { voiceDurationSize: val });
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Waveform Height ({chatConfig.voiceWaveformHeight}px)</label>
                  <input 
                    type="range" min="20" max="60" step="2"
                    value={chatConfig.voiceWaveformHeight}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setChatConfig(prev => ({ ...prev, voiceWaveformHeight: val }));
                      updateDoc(doc(db, 'config', 'chat'), { voiceWaveformHeight: val });
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon Size ({chatConfig.voiceIconSize}px)</label>
                  <input 
                    type="range" min="30" max="60" step="2"
                    value={chatConfig.voiceIconSize}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setChatConfig(prev => ({ ...prev, voiceIconSize: val }));
                      updateDoc(doc(db, 'config', 'chat'), { voiceIconSize: val });
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon BG Color</label>
                    <input 
                      type="color"
                      value={chatConfig.voiceIconBgColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        setChatConfig(prev => ({ ...prev, voiceIconBgColor: val }));
                        updateDoc(doc(db, 'config', 'chat'), { voiceIconBgColor: val });
                      }}
                      className="w-full h-10 rounded-lg cursor-pointer border-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon Color</label>
                    <input 
                      type="color"
                      value={chatConfig.voiceIconColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        setChatConfig(prev => ({ ...prev, voiceIconColor: val }));
                        updateDoc(doc(db, 'config', 'chat'), { voiceIconColor: val });
                      }}
                      className="w-full h-10 rounded-lg cursor-pointer border-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sent Color</label>
                    <input 
                      type="color"
                      value={chatConfig.voiceSentColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        setChatConfig(prev => ({ ...prev, voiceSentColor: val }));
                        updateDoc(doc(db, 'config', 'chat'), { voiceSentColor: val });
                      }}
                      className="w-full h-10 rounded-lg cursor-pointer border-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Received Color</label>
                    <input 
                      type="color"
                      value={chatConfig.voiceReceivedColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        setChatConfig(prev => ({ ...prev, voiceReceivedColor: val }));
                        updateDoc(doc(db, 'config', 'chat'), { voiceReceivedColor: val });
                      }}
                      className="w-full h-10 rounded-lg cursor-pointer border-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Waveform Color</label>
                    <input 
                      type="color"
                      value={chatConfig.voiceWaveformColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        setChatConfig(prev => ({ ...prev, voiceWaveformColor: val }));
                        updateDoc(doc(db, 'config', 'chat'), { voiceWaveformColor: val });
                      }}
                      className="w-full h-10 rounded-lg cursor-pointer border-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Progress Color</label>
                    <input 
                      type="color"
                      value={chatConfig.voiceProgressColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        setChatConfig(prev => ({ ...prev, voiceProgressColor: val }));
                        updateDoc(doc(db, 'config', 'chat'), { voiceProgressColor: val });
                      }}
                      className="w-full h-10 rounded-lg cursor-pointer border-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recording Bubble Color</label>
                  <input 
                    type="color"
                    value={chatConfig.recordingBubbleColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      setChatConfig(prev => ({ ...prev, recordingBubbleColor: val }));
                      updateDoc(doc(db, 'config', 'chat'), { recordingBubbleColor: val });
                    }}
                    className="w-full h-10 rounded-lg cursor-pointer border-none"
                  />
                </div>

                <button 
                  onClick={() => {
                    setChatConfig(DEFAULT_CONFIG);
                    setDoc(doc(db, 'config', 'chat'), DEFAULT_CONFIG);
                  }}
                  className="w-full py-2 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors mt-4"
                >
                  Reset to Default
                </button>
              </div>
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
                    <button onClick={() => initiateCall(activeChat.id, activeChat.name, activeChat.photo || '', false, activeChat.type === 'group')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <Phone className="w-6 h-6" fill="currentColor" />
                    </button>
                    <button onClick={() => initiateCall(activeChat.id, activeChat.name, activeChat.photo || '', true, activeChat.type === 'group')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
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
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white relative">
              {messages.map((msg, index) => {
                const isMe = msg.senderId === user?.uid;
                const showHeader = index === 0 || messages[index - 1].senderId !== msg.senderId;

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative`}>
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
                        {/* Reply Context */}
                        {msg.replyTo && (
                          <div className={`mb-1 px-3 py-1 text-xs bg-gray-50 border-l-2 border-blue-400 rounded text-gray-500 max-w-xs truncate ${isMe ? 'mr-1' : 'ml-1'}`}>
                            <span className="font-semibold block">{msg.replyTo.senderName}</span>
                            {msg.replyTo.text || 'Attachment'}
                          </div>
                        )}

                        <motion.div 
                          className="relative group/msg"
                          drag="x"
                          dragConstraints={{ left: 0, right: 100 }}
                          dragElastic={0.2}
                          dragSnapToOrigin={true}
                          onDragEnd={(_, info) => {
                            if (info.offset.x > 50) {
                              setReplyTo({ id: msg.id, text: msg.text || 'Attachment', senderName: msg.senderName });
                            }
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id);
                          }}
                        >
                          <div
                            className={msg.fileType === 'audio' ? 'relative' : `px-4 py-2 text-[15px] shadow-sm relative ${
                              isMe 
                                ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm' 
                                : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm'
                            }`}
                          >
                            {msg.fileUrl && (
                              <div className={msg.fileType === 'audio' ? '' : 'mb-2'}>
                                {msg.fileType === 'image' ? (
                                  <img src={msg.fileUrl} alt="attachment" className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity" />
                                ) : msg.fileType === 'audio' ? (
                                  <VoiceMessage 
                                    url={msg.fileUrl} 
                                    isMe={isMe} 
                                    waveformData={msg.waveformData}
                                    duration={msg.duration}
                                    timestamp={msg.timestamp}
                                  />
                                ) : (
                                  <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-sm underline">
                                    <FileText className="w-4 h-4" />
                                    <span>Attachment</span>
                                  </a>
                                )}
                              </div>
                            )}
                            {msg.text && <p className="whitespace-pre-wrap break-words" style={{ fontSize: `${chatConfig.messageTextSize}px` }}>{msg.text}</p>}
                            
                            {/* Reactions */}
                            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                              <div className={`absolute -bottom-3 ${isMe ? 'right-0' : 'left-0'} flex -space-x-1`}>
                                {Object.entries(msg.reactions).map(([emoji, uids]) => (
                                  <div key={emoji} className="bg-white rounded-full px-1.5 py-0.5 text-xs shadow-sm border border-gray-100 flex items-center space-x-1">
                                    <span>{emoji}</span>
                                    <span className="text-[10px] text-gray-500">{(uids as string[]).length}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Message Actions (Hover) */}
                          <div className={`absolute top-1/2 -translate-y-1/2 flex items-center space-x-1 opacity-0 group-hover/msg:opacity-100 transition-opacity px-2 ${isMe ? 'right-full' : 'left-full'}`}>
                            <button onClick={() => setReplyTo({ id: msg.id, text: msg.text || 'Attachment', senderName: msg.senderName })} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400" title="Reply">
                              <Reply className="w-4 h-4" />
                            </button>
                            <button onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400" title="React">
                              <Smile className="w-4 h-4" />
                            </button>
                            <button onClick={() => setForwardMessage(msg)} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400" title="Forward">
                              <Forward className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Emoji Picker Overlay */}
                          {showEmojiPicker === msg.id && (
                            <div className={`absolute z-50 bottom-full mb-2 bg-white rounded-full shadow-xl border border-gray-200 p-1 flex space-x-1 ${isMe ? 'right-0' : 'left-0'}`}>
                              {['❤️', '👍', '😂', '😮', '😢', '🔥'].map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReaction(msg.id, emoji)}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full text-lg transition-transform hover:scale-125"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </motion.div>

                        {/* Time */}
                        <span className="text-[11px] text-gray-400 mt-1 px-1">
                          {msg.timestamp?.toDate ? format(msg.timestamp.toDate(), 'h:mm a') : 'Sending...'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {otherUserTyping && (
                <div className="flex items-center space-x-2 text-gray-400 text-xs italic ml-9">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span>{activeChat.name} is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Footer (Input) */}
            <div className="p-4 bg-white border-t border-gray-200">
              {replyTo && (
                <div className="mb-3 flex items-center justify-between bg-gray-50 p-2 rounded-lg border-l-4 border-blue-500">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-blue-600">Replying to {replyTo.senderName}</p>
                    <p className="text-sm text-gray-500 truncate">{replyTo.text}</p>
                  </div>
                  <button onClick={() => setReplyTo(null)} className="p-1 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {recording && (
                <div 
                  className="mb-3 flex items-center space-x-4 p-5 rounded-3xl border shadow-lg min-w-[320px] max-w-full text-white"
                  style={{ backgroundColor: chatConfig.recordingBubbleColor, borderColor: 'rgba(0,0,0,0.1)' }}
                >
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <div className="w-4 h-4 bg-white rounded-full animate-ping" />
                    <span className="text-sm font-bold tabular-nums">{formatTime(recordingDuration)}</span>
                  </div>
                  <div className="flex-1 flex items-center space-x-1.5 h-12 overflow-hidden">
                    {waveformData.slice(-40).map((peak, i) => (
                      <div 
                        key={i} 
                        className="w-1.5 bg-white rounded-full transition-all duration-100" 
                        style={{ height: `${Math.max(15, peak * 100)}%` }} 
                      />
                    ))}
                    {waveformData.length < 40 && [...Array(40 - waveformData.length)].map((_, i) => (
                      <div key={i} className="w-1.5 bg-white/30 rounded-full h-[15%]" />
                    ))}
                  </div>
                  <button 
                    onClick={stopRecording}
                    className="w-14 h-14 bg-white rounded-full hover:bg-gray-100 transition-all shadow-lg flex items-center justify-center active:scale-90"
                    style={{ color: chatConfig.recordingBubbleColor }}
                  >
                    <Check size={32} />
                  </button>
                </div>
              )}

              {selectedFile && !recording && (
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
                <div {...getRootProps()} className="p-2 text-blue-600 hover:bg-gray-100 rounded-full cursor-pointer transition-colors mb-1">
                  <input {...getInputProps()} />
                  <Plus className="w-6 h-6" />
                </div>
                
                <div className="flex-1 bg-gray-100 rounded-3xl border border-transparent focus-within:border-blue-300 focus-within:bg-white transition-all overflow-hidden flex items-center px-4 py-2">
                  <textarea
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      handleTyping();
                    }}
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
                
                {input.trim() || selectedFile ? (
                  <button
                    onClick={handleSend}
                    disabled={uploading}
                    className="p-2 text-blue-600 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-1"
                  >
                    <Send className="w-6 h-6" fill="currentColor" />
                  </button>
                ) : (
                  <button
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    className={`p-2 rounded-full transition-all mb-1 ${recording ? 'bg-red-500 text-white scale-125 animate-pulse' : 'text-blue-600 hover:bg-gray-100'}`}
                  >
                    <Mic className="w-6 h-6" />
                  </button>
                )}
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
          className={`fixed inset-0 z-[200] bg-white ${inCall ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
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
            className="fixed inset-0 bg-white/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center"
          >
            <div className="relative mb-8">
              {outgoingCall.receiverPhoto ? (
                <img src={outgoingCall.receiverPhoto} alt={outgoingCall.receiverName} className="w-40 h-40 rounded-full border-4 border-gray-100 object-cover shadow-2xl z-10 relative" />
              ) : (
                <div className="w-40 h-40 rounded-full border-4 border-gray-100 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-6xl font-bold text-white shadow-2xl z-10 relative">
                  {outgoingCall.receiverName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping opacity-30 scale-150"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-20 scale-125" style={{ animationDelay: '0.2s' }}></div>
            </div>
            
            <h2 className="text-4xl font-bold text-gray-900 mb-2">{outgoingCall.receiverName}</h2>
            <p className="text-gray-500 text-lg flex items-center justify-center mb-16">
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
              <span className="text-gray-900 font-medium">End Call</span>
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
            className="fixed inset-0 bg-white/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center"
          >
            {/* Big Logo */}
            <div className="relative mb-8">
              {incomingCall.callerPhoto ? (
                <img src={incomingCall.callerPhoto} alt={incomingCall.callerName} className="w-40 h-40 rounded-full border-4 border-gray-100 object-cover shadow-2xl z-10 relative" />
              ) : (
                <div className="w-40 h-40 rounded-full border-4 border-gray-100 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-6xl font-bold text-white shadow-2xl z-10 relative">
                  {incomingCall.callerName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              {/* Ripple Effect */}
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping opacity-30 scale-150"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-20 scale-125" style={{ animationDelay: '0.2s' }}></div>
            </div>
            
            {/* Name & Status */}
            <h2 className="text-4xl font-bold text-gray-900 mb-2">{incomingCall.callerName}</h2>
            <p className="text-gray-500 text-lg flex items-center justify-center mb-16">
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
                <span className="text-gray-900 font-medium">Decline</span>
              </div>
              
              <div className="flex flex-col items-center">
                <button
                  onClick={answerCall}
                  className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 hover:scale-105 transition-all shadow-lg shadow-green-500/30 animate-bounce mb-3"
                >
                  <PhoneIncoming className="w-8 h-8" />
                </button>
                <span className="text-gray-900 font-medium">Accept</span>
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
      {/* Forward Message Modal */}
      <AnimatePresence>
        {forwardMessage && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Forward to...</h3>
                <button onClick={() => setForwardMessage(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-2 max-h-[400px] overflow-y-auto">
                <div className="p-2">
                  <h4 className="px-2 text-xs font-semibold text-gray-500 uppercase mb-2">Recent Chats</h4>
                  {users.map(u => (
                    <div
                      key={u.id}
                      onClick={() => handleForward(u.id, 'user')}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                    >
                      {u.photoURL ? (
                        <img src={u.photoURL} alt={u.displayName} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                          {u.displayName?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium">{u.displayName}</span>
                    </div>
                  ))}
                  {groups.map(g => (
                    <div
                      key={g.id}
                      onClick={() => handleForward(g.id, 'group')}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                        {g.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="font-medium">{g.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
