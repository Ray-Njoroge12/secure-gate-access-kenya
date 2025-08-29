"""
Image optimization service for automatic image compression and processing
"""
import os
import logging
import base64
from typing import Optional, Tuple, Dict, Any

# Try to import PIL, but make it optional
try:
    from PIL import Image
    from io import BytesIO
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    logging.warning("PIL/Pillow not available. Image optimization features will be limited.")

logger = logging.getLogger(__name__)

class ImageOptimizationService:
    """
    Service for optimizing images with compression and format conversion
    """

    def __init__(self):
        self.supported_formats = {'JPEG', 'PNG', 'WEBP'}
        self.max_dimensions = (1920, 1080)  # Max width, height
        self.quality_settings = {
            'high': 95,
            'medium': 85,
            'low': 75
        }

    def optimize_image(
        self,
        image_data: bytes,
        quality: str = 'medium',
        max_width: Optional[int] = None,
        max_height: Optional[int] = None,
        output_format: str = 'JPEG'
    ) -> Tuple[bytes, dict]:
        """
        Optimize image with compression and resizing

        Args:
            image_data: Raw image bytes
            quality: Quality setting ('high', 'medium', 'low')
            max_width: Maximum width (optional)
            max_height: Maximum height (optional)
            output_format: Output format ('JPEG', 'PNG', 'WEBP')

        Returns:
            Tuple of (optimized_image_bytes, metadata_dict)
        """
        if not PIL_AVAILABLE:
            logger.warning("PIL not available, returning original image")
            return image_data, {
                'original_size': (0, 0),
                'optimized_size': (0, 0),
                'compression_ratio': 1.0,
                'pil_not_available': True
            }

        try:
            # Open image
            image = Image.open(BytesIO(image_data))

            # Convert to RGB if necessary (for JPEG)
            if output_format.upper() == 'JPEG' and image.mode in ('RGBA', 'LA', 'P'):
                # Create white background for transparent images
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                image = background
            elif image.mode not in ('RGB', 'RGBA'):
                image = image.convert('RGB')

            # Resize if needed
            original_size = image.size
            max_w = max_width or self.max_dimensions[0]
            max_h = max_height or self.max_dimensions[1]

            if image.size[0] > max_w or image.size[1] > max_h:
                image.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)

            # Prepare output
            output_buffer = BytesIO()

            # Set quality
            quality_value = self.quality_settings.get(quality, self.quality_settings['medium'])

            # Save optimized image
            if output_format.upper() == 'JPEG':
                image.save(output_buffer, format='JPEG', quality=quality_value, optimize=True)
            elif output_format.upper() == 'PNG':
                image.save(output_buffer, format='PNG', optimize=True)
            elif output_format.upper() == 'WEBP':
                image.save(output_buffer, format='WEBP', quality=quality_value)
            else:
                # Default to JPEG
                image.save(output_buffer, format='JPEG', quality=quality_value, optimize=True)

            optimized_data = output_buffer.getvalue()

            # Calculate metadata
            metadata = {
                'original_size': original_size,
                'optimized_size': image.size,
                'original_format': image.format,
                'output_format': output_format,
                'quality': quality,
                'compression_ratio': len(image_data) / len(optimized_data) if len(optimized_data) > 0 else 1.0,
                'file_size_original': len(image_data),
                'file_size_optimized': len(optimized_data)
            }

            logger.info(f"Image optimized: {metadata['compression_ratio']:.2f}x compression")
            return optimized_data, metadata

        except Exception as e:
            logger.error(f"Image optimization error: {e}")
            # Return original data if optimization fails
            return image_data, {
                'error': str(e),
                'original_size': (0, 0),
                'optimized_size': (0, 0),
                'compression_ratio': 1.0
            }

    def create_thumbnail(
        self,
        image_data: bytes,
        size: Tuple[int, int] = (200, 200),
        quality: str = 'medium'
    ) -> Tuple[bytes, dict]:
        """
        Create thumbnail from image

        Args:
            image_data: Raw image bytes
            size: Thumbnail size (width, height)
            quality: Quality setting

        Returns:
            Tuple of (thumbnail_bytes, metadata_dict)
        """
        if not PIL_AVAILABLE:
            logger.warning("PIL not available, cannot create thumbnail")
            return image_data, {'error': 'PIL not available', 'pil_not_available': True}

        try:
            image = Image.open(BytesIO(image_data))

            # Create thumbnail
            image.thumbnail(size, Image.Resampling.LANCZOS)

            # Convert to RGB for JPEG
            if image.mode != 'RGB':
                image = image.convert('RGB')

            # Save thumbnail
            output_buffer = BytesIO()
            quality_value = self.quality_settings.get(quality, self.quality_settings['medium'])
            image.save(output_buffer, format='JPEG', quality=quality_value, optimize=True)

            thumbnail_data = output_buffer.getvalue()

            metadata = {
                'thumbnail_size': image.size,
                'original_size': Image.open(BytesIO(image_data)).size,
                'quality': quality,
                'file_size': len(thumbnail_data)
            }

            return thumbnail_data, metadata

        except Exception as e:
            logger.error(f"Thumbnail creation error: {e}")
            return image_data, {'error': str(e)}

    def get_image_info(self, image_data: bytes) -> dict:
        """
        Get image information without processing

        Args:
            image_data: Raw image bytes

        Returns:
            Dictionary with image information
        """
        if not PIL_AVAILABLE:
            return {
                'pil_not_available': True,
                'file_size': len(image_data),
                'format': 'unknown'
            }

        try:
            image = Image.open(BytesIO(image_data))
            return {
                'format': image.format,
                'size': image.size,
                'mode': image.mode,
                'file_size': len(image_data),
                'is_animated': getattr(image, 'is_animated', False)
            }
        except Exception as e:
            return {'error': str(e)}

    def base64_encode_image(self, image_data: bytes) -> str:
        """Encode image data to base64 string"""
        return base64.b64encode(image_data).decode('utf-8')

    def base64_decode_image(self, base64_string: str) -> bytes:
        """Decode base64 string to image data"""
        return base64.b64decode(base64_string)

# Global image optimization service instance
_image_service = None

def get_image_service() -> ImageOptimizationService:
    """Get the global image optimization service instance"""
    global _image_service
    if _image_service is None:
        _image_service = ImageOptimizationService()
    return _image_service

# Convenience functions
def optimize_image(image_data: bytes, **kwargs) -> Tuple[bytes, dict]:
    """Optimize image with default settings"""
    return get_image_service().optimize_image(image_data, **kwargs)

def create_thumbnail(image_data: bytes, **kwargs) -> Tuple[bytes, dict]:
    """Create thumbnail with default settings"""
    return get_image_service().create_thumbnail(image_data, **kwargs)

def get_image_info(image_data: bytes) -> dict:
    """Get image information"""
    return get_image_service().get_image_info(image_data)
