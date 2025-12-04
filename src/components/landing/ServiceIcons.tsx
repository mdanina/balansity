import React from "react";
import { 
  MessageCircle, 
  Pill, 
  Brain, 
  Activity, 
  Users, 
  MessageSquare 
} from "lucide-react";

interface ServiceIconProps {
  type: "therapy" | "psychiatry" | "neuropsychology" | "neurology" | "family" | "speech";
  className?: string;
}

export const ServiceIcon: React.FC<ServiceIconProps> = ({ type, className = "" }) => {
  // Все иконки используют цвет primary для единообразия
  const iconClassName = `${className} text-primary`;

  switch (type) {
    case "therapy":
      return <MessageCircle className={iconClassName} />;
    case "psychiatry":
      return <Pill className={iconClassName} />;
    case "neuropsychology":
      return <Brain className={iconClassName} />;
    case "neurology":
      return <Activity className={iconClassName} />;
    case "family":
      return <Users className={iconClassName} />;
    case "speech":
      return <MessageSquare className={iconClassName} />;
    default:
      return null;
  }
};

