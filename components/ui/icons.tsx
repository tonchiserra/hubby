import type { SVGProps } from "react";

/**
 * Íconos propios, dibujados al spec del UI Kit de COSRX que adopta hubby:
 * grilla de 24, trazo de 1,6, extremos redondeados.
 *
 * Reemplazan a @phosphor-icons/react y conservan sus nombres (`BasketIcon`,
 * `TrashIcon`…) a propósito: el test de `lib/design/icon-usage.test.ts`
 * vigila los íconos por nombre, y cambiar de paquete no tiene por qué
 * cambiarle las reglas. `weight` se acepta y se ignora para que las llamadas
 * existentes no cambien de forma: acá hay un solo peso.
 */
export type IconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & {
  size?: number | string;
  weight?: string;
};

export type Icon = (props: IconProps) => React.JSX.Element;

function make(name: string, body: React.ReactNode, filled?: React.ReactNode): Icon {
  function IconComponent({ size = 24, weight, ...props }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        {...props}
      >
        {weight === "fill" && filled ? filled : body}
      </svg>
    );
  }
  IconComponent.displayName = name;
  return IconComponent;
}

export const TrashIcon = make("TrashIcon", <path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3" />);
export const XCircleIcon = make(
  "XCircleIcon",
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9l6 6m0-6-6 6" />
  </>,
  <>
    <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" />
    <path d="M9 9l6 6m0-6-6 6" stroke="var(--card, #fff)" />
  </>
);
export const PlusCircleIcon = make(
  "PlusCircleIcon",
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v8M8 12h8" />
  </>
);
export const MagnifyingGlassIcon = make(
  "MagnifyingGlassIcon",
  <>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </>
);
export const BookOpenIcon = make("BookOpenIcon", <path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5Zm0 0v13" />);
export const PlusIcon = make("PlusIcon", <path d="M12 5v14M5 12h14" />);
export const PencilSimpleIcon = make("PencilSimpleIcon", <path d="M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4" />);
export const DownloadSimpleIcon = make("DownloadSimpleIcon", <path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" />);
export const BasketIcon = make("BasketIcon", <path d="M3 10h18l-1.8 9.2a1 1 0 0 1-1 .8H5.8a1 1 0 0 1-1-.8L3 10Zm4 0 3-6m7 6-3-6M9 14v3m6-3v3" />);
export const MoonIcon = make("MoonIcon", <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />);
export const StarIcon = make(
  "StarIcon",
  <path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8L12 3.5Z" />,
  <path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8L12 3.5Z" fill="currentColor" />
);
export const ListChecksIcon = make("ListChecksIcon", <path d="M11 6h9M11 12h9M11 18h9M3.5 6l1.5 1.5L8 4.5M3.5 12l1.5 1.5L8 10.5M3.5 18l1.5 1.5L8 16.5" />);
export const HeartIcon = make(
  "HeartIcon",
  <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" />,
  <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" fill="currentColor" />
);
export const SunIcon = make(
  "SunIcon",
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2m0 15v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2.5 12h2m15 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </>
);
export const SlidersHorizontalIcon = make("SlidersHorizontalIcon", <path d="M4 7h9m4 0h3M4 17h3m4 0h9M15 5v4M9 15v4" />);
export const SignOutIcon = make("SignOutIcon", <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4m-4 4h10" />);
export const SignInIcon = make("SignInIcon", <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l4 4-4 4m4-4H4" />);
export const EyeSlashIcon = make(
  "EyeSlashIcon",
  <path d="M3 3l18 18M10.6 5.6A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.9 3.7M6.2 6.9C3.9 8.6 2.5 12 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4.3-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2" />
);
export const EyeIcon = make(
  "EyeIcon",
  <>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </>
);
export const CheckIcon = make("CheckIcon", <path d="M5 12.5l4.5 4.5L19 7.5" />);
export const CaretRightIcon = make("CaretRightIcon", <path d="M9 6l6 6-6 6" />);
export const CaretDownIcon = make("CaretDownIcon", <path d="M6 9l6 6 6-6" />);
export const ArrowUpRightIcon = make("ArrowUpRightIcon", <path d="M7 17 17 7m0 0H9m8 0v8" />);
export const ArrowSquareOutIcon = make("ArrowSquareOutIcon", <path d="M14 4h6v6m0-6-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />);
export const ArrowLeftIcon = make("ArrowLeftIcon", <path d="M19 12H5m0 0 6-6m-6 6 6 6" />);
export const WarningIcon = make("WarningIcon", <path d="M12 9v4m0 3.5h.01M10.3 4.2 2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />);
export const UserIcon = make(
  "UserIcon",
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </>
);
export const SquaresFourIcon = make("SquaresFourIcon", <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />);
export const GearIcon = make(
  "GearIcon",
  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.3l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2.2-1.3L14.3 3h-4l-.4 2.4a7.6 7.6 0 0 0-2.2 1.3l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.6l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2.2 1.3l.4 2.4h4l.4-2.4a7.6 7.6 0 0 0 2.2-1.3l2.4 1 2-3.4-2-1.6c.1-.4.1-.9.1-1.3Z" />
);
export const DotsSixVerticalIcon = make("DotsSixVerticalIcon", <path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" strokeWidth={2.6} />);
export const XIcon = make("XIcon", <path d="M6 6l12 12M18 6 6 18" />);
