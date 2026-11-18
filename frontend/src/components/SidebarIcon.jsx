const WHITE = '#FFFFFF';

export default function SidebarIcon({ Icon, size = 20 }) {
  const IconComp = Icon;
  return (
    <IconComp
      className=""
      width={size}
      height={size}
      strokeWidth={2}
      style={{ color: WHITE, display: 'block' }}
    />
  );
}
