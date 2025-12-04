import React from "react";

interface ServiceIconProps {
  type: "therapy" | "psychiatry" | "coaching";
  className?: string;
}

export const ServiceIcon: React.FC<ServiceIconProps> = ({ type, className = "" }) => {
  const lightBlue = "hsl(188, 30%, 70%)";
  const darkBlue = "hsl(203, 60%, 15%)";

  if (type === "therapy") {
    // Два перекрывающихся пузыря речи
    return (
      <svg viewBox="0 0 100 100" className={className}>
        {/* Задний пузырь */}
        <path
          d="M 20 30 Q 20 20 30 20 L 50 20 Q 60 20 60 30 L 60 50 Q 60 60 50 60 L 40 60 L 35 70 L 40 60 L 30 60 Q 20 60 20 50 Z"
          fill="none"
          stroke={lightBlue}
          strokeWidth="3"
        />
        {/* Передний пузырь с пунктирными линиями */}
        <path
          d="M 40 10 Q 40 0 50 0 L 70 0 Q 80 0 80 10 L 80 30 Q 80 40 70 40 L 60 40 L 55 50 L 60 40 L 50 40 Q 40 40 40 30 Z"
          fill="none"
          stroke={lightBlue}
          strokeWidth="3"
        />
        {/* Пунктирные линии внутри переднего пузыря */}
        <line
          x1="50"
          y1="15"
          x2="70"
          y2="15"
          stroke={darkBlue}
          strokeWidth="2"
          strokeDasharray="3 3"
        />
        <line
          x1="50"
          y1="25"
          x2="70"
          y2="25"
          stroke={darkBlue}
          strokeWidth="2"
          strokeDasharray="3 3"
        />
      </svg>
    );
  }

  if (type === "psychiatry") {
    // Клипборд с капсулой таблетки
    return (
      <svg viewBox="0 0 100 100" className={className}>
        {/* Клипборд */}
        <rect
          x="25"
          y="15"
          width="50"
          height="70"
          fill="none"
          stroke={lightBlue}
          strokeWidth="3"
          rx="2"
        />
        {/* Верхняя часть клипборда */}
        <rect
          x="30"
          y="10"
          width="40"
          height="8"
          fill="none"
          stroke={lightBlue}
          strokeWidth="3"
          rx="2"
        />
        {/* Пунктирные линии на клипборде */}
        <line
          x1="30"
          y1="30"
          x2="70"
          y2="30"
          stroke={darkBlue}
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <line
          x1="30"
          y1="45"
          x2="70"
          y2="45"
          stroke={darkBlue}
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <line
          x1="30"
          y1="60"
          x2="70"
          y2="60"
          stroke={darkBlue}
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        {/* Капсула таблетки */}
        <ellipse
          cx="50"
          cy="75"
          rx="15"
          ry="8"
          fill={darkBlue}
        />
        <line
          x1="35"
          y1="75"
          x2="65"
          y2="75"
          stroke="white"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (type === "coaching") {
    // Три фигурки (родители + ребенок)
    return (
      <svg viewBox="0 0 100 100" className={className}>
        {/* Левый родитель (большой) */}
        <circle
          cx="25"
          cy="40"
          r="12"
          fill="none"
          stroke={lightBlue}
          strokeWidth="3"
        />
        <path
          d="M 25 52 L 25 70 L 20 75 L 30 75 L 25 70"
          fill="none"
          stroke={lightBlue}
          strokeWidth="3"
        />
        {/* Ребенок (маленький, в центре, заполненный) */}
        <circle
          cx="50"
          cy="50"
          r="10"
          fill={darkBlue}
        />
        <path
          d="M 50 60 L 50 75 L 45 80 L 55 80 L 50 75"
          fill={darkBlue}
        />
        {/* Правый родитель (большой) */}
        <circle
          cx="75"
          cy="40"
          r="12"
          fill="none"
          stroke={lightBlue}
          strokeWidth="3"
        />
        <path
          d="M 75 52 L 75 70 L 70 75 L 80 75 L 75 70"
          fill="none"
          stroke={lightBlue}
          strokeWidth="3"
        />
      </svg>
    );
  }

  return null;
};

