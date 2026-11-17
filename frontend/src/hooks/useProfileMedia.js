import { useCallback, useState } from 'react';
import { uploadProfilePhoto, uploadBannerPhoto, saveBannerColor } from '../services/api';
import { notify } from '../components/ToastProvider';

const resolveImageUrl = (path) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
  if (!path) return null;
  return `${baseUrl}/${path.replace(/^\//, '')}`;
};

export default function useProfileMedia() {
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [bannerUrl, setBannerUrl] = useState(null);
  const [bannerColor, setBannerColor] = useState('#7A1E3A');
  const [bannerUploading, setBannerUploading] = useState(false);
  const [showBannerEditor, setShowBannerEditor] = useState(false);

  const loadProfileMedia = useCallback((profile) => {
    if (profile?.foto_perfil) setProfilePhotoUrl(resolveImageUrl(profile.foto_perfil));
    if (profile?.banner_perfil) {
      setBannerUrl(resolveImageUrl(profile.banner_perfil));
      setBannerColor(null);
    } else if (profile?.banner_color) {
      setBannerColor(profile.banner_color);
      setBannerUrl(null);
    }
  }, []);

  const onProfilePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setPhotoUploading(true);
    try {
      const res = await uploadProfilePhoto(formData);
      if (res.data?.url) {
        const newUrl = resolveImageUrl(res.data.url);
        setProfilePhotoUrl(newUrl);
        window.dispatchEvent(new CustomEvent('profile-photo-updated', { detail: { url: newUrl } }));
        notify('Foto de perfil actualizada', 'success');
      }
    } catch (error) {
      console.error('Error subiendo foto de perfil:', error);
      notify('No se pudo subir la foto', 'error');
    } finally {
      setPhotoUploading(false);
    }
  };

  const onBannerImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setBannerUploading(true);
    try {
      const res = await uploadBannerPhoto(formData);
      if (res.data?.url) {
        const newUrl = resolveImageUrl(res.data.url);
        setBannerUrl(newUrl);
        setBannerColor(null);
        window.dispatchEvent(new CustomEvent('profile-banner-updated', { detail: { bannerUrl: newUrl, bannerColor: null } }));
        notify('Banner actualizado', 'success');
        setShowBannerEditor(false);
      }
    } catch {
      notify('No se pudo subir el banner', 'error');
    } finally {
      setBannerUploading(false);
    }
  };

  const onBannerColorSelect = async (color) => {
    try {
      await saveBannerColor(color);
      setBannerColor(color);
      setBannerUrl(null);
      window.dispatchEvent(new CustomEvent('profile-banner-updated', { detail: { bannerUrl: null, bannerColor: color } }));
      notify('Color de banner guardado', 'success');
      setShowBannerEditor(false);
    } catch {
      notify('No se pudo guardar el color', 'error');
    }
  };

  return {
    profilePhotoUrl,
    photoUploading,
    bannerUrl,
    bannerColor,
    setBannerColor,
    bannerUploading,
    showBannerEditor,
    setShowBannerEditor,
    loadProfileMedia,
    onProfilePhotoChange,
    onBannerImageChange,
    onBannerColorSelect,
  };
}
