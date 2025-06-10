import React, { useState, useEffect } from 'react';
import { Image, ImageProps, View, ActivityIndicator, Text } from 'react-native';
import { Colors } from '@/constants/Colors';
import { imageCacheService } from '@/services/imageCacheService';

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  fallbackColor?: string;
  showLoader?: boolean;
  fallbackText?: string;
}

export default function CachedImage({
  uri,
  fallbackColor = Colors.gray[200],
  showLoader = true,
  fallbackText,
  style,
  ...props
}: CachedImageProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadImage();
  }, [uri]);

  const loadImage = async () => {
    if (!uri) {
      setLoading(false);
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const cachedUri = await imageCacheService.getCachedImage(uri);
      setImageUri(cachedUri);
    } catch (err) {
      console.warn('Failed to load image:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = () => {
    setError(true);
    setLoading(false);
  };

  const handleImageLoad = () => {
    setLoading(false);
  };

  if (loading && showLoader) {
    return (
      <View style={[style, { backgroundColor: fallbackColor, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="small" color={Colors.primary[500]} />
      </View>
    );
  }

  if (error || !imageUri) {
    return (
      <View style={[style, { backgroundColor: fallbackColor, justifyContent: 'center', alignItems: 'center' }]}>
        {fallbackText && (
          <Text style={{ color: Colors.gray[500], fontSize: 12, textAlign: 'center' }}>
            {fallbackText}
          </Text>
        )}
      </View>
    );
  }

  return (
    <Image
      {...props}
      source={{ uri: imageUri }}
      style={style}
      onError={handleImageError}
      onLoad={handleImageLoad}
    />
  );
}
