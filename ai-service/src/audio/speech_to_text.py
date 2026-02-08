"""
Speech-to-Text module for audio input.
"""

from typing import Optional
import os


class SpeechToText:
    """Speech-to-Text handler for audio input."""
    
    def __init__(self, engine: str = "whisper"):
        """
        Initialize STT engine.
        
        Args:
            engine: STT engine to use ("whisper", "google", "sphinx")
        """
        self.engine = engine
        self._model = None
    
    def _initialize_whisper(self):
        """Initialize Whisper model."""
        try:
            import whisper
            if self._model is None:
                self._model = whisper.load_model("base")
        except ImportError:
            raise ImportError("openai-whisper is required. Install with: pip install openai-whisper")
    
    def transcribe(self, audio_file: str, language: Optional[str] = None) -> str:
        """
        Transcribe audio file to text.
        
        Args:
            audio_file: Path to audio file
            language: Optional language code
            
        Returns:
            Transcribed text
        """
        if self.engine == "whisper":
            self._initialize_whisper()
            result = self._model.transcribe(audio_file, language=language)
            return result["text"].strip()
        
        elif self.engine == "google":
            try:
                from google.cloud import speech
                
                client = speech.SpeechClient()
                
                with open(audio_file, "rb") as audio_file_obj:
                    content = audio_file_obj.read()
                
                audio = speech.RecognitionAudio(content=content)
                config = speech.RecognitionConfig(
                    encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
                    sample_rate_hertz=16000,
                    language_code=language or "en-US",
                )
                
                response = client.recognize(config=config, audio=audio)
                
                text = ""
                for result in response.results:
                    text += result.alternatives[0].transcript
                
                return text.strip()
            except ImportError:
                raise ImportError("google-cloud-speech is required. Install with: pip install google-cloud-speech")
        
        elif self.engine == "sphinx":
            try:
                import speech_recognition as sr
                
                r = sr.Recognizer()
                with sr.AudioFile(audio_file) as source:
                    audio = r.record(source)
                
                text = r.recognize_sphinx(audio, language=language or "en-US")
                return text.strip()
            except ImportError:
                raise ImportError("SpeechRecognition is required. Install with: pip install SpeechRecognition")
        else:
            raise ValueError(f"Unsupported STT engine: {self.engine}")
    
    def transcribe_realtime(self, audio_stream):
        """
        Transcribe audio stream in real-time (for future implementation).
        
        Args:
            audio_stream: Audio stream
            
        Returns:
            Transcribed text
        """
        # Placeholder for real-time transcription
        raise NotImplementedError("Real-time transcription not yet implemented")

