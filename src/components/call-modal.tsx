'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callType: 'audio' | 'video';
  participantName: string;
  participantServiceType: string;
  isIncoming?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}

export default function CallModal({
  isOpen,
  onClose,
  callType,
  participantName,
  participantServiceType,
  isIncoming = false,
  onAccept,
  onReject
}: CallModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callStartTimeRef = useRef<number>(0);

  // Simulate call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (callStatus === 'connected') {
      callStartTimeRef.current = Date.now();
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStatus]);

  // Initialize media stream for outgoing calls
  useEffect(() => {
    if (!isIncoming && isOpen && callType === 'video') {
      initializeLocalStream();
    }
    
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, isIncoming, callType]);

  const initializeLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      });
      
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      setCallStatus('connected');
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setCallStatus('ended');
    }
  };

  const handleAcceptCall = () => {
    setCallStatus('connected');
    if (callType === 'video') {
      initializeLocalStream();
    }
    onAccept?.();
  };

  const handleRejectCall = () => {
    setCallStatus('ended');
    onReject?.();
    onClose();
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOff(!isSpeakerOff);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold">
            {isIncoming ? 'Incoming Call' : 'Calling...'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-6">
          {/* Participant Info */}
          <div className="text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3 mx-auto">
              {participantName.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-xl font-semibold">{participantName}</h3>
            <p className="text-gray-400 text-sm">{participantServiceType}</p>
            {callStatus === 'connected' && (
              <p className="text-green-400 text-sm mt-2">{formatDuration(callDuration)}</p>
            )}
          </div>

          {/* Video Streams (for video calls) */}
          {callType === 'video' && callStatus === 'connected' && (
            <div className="relative w-full max-w-sm">
              {/* Remote Video */}
              <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Local Video */}
              <div className="absolute top-2 right-2 w-24 h-18 bg-gray-800 rounded overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Call Status */}
          {callStatus === 'connecting' && (
            <div className="text-center">
              <div className="animate-pulse text-gray-400">
                {isIncoming ? 'Incoming call...' : 'Connecting...'}
              </div>
            </div>
          )}

          {/* Call Controls */}
          <div className="flex items-center justify-center space-x-4">
            {isIncoming ? (
              // Incoming call controls
              <>
                <Button
                  onClick={handleRejectCall}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
                <Button
                  onClick={handleAcceptCall}
                  className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4"
                >
                  <Phone className="h-6 w-6" />
                </Button>
              </>
            ) : (
              // Active call controls
              <>
                <Button
                  onClick={toggleMute}
                  className={`rounded-full p-3 ${
                    isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-700'
                  } text-white`}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>

                {callType === 'video' && (
                  <Button
                    onClick={toggleVideo}
                    className={`rounded-full p-3 ${
                      isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-700'
                    } text-white`}
                  >
                    {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                  </Button>
                )}

                <Button
                  onClick={toggleSpeaker}
                  className={`rounded-full p-3 ${
                    isSpeakerOff ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-600 hover:bg-gray-700'
                  } text-white`}
                >
                  {isSpeakerOff ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>

                <Button
                  onClick={handleEndCall}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-full p-3"
                >
                  <PhoneOff className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
