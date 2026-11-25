import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import useProfileMedia from '../../hooks/useProfileMedia';
import { uploadProfilePhoto, uploadBannerPhoto, saveBannerColor } from '../../services/api';
import { notify } from '../../components/ToastProvider';

vi.mock('../../services/api', () => ({
  uploadProfilePhoto: vi.fn(),
  uploadBannerPhoto: vi.fn(),
  saveBannerColor: vi.fn(),
}));

vi.mock('../../components/ToastProvider', () => ({
  notify: vi.fn(),
}));

describe('useProfileMedia hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inicializa con valores por defecto y carga medios de perfil', () => {
    const { result } = renderHook(() => useProfileMedia());
    expect(result.current.profilePhotoUrl).toBeNull();
    expect(result.current.bannerColor).toBe('#7A1E3A');

    act(() => {
      result.current.loadProfileMedia({
        foto_perfil: 'uploads/foto.jpg',
        banner_perfil: 'uploads/banner.jpg',
      });
    });

    expect(result.current.profilePhotoUrl).toContain('uploads/foto.jpg');
    expect(result.current.bannerUrl).toContain('uploads/banner.jpg');
    expect(result.current.bannerColor).toBeNull();
  });

  it('carga banner de color cuando no hay imagen de banner', () => {
    const { result } = renderHook(() => useProfileMedia());
    act(() => {
      result.current.loadProfileMedia({
        banner_color: '#123456',
      });
    });

    expect(result.current.bannerColor).toBe('#123456');
    expect(result.current.bannerUrl).toBeNull();
  });

  it('actualiza foto de perfil con éxito', async () => {
    uploadProfilePhoto.mockResolvedValueOnce({
      data: { url: 'uploads/new_avatar.jpg' },
    });

    const { result } = renderHook(() => useProfileMedia());
    const file = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [file] } };

    await act(async () => {
      await result.current.onProfilePhotoChange(event);
    });

    expect(uploadProfilePhoto).toHaveBeenCalled();
    expect(result.current.profilePhotoUrl).toContain('uploads/new_avatar.jpg');
    expect(notify).toHaveBeenCalledWith('Foto de perfil actualizada', 'success');
  });

  it('maneja error al subir foto de perfil', async () => {
    uploadProfilePhoto.mockRejectedValueOnce(new Error('Upload failed'));

    const { result } = renderHook(() => useProfileMedia());
    const file = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [file] } };

    await act(async () => {
      await result.current.onProfilePhotoChange(event);
    });

    expect(notify).toHaveBeenCalledWith('No se pudo subir la foto', 'error');
  });

  it('actualiza banner de imagen con éxito y maneja error', async () => {
    uploadBannerPhoto.mockResolvedValueOnce({
      data: { url: 'uploads/new_banner.jpg' },
    });

    const { result } = renderHook(() => useProfileMedia());
    const file = new File(['content'], 'banner.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.onBannerImageChange({ target: { files: [file] } });
    });

    expect(uploadBannerPhoto).toHaveBeenCalled();
    expect(result.current.bannerUrl).toContain('uploads/new_banner.jpg');
    expect(notify).toHaveBeenCalledWith('Banner actualizado', 'success');

    // Error
    uploadBannerPhoto.mockRejectedValueOnce(new Error('Banner fail'));
    await act(async () => {
      await result.current.onBannerImageChange({ target: { files: [file] } });
    });
    expect(notify).toHaveBeenCalledWith('No se pudo subir el banner', 'error');
  });

  it('guarda color de banner con éxito y maneja error', async () => {
    saveBannerColor.mockResolvedValueOnce({});

    const { result } = renderHook(() => useProfileMedia());

    await act(async () => {
      await result.current.onBannerColorSelect('#ABCDEF');
    });

    expect(saveBannerColor).toHaveBeenCalledWith('#ABCDEF');
    expect(result.current.bannerColor).toBe('#ABCDEF');
    expect(notify).toHaveBeenCalledWith('Color de banner guardado', 'success');

    // Error
    saveBannerColor.mockRejectedValueOnce(new Error('Save failed'));
    await act(async () => {
      await result.current.onBannerColorSelect('#000000');
    });
    expect(notify).toHaveBeenCalledWith('No se pudo guardar el color', 'error');
  });
});
