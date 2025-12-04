import React from "react";

interface ResultIconProps {
  type: "pie" | "grid" | "bar";
}

export const ResultIcon: React.FC<ResultIconProps> = ({ type }) => {
  const darkBlue = "hsl(203, 60%, 15%)";
  const lightBlue = "hsl(188, 30%, 70%)";

  if (type === "pie") {
    // Круговая диаграмма для 80%
    return (
      <svg viewBox="0 0 100 100" className="landing-result-icon">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={darkBlue}
          strokeWidth="8"
          strokeDasharray={`251.2 62.8`} // 80% заполнено, 20% пусто
          transform="rotate(-90 50 50)"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={lightBlue}
          strokeWidth="8"
          strokeDasharray="0 62.8"
          strokeDashoffset="0"
          transform="rotate(-90 50 50)"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
    );
  }

  if (type === "grid") {
    // Сетка из 4 точек для 3 из 4
    return (
      <svg viewBox="0 0 100 100" className="landing-result-icon">
        {/* Верхний левый */}
        <circle cx="30" cy="30" r="12" fill={darkBlue} />
        {/* Верхний правый */}
        <circle cx="70" cy="30" r="12" fill={darkBlue} />
        {/* Нижний левый */}
        <circle cx="30" cy="70" r="12" fill={darkBlue} />
        {/* Нижний правый - пунктирный */}
        <circle
          cx="70"
          cy="70"
          r="12"
          fill="none"
          stroke={lightBlue}
          strokeWidth="3"
          strokeDasharray="4 4"
        />
      </svg>
    );
  }

  if (type === "bar") {
    // Столбчатая диаграмма для 61%
    return (
      <svg viewBox="0 0 100 100" className="landing-result-icon">
        {/* Высокий столбец (61%) */}
        <rect
          x="20"
          y="20"
          width="30"
          height="60"
          fill={darkBlue}
          rx="4"
        />
        {/* Низкий столбец (39%) */}
        <rect
          x="60"
          y="60"
          width="30"
          height="20"
          fill="none"
          stroke={lightBlue}
          strokeWidth="3"
          strokeDasharray="4 4"
          rx="4"
        />
      </svg>
    );
  }

  return null;
};

