import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { CachedImage } from '@/components/CachedImage';

// Mock the image cache service
jest.mock('@/services/imageCacheService', () => ({
  imageCacheService: {
    getCachedImage: jest.fn(),
  },
}));

describe('CachedImage', () => {
  const mockImageCacheService = require('@/services/imageCacheService').imageCacheService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render cached image when available', async () => {
    const localUri = 'file://cached-image.jpg';
    mockImageCacheService.getCachedImage.mockResolvedValue(localUri);

    const { getByTestId } = render(
      <CachedImage
        source={{ uri: 'https://example.com/image.jpg' }}
        style={{ width: 100, height: 100 }}
        testID="cached-image"
      />
    );

    await waitFor(() => {
      const image = getByTestId('cached-image');
      expect(image).toBeTruthy();
    });

    expect(mockImageCacheService.getCachedImage).toHaveBeenCalledWith('https://example.com/image.jpg');
  });

  it('should show loading state initially', () => {
    mockImageCacheService.getCachedImage.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve('file://cached.jpg'), 100))
    );

    const { getByTestId } = render(
      <CachedImage
        source={{ uri: 'https://example.com/image.jpg' }}
        style={{ width: 100, height: 100 }}
        testID="cached-image"
      />
    );

    const loadingView = getByTestId('loading-view');
    expect(loadingView).toBeTruthy();
  });

  it('should show error state when image fails to load', async () => {
    mockImageCacheService.getCachedImage.mockRejectedValue(new Error('Cache error'));

    const { getByTestId } = render(
      <CachedImage
        source={{ uri: 'https://example.com/image.jpg' }}
        style={{ width: 100, height: 100 }}
        testID="cached-image"
      />
    );

    await waitFor(() => {
      const errorView = getByTestId('error-view');
      expect(errorView).toBeTruthy();
    });
  });

  it('should use custom fallback colors', async () => {
    mockImageCacheService.getCachedImage.mockRejectedValue(new Error('Cache error'));

    const { getByTestId } = render(
      <CachedImage
        source={{ uri: 'https://example.com/image.jpg' }}
        style={{ width: 100, height: 100 }}
        fallbackBackgroundColor="#ff0000"
        fallbackIconColor="#00ff00"
        testID="cached-image"
      />
    );

    await waitFor(() => {
      const errorView = getByTestId('error-view');
      expect(errorView.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: '#ff0000',
        })
      );
    });
  });

  it('should handle local images without caching', async () => {
    const { getByTestId } = render(
      <CachedImage
        source={{ uri: 'file://local-image.jpg' }}
        style={{ width: 100, height: 100 }}
        testID="cached-image"
      />
    );

    await waitFor(() => {
      const image = getByTestId('cached-image');
      expect(image).toBeTruthy();
    });

    // Should not call cache service for local images
    expect(mockImageCacheService.getCachedImage).not.toHaveBeenCalled();
  });

  it('should handle missing source gracefully', async () => {
    const { getByTestId } = render(
      <CachedImage
        source={{ uri: '' }}
        style={{ width: 100, height: 100 }}
        testID="cached-image"
      />
    );

    await waitFor(() => {
      const errorView = getByTestId('error-view');
      expect(errorView).toBeTruthy();
    });
  });
});
