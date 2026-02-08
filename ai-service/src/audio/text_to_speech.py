"""
Text-to-Speech module for audio responses.
"""

from typing import Optional
import os


class TextToSpeech:
    """Text-to-Speech handler for audio responses."""
    
    def __init__(
        self,
        engine: str = "pyttsx3",
        voice: Optional[str] = None,
        rate: int = 150
    ):
        """
        Initialize TTS engine.
        
        Args:
            engine: TTS engine to use ("pyttsx3", "gTTS", "elevenlabs")
            voice: Optional voice ID
            rate: Speech rate
        """
        self.engine = engine
        self.voice = voice
        self.rate = rate
        self._tts = None
    
    def _initialize_pyttsx3(self):
        """Initialize pyttsx3 TTS engine."""
        try:
            import pyttsx3
            self._tts = pyttsx3.init()
            
            # Set properties
            self._tts.setProperty('rate', self.rate)
            
            # Set voice if specified
            if self.voice:
                voices = self._tts.getProperty('voices')
                for v in voices:
                    if self.voice.lower() in v.name.lower():
                        self._tts.setProperty('voice', v.id)
                        break
        except ImportError:
            raise ImportError("pyttsx3 is required. Install with: pip install pyttsx3")
    
    def _initialize_gtts(self):
        """Initialize Google TTS engine."""
        try:
            from gtts import gTTS
            # gTTS doesn't need initialization
            return True
        except ImportError:
            raise ImportError("gTTS is required. Install with: pip install gtts")
    
    def speak(self, text: str, output_file: Optional[str] = None) -> Optional[str]:
        """
        Convert text to speech.
        
        Args:
            text: Text to convert to speech
            output_file: Optional output file path (for file-based engines)
            
        Returns:
            Path to audio file if saved, None if played directly
        """
        if self.engine == "pyttsx3":
            self._initialize_pyttsx3()
            if output_file:
                self._tts.save_to_file(text, output_file)
                self._tts.runAndWait()
                return output_file
            else:
                self._tts.say(text)
                self._tts.runAndWait()
                return None
        
        elif self.engine == "gTTS":
            self._initialize_gtts()
            from gtts import gTTS
            import io
            
            tts = gTTS(text=text, lang='en')
            
            if output_file:
                tts.save(output_file)
                return output_file
            else:
                # Save to temporary file and play
                import tempfile
                with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp:
                    output_file = tmp.name
                tts.save(output_file)
                # Note: Playback requires additional audio library
                return output_file
        
        elif self.engine == "elevenlabs":
            try:
                from elevenlabs import generate, play, set_api_key
                
                api_key = os.getenv("ELEVENLABS_API_KEY")
                if api_key:
                    set_api_key(api_key)
                
                audio = generate(text=text, voice=self.voice or "Rachel")
                
                if output_file:
                    with open(output_file, 'wb') as f:
                        f.write(audio)
                    return output_file
                else:
                    play(audio)
                    return None
            except ImportError:
                raise ImportError("elevenlabs is required. Install with: pip install elevenlabs")
        else:
            raise ValueError(f"Unsupported TTS engine: {self.engine}")

