// src/components/Footer.jsx
import React, { useContext, useRef, useState } from 'react';
import {
  Modal, Pressable, ScrollView, Text, TouchableOpacity, View, StyleSheet, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { IconStore, IconUser, IconUserPlus } from './Icons';

const CARBON = '#2A2A2A';
const WHITE  = '#FFFFFF';
const VINOTINTO = '#7A1E3A';
const BOTTOM_GUTTER = 40;

const COLUMNS = [
  {
    title: 'BookyHome',
    links: ['Acerca de nosotros', 'Contacto', 'Términos y condiciones', 'Política de privacidad'],
  },
  {
    title: 'Comprar',
    links: ['Explorar catálogo', 'Cómo comprar', 'Envíos y entregas', 'Devoluciones'],
  },
  {
    title: 'Vender',
    links: ['Vender en BookyHome', 'Planes y tarifas', 'Centro de vendedores', 'FAQ vendedores'],
  },
  {
    title: 'Mi Cuenta',
    links: ['Iniciar sesión / Registro', 'Mis compras', 'Lista de deseos', 'Ayuda y Soporte'],
  },
];

const INFO_LINKS = {
  'Acerca de nosotros': [
    { type: 'paragraph', parts: [{ text: 'BookyHome', bold: true }, { text: ' es una plataforma colombiana creada para conectar lectores, compradores, tiendas y vendedores de libros en un mismo espacio digital.' }] },
    { type: 'heading', text: 'Nuestra misión' },
    { type: 'paragraph', text: 'Facilitar la compra y venta de libros de forma sencilla, segura y cercana, ayudando a que más personas encuentren títulos relevantes y a que independientemente de su tamaño, las librerías y vendedores puedan llegar a más clientes.' },
    { type: 'heading', text: '¿Qué hacemos?' },
    { type: 'paragraph', text: 'En BookyHome puedes explorar un catálogo de libros, encontrar ofertas, comparar opciones y comprar desde una experiencia pensada para la comodidad del usuario. También brindamos un espacio para que vendedores y tiendas publiquen sus productos, gestionen sus ventas y conecten con compradores interesados.' },
    { type: 'heading', text: '¿Por qué existimos?' },
    { type: 'paragraph', text: 'Creemos que el libro es un producto cultural, educativo y personal, por eso buscamos crear una comunidad donde la compra sea clara, accesible y confiable. Queremos apoyar tanto a quienes buscan leer como a quienes hacen posible la venta y distribución de libros.' },
    { type: 'heading', text: 'Compromiso' },
    { type: 'paragraph', text: 'BookyHome trabaja para ofrecer una experiencia amigable, transparente y fácil de usar, con foco en la calidad de la información, la atención al cliente y la confianza entre compradores y vendedores.' },
  ],
  Contacto: [
    { type: 'paragraph', text: 'Si necesitas ayuda, tienes dudas sobre un pedido o quieres comunicarte con el equipo de BookyHome, puedes contactarnos a través de los siguientes canales.' },
    { type: 'heading', text: 'Soporte y atención' },
    { type: 'paragraph', parts: [{ text: 'Email:', bold: true }, { text: ' soporte@bookyhome.com' }] },
    { type: 'paragraph', parts: [{ text: 'Privacidad:', bold: true }, { text: ' privacidad@bookyhome.com' }] },
    { type: 'heading', text: 'Horario' },
    { type: 'paragraph', text: 'Atendemos consultas de lunes a viernes, en horario hábil. En caso de necesitar respuesta sobre pedidos o incidencias, te responderemos en el menor tiempo posible.' },
    { type: 'heading', text: '¿Qué puedes comunicar?' },
    { type: 'paragraph', text: 'Podemos ayudarte con dudas sobre compras, entregas, devoluciones, pagos, publicaciones de vendedores, problemas con tu cuenta o cualquier inquietud relacionada con la plataforma.' },
  ],
  'Vender en BookyHome': [
    { type: 'paragraph', text: 'BookyHome te permite vender libros de forma sencilla, con visibilidad para compradores interesados y herramientas para gestionar tus publicaciones.' },
    { type: 'heading', text: '¿Cómo funciona?' },
    { type: 'paragraph', text: 'Creas tu cuenta de vendedor, publicas tus libros con información clara, defines el precio y disponibilidad, y gestionas tus ventas desde un panel sencillo.' },
    { type: 'heading', text: 'Ventajas' },
    { type: 'paragraph', text: 'Acceso a un público activo de lectores, mejor visibilidad para tus títulos, organización de ventas y un espacio para crecer tu negocio literario.' },
    { type: 'heading', text: 'Objetivo' },
    { type: 'paragraph', text: 'Queremos apoyar a librerías, vendedores independientes y marcas que quieran conectar con lectores en Colombia en una experiencia segura y ordenada.' },
  ],
  'Planes y tarifas': [
    { type: 'paragraph', text: 'BookyHome ofrece un modelo de venta pensado para librerías pequeñas, grandes tiendas y vendedores independientes.' },
    { type: 'heading', text: 'Publicación' },
    { type: 'paragraph', text: 'Puedes comenzar a publicar tus libros con una estructura simple y clara, adaptada a tu catálogo y disponibilidad.' },
    { type: 'heading', text: 'Gestión' },
    { type: 'paragraph', text: 'Controla tus ventas, pedidos y atención al cliente desde un mismo lugar, con herramientas para mantener tus publicaciones actualizadas.' },
    { type: 'heading', text: 'Flexibilidad' },
    { type: 'paragraph', text: 'El plan se adapta al volumen de publicaciones y al tipo de negocio que deseas impulsar dentro de la plataforma.' },
  ],
  'Centro de vendedores': [
    { type: 'paragraph', text: 'El centro de vendedores es el punto de referencia para administrar tu negocio en BookyHome.' },
    { type: 'heading', text: 'Desde ahí puedes' },
    { type: 'paragraph', text: 'Ver tus publicaciones, revisar ventas, conocer el estado de pedidos, responder mensajes y actualizar información de tus libros o tienda.' },
    { type: 'heading', text: 'Soporte' },
    { type: 'paragraph', text: 'También encontrarás información útil para mejorar tu presencia, mantener tus productos actualizados y ofrecer una mejor experiencia a tus clientes.' },
  ],
  'FAQ vendedores': [
    { type: 'paragraph', text: 'Estas son algunas preguntas frecuentes que suelen aparecer al comenzar a vender en BookyHome.' },
    { type: 'heading', text: '¿Necesito ser una librería para vender?' },
    { type: 'paragraph', text: 'No. Puedes vender como tienda, librería o vendedor independiente siempre que cumplas con los requisitos de la plataforma y publiques información verídica.' },
    { type: 'heading', text: '¿Cómo gestiono mis pedidos?' },
    { type: 'paragraph', text: 'Desde tu panel de vendedor puedes revisar las ventas, confirmar el estado del pedido y comunicarte con el comprador si es necesario.' },
    { type: 'heading', text: '¿Qué pasa si tengo una duda?' },
    { type: 'paragraph', text: 'Puedes comunicarte con el equipo de soporte para resolver dudas sobre publicaciones, ventas, pagos, entregas o atención al cliente.' },
  ],
  'Cómo comprar': [
    { type: 'paragraph', text: 'Comprar en BookyHome es sencillo y seguro. Estos son los pasos básicos para completar una compra.' },
    { type: 'heading', text: '1. Explora el catálogo' },
    { type: 'paragraph', text: 'Busca por título, autor, categoría o tienda para encontrar el libro que necesitas.' },
    { type: 'heading', text: '2. Revisa la información' },
    { type: 'paragraph', text: 'Consulta la descripción, disponibilidad, precio, vendedor y condiciones de entrega antes de comprar.' },
    { type: 'heading', text: '3. Agrega al carrito' },
    { type: 'paragraph', text: 'Cuando encuentres el libro correcto, agrégalo al carrito y confirma los datos del pedido.' },
    { type: 'heading', text: '4. Finaliza el pago' },
    { type: 'paragraph', text: 'Completa la compra con el método de pago disponible y confirma la operación desde la plataforma.' },
    { type: 'heading', text: '5. Sigue tu pedido' },
    { type: 'paragraph', text: 'Podrás consultar el estado de tu compra y recibir notificaciones sobre envío, entrega o soporte.' },
  ],
  'Envíos y entregas': [
    { type: 'paragraph', text: 'Los tiempos de entrega dependen del vendedor, la ciudad y la empresa de mensajería que realice la logística.' },
    { type: 'heading', text: '¿Cómo se gestionan?' },
    { type: 'paragraph', text: 'Una vez confirmada la compra, el vendedor prepara el pedido y lo envía según la información publicada en la plataforma.' },
    { type: 'heading', text: 'Tiempos estimados' },
    { type: 'paragraph', text: 'Los tiempos pueden variar entre 2 y 10 días hábiles, dependiendo de la ubicación y la disponibilidad del producto.' },
    { type: 'heading', text: 'Seguimiento' },
    { type: 'paragraph', text: 'Podrás ver el estado del pedido desde tu cuenta y recibir notificaciones cuando el envío esté en tránsito o entregado.' },
  ],
  Devoluciones: [
    { type: 'paragraph', text: 'Si el libro recibido no coincide con la publicación, llega dañado o presenta un problema, puedes solicitar una devolución.' },
    { type: 'heading', text: 'Cuándo puedes devolver' },
    { type: 'paragraph', text: 'Se puede solicitar devolución por producto defectuoso, incorrecto, no coincidente con la descripción o entregado en mal estado.' },
    { type: 'heading', text: 'Proceso' },
    { type: 'paragraph', text: 'Debes indicar el motivo y, si aplica, adjuntar información y comentarios del caso. La solicitud será revisada por la plataforma y el vendedor.' },
    { type: 'heading', text: 'Reembolso' },
    { type: 'paragraph', text: 'El reembolso o cambio se gestionará según la política del vendedor y la validación del caso por parte de BookyHome.' },
  ],
  'Política de privacidad': [
    { type: 'paragraph', bold: true, text: 'Última actualización: 30 de Agosto de 2026' },
    { type: 'heading', text: '1. Información que Recopilamos' },
    { type: 'paragraph', text: 'Recopilamos información necesaria para crear y administrar tu cuenta, como nombre, correo electrónico, contraseña, dirección de entrega, datos de contacto, historial de compras, preferencias de navegación, reseñas, mensajes y cualquier información que proporciones al usar la plataforma.' },
    { type: 'heading', text: '2. Cómo Usamos tu Información' },
    { type: 'paragraph', text: 'Usamos tus datos para gestionar tu registro, procesar pedidos, facilitar la atención al cliente, mejorar la experiencia de compra, enviar confirmaciones y notificaciones, prevenir fraudes, mantener la seguridad de la plataforma y mejorar la calidad de nuestros servicios.' },
    { type: 'heading', text: '3. Compartir Información con terceros' },
    { type: 'paragraph', text: 'No vendemos tus datos personales. Sin embargo, podemos compartir información con vendedores, socios logísticos, proveedores de pagos, servicios de soporte o autoridades cuando sea necesario para completar una compra, atender un reclamo, cumplir con una obligación legal o proteger los derechos de la plataforma y de sus usuarios.' },
    { type: 'heading', text: '4. Cookies y tecnologías similares' },
    { type: 'paragraph', text: 'Utilizamos cookies, almacenamiento local y herramientas analíticas para reconocer tu sesión, recordar tus preferencias, mantener la seguridad, medir tráfico y mejorar la navegación dentro de la app o sitio web. Puedes configurar tu navegador para aceptar, rechazar o eliminar cookies, aunque algunas funciones pueden verse limitadas.' },
    { type: 'heading', text: '5. Seguridad de tus Datos' },
    { type: 'paragraph', text: 'Aplicamos medidas razonables de seguridad para proteger tu información frente a accesos no autorizados, uso indebido o pérdida. Sin embargo, ninguna transmisión por internet es completamente segura; por ello, recomendamos mantener tus credenciales protegidas y notificar cualquier sospecha de uso no autorizado.' },
    { type: 'heading', text: '6. Tus Derechos' },
    { type: 'paragraph', text: 'Tienes derecho a acceder, corregir, actualizar o solicitar la eliminación de tus datos personales, así como a limitar o rechazar determinados usos. Para ejercer estos derechos, puedes contactarnos a través de nuestro soporte o correo de privacidad.' },
    { type: 'heading', text: '7. Retención y eliminación' },
    { type: 'paragraph', text: 'Conservamos la información mientras tu cuenta esté activa o mientras sea necesario para cumplir con obligaciones legales, resolver disputas, prevenir fraudes y mejorar la operación de la plataforma. Cuando la información ya no sea necesaria, procederemos a su eliminación o anonimización según corresponda.' },
    { type: 'heading', text: '8. Menores de Edad' },
    { type: 'paragraph', text: 'BookyHome no está destinado a menores de edad sin supervisión. Si detectamos o recibimos información de un menor sin la debida autorización, podremos bloquear o eliminar esa cuenta y la información asociada.' },
    { type: 'heading', text: '9. Contacto' },
    { type: 'paragraph', text: 'Si tienes dudas sobre esta política, deseas ejercer tus derechos o reportar un problema relacionado con tus datos, puedes comunicarte con nosotros en soporte@bookyhome.com o privacidad@bookyhome.com.' },
  ],
  'Términos y condiciones': [
    { type: 'paragraph', bold: true, text: 'Última actualización: 30 de Agosto de 2026' },
    { type: 'heading', text: '1. Aceptación de los Términos' },
    { type: 'paragraph', text: 'Al registrarte en BookyHome, declaras que eres mayor de edad o cuentas con la autorización de tu tutor legal, y aceptas cumplir estos términos y condiciones en su totalidad.' },
    { type: 'heading', text: '2. Descripción del Servicio' },
    { type: 'paragraph', text: 'BookyHome es una plataforma digital de comercio electrónico especializada en libros, diseñada para conectar compradores con librerías, tiendas y vendedores independientes en Colombia. La plataforma actúa como intermediario para facilitar la publicación, búsqueda, compra, pago y seguimiento de pedidos.' },
    { type: 'heading', text: '3. Registro y Cuenta de Usuario' },
    { type: 'paragraph', text: 'Debes proporcionar información verídica, completa y actualizada al registrarte. Eres responsable de mantener la confidencialidad de tus credenciales, así como de cualquier actividad realizada desde tu cuenta. BookyHome puede suspender, limitar o eliminar cuentas que incumplan estas condiciones o afecten la seguridad o el buen funcionamiento de la plataforma.' },
    { type: 'heading', text: '4. Compras, Pagos y Protección al Comprador' },
    { type: 'paragraph', text: 'Los precios, disponibilidad y condiciones de venta son definidos por cada vendedor o tienda. BookyHome facilita la operación y puede ofrecer mecanismos de protección para compras, verificaciones y atención a reclamos. Sin embargo, la venta final se realiza entre el comprador y el vendedor, y BookyHome no es propietario de los libros ofertados ni de los inventarios publicados.' },
    { type: 'heading', text: '5. Envíos, Entregas y Responsabilidad' },
    { type: 'paragraph', text: 'Los tiempos de entrega dependen de la logística del vendedor, la ubicación del comprador y los servicios de mensajería. BookyHome no garantiza tiempos de entrega exactos ni es responsable por retrasos atribuibles a terceros, fallas logísticas, condiciones climáticas, impagos, huelgas o causas ajenas a la plataforma.' },
    { type: 'heading', text: '6. Devoluciones y Reembolsos' },
    { type: 'paragraph', text: 'El comprador podrá solicitar una devolución o reembolso cuando el producto recibido no corresponda a la publicación, presente un daño evidente, o exista una situación conforme a la política de la plataforma y las condiciones del vendedor. Los tiempos y procedimientos de devolución se gestionarán según el caso, la categoría del producto y la política de cada tienda, siempre dentro de los mecanismos habilitados por BookyHome.' },
    { type: 'heading', text: '7. Publicaciones, contenido y vendedores' },
    { type: 'paragraph', text: 'Los vendedores son responsables de la veracidad, calidad, disponibilidad y legalidad de la información publicada en sus anuncios, así como del cumplimiento de las condiciones de venta y entrega. Queda prohibido publicar contenido falso, engañoso, infractor, ilegal o que vulneré derechos de terceros.' },
    { type: 'heading', text: '8. Conducta del Usuario' },
    { type: 'paragraph', text: 'Está prohibido usar la plataforma para actividades ilegales, suplantar identidades, publicar contenido fraudulento, intentar acceder a cuentas ajenas, manipular reseñas, compras o evaluaciones, o interferir con la operación normal de la aplicación.' },
    { type: 'heading', text: '9. Soporte, notificaciones y comunicaciones' },
    { type: 'paragraph', text: 'BookyHome puede enviar mensajes, notificaciones, confirmaciones y avisos relacionados con pedidos, seguridad, cambios en la plataforma o atención al cliente. El usuario acepta recibir estas comunicaciones en la medida en que sean necesarias para la operación del servicio.' },
    { type: 'heading', text: '10. Propiedad Intelectual' },
    { type: 'paragraph', text: 'El nombre, logotipo, diseño, contenido y estructura de BookyHome son propiedad de la plataforma o de sus respectivos titulares. Se prohíbe la reproducción, uso no autorizado o apropiación indebida de cualquier elemento de la marca, la interfaz o los contenidos protegidos.' },
    { type: 'heading', text: '11. Ley aplicable y jurisdicción' },
    { type: 'paragraph', text: 'Estos términos se rigen por la legislación vigente de la República de Colombia. Cualquier controversia relacionada con su interpretación, ejecución o cumplimiento será sometida a la jurisdicción de los tribunales competentes de la ciudad de Bogotá D.C., Colombia, salvo que la ley aplicable establezca otra competencia.' },
    { type: 'heading', text: '12. Modificaciones' },
    { type: 'paragraph', text: 'BookyHome puede actualizar estos términos y condiciones en cualquier momento para reflejar cambios legales, funcionales o operativos del servicio. Los cambios entrarán en vigor a partir de su publicación dentro de la plataforma y serán aplicables a nuevos usos o actividades posteriores.' },
  ],
};

export default function Footer({ style }) {
  const footerRef = useRef(null);
  const measured = useRef(false);
  const [leftOffset, setLeftOffset] = useState(0);
  const [activeInfo, setActiveInfo] = useState(null);
  const [accountModalStage, setAccountModalStage] = useState(null);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { darkMode } = useAppTheme();
  const navigation = useNavigation();
  const { user, token } = useContext(AuthContext);

  const measurePosition = () => {
    if (measured.current) return;
    measured.current = true;
    footerRef.current?.measureInWindow?.((x) => setLeftOffset(x));
  };

  const showUnavailableMessage = (title, message) => {
    setActiveInfo({ title, content: [{ type: 'paragraph', text: message }] });
  };

  const handleLinkPress = (link) => {
    if (INFO_LINKS[link]) {
      setActiveInfo({ title: link, content: INFO_LINKS[link] });
      return;
    }

    const role = String(user?.rol || '').trim().toLowerCase();
    const isBuyer = !role || role === 'comprador' || role === 'usuario';
    const isAuthenticated = Boolean(token || user);
    const accountLinks = [
      'Iniciar sesión / Registro',
      'Mis compras',
      'Lista de deseos',
      'Ayuda y Soporte',
    ];
    const navigateTo = (screen) => {
      if (navigation.getState().routeNames.includes(screen)) {
        navigation.navigate(screen);
      } else {
        showUnavailableMessage(link, 'Esta opción no está disponible en esta sección de la aplicación.');
      }
    };

    if (!isAuthenticated && accountLinks.includes(link)) {
      setAccountModalStage('welcome');
      return;
    }

    if (link === 'Explorar catálogo') {
      navigateTo('Catalogo');
    } else if (link === 'Iniciar sesión / Registro') {
      navigateTo('Profile');
    } else if (link === 'Mis compras') {
      if (isBuyer) navigateTo('History');
      else showUnavailableMessage(link, 'El historial de compras está disponible para cuentas de comprador.');
    } else if (link === 'Lista de deseos') {
      if (isBuyer) navigateTo('ListaDeseos');
      else showUnavailableMessage(link, 'La lista de deseos está disponible para cuentas de comprador.');
    } else if (link === 'Ayuda y Soporte') {
      if (isBuyer) navigateTo('SoporteTecnico');
      else showUnavailableMessage(link, 'Para recibir ayuda, escribe a soporte@bookyhome.com.');
    }
  };

  return (
    <>
      <View
      ref={footerRef}
      collapsable={false}
      onLayout={measurePosition}
      style={[
        styles.footer,
        {
          width,
          marginLeft: -leftOffset,
          marginBottom: -BOTTOM_GUTTER,
          paddingBottom: styles.footer.paddingBottom + BOTTOM_GUTTER + insets.bottom,
        },
        style,
      ]}
    >

      {/* Columnas */}
      <View style={styles.grid}>
        {COLUMNS.map((col, i) => (
          <View key={i} style={styles.column}>
            <Text style={styles.colTitle}>{col.title}</Text>
            {col.links.map((link, j) => (
              <TouchableOpacity key={j} onPress={() => handleLinkPress(link)} activeOpacity={0.7}>
                <Text style={styles.colLink}>{link}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

        <View style={[styles.divider, darkMode && styles.dividerDark]} />

        <Text style={[styles.copyright, darkMode && styles.copyrightDark]}>
          © {new Date().getFullYear()} BookyHome — Todos los derechos reservados.
        </Text>
      </View>

      <Modal
        visible={Boolean(activeInfo)}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveInfo(null)}
      >
        <Pressable
          style={[styles.modalBackdrop, darkMode && styles.modalBackdropDark]}
          onPress={() => setActiveInfo(null)}
        >
          <Pressable
            style={[styles.infoModal, darkMode && styles.infoModalDark]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, darkMode && styles.modalTitleDark]}>{activeInfo?.title}</Text>
              <TouchableOpacity
                onPress={() => setActiveInfo(null)}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                hitSlop={10}
              >
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
              {activeInfo?.content?.map((item, index) => (
                item.type === 'heading' ? (
                  <View key={index} style={[styles.infoHeadingWrap, darkMode && styles.infoHeadingWrapDark]}>
                    <Text style={[styles.infoHeading, darkMode && styles.infoHeadingDark]}>{item.text}</Text>
                  </View>
                ) : (
                  <Text key={index} style={[styles.infoParagraph, darkMode && styles.infoParagraphDark]}>
                    {item.bold ? (
                      <Text style={styles.infoStrong}>{item.text}</Text>
                    ) : item.parts ? (
                      item.parts.map((part, partIndex) => (
                        <Text key={partIndex} style={part.bold ? styles.infoStrong : undefined}>{part.text}</Text>
                      ))
                    ) : item.text}
                  </Text>
                )
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={Boolean(accountModalStage)}
        transparent
        animationType="fade"
        onRequestClose={() => setAccountModalStage(null)}
      >
        <Pressable
          style={[styles.modalBackdrop, darkMode && styles.modalBackdropDark]}
          onPress={() => setAccountModalStage(null)}
        >
          <Pressable
            style={[styles.choiceModal, darkMode && styles.infoModalDark]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.choiceHeader}>
              <Text style={styles.choiceTitle}>
                {accountModalStage === 'register' ? 'Crear cuenta' : '¡Bienvenido a BookyHome!'}
              </Text>
              <TouchableOpacity
                onPress={() => setAccountModalStage(null)}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                hitSlop={10}
              >
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.choiceSubtitle, darkMode && styles.choiceSubtitleDark]}>
              {accountModalStage === 'register'
                ? '¿Cómo quieres unirte a BookyHome?'
                : '¿Ya tienes cuenta o eres nuevo por aquí?'}
            </Text>
            {accountModalStage === 'register' ? (
              <>
                <AccountChoice
                  icon={<IconUser size={22} color={VINOTINTO} />}
                  title="Soy comprador"
                  description="Quiero explorar y comprar libros"
                  darkMode={darkMode}
                  onPress={() => {
                    setAccountModalStage(null);
                    navigation.navigate('Register');
                  }}
                />
                <AccountChoice
                  icon={<IconStore size={22} color={VINOTINTO} />}
                  title="Tengo una librería"
                  description="Quiero vender mis libros en BookyHome"
                  darkMode={darkMode}
                  onPress={() => {
                    setAccountModalStage(null);
                    navigation.navigate('RegisterLibrary');
                  }}
                />
                <TouchableOpacity
                  onPress={() => setAccountModalStage('welcome')}
                  accessibilityRole="button"
                  style={styles.choiceBack}
                >
                  <Text style={styles.choiceBackText}>Atrás</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <AccountChoice
                  icon={<IconUser size={22} color={VINOTINTO} />}
                  title="Ya tengo cuenta"
                  description="Iniciar sesión en BookyHome"
                  darkMode={darkMode}
                  onPress={() => {
                    setAccountModalStage(null);
                    navigation.navigate('Login');
                  }}
                />
                <AccountChoice
                  icon={<IconUserPlus size={22} color={VINOTINTO} />}
                  title="Soy nuevo"
                  description="Crear una cuenta gratis"
                  darkMode={darkMode}
                  onPress={() => setAccountModalStage('register')}
                />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function AccountChoice({ icon, title, description, darkMode, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.choiceOption, darkMode && styles.choiceOptionDark]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
    >
      <View style={styles.choiceIcon}>{icon}</View>
      <View style={styles.choiceText}>
        <Text style={[styles.choiceOptionTitle, darkMode && styles.choiceOptionTitleDark]}>{title}</Text>
        <Text style={[styles.choiceOptionDescription, darkMode && styles.choiceSubtitleDark]}>{description}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  footer: { backgroundColor: CARBON, paddingHorizontal: 32, paddingTop: 56, paddingBottom: 32 },
  footerDark: { backgroundColor: '#1A1A1A' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 24, rowGap: 48 },
  column: { minWidth: '42%', flex: 1 },
  colTitle: { color: WHITE, fontSize: 15.2, fontWeight: '700', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 0.8 },
  colTitleDark: { color: '#E0E0E0' },
  colLink: { color: '#B0B0B0', fontSize: 14.4, marginBottom: 14.4, lineHeight: 20 },
  colLinkDark: { color: '#B0B0B0' },
  divider: { height: 1, backgroundColor: '#333333', marginTop: 48, marginBottom: 32 },
  dividerDark: { backgroundColor: '#333333' },
  copyright: { color: '#999999', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  copyrightDark: { color: '#888888' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(10,10,10,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBackdropDark: { backgroundColor: 'rgba(0,0,0,0.8)' },
  infoModal: { width: '100%', maxHeight: '82%', backgroundColor: WHITE, borderRadius: 16, overflow: 'hidden' },
  infoModalDark: { backgroundColor: '#1E1E1E' },
  modalHeader: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 22, paddingRight: 16, paddingVertical: 16, backgroundColor: VINOTINTO },
  modalTitle: { flex: 1, color: WHITE, fontSize: 17, fontWeight: '700', letterSpacing: 0.2, lineHeight: 22, marginRight: 12 },
  modalTitleDark: { color: '#E0E0E0' },
  closeButton: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.15)', color: WHITE, fontSize: 22, lineHeight: 30, textAlign: 'center' },
  modalScroll: { flexGrow: 1 },
  modalContent: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 26 },
  infoHeadingWrap: { borderLeftWidth: 3, borderLeftColor: VINOTINTO, paddingLeft: 12, marginTop: 24, marginBottom: 7 },
  infoHeadingWrapDark: { borderLeftColor: VINOTINTO },
  infoHeading: { color: VINOTINTO, fontSize: 15.2, fontWeight: '700', lineHeight: 21 },
  infoHeadingDark: { color: '#E0E0E0', borderLeftColor: VINOTINTO },
  infoParagraph: { color: '#2D2D2D', fontSize: 14.7, lineHeight: 25.7, marginBottom: 14 },
  infoParagraphDark: { color: '#B0B0B0' },
  infoStrong: { fontWeight: '700' },
  choiceModal: { width: '100%', maxWidth: 480, backgroundColor: WHITE, borderRadius: 16, padding: 22 },
  choiceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  choiceTitle: { flex: 1, color: CARBON, fontSize: 20, fontWeight: '800', marginRight: 12 },
  choiceSubtitle: { color: '#666666', fontSize: 14, lineHeight: 20, marginBottom: 18 },
  choiceSubtitleDark: { color: '#B0B0B0' },
  choiceOption: { minHeight: 76, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAF8F6', borderWidth: 1, borderColor: '#E8E2DE', borderRadius: 10, padding: 14, marginBottom: 10 },
  choiceOptionDark: { backgroundColor: '#252525', borderColor: '#444444' },
  choiceIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3E6EA', marginRight: 13 },
  choiceText: { flex: 1 },
  choiceOptionTitle: { color: CARBON, fontSize: 15, fontWeight: '700', marginBottom: 3 },
  choiceOptionTitleDark: { color: '#E0E0E0' },
  choiceOptionDescription: { color: '#666666', fontSize: 13, lineHeight: 18 },
  choiceBack: { alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8, marginTop: 2 },
  choiceBackText: { color: VINOTINTO, fontSize: 14, fontWeight: '700' },
});