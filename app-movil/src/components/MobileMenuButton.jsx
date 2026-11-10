import React, { useContext, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { IconMenu } from './Icons';
import SidebarMenu from './SidebarMenu';

export default function MobileMenuButton({ tintColor = '#7A1E3A' }) {
  const navigation = useNavigation();
  const { user, signOut } = useContext(AuthContext);
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={{ paddingHorizontal: 8, paddingVertical: 4 }}
        accessibilityLabel="Abrir menú"
        accessibilityRole="button"
      >
        <IconMenu size={22} color={tintColor} />
      </TouchableOpacity>
      <SidebarMenu
        visible={visible}
        onClose={() => setVisible(false)}
        user={user}
        navigation={navigation}
        onSignOut={signOut}
      />
    </>
  );
}
