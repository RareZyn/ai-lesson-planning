import easyocr
import cv2
import numpy as np
from PIL import Image
import io
import base64
import json
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)
CORS(app)

class OCRService:
    def __init__(self):
        print("Initializing EasyOCR reader for English and Malay...")
        # Initialize EasyOCR reader for English and Malay
        self.reader = easyocr.Reader(['en', 'ms'])
        print("EasyOCR reader initialized successfully!")
    
    def preprocess_image(self, image):
        """
        Preprocess the image to improve OCR accuracy
        """
        try:
            # Ensure image is in correct format
            if len(image.shape) == 3:
                # Convert to grayscale
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                # Already grayscale
                gray = image
            
            print(f"Preprocessing - Grayscale shape: {gray.shape}")
            
            # Apply Gaussian blur to reduce noise
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # Apply threshold to get binary image
            _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Optional: Apply morphological operations to clean up the image
            kernel = np.ones((2,2), np.uint8)
            thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
            
            print("Image preprocessing completed")
            return thresh
            
        except Exception as e:
            print(f"Error in preprocessing: {e}")
            return image
    
    def extract_text_from_image(self, image_data, preprocess=True):
        """
        Extract text from image using EasyOCR
        
        Args:
            image_data: Base64 encoded image or file path
            preprocess: Whether to apply preprocessing
            
        Returns:
            dict: Contains extracted text, confidence scores, and bounding boxes
        """
        try:
            print(f"Starting text extraction, preprocessing: {preprocess}")
            
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
                    # Create white background
                    background = Image.new('RGB', image.size, (255, 255, 255))
                    background.paste(image, mask=image.split()[-1])  # Use alpha channel as mask
                    image = background
                elif image.mode != 'RGB':
                    print(f"Converting {image.mode} to RGB...")
                    image = image.convert('RGB')
                
                image_np = np.array(image)
                print(f"Image processed successfully, final shape: {image_np.shape}")
            else:
                # If it's a file path
                print(f"Loading image from file: {image_data}")
                image_np = cv2.imread(image_data)
                
            # Ensure we have a valid image
            if image_np is None:
                raise ValueError("Failed to load or decode image")
                
            # Convert RGB to BGR for OpenCV if needed
            if len(image_np.shape) == 3 and image_np.shape[2] == 3:
                image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
            
            # Preprocess image if requested
            if preprocess:
                print("Applying image preprocessing...")
                processed_image = self.preprocess_image(image_np)
            else:
                processed_image = image_np
            
            print("Running OCR...")
            # Extract text using EasyOCR
            results = self.reader.readtext(processed_image)
            print(f"OCR completed, found {len(results)} text regions")
            
            # Process results
            extracted_data = {
                'text': '',
                'words': [],
                'confidence': 0,
                'bounding_boxes': []
            }
            
            total_confidence = 0
            word_count = 0
            
            for i, (bbox, text, confidence) in enumerate(results):
                print(f"Result {i}: text='{text}', confidence={confidence:.3f}")
                
                if confidence > 0.1:  # Lower threshold to capture more results
                    # Convert numpy arrays to regular Python lists for JSON serialization
                    bbox_list = [[float(point[0]), float(point[1])] for point in bbox]
                    
                    extracted_data['words'].append({
                        'text': str(text),  # Ensure it's a string
                        'confidence': float(confidence),  # Convert numpy float to Python float
                        'bbox': bbox_list
                    })
                    extracted_data['bounding_boxes'].append(bbox_list)
                    total_confidence += float(confidence)
                    word_count += 1
                else:
                    print(f"Skipping low confidence result: '{text}' (confidence: {confidence:.3f})")
            
            # Combine all text
            extracted_text = ' '.join([word['text'] for word in extracted_data['words']])
            extracted_data['text'] = extracted_text
            
            # Calculate average confidence
            if word_count > 0:
                extracted_data['confidence'] = float(total_confidence / word_count)
            else:
                extracted_data['confidence'] = 0.0
            
            print(f"Final extracted text: '{extracted_text}'")
            print(f"Average confidence: {extracted_data['confidence']:.3f}")
            print(f"Word count: {word_count}")
            
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
print("Starting OCR service initialization...")
ocr_service = OCRService()

@app.route('/api/ocr/extract', methods=['POST'])
def extract_text():
    """
    API endpoint to extract text from uploaded image
    """
    try:
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
        result = ocr_service.extract_text_from_image(image_data, preprocess)
        
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
        
        print(f"Sending response: {json.dumps(response_data, indent=2)}")
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
        print("Received batch OCR extract request")
        data = request.get_json()
        
        if not data or 'images' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        
        images = data['images']
        print(f"Processing {len(images)} images")
        
        # Process images
        results = ocr_service.batch_process_images(images)
        
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
    

def optimize_image_for_ocr(self, image_np, max_width=2000, max_height=2000):
    """
    Optimize large images for better OCR performance and memory usage
    """
    try:
        height, width = image_np.shape[:2]
        
        # Check if image is too large
        if width > max_width or height > max_height:
            print(f"Image is large ({width}x{height}), resizing for better performance...")
            
            # Calculate scaling factor
            scale_width = max_width / width
            scale_height = max_height / height
            scale = min(scale_width, scale_height)
            
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

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({'status': 'healthy', 'service': 'OCR Service'})

if __name__ == '__main__':
    print("Starting Flask OCR service on port 5001...")
    app.run(debug=True, port=5001)