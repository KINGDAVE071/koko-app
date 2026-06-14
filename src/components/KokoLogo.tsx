export default function KokoLogo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full bg-koko-orange text-white font-bold select-none"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      K
    </div>
  );
}
