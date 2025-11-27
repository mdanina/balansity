import { Link } from "react-router-dom";
import logoOtters from "@/assets/logo-otters.png";

export const Header = () => {
  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoOtters} alt="Little Otter" className="h-10 w-10" />
          <span className="text-xl font-bold text-primary">Little Otter</span>
        </Link>
      </div>
    </header>
  );
};
