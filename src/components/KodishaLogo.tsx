import React from "react";
import Badge from "./KodishaBadge.svg";

type Props = {
  size?: number;
  className?: string;
  title?: string;
  ariaHidden?: boolean;
};

const KodishaLogo: React.FC<Props> = ({
  size = 56,
  className = "",
  title = "Kodisha",
  ariaHidden = false,
}) => {
  const s = Math.max(32, size);
  return (
    <img
      src={Badge}
      width={s}
      height={s}
      className={className}
      alt={ariaHidden ? "" : title}
      aria-hidden={ariaHidden}
    />
  );
};

export default KodishaLogo;
