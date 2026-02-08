"""
Fine-tuning module for training custom models on store-specific data.
"""

from typing import List, Dict, Optional
import json
import os
from pathlib import Path


class FineTuningManager:
    """Manager for fine-tuning language models."""
    
    def __init__(self, base_model: str = "gpt-3.5-turbo", training_data_path: Optional[str] = None):
        """
        Initialize fine-tuning manager.
        
        Args:
            base_model: Base model to fine-tune
            training_data_path: Path to training data
        """
        self.base_model = base_model
        self.training_data_path = training_data_path or "data/training"
        self.tuned_model_id: Optional[str] = None
        Path(self.training_data_path).mkdir(parents=True, exist_ok=True)
    
    def prepare_training_data(
        self,
        conversations: List[Dict],
        output_format: str = "jsonl"
    ) -> str:
        """
        Prepare training data in the required format.
        
        Args:
            conversations: List of conversation dictionaries
            output_format: Format for output ("jsonl" or "json")
            
        Returns:
            Path to prepared training data file
        """
        output_path = os.path.join(self.training_data_path, f"training_data.{output_format}")
        
        if output_format == "jsonl":
            with open(output_path, 'w') as f:
                for conv in conversations:
                    json.dump(conv, f)
                    f.write('\n')
        else:
            with open(output_path, 'w') as f:
                json.dump(conversations, f, indent=2)
        
        return output_path
    
    def create_conversation_format(
        self,
        user_message: str,
        assistant_message: str,
        system_prompt: Optional[str] = None
    ) -> Dict:
        """
        Create conversation in OpenAI fine-tuning format.
        
        Args:
            user_message: User message
            assistant_message: Assistant response
            system_prompt: Optional system prompt
            
        Returns:
            Formatted conversation dictionary
        """
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": user_message})
        messages.append({"role": "assistant", "content": assistant_message})
        
        return {"messages": messages}
    
    def fine_tune(
        self,
        training_file_path: str,
        validation_file_path: Optional[str] = None,
        epochs: int = 3,
        learning_rate_multiplier: float = 0.1
    ) -> str:
        """
        Fine-tune the model.
        
        Args:
            training_file_path: Path to training data file
            validation_file_path: Optional path to validation data
            epochs: Number of training epochs
            learning_rate_multiplier: Learning rate multiplier
            
        Returns:
            Fine-tuned model ID
        """
        try:
            from openai import OpenAI
            client = OpenAI()
            
            # Upload training file
            with open(training_file_path, 'rb') as f:
                training_file = client.files.create(
                    file=f,
                    purpose='fine-tune'
                )
            
            # Upload validation file if provided
            validation_file_id = None
            if validation_file_path and os.path.exists(validation_file_path):
                with open(validation_file_path, 'rb') as f:
                    validation_file = client.files.create(
                        file=f,
                        purpose='fine-tune'
                    )
                    validation_file_id = validation_file.id
            
            # Create fine-tuning job
            fine_tune_job = client.fine_tuning.jobs.create(
                training_file=training_file.id,
                validation_file=validation_file_id,
                model=self.base_model,
                hyperparameters={
                    "n_epochs": epochs,
                    "learning_rate_multiplier": learning_rate_multiplier
                }
            )
            
            print(f"Fine-tuning job created: {fine_tune_job.id}")
            print(f"Status: {fine_tune_job.status}")
            print("Note: Fine-tuning can take time. Check status periodically.")
            
            self.tuned_model_id = fine_tune_job.id
            return fine_tune_job.id
            
        except ImportError:
            raise ImportError("openai package is required. Install with: pip install openai")
        except Exception as e:
            raise Exception(f"Fine-tuning failed: {str(e)}")
    
    def check_fine_tune_status(self, job_id: str) -> Dict:
        """
        Check the status of a fine-tuning job.
        
        Args:
            job_id: Fine-tuning job ID
            
        Returns:
            Job status information
        """
        try:
            from openai import OpenAI
            client = OpenAI()
            
            job = client.fine_tuning.jobs.retrieve(job_id)
            return {
                "id": job.id,
                "status": job.status,
                "fine_tuned_model": job.fine_tuned_model,
                "created_at": job.created_at
            }
        except Exception as e:
            raise Exception(f"Failed to check status: {str(e)}")

