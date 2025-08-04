import {cn} from "@/lib/utils";
import {ReactNode} from "react";

type FontWeight = "normal" | "medium" | "semibold" | "bold";
type FontFamily = "inter" | "roboto" | "poppins";

type TypographyProps = {
  children: ReactNode;
  className?: string;
  weight?: FontWeight;
  opacity?: number;
  font?: FontFamily;
};

const weightClass = (weight?: FontWeight, fallback: FontWeight = "medium") => {
  const w = weight ?? fallback;
  return {
    "font-normal": w === "normal",
    "font-medium": w === "medium",
    "font-semibold": w === "semibold",
    "font-bold": w === "bold",
  };
};

const fontClass = (fallback: FontFamily, font?: FontFamily) => {
  const f = font ?? fallback;
  return {
    "font-inter": f === "inter",
    "font-roboto": f === "roboto",
    "font-poppins": f === "poppins",
  };
};

const opacityClass = (opacity: number = 100) =>
  cn({
    "opacity-0": opacity === 0,
    "opacity-5": opacity === 5,
    "opacity-10": opacity === 10,
    "opacity-20": opacity === 20,
    "opacity-25": opacity === 25,
    "opacity-30": opacity === 30,
    "opacity-40": opacity === 40,
    "opacity-50": opacity === 50,
    "opacity-60": opacity === 60,
    "opacity-70": opacity === 70,
    "opacity-75": opacity === 75,
    "opacity-80": opacity === 80,
    "opacity-90": opacity === 90,
    "opacity-95": opacity === 95,
  });
export function Title32({
  children,
  className,
  weight,
  opacity,
  font,
}: TypographyProps) {
  return (
    <h1
      className={cn(
        "text-[24px] md:text-[32px] text-primary/90",
        fontClass("roboto", font),
        weightClass(weight, "medium"),
        opacityClass(opacity),
        className
      )}
    >
      {children}
    </h1>
  );
}

export function Title24({
  children,
  className,
  weight,
  opacity,
  font,
}: TypographyProps) {
  return (
    <h2
      className={cn(
        "text-[20px] md:text-[24px] text-primary",
        fontClass("poppins", font),
        weightClass(weight, "medium"),
        opacityClass(opacity),
        className
      )}
    >
      {children}
    </h2>
  );
}

export function Text20({
  children,
  className,
  weight,
  opacity,
  font,
}: TypographyProps) {
  return (
    <p
      className={cn(
        "text-[18px] md:text-[20px] text-primary",
        fontClass("poppins", font),
        weightClass(weight, "medium"),
        opacityClass(opacity),
        className
      )}
    >
      {children}
    </p>
  );
}

export function Text16({
  children,
  className,
  weight,
  opacity,
  font,
}: TypographyProps) {
  return (
    <p
      className={cn(
        "text-[15px] md:text-[16px] text-primary",
        fontClass("inter", font),
        weightClass(weight, "semibold"),
        opacityClass(opacity),
        className
      )}
    >
      {children}
    </p>
  );
}

export function Text14({
  children,
  className,
  weight,
  opacity,
  font,
}: TypographyProps) {
  return (
    <p
      className={cn(
        "text-[13px] md:text-[14px] text-primary",
        fontClass("inter", font),
        weightClass(weight, "semibold"),
        opacityClass(opacity),
        className
      )}
    >
      {children}
    </p>
  );
}

export function Text14BoldWhite({
  children,
  className,
  weight,
  opacity,
  font,
}: TypographyProps) {
  return (
    <p
      className={cn(
        "text-[13px] md:text-[14px] text-white",
        fontClass("roboto", font),
        weightClass(weight, "bold"),
        opacityClass(opacity),
        className
      )}
    >
      {children}
    </p>
  );
}

export function SmallText({
  children,
  className,
  weight,
  opacity,
  font,
}: TypographyProps) {
  return (
    <p
      className={cn(
        "text-[11px] md:text-[12px] text-primary",
        fontClass("roboto", font),
        weightClass(weight, "medium"),
        opacityClass(opacity),
        className
      )}
    >
      {children}
    </p>
  );
}
