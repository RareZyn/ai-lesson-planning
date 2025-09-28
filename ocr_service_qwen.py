import torch
from transformers import Qwen2VLForConditionalGeneration, AutoTokenizer, AutoProcessor
from qwen_vl_utils import process_vision_info
import cv2
import numpy as np
from PIL import Image
import io
import base64
import json
import os
import re
from flask import Flask, request, jsonify
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)
CORS(app)

class QwenOCRService:
    def __init__(self):
        print("Initializing Qwen2-VL-7B-Instruct model...")
        
        # Set device
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"Using device: {self.device}")
        
        # Model name
        self.model_name = "Qwen/Qwen2-VL-7B-Instruct"
        
        try:
            # Load model with optimizations for inference
            print("Loading model...")
            self.model = Qwen2VLForConditionalGeneration.from_pretrained(
                self.model_name,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                device_map="auto" if torch.cuda.is_available() else None,
                trust_remote_code=True
            )
            
            # Load processor
            print("Loading processor...")
            self.processor = AutoProcessor.from_pretrained(
                self.model_name,
                trust_remote_code=True
            )
            
            # Set model to evaluation mode
            self.model.eval()
            
            print("Qwen2-VL model initialized successfully!")
            
        except Exception as e:
            print(f"Error initializing model: {e}")
            raise e
    
    def preprocess_image(self, image):
        """
        Preprocess the image to improve OCR accuracy
        """
        try:
            # Ensure image is in correct format
            if len(image.shape) == 3:
                # Convert to grayscale for preprocessing, but keep original for model
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image
            
            print(f"Preprocessing - Image shape: {image.shape}")
            
            # Apply Gaussian blur to reduce noise
            blurred = cv2.GaussianBlur(gray, (3, 3), 0)
            
            # Apply adaptive threshold for better text extraction
            thresh = cv2.adaptiveThreshold(
                blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
            )
            
            # Optional: Apply morphological operations to clean up
            kernel = np.ones((2,2), np.uint8)
            thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
            
            # Convert back to RGB for the model (Qwen2-VL expects RGB)
            if len(image.shape) == 3:
                processed_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            else:
                processed_rgb = cv2.cvtColor(thresh, cv2.COLOR_GRAY2RGB)
            
            print("Image preprocessing completed")
            return processed_rgb
            
        except Exception as e:
            print(f"Error in preprocessing: {e}")
            # Return original image in RGB format
            if len(image.shape) == 3:
                return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            else:
                return cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
    
    def optimize_image_for_model(self, image_np, max_size=1024):
        """
        Optimize image size for the model while maintaining aspect ratio
        """
        try:
            height, width = image_np.shape[:2]
            
            # Check if image needs resizing
            if max(width, height) > max_size:
                print(f"Image is large ({width}x{height}), resizing for model...")
                
                # Calculate scaling factor
                scale = max_size / max(width, height)
                
                # Calculate new dimensions
                new_width = int(width * scale)
                new_height = int(height * scale)
                
                # Resize image
                resized = cv2.resize(image_np, (new_width, new_height), interpolation=cv2.INTER_AREA)
                print(f"Image resized to {new_width}x{new_height}")
                return resized
            
            return image_np
            
        except Exception as e:
            print(f"Error optimizing image: {e}")
            return image_np
    
    def extract_text_with_qwen(self, image_pil):
        """
        Extract text using Qwen2-VL model
        """
        try:
            print("Preparing messages for Qwen2-VL...")
            
            # Prepare messages for the model
            messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "image": image_pil,
                        },
                        {
                            "type": "text", 
                            "text": "Please extract all text from this image. Focus on handwritten text if present. Return only the extracted text without any additional commentary or formatting. If you see both printed and handwritten text, include both. Be as accurate as possible with the transcription."
                        },
                    ],
                }
            ]
            
            # Prepare inputs
            text = self.processor.apply_chat_template(
                messages, tokenize=False, add_generation_prompt=True
            )
            
            image_inputs, video_inputs = process_vision_info(messages)
            
            inputs = self.processor(
                text=[text],
                images=image_inputs,
                videos=video_inputs,
                padding=True,
                return_tensors="pt",
            )
            
            # Move inputs to device
            inputs = inputs.to(self.device)
            
            print("Running inference with Qwen2-VL...")
            
            # Generate response
            with torch.no_grad():
                generated_ids = self.model.generate(
                    **inputs,
                    max_new_tokens=512,
                    temperature=0.1,
                    do_sample=False,
                    pad_token_id=self.processor.tokenizer.eos_token_id
                )
            
            # Trim generated tokens
            generated_ids_trimmed = [
                out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
            ]
            
            # Decode response
            output_text = self.processor.batch_decode(
                generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False
            )[0]
            
            print(f"Raw model output: '{output_text}'")
            
            # Clean and process the output
            extracted_text = self.clean_extracted_text(output_text)
            
            print(f"Cleaned extracted text: '{extracted_text}'")
            
            return extracted_text
            
        except Exception as e:
            print(f"Error in Qwen2-VL inference: {e}")
            import traceback
            traceback.print_exc()
            return ""
    
    def clean_extracted_text(self, text):
        """
        Clean the extracted text from model output
        """
        try:
            # Remove common prefixes/suffixes that the model might add
            prefixes_to_remove = [
                "The text in the image is:",
                "The text in this image is:",
                "The extracted text is:",
                "Text from image:",
                "I can see the following text:",
                "The image contains:",
                "Here is the text:",
                "The text says:",
            ]
            
            cleaned_text = text.strip()
            
            # Remove prefixes (case insensitive)
            for prefix in prefixes_to_remove:
                if cleaned_text.lower().startswith(prefix.lower()):
                    cleaned_text = cleaned_text[len(prefix):].strip()
                    break
            
            # Remove quotes if the entire text is wrapped in them
            if (cleaned_text.startswith('"') and cleaned_text.endswith('"')) or \
               (cleaned_text.startswith("'") and cleaned_text.endswith("'")):
                cleaned_text = cleaned_text[1:-1].strip()
            
            # Clean up extra whitespace and newlines
            cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()
            
            return cleaned_text
            
        except Exception as e:
            print(f"Error cleaning text: {e}")
            return text.strip()
    
    def estimate_confidence(self, extracted_text, image_complexity="medium"):
        """
        Estimate confidence based on text length and complexity
        Since Qwen2-VL doesn't provide confidence scores, we estimate based on output
        """
        try:
            if not extracted_text or len(extracted_text.strip()) == 0:
                return 0.0
            
            # Base confidence based on text length
            text_length = len(extracted_text.strip())
            if text_length < 3:
                base_confidence = 0.3
            elif text_length < 10:
                base_confidence = 0.6
            elif text_length < 50:
                base_confidence = 0.8
            else:
                base_confidence = 0.9
            
            # Adjust based on text characteristics
            confidence_adjustments = 0.0
            
            # Check for complete words (bonus for word boundaries)
            words = extracted_text.split()
            if len(words) >= 2:
                confidence_adjustments += 0.1
            
            # Check for proper sentence structure
            if any(char in extracted_text for char in '.!?'):
                confidence_adjustments += 0.05
            
            # Penalize very short outputs
            if len(extracted_text.strip()) < 2:
                confidence_adjustments -= 0.4
            
            # Penalize outputs that look like error messages
            error_indicators = ['cannot', 'unable', 'no text', 'error', 'unclear']
            if any(indicator in extracted_text.lower() for indicator in error_indicators):
                confidence_adjustments -= 0.3
            
            final_confidence = min(1.0, max(0.0, base_confidence + confidence_adjustments))
            
            return final_confidence
            
        except Exception as e:
            print(f"Error estimating confidence: {e}")
            return 0.5
    
    def extract_text_from_image(self, image_data, preprocess=True):
        """
        Extract text from image using Qwen2-VL model
        
        Args:
            image_data: Base64 encoded image or file path
            preprocess: Whether to apply preprocessing
            
        Returns:
            dict: Contains extracted text, confidence scores, and metadata
        """
        try:
            print(f"Starting text extraction with Qwen2-VL, preprocessing: {preprocess}")
            
            # Decode base64 image if it's base64 encoded
            if isinstance(image_data, str) and image_data.startswith('data:image'):
                print("Decoding base64 image...")
                # Remove data URL prefix
                image_data = image_data.split(',')[1]
                image_bytes = base64.b64decode(image_data)
                image = Image.open(io.BytesIO(image_bytes))
                
                # Convert RGBA to RGB if needed
                if image.mode == 'RGBA':
                    print("Converting RGBA to RGB...")
                    background = Image.new('RGB', image.size, (255, 255, 255))
                    background.paste(image, mask=image.split()[-1])
                    image = background
                elif image.mode != 'RGB':
                    print(f"Converting {image.mode} to RGB...")
                    image = image.convert('RGB')
                
                image_np = np.array(image)
                print(f"Image processed successfully, shape: {image_np.shape}")
            else:
                # If it's a file path
                print(f"Loading image from file: {image_data}")
                image_np = cv2.imread(image_data)
                image_np = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)
                
            # Ensure we have a valid image
            if image_np is None:
                raise ValueError("Failed to load or decode image")
            
            # Optimize image size for the model
            image_np = self.optimize_image_for_model(image_np)
            
            # Preprocess image if requested
            if preprocess:
                print("Applying image preprocessing...")
                processed_image_np = self.preprocess_image(image_np)
            else:
                processed_image_np = image_np
            
            # Convert to PIL Image for the model
            image_pil = Image.fromarray(processed_image_np)
            
            print("Running Qwen2-VL OCR...")
            # Extract text using Qwen2-VL
            extracted_text = self.extract_text_with_qwen(image_pil)
            
            # Estimate confidence
            confidence = self.estimate_confidence(extracted_text)
            
            # Process results in EasyOCR-compatible format
            extracted_data = {
                'text': extracted_text,
                'words': [],
                'confidence': confidence,
                'bounding_boxes': []
            }
            
            # Create word-level data (simplified since Qwen2-VL doesn't provide bounding boxes)
            if extracted_text:
                words = extracted_text.split()
                for i, word in enumerate(words):
                    # Estimate word confidence (slightly lower than overall confidence)
                    word_confidence = max(0.1, confidence - 0.1 + (i * 0.01))
                    word_confidence = min(1.0, word_confidence)
                    
                    extracted_data['words'].append({
                        'text': word,
                        'confidence': word_confidence,
                        'bbox': []  # Qwen2-VL doesn't provide bounding boxes
                    })
            
            print(f"Final extracted text: '{extracted_text}'")
            print(f"Estimated confidence: {confidence:.3f}")
            print(f"Word count: {len(extracted_data['words'])}")
            
            return extracted_data
            
        except Exception as e:
            print(f"Error in OCR extraction: {e}")
            import traceback
            traceback.print_exc()
            return {
                'error': str(e),
                'text': '',
                'confidence': 0,
                'words': [],
                'bounding_boxes': []
            }
    
    def batch_process_images(self, image_list):
        """
        Process multiple images at once
        
        Args:
            image_list: List of image data
            
        Returns:
            list: Results for each image
        """
        results = []
        for i, image_data in enumerate(image_list):
            print(f"Processing batch image {i+1}/{len(image_list)}")
            result = self.extract_text_from_image(image_data)
            results.append(result)
        return results

