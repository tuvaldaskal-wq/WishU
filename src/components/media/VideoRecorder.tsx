import { useState, useRef, useEffect } from 'react';
import { RotateCcw, Check } from 'lucide-react';

interface VideoRecorderProps {
    onRecordingComplete: (blob: Blob) => void;
    onCancel: () => void;
}

export const VideoRecorder = ({ onRecordingComplete, onCancel }: VideoRecorderProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [recording, setRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [countdown, setCountdown] = useState(0);
    const [cameraError, setCameraError] = useState('');
    const [stream, setStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            setCameraError('Camera access denied. Please check permissions.');
            console.error(err);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const startRecording = () => {
        if (!stream) return;
        setCountdown(3);
        let count = 3;
        const timer = setInterval(() => {
            count--;
            setCountdown(count);
            if (count === 0) {
                clearInterval(timer);
                beginCapture();
            }
        }, 1000);
    };

    const beginCapture = () => {
        if (!stream) return;
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        const chunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            setRecordedBlob(blob);
            if (videoRef.current) {
                videoRef.current.srcObject = null;
                videoRef.current.src = URL.createObjectURL(blob);
                videoRef.current.controls = true;
                videoRef.current.play();
            }
        };

        mediaRecorder.start();
        setRecording(true);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && recording) {
            mediaRecorderRef.current.stop();
            setRecording(false);
        }
    };

    const reset = () => {
        setRecordedBlob(null);
        if (videoRef.current) {
            videoRef.current.src = '';
            videoRef.current.controls = false;
        }
        startCamera();
    };

    const confirm = () => {
        if (recordedBlob) {
            stopCamera();
            onRecordingComplete(recordedBlob);
        }
    };

    if (cameraError) {
        return (
            <div className="bg-slate-900 text-white rounded-2xl p-8 text-center">
                <p>{cameraError}</p>
                <button onClick={onCancel} className="mt-4 text-sm underline">Close</button>
            </div>
        );
    }

    return (
        <div className="bg-black rounded-3xl overflow-hidden shadow-2xl relative w-full aspect-[9/16] max-h-[60vh] flex flex-col">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={!recordedBlob} // Mute live preview to prevent echo
                className="w-full h-full object-cover flex-1"
            />

            {/* Overlays */}
            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex justify-center items-center gap-8">
                    {!recordedBlob ? (
                        !recording ? (
                            <>
                                {countdown > 0 ? (
                                    <div className="text-6xl font-bold text-white animate-ping">{countdown}</div>
                                ) : (
                                    <button
                                        onClick={startRecording}
                                        className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/20 transition-all"
                                    >
                                        <div className="w-12 h-12 bg-red-500 rounded-full" />
                                    </button>
                                )}
                            </>
                        ) : (
                            <button
                                onClick={stopRecording}
                                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/20 transition-all"
                            >
                                <div className="w-6 h-6 bg-red-500 rounded-sm" />
                            </button>
                        )
                    ) : (
                        // Review Mode
                        <>
                            <button onClick={reset} className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20">
                                <RotateCcw size={24} />
                            </button>
                            <button onClick={confirm} className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg transform hover:scale-105 active:scale-95 transition-all">
                                <Check size={28} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Close Button */}
            {!recording && !recordedBlob && (
                <button onClick={onCancel} className="absolute top-4 right-4 p-2 bg-black/40 rounded-full text-white backdrop-blur-sm">
                    <XIcon />
                </button>
            )}
        </div>
    );
};

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