# Initialize OCR service
print("Starting Qwen2-VL OCR service initialization...")
try:
    qwen_ocr_service = QwenOCRService()
    print("OCR service initialized successfully!")
except Exception as e:
    print(f"Failed to initialize OCR service: {e}")
    qwen_ocr_service = None

@app.route('/api/ocr/extract', methods=['POST'])
def extract_text():
    """
    API endpoint to extract text from uploaded image
    """
    try:
        if qwen_ocr_service is None:
            return jsonify({
                'success': False,
                'error': 'OCR service not initialized'
            }), 500
        
        print("Received OCR extract request")
        data = request.get_json()
        
        if not data or 'image' not in data:
            print("No image data provided")
            return jsonify({'error': 'No image data provided'}), 400
        
        image_data = data['image']
        preprocess = data.get('preprocess', True)
        
        print(f"Image data type: {type(image_data)}")
        print(f"Image data length: {len(image_data) if isinstance(image_data, str) else 'N/A'}")
        print(f"Preprocessing enabled: {preprocess}")
        
        # Extract text
        result = qwen_ocr_service.extract_text_from_image(image_data, preprocess)
        
        if 'error' in result:
            print(f"OCR processing failed: {result['error']}")
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500
        
        response_data = {
            'success': True,
            'data': result
        }
        
        print(f"Sending successful response with {len(result['text'])} characters extracted")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"API error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ocr/batch-extract', methods=['POST'])
def batch_extract_text():
    """
    API endpoint to extract text from multiple images
    """
    try:
        if qwen_ocr_service is None:
            return jsonify({
                'success': False,
                'error': 'OCR service not initialized'
            }), 500
        
        print("Received batch OCR extract request")
        data = request.get_json()
        
        if not data or 'images' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        
        images = data['images']
        print(f"Processing {len(images)} images")
        
        # Process images
        results = qwen_ocr_service.batch_process_images(images)
        
        return jsonify({
            'success': True,
            'data': results
        })
        
    except Exception as e:
        print(f"Batch API error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    status = 'healthy' if qwen_ocr_service is not None else 'unhealthy'
    model_info = {
        'status': status,
        'service': 'Qwen2-VL OCR Service',
        'model': 'Qwen/Qwen2-VL-7B-Instruct',
        'device': str(qwen_ocr_service.device) if qwen_ocr_service else 'unknown'
    }
    
    return jsonify(model_info)

if __name__ == '__main__':
    print("Starting Flask Qwen2-VL OCR service on port 5001...")
    app.run(debug=True, port=5001, host='0.0.0.0')